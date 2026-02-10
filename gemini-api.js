// Google Gemini API Integration for Veritas Analyzer
//
// Browser:
//   - `CONFIG` and `ANALYSIS_PROMPTS` are defined globally by config.js (included via <script>).
//
// Node / backend (server.js):
//   - We require config.js here so CONFIG is defined before this class is used.
if (typeof module !== 'undefined' && module.exports) {
    const { CONFIG: NODE_CONFIG, ANALYSIS_PROMPTS: NODE_ANALYSIS_PROMPTS } = require('./config');
    if (typeof global !== 'undefined') {
        global.CONFIG = NODE_CONFIG;
        global.ANALYSIS_PROMPTS = NODE_ANALYSIS_PROMPTS;
    }
}

class GeminiAPI {
    constructor() {
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.apiUrl = CONFIG.GEMINI_API_URL;
        this.requestTimeout = CONFIG.REQUEST_TIMEOUT;
    }

    // Main method to analyze text with multiple prompts
    async analyzeText(text, analysisTypes = null) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured. Please add your API key in config.js');
        }

        if (!text || text.trim().length < CONFIG.MIN_TEXT_LENGTH) {
            throw new Error(`Text must be at least ${CONFIG.MIN_TEXT_LENGTH} characters long`);
        }

        if (text.length > CONFIG.MAX_TEXT_LENGTH) {
            throw new Error(`Text must be less than ${CONFIG.MAX_TEXT_LENGTH} characters`);
        }

        // Use all analysis types if none specified
        if (!analysisTypes) {
            analysisTypes = Object.values(CONFIG.ANALYSIS_TYPES);
        }

        try {
            // Run all analyses in parallel for better performance
            const analysisPromises = analysisTypes.map(type => 
                this.runSingleAnalysis(text, type)
            );

            const results = await Promise.allSettled(analysisPromises);
            
            // Process results and handle any failures
            const processedResults = this.processAnalysisResults(results, analysisTypes);
            
            // Calculate overall score
            const overallScore = this.calculateOverallScore(processedResults);
            
            return {
                success: true,
                data: {
                    overallScore: overallScore,
                    credibilityLevel: this.getCredibilityLevel(overallScore),
                    analysisResults: processedResults,
                    analyzedText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Analysis error:', error);
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    // Run a single analysis with a specific prompt
    async runSingleAnalysis(text, analysisType) {
        const prompt = ANALYSIS_PROMPTS[analysisType];
        if (!prompt) {
            throw new Error(`Unknown analysis type: ${analysisType}`);
        }

        const fullPrompt = prompt + '\n\n' + text;

        try {
            // Use higher token limit for URL analysis types
            const isURLAnalysis = analysisType === CONFIG.ANALYSIS_TYPES.URL_CONTENT || 
                                  analysisType === CONFIG.ANALYSIS_TYPES.FACT_CHECK;
            const maxTokens = isURLAnalysis ? 4096 : 2048;
            
            const response = await this.makeAPIRequest(fullPrompt, maxTokens);
            const result = this.parseAPIResponse(response, analysisType);
            
            return {
                type: analysisType,
                success: true,
                data: result
            };

        } catch (error) {
            // Check if error is due to safety filters, missing content, token limits, or JSON parsing - use fallback
            const isSafetyBlock = error.message && (
                error.message.includes('blocked') ||
                error.message.includes('SAFETY') ||
                error.message.includes('safety filter') ||
                error.message.includes('No content parts found') ||
                error.message.includes('No content found') ||
                error.message.includes('Content parts array is empty') ||
                error.message.includes('No text content found')
            );
            
            const isTokenLimit = error.message && (
                error.message.includes('token limit') ||
                error.message.includes('MAX_TOKENS') ||
                error.message.includes('truncated')
            );
            
            const isJSONError = error.message && (
                error.message.includes('No JSON found') ||
                error.message.includes('JSON') ||
                error.message.includes('Invalid JSON') ||
                error.message.includes('parse')
            );
            
            // Log as warning (not error) since we're handling it gracefully
            if (isSafetyBlock) {
                console.warn(`Analysis blocked or content missing for ${analysisType}, using fallback result`);
            } else if (isTokenLimit) {
                console.warn(`Analysis truncated due to token limit for ${analysisType}, using fallback result`);
            } else if (isJSONError) {
                console.warn(`JSON parsing failed for ${analysisType}, using fallback result. Error: ${error.message}`);
            } else {
                console.warn(`Analysis failed for ${analysisType}, using fallback result:`, error.message);
            }
            
            // Always return fallback result to prevent complete failure
            return {
                type: analysisType,
                success: false,
                error: error.message,
                data: this.getFallbackResult(analysisType)
            };
        }
    }

    // Make API request to Gemini with multiple primary and secondary models
    async makeAPIRequest(prompt, maxOutputTokens = 2048) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: maxOutputTokens,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_ONLY_HIGH"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_ONLY_HIGH"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_ONLY_HIGH"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_ONLY_HIGH"
                }
            ]
        };

        // Build ordered primary and secondary URL lists from CONFIG.
        // If arrays aren't set, fall back to single URL values so behavior
        // remains compatible with earlier versions.
        const primaryUrls = (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.GEMINI_PRIMARY_API_URLS) && CONFIG.GEMINI_PRIMARY_API_URLS.length > 0)
            ? CONFIG.GEMINI_PRIMARY_API_URLS
            : [
                (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_PRIMARY_API_URL)
                    ? CONFIG.GEMINI_PRIMARY_API_URL
                    : this.apiUrl
              ];

        const secondaryUrls = (typeof CONFIG !== 'undefined' && Array.isArray(CONFIG.GEMINI_SECONDARY_API_URLS) && CONFIG.GEMINI_SECONDARY_API_URLS.length > 0)
            ? CONFIG.GEMINI_SECONDARY_API_URLS
            : [
                this.apiUrl
              ];

        // Helper to detect "quota / rate limit" style errors for deciding
        // when to move on to the next secondary model.
        const isQuotaError = (error) => {
            if (!error || !error.message) return false;
            const msg = error.message.toLowerCase();
            return (
                msg.includes('quota') ||
                msg.includes('rate limit') ||
                msg.includes('resource has been exhausted') ||
                msg.includes('exceeded') ||
                msg.includes('429')
            );
        };

        // 1) Try PRIMARY models in order. If any primary succeeds, return
        //    immediately. If a primary fails, move to the next primary.
        //    After all primaries fail, we go to secondary models.
        let lastPrimaryError = null;
        for (const url of primaryUrls) {
            try {
                return await this._makeRequestToUrl(url, requestBody);
            } catch (err) {
                lastPrimaryError = err;
                console.warn(`Primary Gemini model at ${url} failed:`, err.message);
                // Continue to next primary model
            }
        }

        // 2) All primaries failed -> try SECONDARY models one by one.
        //    For secondary models, we only fall through to the next one
        //    when we detect a quota/limit error. For any other error, we
        //    stop and surface that error.
        let lastSecondaryError = lastPrimaryError;
        for (const url of secondaryUrls) {
            try {
                return await this._makeRequestToUrl(url, requestBody);
            } catch (err) {
                console.warn(`Secondary Gemini model at ${url} failed:`, err.message);
                lastSecondaryError = err;
                if (!isQuotaError(err)) {
                    // Only continue to the next secondary when the current one
                    // appears to have hit a quota / rate limit. For other errors,
                    // stop here and surface the problem.
                    break;
                }
                // If it looks like a quota error, continue to the next secondary.
            }
        }

        // If we reach here, all attempts failed.
        throw lastSecondaryError || new Error('All configured Gemini models failed');
    }

    // Internal helper: make a single HTTP request to a specific model URL
    async _makeRequestToUrl(apiUrl, requestBody) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(`${apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    // If JSON parsing fails, try to get text
                    const errorText = await response.text().catch(() => '');
                    throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || errorText || response.statusText}`);
                }

                // Check for specific error cases
                if (errorData.error) {
                    const errorMsg = errorData.error.message || '';
                    if (errorMsg.includes('model') || errorMsg.includes('Model')) {
                        throw new Error(`API model error: ${errorMsg}. Please check if the model name in config.js is valid.`);
                    }
                    if (errorData.error.code === 403) {
                        throw new Error(`API access denied (403): ${errorMsg}. Please check your API key permissions.`);
                    }
                    if (errorData.error.code === 400) {
                        throw new Error(`API request error (400): ${errorMsg}. Please check your request format.`);
                    }
                }

                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // Debug logging (can be removed in production)
            if (!data.candidates || data.candidates.length === 0) {
                console.warn('API Response Debug:', {
                    hasCandidates: !!data.candidates,
                    candidateCount: data.candidates?.length || 0,
                    promptFeedback: data.promptFeedback,
                    dataKeys: Object.keys(data)
                });
            }

            // Validate response structure with proper null checks
            if (!data || !data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
                // Check if there's a promptFeedback that might explain the issue
                if (data.promptFeedback && data.promptFeedback.blockReason) {
                    throw new Error(`API blocked the request: ${data.promptFeedback.blockReason}. The content may have triggered safety filters.`);
                }
                throw new Error('Invalid response format from API: No candidates found');
            }

            const candidate = data.candidates[0];

            // Check finishReason first to understand what happened
            if (candidate.finishReason) {
                if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
                    const safetyInfo = candidate.safetyRatings ? 
                        ` Blocked categories: ${candidate.safetyRatings.filter(r => r.blocked).map(r => r.category).join(', ')}` : '';
                    throw new Error(`API blocked the response due to ${candidate.finishReason}.${safetyInfo} The content may have triggered safety filters.`);
                }
                if (candidate.finishReason === 'OTHER') {
                    throw new Error('API returned an error finish reason. Please try again or adjust your content.');
                }
                // MAX_TOKENS and STOP are acceptable - continue processing
            }

            // Check safety ratings for blocking
            if (candidate.safetyRatings && candidate.safetyRatings.length > 0) {
                const blockedRatings = candidate.safetyRatings.filter(r => r.blocked);
                if (blockedRatings.length > 0) {
                    throw new Error(`Content was blocked by safety filters: ${blockedRatings.map(r => r.category).join(', ')}`);
                }
            }

            // Check if content exists
            if (!candidate.content) {
                // Log for debugging
                console.warn('Candidate has no content:', {
                    finishReason: candidate.finishReason,
                    safetyRatings: candidate.safetyRatings,
                    candidateKeys: Object.keys(candidate)
                });
                throw new Error('Invalid response format from API: No content found in candidate');
            }

            // Check if parts exist
            if (!candidate.content.parts) {
                // This might indicate content was blocked - check safety ratings first
                if (candidate.safetyRatings && candidate.safetyRatings.some(r => r.blocked)) {
                    const blocked = candidate.safetyRatings.filter(r => r.blocked);
                    throw new Error(`Content was blocked by safety filters: ${blocked.map(r => r.category).join(', ')}`);
                }
                throw new Error('Invalid response format from API: No content parts found');
            }

            if (!Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
                // This might indicate content was blocked
                if (candidate.safetyRatings && candidate.safetyRatings.some(r => r.blocked)) {
                    const blocked = candidate.safetyRatings.filter(r => r.blocked);
                    throw new Error(`Content was blocked by safety filters: ${blocked.map(r => r.category).join(', ')}`);
                }
                throw new Error('Invalid response format from API: Content parts array is empty');
            }

            // Check if we have text content
            const textPart = candidate.content.parts.find(part => part && part.text);
            if (!textPart || !textPart.text || typeof textPart.text !== 'string') {
                // Check if this is due to safety blocking
                if (candidate.safetyRatings && candidate.safetyRatings.some(r => r.blocked)) {
                    const blocked = candidate.safetyRatings.filter(r => r.blocked);
                    throw new Error(`Content was blocked by safety filters: ${blocked.map(r => r.category).join(', ')}`);
                }
                throw new Error('Invalid response format from API: No text content found in parts');
            }

            let responseText = textPart.text.trim();

            // Validate we have actual text content
            if (!responseText || responseText.length === 0) {
                throw new Error('Invalid response format from API: Text content is empty');
            }

            return responseText;

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - API took too long to respond');
            }
            throw error;
        }
    }

    // Parse API response and extract JSON
    parseAPIResponse(responseText, analysisType) {
        try {
            if (!responseText || typeof responseText !== 'string') {
                throw new Error('Invalid response text');
            }

            // Log the response for debugging (first 2000 chars)
            console.log('API Response received (first 2000 chars):', responseText.substring(0, 2000));

            let jsonString = null;
            
            // Strategy 1: Try to find JSON in markdown code blocks (```json ... ``` or ``` ... ```)
            const markdownJsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (markdownJsonMatch && markdownJsonMatch[1]) {
                const codeBlockContent = markdownJsonMatch[1].trim();
                if (codeBlockContent.startsWith('{') || codeBlockContent.startsWith('[')) {
                    jsonString = codeBlockContent;
                    console.log('Found JSON in markdown code block');
                }
            }
            
            // Strategy 2: Try to find JSON object directly (look for balanced braces)
            if (!jsonString) {
                let braceCount = 0;
                let startIndex = -1;
                let inString = false;
                let escapeNext = false;
                
                for (let i = 0; i < responseText.length; i++) {
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    if (responseText[i] === '\\') {
                        escapeNext = true;
                        continue;
                    }
                    if (responseText[i] === '"' && !escapeNext) {
                        inString = !inString;
                        continue;
                    }
                    if (!inString) {
                        if (responseText[i] === '{') {
                            if (braceCount === 0) startIndex = i;
                            braceCount++;
                        } else if (responseText[i] === '}') {
                            braceCount--;
                            if (braceCount === 0 && startIndex !== -1) {
                                jsonString = responseText.substring(startIndex, i + 1);
                                console.log('Found JSON using balanced braces method');
                                break;
                            }
                        }
                    }
                }
            }
            
            // Strategy 3: Try regex match for JSON object
            if (!jsonString) {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch && jsonMatch[0]) {
                    jsonString = jsonMatch[0];
                    console.log('Found JSON using regex match');
                }
            }
            
            // Strategy 4: Try to parse the entire response as JSON
            if (!jsonString) {
                try {
                    const parsed = JSON.parse(responseText.trim());
                    if (typeof parsed === 'object' && parsed !== null) {
                        console.log('Parsed entire response as JSON');
                        return this.validateAndReturnParsed(parsed, analysisType);
                    }
                } catch (e) {
                    // Not valid JSON, continue
                }
            }

            // Strategy 5: Try to find JSON after common prefixes
            if (!jsonString) {
                // Look for JSON after explanations like "Here is the analysis:", "The result is:", etc.
                const prefixes = [
                    /Here[^:]*:\s*(\{[\s\S]*\})/i,
                    /Result[^:]*:\s*(\{[\s\S]*\})/i,
                    /Analysis[^:]*:\s*(\{[\s\S]*\})/i,
                    /JSON[^:]*:\s*(\{[\s\S]*\})/i,
                    /Response[^:]*:\s*(\{[\s\S]*\})/i
                ];
                
                for (const prefixPattern of prefixes) {
                    const match = responseText.match(prefixPattern);
                    if (match && match[1]) {
                        jsonString = match[1];
                        console.log('Found JSON after prefix');
                        break;
                    }
                }
            }

            // If still no JSON found, try to extract partial data or use fallback
            if (!jsonString) {
                console.warn('No JSON found in response. Full response text:', responseText);
                console.warn('Response length:', responseText.length, 'characters');
                
                // Try to extract partial data from the text response
                const partialData = this.extractPartialJSON(responseText, analysisType);
                if (partialData) {
                    console.log('Using extracted partial data from text response');
                    return partialData;
                }
                
                // If we can't extract anything, throw error that will be caught and handled with fallback
                throw new Error('No JSON found in response. The API returned plain text instead of JSON format.');
            }

            // Try to parse the JSON string
            let parsed;
            try {
                parsed = JSON.parse(jsonString);
            } catch (parseError) {
                console.warn('JSON parse error, attempting repair:', parseError.message);
                
                // Try simple fixes first
                let fixedJson = jsonString;
                
                // Remove trailing commas
                fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
                
                // Try to repair incomplete JSON
                fixedJson = this.repairIncompleteJSON(fixedJson, parseError);
                
                try {
                    parsed = JSON.parse(fixedJson);
                } catch (repairError) {
                    console.warn('JSON repair failed, extracting partial data:', repairError.message);
                    
                    // If repair failed, extract what we can
                    parsed = this.extractPartialJSON(jsonString, analysisType);
                    if (!parsed) {
                        // Last resort: use fallback result
                        console.warn('Could not extract partial JSON, using fallback result');
                        throw new Error(`Invalid JSON format: ${parseError.message}. The response may be incomplete.`);
                    }
                }
            }
            
            return this.validateAndReturnParsed(parsed, analysisType);

        } catch (error) {
            console.error('Error parsing API response:', error);
            console.error('Raw response (first 1000 chars):', responseText ? responseText.substring(0, 1000) : 'No response');
            throw new Error(`Failed to parse API response: ${error.message}`);
        }
    }

    // Repair incomplete JSON from truncated responses
    repairIncompleteJSON(jsonString, parseError) {
        let fixed = jsonString.trim();
        
        // Get error position if available
        const positionMatch = parseError.message.match(/position (\d+)/);
        const errorPos = positionMatch ? parseInt(positionMatch[1]) : fixed.length;
        
        // Simple strategy: Remove everything from the error position backwards until we find a safe cut point
        // A safe cut point is:
        // 1. End of a complete array element (], } followed by comma or end)
        // 2. End of a complete object property (", number, true/false/null followed by comma)
        
        // Start from before the error and work backwards to find last complete element
        let cutPos = Math.min(errorPos, fixed.length);
        
        // Look for the last comma before the error (indicates end of previous element)
        const beforeError = fixed.substring(0, cutPos);
        const lastCommaIndex = beforeError.lastIndexOf(',');
        
        if (lastCommaIndex > 0 && lastCommaIndex > cutPos - 200) {
            // Found a comma - check if we can safely cut there
            const testCut = fixed.substring(0, lastCommaIndex);
            
            // Try to validate this cut point by checking structure
            let testBraceCount = 0;
            let testBracketCount = 0;
            let inString = false;
            let escape = false;
            
            for (let i = 0; i < testCut.length; i++) {
                if (escape) {
                    escape = false;
                    continue;
                }
                if (fixed[i] === '\\') {
                    escape = true;
                    continue;
                }
                if (fixed[i] === '"') {
                    inString = !inString;
                    continue;
                }
                if (!inString) {
                    if (fixed[i] === '{') testBraceCount++;
                    else if (fixed[i] === '}') testBraceCount--;
                    else if (fixed[i] === '[') testBracketCount++;
                    else if (fixed[i] === ']') testBracketCount--;
                }
            }
            
            // If structure is reasonably balanced, use this cut point
            if (Math.abs(testBraceCount) <= 2 && Math.abs(testBracketCount) <= 2) {
                cutPos = lastCommaIndex;
                fixed = testCut;
            }
        } else {
            // No comma found, try to remove incomplete content at the end
            fixed = beforeError;
            
            // Remove incomplete array elements
            // Pattern: array with incomplete last element like: [..., "incomplete
            fixed = fixed.replace(/\[([^\]]*),\s*"[^"]*$/, '[$1'); // Remove incomplete string in array
            fixed = fixed.replace(/\[([^\]]*),\s*\{[^}]*$/, '[$1'); // Remove incomplete object in array
            fixed = fixed.replace(/\[([^\]]*),\s*\[[^\]]*$/, '[$1'); // Remove incomplete nested array
            
            // Remove incomplete object properties
            fixed = fixed.replace(/\{([^}]*),\s*"[^"]*:\s*[^,}]*$/, '{$1'); // Remove incomplete property
        }
        
        // Remove any trailing comma
        fixed = fixed.replace(/,\s*$/, '');
        
        // Count unclosed structures (respecting strings)
        let braceCount = 0;
        let bracketCount = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < fixed.length; i++) {
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (fixed[i] === '\\') {
                escapeNext = true;
                continue;
            }
            if (fixed[i] === '"' && !escapeNext) {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (fixed[i] === '{') braceCount++;
                else if (fixed[i] === '}') braceCount--;
                else if (fixed[i] === '[') bracketCount++;
                else if (fixed[i] === ']') bracketCount--;
            }
        }
        
        // Close unclosed structures
        if (bracketCount > 0) {
            fixed = fixed.trim() + ']'.repeat(bracketCount);
        }
        if (braceCount > 0) {
            fixed = fixed.trim() + '}'.repeat(braceCount);
        }
        
        // Final cleanup
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        
        return fixed.trim();
    }
    
    // Extract partial JSON when repair fails
    extractPartialJSON(jsonString, analysisType) {
        try {
            if (!jsonString || typeof jsonString !== 'string') {
                return null;
            }
            
            // Try to extract what we can using regex patterns
            const result = {};
            
            // Extract scores (these are usually at the top level)
            const contentScoreMatch = jsonString.match(/"content_score"\s*:\s*(\d+)/);
            if (contentScoreMatch) {
                result.content_score = parseInt(contentScoreMatch[1]);
            }
            
            const overallScoreMatch = jsonString.match(/"overall_score"\s*:\s*(\d+)/);
            if (overallScoreMatch) {
                result.overall_score = parseInt(overallScoreMatch[1]);
            }
            
            // Extract quality/level strings (handle incomplete strings)
            const contentQualityMatch = jsonString.match(/"content_quality"\s*:\s*"([^"]*)/);
            if (contentQualityMatch) {
                result.content_quality = contentQualityMatch[1] || 'unknown';
            }
            
            const credibilityLevelMatch = jsonString.match(/"credibility_level"\s*:\s*"([^"]*)/);
            if (credibilityLevelMatch) {
                result.credibility_level = credibilityLevelMatch[1] || 'moderate';
            }
            
            // Extract summary if available (may be incomplete)
            const summaryMatch = jsonString.match(/"summary"\s*:\s*"([^"]*)/);
            if (summaryMatch) {
                result.summary = summaryMatch[1] || 'Analysis was truncated.';
            }
            
            // Always return a valid result for URL analysis types, even with minimal data
            if (analysisType === CONFIG.ANALYSIS_TYPES.URL_CONTENT) {
                // Try to extract score even if not found in standard location
                let score = result.content_score;
                if (score === undefined) {
                    // Try alternative patterns
                    const altScoreMatch = jsonString.match(/"score"\s*:\s*(\d+)/);
                    if (altScoreMatch) {
                        score = parseInt(altScoreMatch[1]);
                    }
                }
                
                return {
                    content_score: score !== undefined ? score : 50,
                    content_quality: result.content_quality || 'unknown',
                    content_preview: {
                        title: 'Unknown',
                        description: 'Response was truncated - partial data only',
                        main_topics: [],
                        content_type: 'unknown'
                    },
                    credibility_indicators: [],
                    red_flags: [],
                    recommendations: ['Response was truncated. Please verify information independently.']
                };
            } else if (analysisType === CONFIG.ANALYSIS_TYPES.FACT_CHECK) {
                // Try to extract score even if not found in standard location
                let score = result.overall_score;
                if (score === undefined) {
                    // Try alternative patterns
                    const altScoreMatch = jsonString.match(/"score"\s*:\s*(\d+)/);
                    if (altScoreMatch) {
                        score = parseInt(altScoreMatch[1]);
                    }
                }
                
                return {
                    overall_score: score !== undefined ? score : 50,
                    credibility_level: result.credibility_level || 'moderate',
                    summary: result.summary || 'Analysis was truncated. Partial results only - please verify information independently.',
                    claims: [],
                    recommendations: ['Response was truncated. Please verify information independently.']
                };
            }
            
            // For other types, return null to use fallback from getFallbackResult
            return null;
        } catch (e) {
            console.error('Error extracting partial JSON:', e);
            return null;
        }
    }

    // Validate and return parsed response
    validateAndReturnParsed(parsed, analysisType) {
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Parsed response is not an object');
        }
        
        // Validate the response structure (but be lenient with some types)
        try {
            this.validateResponseStructure(parsed, analysisType);
        } catch (validationError) {
            // For URL_CONTENT and FACT_CHECK, be more lenient since they have optional fields
            if (analysisType === CONFIG.ANALYSIS_TYPES.URL_CONTENT) {
                // Only require content_score
                if (parsed.content_score === undefined || parsed.content_score === null) {
                    throw validationError;
                }
            } else if (analysisType === CONFIG.ANALYSIS_TYPES.FACT_CHECK) {
                // Only require overall_score
                if (parsed.overall_score === undefined || parsed.overall_score === null) {
                    throw validationError;
                }
                // Ensure claims is an array if not present
                if (!parsed.claims || !Array.isArray(parsed.claims)) {
                    parsed.claims = [];
                }
            } else {
                throw validationError;
            }
        }
        
        return parsed;
    }

    // Validate response structure based on analysis type
    validateResponseStructure(data, analysisType) {
        if (!data || typeof data !== 'object') {
            throw new Error('Response data is not an object');
        }

        const requiredFields = {
            [CONFIG.ANALYSIS_TYPES.FACT_CHECK]: ['overall_score', 'credibility_level'],
            [CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION]: ['source_score', 'source_quality'],
            [CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS]: ['language_score', 'language_quality'],
            [CONFIG.ANALYSIS_TYPES.BIAS_DETECTION]: ['bias_score', 'overall_bias_level'],
            [CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION]: ['manipulation_score', 'manipulation_level'],
            [CONFIG.ANALYSIS_TYPES.URL_CONTENT]: ['content_score', 'content_quality'],
            [CONFIG.ANALYSIS_TYPES.URL_SAFETY]: ['safety_score', 'safety_level'],
            [CONFIG.ANALYSIS_TYPES.CLICKBAIT_DETECTION]: ['clickbait_score', 'clickbait_level']
        };

        const fields = requiredFields[analysisType] || [];
        for (const field of fields) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    // Process analysis results and handle failures
    processAnalysisResults(results, analysisTypes) {
        const processed = {};
        
        results.forEach((result, index) => {
            const analysisType = analysisTypes[index];
            
            if (result.status === 'fulfilled' && result.value.success) {
                processed[analysisType] = result.value.data;
            } else {
                console.warn(`Analysis failed for ${analysisType}:`, result.reason || result.value?.error);
                processed[analysisType] = this.getFallbackResult(analysisType);
            }
        });

        return processed;
    }

    // Calculate overall score from individual analysis scores
    calculateOverallScore(results) {
        if (!results || typeof results !== 'object') {
            return 50; // Default score if results are invalid
        }

        const scoreData = [];
        
        // Extract scores from different analysis types with proper mapping and null checks
        if (results[CONFIG.ANALYSIS_TYPES.FACT_CHECK] && typeof results[CONFIG.ANALYSIS_TYPES.FACT_CHECK] === 'object') {
            const factCheck = results[CONFIG.ANALYSIS_TYPES.FACT_CHECK];
            if (factCheck.overall_score !== undefined && factCheck.overall_score !== null) {
                scoreData.push({
                    score: Number(factCheck.overall_score),
                    type: CONFIG.ANALYSIS_TYPES.FACT_CHECK,
                    weight: 0.35 // Most important for credibility
                });
            }
        }

        if (results[CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION] && typeof results[CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION] === 'object') {
            const sourceVer = results[CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION];
            if (sourceVer.source_score !== undefined && sourceVer.source_score !== null) {
                scoreData.push({
                    score: Number(sourceVer.source_score),
                    type: CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION,
                    weight: 0.30 // Very important for credibility
                });
            }
        }

        if (results[CONFIG.ANALYSIS_TYPES.URL_CONTENT] && typeof results[CONFIG.ANALYSIS_TYPES.URL_CONTENT] === 'object') {
            const urlContent = results[CONFIG.ANALYSIS_TYPES.URL_CONTENT];
            if (urlContent.content_score !== undefined && urlContent.content_score !== null) {
                scoreData.push({
                    score: Number(urlContent.content_score),
                    type: CONFIG.ANALYSIS_TYPES.URL_CONTENT,
                    weight: 0.40 // Very important for URL analysis
                });
            }
        }

        if (results[CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS] && typeof results[CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS] === 'object') {
            const langAnalysis = results[CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS];
            if (langAnalysis.language_score !== undefined && langAnalysis.language_score !== null) {
                scoreData.push({
                    score: Number(langAnalysis.language_score),
                    type: CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS,
                    weight: 0.20 // Important for quality assessment
                });
            }
        }

        if (results[CONFIG.ANALYSIS_TYPES.BIAS_DETECTION] && typeof results[CONFIG.ANALYSIS_TYPES.BIAS_DETECTION] === 'object') {
            const biasAnalysis = results[CONFIG.ANALYSIS_TYPES.BIAS_DETECTION];
            if (biasAnalysis.bias_score !== undefined && biasAnalysis.bias_score !== null) {
                // For bias, lower score means better (less bias = higher credibility)
                const biasScore = Number(biasAnalysis.bias_score);
                const invertedScore = 100 - biasScore; // Invert the score
                scoreData.push({
                    score: invertedScore,
                    type: CONFIG.ANALYSIS_TYPES.BIAS_DETECTION,
                    weight: 0.10 // Important but less critical
                });
            }
        }

        if (results[CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION] && typeof results[CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION] === 'object') {
            const emotManip = results[CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION];
            if (emotManip.manipulation_score !== undefined && emotManip.manipulation_score !== null) {
                // For manipulation, lower score means better (less manipulation = higher credibility)
                const manipulationScore = Number(emotManip.manipulation_score);
                const invertedScore = 100 - manipulationScore; // Invert the score
                scoreData.push({
                    score: invertedScore,
                    type: CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION,
                    weight: 0.05 // Least critical but still relevant
                });
            }
        }

        if (scoreData.length === 0) {
            return 50; // Default score if no valid scores
        }

        // Calculate weighted average
        let weightedSum = 0;
        let totalWeight = 0;

        scoreData.forEach(({ score, weight }) => {
            // Ensure score is a valid number and within valid range
            const numScore = Number(score);
            if (!isNaN(numScore) && isFinite(numScore)) {
                const normalizedScore = Math.max(0, Math.min(100, numScore));
                weightedSum += normalizedScore * weight;
                totalWeight += weight;
            }
        });

        // Calculate final score
        const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
        
        // Round to nearest integer and ensure it's within bounds
        const roundedScore = Math.round(finalScore);
        return Math.max(0, Math.min(100, roundedScore));
    }

    // Get credibility level based on score
    getCredibilityLevel(score) {
        if (score >= 85) return 'High Credibility';
        if (score >= 70) return 'Moderate Credibility';
        if (score >= 50) return 'Low Credibility';
        return 'Very Low Credibility';
    }

    // Get fallback result when analysis fails
    getFallbackResult(analysisType) {
        const fallbacks = {
            [CONFIG.ANALYSIS_TYPES.FACT_CHECK]: {
                overall_score: 50,
                credibility_level: 'moderate',
                card_description: 'Fact-check analysis unavailable. Verify claims independently.',
                summary: 'Analysis unavailable - please verify information independently',
                claims: [],
                recommendations: ['Verify information from multiple sources', 'Check for recent updates']
            },
            [CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION]: {
                source_score: 50,
                source_quality: 'unknown',
                questions_to_ask: ['What is the source of this information?', 'Can this be verified elsewhere?'],
                suggested_sources: [],
                red_flags: [],
                recommendations: ['Verify from official sources', 'Check multiple news outlets']
            },
            [CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS]: {
                language_score: 50,
                language_quality: 'unknown',
                emotional_tone: 'unknown',
                bias_indicators: [],
                manipulation_techniques: [],
                recommendations: ['Read critically', 'Look for emotional language']
            },
            [CONFIG.ANALYSIS_TYPES.BIAS_DETECTION]: {
                bias_score: 50,
                overall_bias_level: 'unknown',
                bias_types: [],
                recommendations: ['Consider multiple perspectives', 'Check for confirmation bias']
            },
            [CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION]: {
                manipulation_score: 50,
                manipulation_level: 'unknown',
                techniques_used: [],
                emotional_triggers: [],
                recommendations: ['Stay objective', 'Look for emotional appeals']
            },
            [CONFIG.ANALYSIS_TYPES.URL_CONTENT]: {
                content_score: 50,
                content_quality: 'unknown',
                card_description: 'Content analysis unavailable. Please verify independently.',
                content_preview: {
                    title: 'Unknown',
                    description: 'Unable to analyze content',
                    main_topics: [],
                    content_type: 'unknown'
                },
                credibility_indicators: [],
                red_flags: [],
                recommendations: ['Verify content from multiple sources', 'Check the source website directly']
            },
            [CONFIG.ANALYSIS_TYPES.URL_SAFETY]: {
                safety_score: 50,
                safety_level: 'unknown',
                card_description: 'URL safety analysis unavailable. Verify URL before accessing.',
                url_analysis: {
                    domain_reputation: 'unknown',
                    ssl_certificate: 'unknown',
                    redirect_chain: [],
                    suspicious_patterns: []
                },
                security_flags: [],
                recommendations: ['Exercise caution', 'Verify the URL before accessing']
            },
            [CONFIG.ANALYSIS_TYPES.CLICKBAIT_DETECTION]: {
                clickbait_score: 50,
                clickbait_level: 'unknown',
                card_description: 'Clickbait analysis unavailable. Exercise caution with headlines.',
                manipulation_techniques: [],
                emotional_triggers: [],
                misleading_elements: [],
                recommendations: ['Be cautious of sensational headlines', 'Read the full content before sharing']
            }
        };

        return fallbacks[analysisType] || fallbacks[CONFIG.ANALYSIS_TYPES.FACT_CHECK];
    }

    // Test API connection
    async testConnection() {
        try {
            const testPrompt = 'Respond with exactly this JSON: {"test": "success", "message": "API connection working"}';
            const response = await this.makeAPIRequest(testPrompt);
            
            // Try to parse JSON, but don't fail if it's not perfect JSON
            let result;
            try {
                result = JSON.parse(response);
            } catch (parseError) {
                // If JSON parsing fails, check if response contains success indicators
                if (response.toLowerCase().includes('success') || response.toLowerCase().includes('working')) {
                    result = { test: 'success', message: 'API connection working' };
                } else {
                    throw parseError;
                }
            }
            
            return {
                success: true,
                message: 'API connection successful',
                data: result
            };
        } catch (error) {
            console.error('API test error:', error);
            return {
                success: false,
                message: `API connection failed: ${error.message}`,
                error: error.message
            };
        }
    }
}

// Create global instance
const geminiAPI = new GeminiAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GeminiAPI, geminiAPI };
}
