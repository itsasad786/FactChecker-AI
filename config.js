// Configuration for Veritas Analyzer
const CONFIG = {
    // Google Gemini API Configuration
    GEMINI_API_KEY: 'AIzaSyAxrauoldqH5M09Hv18K4cKC6VxCyg6Jnk', // Add your Gemini API key here
    
    // MODEL SELECTION - Change this to switch between different Gemini models
    // Available models and their limits:
    // - gemini-2.0-flash-exp: 1000 requests/day (FREE) - Fastest, good for most use cases
    // - gemini-1.5-flash: 15 requests/minute, 1M tokens/day (FREE) - More reliable
    // - gemini-1.5-pro: 2 requests/minute, 1M tokens/day (FREE) - Most capable
    // - gemini-1.5-flash-8b: 15 requests/minute, 1M tokens/day (FREE) - Lightweight
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent',
    
    // Analysis Settings
    MAX_TEXT_LENGTH: 10000,
    MIN_TEXT_LENGTH: 50,
    
    // URL Analysis Settings
    MAX_URL_CONTENT_LENGTH: 800,  // Maximum words for URL content (reduces tokens)
    TARGET_URL_TOKENS: 1000,      // Target token count for URL analysis
    
    // API Timeout Settings
    REQUEST_TIMEOUT: 30000, // 30 seconds
    
    // Analysis Types
    ANALYSIS_TYPES: {
        FACT_CHECK: 'fact_check',
        SOURCE_VERIFICATION: 'source_verification',
        LANGUAGE_ANALYSIS: 'language_analysis',
        BIAS_DETECTION: 'bias_detection',
        EMOTIONAL_MANIPULATION: 'emotional_manipulation',
        URL_SAFETY: 'url_safety',
        URL_CONTENT: 'url_content',
        CLICKBAIT_DETECTION: 'clickbait_detection'
    }
};

// Prompts for different types of analysis
const ANALYSIS_PROMPTS = {
    [CONFIG.ANALYSIS_TYPES.FACT_CHECK]: `You are a fact-checking assistant. Analyze the following text for potential misinformation and provide your response ONLY as valid JSON, with no additional text before or after the JSON.

IMPORTANT: Return ONLY the JSON object, no explanations, no markdown, no code blocks, just the raw JSON.

Required JSON format:
{
    "overall_score": <number between 0-100 where 0=completely false, 50=unverifiable, 100=completely true>,
    "credibility_level": "<high/moderate/low>",
    "card_description": "<ONE short sentence (max 20 words) describing fact-check results and claim verification status>",
    "summary": "<brief summary of findings>",
    "claims": [
        {
            "claim": "<specific claim found>",
            "red_flags": ["<red flag 1>", "<red flag 2>"],
            "verification_status": "<verified/unverified/suspicious>",
            "explanation": "<detailed explanation>"
        }
    ],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

CRITICAL: card_description must be ONE short sentence (max 20 words) - NOT a paragraph. Make it DIFFERENT from content quality description. Focus on claim verification, not content quality.

Scoring Guidelines:
- 90-100: Highly credible, well-sourced, factually accurate
- 70-89: Generally credible with minor issues
- 50-69: Mixed credibility, some verifiable claims
- 30-49: Low credibility, many red flags
- 0-29: Very low credibility, likely misinformation

Focus on identifying:
- Sensationalist language
- Lack of reputable sources
- Logical fallacies
- Emotional manipulation
- Unverifiable claims
- Biased language

Remember: Return ONLY valid JSON, nothing else.

Text to analyze:`,

    [CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION]: `Analyze the following text for source credibility and verification. Your response should be in JSON format:

{
    "source_score": <number between 0-100>,
    "source_quality": "<excellent/good/poor>",
    "questions_to_ask": [
        "<critical question 1>",
        "<critical question 2>"
    ],
    "suggested_sources": [
        {
            "source": "<source name>",
            "type": "<government/academic/news/ngo>",
            "reliability": "<high/medium/low>",
            "verification_method": "<how to verify>"
        }
    ],
    "red_flags": ["<red flag 1>", "<red flag 2>"],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

Focus on:
- Source credibility
- Verification methods
- Suggested credible sources (WHO, RBI, PIB, academic institutions, etc.)
- Questions a critical thinker should ask

Text to analyze:`,

    [CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS]: `Analyze the language and writing style of the following text for potential manipulation or bias. Your response should be in JSON format:

{
    "language_score": <number between 0-100>,
    "language_quality": "<neutral/biased/manipulative>",
    "emotional_tone": "<neutral/emotional/manipulative>",
    "card_description": "<A concise 1-2 sentence summary of the language analysis findings for display in the UI card>",
    "bias_indicators": [
        {
            "type": "<confirmation bias/selection bias/etc>",
            "example": "<specific example from text>",
            "impact": "<how it affects credibility>"
        }
    ],
    "manipulation_techniques": [
        {
            "technique": "<technique name>",
            "example": "<specific example>",
            "severity": "<high/medium/low>"
        }
    ],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

Focus on:
- Emotional manipulation
- Biased language
- Logical fallacies
- Persuasive techniques
- Neutrality of tone

The card_description should be a brief, informative summary of what you found in the language analysis.

Text to analyze:`,

    [CONFIG.ANALYSIS_TYPES.BIAS_DETECTION]: `Detect various types of bias in the following text. Your response should be in JSON format:

{
    "bias_score": <number between 0-100>,
    "overall_bias_level": "<low/medium/high>",
    "card_description": "<A concise 1-2 sentence summary of the bias analysis findings for display in the UI card>",
    "bias_types": [
        {
            "type": "<confirmation bias/selection bias/etc>",
            "severity": "<low/medium/high>",
            "examples": ["<example 1>", "<example 2>"],
            "explanation": "<detailed explanation>"
        }
    ],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

Focus on:
- Confirmation bias
- Selection bias
- Availability bias
- Anchoring bias
- Political bias
- Cultural bias

The card_description should be a brief, informative summary of what bias types you found and their severity.

Text to analyze:`,

    [CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION]: `Analyze the following text for emotional manipulation techniques. Your response should be in JSON format:

{
    "manipulation_score": <number between 0-100>,
    "manipulation_level": "<low/medium/high>",
    "techniques_used": [
        {
            "technique": "<technique name>",
            "example": "<specific example from text>",
            "impact": "<how it affects the reader>",
            "severity": "<low/medium/high>"
        }
    ],
    "emotional_triggers": ["<trigger 1>", "<trigger 2>"],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

Focus on:
- Fear-mongering
- Emotional appeals
- Guilt-tripping
- Bandwagon effect
- Scarcity tactics
- Authority appeals

Text to analyze:`,

    [CONFIG.ANALYSIS_TYPES.URL_SAFETY]: `Analyze the following URL for safety and security indicators. Your response should be in JSON format:

{
    "safety_score": <number between 0-100>,
    "safety_level": "<safe/suspicious/dangerous>",
    "card_description": "<ONE short sentence (max 20 words) describing URL safety and security status>",
    "url_analysis": {
        "domain_reputation": "<excellent/good/poor/unknown>",
        "ssl_certificate": "<valid/invalid/unknown>",
        "redirect_chain": ["<redirect 1>", "<redirect 2>"],
        "suspicious_patterns": ["<pattern 1>", "<pattern 2>"]
    },
    "security_flags": [
        {
            "flag": "<flag name>",
            "severity": "<high/medium/low>",
            "description": "<explanation>"
        }
    ],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

CRITICAL: card_description must be ONE short sentence (max 20 words) - NOT a paragraph. Keep it concise.

Focus on:
- Domain reputation and history
- SSL certificate validity
- Suspicious URL patterns
- Known malicious domains
- Redirect chains
- URL shortening services
- Phishing indicators

URL to analyze:`,

    [CONFIG.ANALYSIS_TYPES.URL_CONTENT]: `You are a content analysis assistant. Analyze the following URL content and provide your response ONLY as valid JSON, with no additional text before or after the JSON.

IMPORTANT: Return ONLY the JSON object, no explanations, no markdown, no code blocks, just the raw JSON.

Required JSON format:
{
    "content_score": <number between 0-100>,
    "content_quality": "<excellent/good/moderate/poor>",
    "card_description": "<ONE short sentence (max 20 words) describing content quality and credibility>",
    "content_preview": {
        "title": "<page title>",
        "description": "<page description>",
        "main_topics": ["<topic 1>", "<topic 2>"],
        "content_type": "<news/blog/social media/article/etc>"
    },
    "credibility_indicators": [
        {
            "indicator": "<indicator name>",
            "present": <true/false>,
            "impact": "<positive/negative/neutral>"
        }
    ],
    "red_flags": ["<red flag 1>", "<red flag 2>"],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

CRITICAL: card_description must be ONE short sentence (max 20 words) - NOT a paragraph. Keep it concise and specific.

Scoring Guidelines:
- 90-100: Excellent content quality, highly credible
- 70-89: Good content quality, generally credible
- 50-69: Moderate content quality, mixed credibility
- 30-49: Poor content quality, low credibility
- 0-29: Very poor content quality, very low credibility

Focus on:
- Content quality and accuracy
- Source credibility
- Factual claims
- Author expertise
- Publication standards
- Recent updates

Remember: Return ONLY valid JSON, nothing else.

Content to analyze:`,

    [CONFIG.ANALYSIS_TYPES.CLICKBAIT_DETECTION]: `Analyze this URL for clickbait and manipulative content. Your response should be in JSON format:

{
    "clickbait_score": <number between 0-100>,
    "clickbait_level": "<low/medium/high>",
    "card_description": "<ONE short sentence (max 20 words) describing clickbait detection results>",
    "manipulation_techniques": [
        {
            "technique": "<technique name>",
            "example": "<specific example>",
            "severity": "<high/medium/low>",
            "impact": "<how it affects the reader>"
        }
    ],
    "emotional_triggers": ["<trigger 1>", "<trigger 2>"],
    "misleading_elements": ["<element 1>", "<element 2>"],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

CRITICAL: card_description must be ONE short sentence (max 20 words) - NOT a paragraph. Keep it concise.

Focus on:
- Sensationalist headlines
- Emotional manipulation
- Misleading titles
- False urgency
- Exaggerated claims
- Tabloid-style content
- Social media clickbait

URL to analyze:`
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ANALYSIS_PROMPTS };
}
