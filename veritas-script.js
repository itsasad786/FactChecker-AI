// Veritas Analyzer JavaScript Functionality

// Tab switching functionality
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Clear previous results when switching tabs
    clearAnalysisResults();
    
    // Reset forms when switching tabs
    resetForms();
}

// Reset all input forms
function resetForms() {
    document.getElementById('text-input').value = '';
    document.getElementById('url-input').value = '';
    document.getElementById('url-preview').style.display = 'none';
    document.getElementById('uploaded-files').style.display = 'none';
    document.getElementById('file-input').value = '';
    updateCharCount();
}

// Character count for text input
function updateCharCount() {
    const textInput = document.getElementById('text-input');
    const charCount = document.querySelector('.char-count');
    
    if (textInput && charCount) {
        const count = textInput.value.length;
        charCount.textContent = `${count} characters`;
        
        // Change color based on length
        if (count > 5000) {
            charCount.style.color = '#dc3545';
        } else if (count > 2000) {
            charCount.style.color = '#ffc107';
        } else {
            charCount.style.color = '#666666';
        }
    }
}

// Add event listener for character count
document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text-input');
    if (textInput) {
        textInput.addEventListener('input', updateCharCount);
    }
});

// Text analysis function
async function analyzeText() {
    const textInput = document.getElementById('text-input');
    const text = textInput.value.trim();
    
    if (!text) {
        showNotification('Please enter some text to analyze', 'error');
        return;
    }
    
    if (text.length < 50) {
        showNotification('Please enter at least 50 characters for accurate analysis', 'warning');
        return;
    }
    
    // Clear previous results before starting new analysis
    clearAnalysisResults();
    
    // Show loading state
    const analyzeBtn = document.querySelector('#text-tab .analyze-btn');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    analyzeBtn.disabled = true;
    
    try {
        // Check if API key is configured
        if (!CONFIG.GEMINI_API_KEY) {
            throw new Error('API key not configured. Please add your Gemini API key in config.js');
        }
        
        // Show progress notification
        showNotification('Starting comprehensive analysis...', 'info');
        
        // Call the real Gemini API
        const result = await geminiAPI.analyzeText(text);
        
        if (result.success) {
            // Store original text in results for categorization
            result.data.originalText = text;
            showNotification('Analysis completed successfully!', 'success');
            showAnalysisResults(result.data);
        } else {
            throw new Error(result.message || 'Analysis failed');
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        
        // Show error notification
        showNotification(`Analysis failed: ${error.message}`, 'error');
        
        // Fallback to mock results for demonstration
        showNotification('Showing demo results. Please configure API key for real analysis.', 'warning');
        showAnalysisResults(generateMockResults(text));
        
    } finally {
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
}

// URL analysis function - Rebuilt from scratch
async function analyzeURL() {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    
    // Validate input
    if (!url) {
        showNotification('Please enter a URL to analyze', 'error');
        return;
    }
    
    if (!isValidURL(url)) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }
    
    // Clear previous results
    clearAnalysisResults();
    
    // Show loading state
    const analyzeBtn = document.querySelector('#url-tab .analyze-btn');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    analyzeBtn.disabled = true;
    
    try {
        // Check API key
        if (!CONFIG || !CONFIG.GEMINI_API_KEY || !CONFIG.GEMINI_API_KEY.trim()) {
            throw new Error('API key not configured');
        }
        
        // Step 1: Extract content from URL
        showNotification('Extracting content from URL...', 'info');
        showURLPreview(url);
        
        const extractResult = await urlExtractor.extractContent(url);
        
        if (!extractResult || !extractResult.success) {
            throw new Error('Failed to extract content from URL');
        }
        
        const extractedContent = extractResult.data;
        
        // Update preview
        updateURLPreview(extractedContent);
        showNotification('Content extracted. Analyzing...', 'success');
        
        // Step 2: Prepare content for analysis (ensure it's not too long)
        let contentToAnalyze = extractedContent.content || '';
        
        // Limit content length more aggressively to prevent token limit issues
        const maxContentWords = 500; // Reduced from 800 to be safer
        if (contentToAnalyze) {
            const words = contentToAnalyze.split(/\s+/);
            if (words.length > maxContentWords) {
                contentToAnalyze = words.slice(0, maxContentWords).join(' ');
                // Try to end at sentence
                const lastPeriod = contentToAnalyze.lastIndexOf('.');
                if (lastPeriod > contentToAnalyze.length * 0.7) {
                    contentToAnalyze = contentToAnalyze.substring(0, lastPeriod + 1);
                } else {
                    contentToAnalyze = contentToAnalyze.trim() + '...';
                }
            }
        }
        
        const contentText = `
URL: ${url}
Title: ${extractedContent.title || 'Unknown'}
Source: ${extractedContent.source || 'Unknown'}

Content:
${contentToAnalyze || 'No content extracted'}
        `.trim();
        
        // Step 3: Analyze with Gemini API
        const analysisTypes = [
            CONFIG.ANALYSIS_TYPES.URL_CONTENT,
            CONFIG.ANALYSIS_TYPES.FACT_CHECK,
            CONFIG.ANALYSIS_TYPES.URL_SAFETY,
            CONFIG.ANALYSIS_TYPES.CLICKBAIT_DETECTION
        ];
        
        const analysisResult = await geminiAPI.analyzeText(contentText, analysisTypes);
        
        if (!analysisResult || !analysisResult.success) {
            throw new Error(analysisResult?.message || 'Analysis failed');
        }
        
        // Step 4: Add URL info to results
        analysisResult.data.urlInfo = {
            originalUrl: url,
            title: extractedContent.title,
            source: extractedContent.source,
            wordCount: extractedContent.wordCount
        };
        
        // Step 5: Store original content and display results
        analysisResult.data.originalText = contentText;
        analysisResult.data.content = contentToAnalyze;
        showNotification('Analysis completed successfully!', 'success');
        showAnalysisResults(analysisResult.data);
        
    } catch (error) {
        console.error('URL analysis error:', error);
        showNotification(`Analysis failed: ${error.message}`, 'error');
    } finally {
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
}

// URL validation helper
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Show URL preview (loading state)
function showURLPreview(url) {
    const preview = document.getElementById('url-preview');
    if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = `
            <div class="preview-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading: ${url}</span>
            </div>
        `;
    }
}

// Update URL preview with extracted content
function updateURLPreview(extractedContent) {
    const preview = document.getElementById('url-preview');
    if (preview && extractedContent) {
        preview.innerHTML = `
            <div class="url-preview-content">
                <h4>Content Preview</h4>
                <div class="preview-details">
                    <p><strong>URL:</strong> ${extractedContent.url || 'N/A'}</p>
                    <p><strong>Title:</strong> ${extractedContent.title || 'Untitled'}</p>
                    <p><strong>Source:</strong> ${extractedContent.source || 'Unknown'}</p>
                    <p><strong>Word Count:</strong> ${extractedContent.wordCount || 0}</p>
                </div>
                <div class="preview-content">
                    <h5>Content:</h5>
                    <p>${extractedContent.content ? extractedContent.content.substring(0, 300) + (extractedContent.content.length > 300 ? '...' : '') : 'No content available'}</p>
                </div>
            </div>
        `;
    }
}

// File upload handling
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    
    if (fileInput && uploadArea) {
        // File input change
        fileInput.addEventListener('change', handleFileUpload);
        
        // Drag and drop
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
});

function handleFileUpload(event) {
    const files = event.target.files;
    displayUploadedFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    displayUploadedFiles(files);
}

function displayUploadedFiles(files) {
    const uploadedFiles = document.getElementById('uploaded-files');
    
    if (files.length === 0) {
        uploadedFiles.style.display = 'none';
        return;
    }
    
    uploadedFiles.style.display = 'block';
    uploadedFiles.innerHTML = '<h4>Uploaded Files:</h4>';
    
    Array.from(files).forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // Get file type icon
        const fileIcon = getFileTypeIcon(file.type);
        const fileSize = formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="${fileIcon}"></i>
                <div class="file-details">
                    <span class="file-name">${file.name}</span>
                    <span class="file-meta">${fileSize} • ${file.type}</span>
                </div>
            </div>
            <button class="analyze-btn" onclick="analyzeFile(${index})">
                <i class="fas fa-search"></i>
                Analyze
            </button>
        `;
        uploadedFiles.appendChild(fileItem);
    });
}

// Get file type icon
function getFileTypeIcon(fileType) {
    if (fileType.startsWith('image/')) {
        return 'fas fa-image';
    } else if (fileType === 'application/pdf') {
        return 'fas fa-file-pdf';
    } else if (fileType.startsWith('text/')) {
        return 'fas fa-file-alt';
    }
    return 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function analyzeFile(fileIndex) {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[fileIndex];
    
    if (!file) {
        showNotification('File not found', 'error');
        return;
    }
    
    // Clear previous results before starting new analysis
    clearAnalysisResults();
    
    try {
        // Show loading state
        const analyzeBtn = document.querySelector(`[onclick="analyzeFile(${fileIndex})"]`);
        const originalText = analyzeBtn.innerHTML;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        analyzeBtn.disabled = true;
        
        // Check if API key is configured
        if (!CONFIG.GEMINI_API_KEY) {
            throw new Error('API key not configured. Please add your Gemini API key in config.js');
        }
        
        showNotification(`Processing ${file.name}...`, 'info');
        
        // Extract content from file
        const extractionResult = await contentExtractor.extractContentFromFile(file);
        
        if (!extractionResult.success) {
            throw new Error(extractionResult.error || 'Failed to extract content from file');
        }
        
        showNotification(`Content extracted successfully (${extractionResult.wordCount} words). Starting analysis...`, 'success');
        
        // Analyze the extracted content using the same text analysis system
        const analysisResult = await analyzeExtractedFileContent(extractionResult);
        
        if (analysisResult.success) {
            // Store original text in results for categorization
            analysisResult.data.originalText = extractionResult.extractedText || '';
            showNotification('File analysis completed successfully!', 'success');
            showAnalysisResults(analysisResult.data);
        } else {
            throw new Error(analysisResult.message || 'Analysis failed');
        }
        
    } catch (error) {
        console.error('File analysis error:', error);
        showNotification(`File analysis failed: ${error.message}`, 'error');
        
        // Fallback to mock results for demonstration
        showNotification('Showing demo results. Please configure API key for real analysis.', 'warning');
        showAnalysisResults(generateMockResults(file.name));
        
    } finally {
        // Reset button state
        const analyzeBtn = document.querySelector(`[onclick="analyzeFile(${fileIndex})"]`);
        if (analyzeBtn) {
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze';
            analyzeBtn.disabled = false;
        }
    }
}

// Generate mock analysis results
function generateMockResults(input) {
    const score = Math.floor(Math.random() * 40) + 60; // Score between 60-100
    let title, description;
    
    if (score >= 85) {
        title = 'High Credibility';
        description = 'This content shows strong indicators of reliability and factual accuracy.';
    } else if (score >= 70) {
        title = 'Moderate Credibility';
        description = 'This content has some reliable elements but should be verified with additional sources.';
    } else {
        title = 'Low Credibility';
        description = 'This content shows several warning signs and should be treated with caution.';
    }
    
    return {
        overallScore: score,
        title: title,
        description: description,
        details: [
            {
                name: 'Source Verification',
                score: Math.floor(Math.random() * 30) + 70,
                description: 'Source appears to be from a reputable organization with established credibility.'
            },
            {
                name: 'Fact Checking',
                score: Math.floor(Math.random() * 30) + 70,
                description: 'Most claims can be verified through multiple independent sources.'
            },
            {
                name: 'Language Analysis',
                score: Math.floor(Math.random() * 30) + 70,
                description: 'Content uses neutral language with minimal emotional manipulation.'
            },
            {
                name: 'Bias Detection',
                score: Math.floor(Math.random() * 30) + 70,
                description: 'Information is current and up-to-date with recent developments.'
            }
        ]
    };
}

// Show analysis results
// Clear analysis results and reset UI state
function clearAnalysisResults() {
    const resultsSection = document.getElementById('results');
    const reportingHub = document.getElementById('reporting-hub');
    
    // Hide results section
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    // Hide reporting hub completely (remove from layout)
    if (reportingHub) {
        reportingHub.style.display = 'none';
        reportingHub.style.visibility = 'hidden';
        reportingHub.style.margin = '0';
        reportingHub.style.padding = '0';
        reportingHub.style.height = '0';
        reportingHub.style.overflow = 'hidden';
        reportingHub.classList.remove('show');
    }
    
    // Also hide any report button
    const reportBtn = document.getElementById('report-btn');
    if (reportBtn) {
        reportBtn.style.display = 'none';
    }
    
    // Clear any existing notifications
    clearNotifications();
    
    // Reset any loading states
    resetLoadingStates();
}

// Clear all notifications
function clearNotifications() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => notification.remove());
}


// Reset loading states
function resetLoadingStates() {
    // Reset text analysis button
    const textAnalyzeBtn = document.querySelector('#text-tab .analyze-btn');
    if (textAnalyzeBtn) {
        textAnalyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Text';
        textAnalyzeBtn.disabled = false;
    }
    
    // Reset URL analysis button
    const urlAnalyzeBtn = document.querySelector('#url-tab .analyze-btn');
    if (urlAnalyzeBtn) {
        urlAnalyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze URL';
        urlAnalyzeBtn.disabled = false;
    }
    
    // Reset file analysis buttons
    const fileAnalyzeBtns = document.querySelectorAll('.analyze-btn');
    fileAnalyzeBtns.forEach(btn => {
        if (btn.innerHTML.includes('Processing')) {
            btn.innerHTML = '<i class="fas fa-search"></i> Analyze';
            btn.disabled = false;
        }
    });
}

// Start new analysis - clear everything and reset to first tab
function startNewAnalysis() {
    // Use the same approach as tab switching - it works perfectly
    // Clear all results and UI state
    clearAnalysisResults();
    
    // Reset all forms
    resetForms();
    
    // Switch to text tab (first tab) - this will also call clearAnalysisResults() again
    switchTab('text');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show notification
    showNotification('Ready for new analysis!', 'success');
}

function showAnalysisResults(results) {
    const resultsSection = document.getElementById('results');
    
    // Update overall score
    document.getElementById('overall-score').textContent = results.overallScore;
    document.getElementById('score-title').textContent = results.credibilityLevel;
    document.getElementById('score-description').textContent = getOverallDescription(results);
    
    // Update score circle with smooth animation and dynamic colors
    const scoreCircle = document.querySelector('.score-circle');
    const percentage = (results.overallScore / 100) * 360;
    
    // Get color based on score
    const colors = getScoreColors(results.overallScore);
    
    // Animate the score circle with dynamic colors
    scoreCircle.style.background = `conic-gradient(${colors.primary} 0deg, ${colors.primary} ${percentage}deg, #e9ecef ${percentage}deg)`;
    
    // Update score value color
    const scoreValue = document.querySelector('.score-value');
    if (scoreValue) {
        scoreValue.style.transition = 'all 0.5s ease-in-out';
        scoreValue.style.color = colors.primary;
    }
    
    // Update detail cards with real analysis results
    updateDetailCards(results);
    
    // Add detailed insights section
    addDetailedInsights(results);
    
    // Show reporting hub if threat is detected
    const threat = categorizeThreat(results);
    if (threat.shouldReport) {
        showReportingHub(results);
        // Show report button
        document.getElementById('report-btn').style.display = 'inline-flex';
    } else {
        // Hide report button for low threat content
        document.getElementById('report-btn').style.display = 'none';
    }
    
    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    // Add animation
    resultsSection.classList.add('fade-in');
}

// Get overall description based on analysis results
function getOverallDescription(results) {
    if (results.analysisResults && results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK]) {
        const factCheck = results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK];
        return factCheck.summary || 'Analysis completed. Review detailed findings below.';
    }
    return 'Analysis completed. Review detailed findings below.';
}

// Update detail cards with real analysis results
function updateDetailCards(results) {
    const detailCards = document.querySelectorAll('.detail-card');
    
    // Check if this is a URL analysis result
    const isURLAnalysis = results.urlInfo && results.urlInfo.originalUrl;
    
    if (isURLAnalysis) {
        updateURLDetailCards(results, detailCards);
    } else {
        updateTextDetailCards(results, detailCards);
    }
}

// Update detail cards for URL analysis
function updateURLDetailCards(results, detailCards) {
    // Update card headers for URL analysis
    updateDetailCardHeaders(true);
    
    // URL Content Card (Card 1)
    if (detailCards[0] && results.analysisResults[CONFIG.ANALYSIS_TYPES.URL_CONTENT]) {
        const contentAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.URL_CONTENT];
        const progressFill = detailCards[0].querySelector('.progress-fill');
        const description = detailCards[0].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${contentAnalysis.content_score}%`;
        }
        if (description) {
            description.textContent = getURLContentDescription(contentAnalysis);
        }
        detailCards[0].style.display = 'block';
    }
    
    // Fact Check Card (Card 2)
    if (detailCards[1] && results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK]) {
        const factCheck = results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK];
        const progressFill = detailCards[1].querySelector('.progress-fill');
        const description = detailCards[1].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${factCheck.overall_score}%`;
        }
        if (description) {
            description.textContent = getFactCheckDescription(factCheck);
        }
        detailCards[1].style.display = 'block';
    }
    
    // URL Safety Card (Card 3)
    if (detailCards[2] && results.analysisResults[CONFIG.ANALYSIS_TYPES.URL_SAFETY]) {
        const safetyAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.URL_SAFETY];
        const progressFill = detailCards[2].querySelector('.progress-fill');
        const description = detailCards[2].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${safetyAnalysis.safety_score}%`;
        }
        if (description) {
            description.textContent = getURLSafetyDescription(safetyAnalysis);
        }
        detailCards[2].style.display = 'block';
    }
    
    // Clickbait Detection Card (Card 4)
    if (detailCards[3] && results.analysisResults[CONFIG.ANALYSIS_TYPES.CLICKBAIT_DETECTION]) {
        const clickbaitAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.CLICKBAIT_DETECTION];
        const progressFill = detailCards[3].querySelector('.progress-fill');
        const description = detailCards[3].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${clickbaitAnalysis.clickbait_score}%`;
        }
        if (description) {
            description.textContent = getClickbaitDescription(clickbaitAnalysis);
        }
        detailCards[3].style.display = 'block';
    }
}

// Update detail cards for text analysis
function updateTextDetailCards(results, detailCards) {
    // Update card headers for text analysis
    updateDetailCardHeaders(false);
    
    // Source Verification Card
    if (detailCards[0] && results.analysisResults[CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION]) {
        const sourceAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION];
        const progressFill = detailCards[0].querySelector('.progress-fill');
        const description = detailCards[0].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${sourceAnalysis.source_score}%`;
        }
        if (description) {
            description.textContent = getSourceDescription(sourceAnalysis);
        }
    }
    
    // Fact Checking Card
    if (detailCards[1] && results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK]) {
        const factCheck = results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK];
        const progressFill = detailCards[1].querySelector('.progress-fill');
        const description = detailCards[1].querySelector('.detail-content p');
        
        if (progressFill) {
            // Validate and ensure score is a valid number between 0-100
            let score = factCheck.overall_score;
            if (score === undefined || score === null || isNaN(score)) {
                score = 50; // Default if invalid
            }
            score = Number(score);
            score = Math.max(0, Math.min(100, score)); // Clamp between 0-100
            progressFill.style.width = `${score}%`;
        }
        if (description) {
            description.textContent = getFactCheckDescription(factCheck);
        }
    }
    
    // Language Analysis Card
    if (detailCards[2] && results.analysisResults[CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS]) {
        const languageAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS];
        const progressFill = detailCards[2].querySelector('.progress-fill');
        const description = detailCards[2].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${languageAnalysis.language_score}%`;
        }
        if (description) {
            description.textContent = getLanguageDescription(languageAnalysis);
        }
    }
    
    // Bias Detection Card
    if (detailCards[3] && results.analysisResults[CONFIG.ANALYSIS_TYPES.BIAS_DETECTION]) {
        const biasAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.BIAS_DETECTION];
        const progressFill = detailCards[3].querySelector('.progress-fill');
        const description = detailCards[3].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${biasAnalysis.bias_score}%`;
        }
        if (description) {
            description.textContent = getBiasDescription(biasAnalysis);
        }
    }
}

// Helper functions to generate descriptions from AI analysis
function getSourceDescription(sourceAnalysis) {
    // Use AI-generated recommendations or create dynamic description
    if (sourceAnalysis.recommendations && sourceAnalysis.recommendations.length > 0) {
        return sourceAnalysis.recommendations[0];
    }
    
    // Fallback to quality-based description
    if (sourceAnalysis.source_quality === 'excellent') {
        return 'Source appears to be highly credible and reliable.';
    } else if (sourceAnalysis.source_quality === 'good') {
        return 'Source shows good credibility with some verification needed.';
    } else if (sourceAnalysis.source_quality === 'poor') {
        return 'Source shows poor credibility and requires additional verification.';
    }
    
    return 'Source verification completed. Check recommended sources for validation.';
}

function getFactCheckDescription(factCheck) {
    // Use AI-generated short description if available
    if (factCheck.card_description) {
        return truncateDescription(factCheck.card_description, 120);
    }
    
    // Create short, specific description (different from URL content)
    const level = factCheck.credibility_level || 'moderate';
    const score = factCheck.overall_score || 50;
    const claimCount = factCheck.claims ? factCheck.claims.length : 0;
    
    if (level === 'high' || score >= 80) {
        return `Verified claims found. ${claimCount > 0 ? `${claimCount} claim${claimCount > 1 ? 's' : ''} analyzed.` : 'High factual accuracy.'}`;
    } else if (level === 'moderate' || score >= 50) {
        return `Mixed verification results. ${claimCount > 0 ? `${claimCount} claim${claimCount > 1 ? 's' : ''} need${claimCount > 1 ? '' : 's'} verification.` : 'Some unverified claims.'}`;
    } else {
        return `Low credibility detected. ${claimCount > 0 ? `${claimCount} suspicious claim${claimCount > 1 ? 's' : ''} found.` : 'Multiple red flags present.'}`;
    }
}

function getLanguageDescription(languageAnalysis) {
    // Use AI-generated card description if available
    if (languageAnalysis.card_description) {
        return languageAnalysis.card_description;
    }
    
    // Fallback to dynamic description based on AI analysis results
    let description = '';
    
    // Start with language quality assessment
    if (languageAnalysis.language_quality) {
        if (languageAnalysis.language_quality === 'neutral') {
            description = 'Content uses neutral language with minimal bias detected.';
        } else if (languageAnalysis.language_quality === 'biased') {
            description = 'Content shows signs of bias and emotional manipulation.';
        } else if (languageAnalysis.language_quality === 'manipulative') {
            description = 'Content uses manipulative language and emotional appeals.';
        }
    }
    
    // Add specific bias indicators found
    if (languageAnalysis.bias_indicators && languageAnalysis.bias_indicators.length > 0) {
        const biasTypes = languageAnalysis.bias_indicators.map(bias => bias.type).join(', ');
        description += ` Detected bias types: ${biasTypes}.`;
    }
    
    // Add manipulation techniques found
    if (languageAnalysis.manipulation_techniques && languageAnalysis.manipulation_techniques.length > 0) {
        const techniques = languageAnalysis.manipulation_techniques.map(tech => tech.technique).join(', ');
        description += ` Manipulation techniques used: ${techniques}.`;
    }
    
    // Add emotional tone analysis
    if (languageAnalysis.emotional_tone) {
        description += ` Emotional tone: ${languageAnalysis.emotional_tone}.`;
    }
    
    // Fallback to recommendations if no specific analysis available
    if (!description && languageAnalysis.recommendations && languageAnalysis.recommendations.length > 0) {
        description = languageAnalysis.recommendations[0];
    }
    
    return description || 'Language analysis completed. Review detailed findings below.';
}

function getBiasDescription(biasAnalysis) {
    // Use AI-generated card description if available
    if (biasAnalysis.card_description) {
        return biasAnalysis.card_description;
    }
    
    // Fallback to dynamic description based on AI analysis results
    let description = '';
    
    // Start with overall bias level assessment
    if (biasAnalysis.overall_bias_level) {
        if (biasAnalysis.overall_bias_level === 'low') {
            description = 'Content shows minimal bias and maintains objectivity.';
        } else if (biasAnalysis.overall_bias_level === 'medium') {
            description = 'Content shows moderate bias that should be considered.';
        } else if (biasAnalysis.overall_bias_level === 'high') {
            description = 'Content shows significant bias and requires critical evaluation.';
        }
    }
    
    // Add specific bias types found
    if (biasAnalysis.bias_types && biasAnalysis.bias_types.length > 0) {
        const biasTypes = biasAnalysis.bias_types.map(bias => bias.type).join(', ');
        description += ` Detected bias types: ${biasTypes}.`;
        
        // Add severity information
        const highSeverityBias = biasAnalysis.bias_types.filter(bias => bias.severity === 'high');
        if (highSeverityBias.length > 0) {
            description += ` High severity biases: ${highSeverityBias.map(bias => bias.type).join(', ')}.`;
        }
    }
    
    // Add specific examples if available
    if (biasAnalysis.bias_types && biasAnalysis.bias_types.length > 0) {
        const examples = biasAnalysis.bias_types
            .filter(bias => bias.examples && bias.examples.length > 0)
            .map(bias => bias.examples[0])
            .slice(0, 2); // Show max 2 examples
        
        if (examples.length > 0) {
            description += ` Examples: "${examples.join('", "')}".`;
        }
    }
    
    // Fallback to recommendations if no specific analysis available
    if (!description && biasAnalysis.recommendations && biasAnalysis.recommendations.length > 0) {
        description = biasAnalysis.recommendations[0];
    }
    
    return description || 'Bias analysis completed. Review detailed findings below.';
}

// Reporting Hub functionality
let selectedAuthority = null;
let currentAnalysisResults = null;

// Authority definitions
const AUTHORITIES = {
    cyber: {
        id: 'cyber',
        name: 'Cyber Crime Cell',
        organization: 'Indian Cyber Crime Coordination Centre (I4C)',
        icon: 'fas fa-shield-alt',
        description: 'Report cyber crimes, online fraud, and digital threats',
        actions: ['Online Portal', 'Email Report', 'WhatsApp'],
        contact: {
            portal: 'https://cybercrime.gov.in',
            email: 'cybercrime@nic.in',
            whatsapp: '+91-155260'
        },
        template: 'cyber'
    },
    financial: {
        id: 'financial',
        name: 'Financial Scam',
        organization: 'RBI Sachet Portal',
        icon: 'fas fa-rupee-sign',
        description: 'Report financial scams, banking fraud, and investment schemes',
        actions: ['RBI Portal', 'SEBI Report', 'Bank Complaint'],
        contact: {
            portal: 'https://sachet.rbi.org.in',
            email: 'sachet@rbi.org.in',
            phone: '1800-11-2378'
        },
        template: 'financial'
    },
    election: {
        id: 'election',
        name: 'Election Misinformation',
        organization: 'Election Commission of India',
        icon: 'fas fa-vote-yea',
        description: 'Report election-related misinformation and fake news',
        actions: ['ECI Portal', 'Vigilance Unit', 'Social Media'],
        contact: {
            portal: 'https://eci.gov.in',
            email: 'vigilance@eci.gov.in',
            phone: '011-23717391'
        },
        template: 'election'
    },
    health: {
        id: 'health',
        name: 'Health Misinformation',
        organization: 'Ministry of Health & Family Welfare',
        icon: 'fas fa-heartbeat',
        description: 'Report health-related misinformation and medical scams',
        actions: ['Health Ministry', 'WHO India', 'Medical Board'],
        contact: {
            portal: 'https://mohfw.gov.in',
            email: 'feedback@mohfw.gov.in',
            phone: '1075'
        },
        template: 'health'
    },
    general: {
        id: 'general',
        name: 'General Fake News',
        organization: 'PIB Fact Check',
        icon: 'fas fa-newspaper',
        description: 'Report general misinformation and fake news',
        actions: ['PIB Portal', 'WhatsApp Bot', 'Social Media'],
        contact: {
            portal: 'https://factcheck.pib.gov.in',
            whatsapp: '+91-8800001234',
            email: 'factcheck@pib.gov.in'
        },
        template: 'general'
    }
};

// Threat categorization based on analysis results
function categorizeThreat(results) {
    const score = results.overallScore || 50;
    
    // Get analysis results from the correct structure
    const analysisResults = results.analysisResults || {};
    const factCheck = analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK] || {};
    const biasAnalysis = analysisResults[CONFIG.ANALYSIS_TYPES.BIAS_DETECTION] || {};
    const languageAnalysis = analysisResults[CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS] || {};
    const emotionalManipulation = analysisResults[CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION] || languageAnalysis || {};
    
    // Get original content text for keyword analysis
    const originalText = results.originalText || results.content || '';
    const urlInfo = results.urlInfo || {};
    const urlTitle = urlInfo.title || '';
    const urlSource = urlInfo.source || '';
    
    // Combine all text for analysis
    const allText = (originalText + ' ' + urlTitle + ' ' + urlSource).toLowerCase();
    
    let threatLevel = 'low';
    let category = 'general';
    let confidence = 0;
    
    // Determine threat level based on score and analysis
    if (score < 30) {
        threatLevel = 'high';
        confidence = 0.9;
    } else if (score < 50) {
        threatLevel = 'medium';
        confidence = 0.7;
    } else {
        threatLevel = 'low';
        confidence = 0.3;
    }
    
    // Extract data from analysis results
    const claims = factCheck.claims || [];
    const claimTexts = claims.map(c => (c.claim || c.text || '')).join(' ').toLowerCase();
    const techniques = emotionalManipulation.techniques || languageAnalysis.manipulation_techniques || [];
    const techniqueNames = techniques.map(t => (t.technique || t.name || t)).join(' ').toLowerCase();
    const biasTypes = biasAnalysis.bias_types || [];
    const biasTypeNames = biasTypes.map(b => (b.type || b.name || b)).join(' ').toLowerCase();
    
    // Combine all text sources for comprehensive keyword detection
    const combinedText = (allText + ' ' + claimTexts + ' ' + techniqueNames + ' ' + biasTypeNames).toLowerCase();
    
    // Score each category based on keyword matches
    const categoryScores = {
        cyber: 0,
        financial: 0,
        election: 0,
        health: 0,
        general: 0
    };
    
    // Check for cyber crime indicators (highest priority for cyber-related content)
    const cyberKeywords = [
        'hack', 'hacked', 'hacking', 'hacker', 'virus', 'malware', 'phishing', 'phish',
        'password', 'account', 'security', 'breach', 'data leak', 'leak', 'personal information',
        'identity theft', 'cyber', 'cybercrime', 'cyber crime', 'online fraud', 'digital threat',
        'ransomware', 'trojan', 'spyware', 'keylogger', 'ddos', 'sql injection', 'xss',
        'social engineering', 'credential', 'login', 'unauthorized access', 'data breach'
    ];
    cyberKeywords.forEach(keyword => {
        if (combinedText.includes(keyword)) {
            categoryScores.cyber += 2; // Higher weight for cyber keywords
        }
    });
    
    // Check for financial scam indicators
    const financialKeywords = [
        'investment', 'profit', 'money', 'bank', 'loan', 'credit', 'crypto', 'bitcoin',
        'scheme', 'guaranteed', 'returns', 'quick money', 'get rich', 'financial freedom',
        'scam', 'fraud', 'ponzi', 'pyramid', 'forex', 'trading', 'stock', 'share',
        'dividend', 'interest rate', 'emi', 'refund', 'tax', 'irs', 'income tax',
        'lottery', 'prize', 'winner', 'claim', 'rupee', 'rs.', '₹', 'inr'
    ];
    financialKeywords.forEach(keyword => {
        if (combinedText.includes(keyword)) {
            categoryScores.financial += 1.5;
        }
    });
    
    // Check for election misinformation indicators
    const electionKeywords = [
        'election', 'vote', 'voting', 'voter', 'candidate', 'party', 'polls', 'polling',
        'campaign', 'ballot', 'democracy', 'government', 'political', 'policy', 'minister',
        'pm', 'prime minister', 'mp', 'mla', 'parliament', 'assembly', 'constituency',
        'eci', 'election commission', 'election day', 'voting day', 'polling booth',
        'election result', 'exit poll', 'opinion poll', 'manifesto', 'rally'
    ];
    electionKeywords.forEach(keyword => {
        if (combinedText.includes(keyword)) {
            categoryScores.election += 1.5;
        }
    });
    
    // Check for health misinformation indicators
    const healthKeywords = [
        'cure', 'treatment', 'medicine', 'doctor', 'hospital', 'health', 'disease',
        'covid', 'coronavirus', 'vaccine', 'vaccination', 'medical', 'therapy', 'healing',
        'pandemic', 'epidemic', 'symptom', 'diagnosis', 'prescription', 'drug', 'pill',
        'ayurveda', 'homeopathy', 'allopathy', 'surgery', 'operation', 'cancer',
        'diabetes', 'heart', 'blood pressure', 'bp', 'sugar', 'cholesterol'
    ];
    healthKeywords.forEach(keyword => {
        if (combinedText.includes(keyword)) {
            categoryScores.health += 1.5;
        }
    });
    
    // Find the category with the highest score
    let maxScore = 0;
    let detectedCategory = 'general';
    
    for (const [cat, score] of Object.entries(categoryScores)) {
        if (score > maxScore) {
            maxScore = score;
            detectedCategory = cat;
        }
    }
    
    // Only assign specific category if we have strong indicators (score >= 2)
    if (maxScore >= 2) {
        category = detectedCategory;
        confidence = Math.max(confidence, Math.min(0.95, 0.6 + (maxScore * 0.1)));
    } else {
        // Default to general if no strong indicators
        category = 'general';
    }
    
    return {
        level: threatLevel,
        category: category,
        confidence: confidence,
        shouldReport: threatLevel !== 'low' && confidence > 0.6
    };
}

// Helper functions for threat detection
function hasFinancialIndicators(claims, techniques) {
    const financialKeywords = [
        'investment', 'profit', 'money', 'bank', 'loan', 'credit', 'crypto', 'bitcoin',
        'scheme', 'guaranteed', 'returns', 'quick money', 'get rich', 'financial freedom'
    ];
    
    const scamTechniques = [
        'urgency', 'fear of missing out', 'guaranteed returns', 'no risk'
    ];
    
    return checkKeywords(claims, financialKeywords) || 
           checkTechniques(techniques, scamTechniques);
}

function hasCyberIndicators(claims, techniques) {
    const cyberKeywords = [
        'hack', 'virus', 'malware', 'phishing', 'password', 'account', 'security',
        'breach', 'data leak', 'personal information', 'identity theft'
    ];
    
    const cyberTechniques = [
        'urgency', 'fear', 'authority', 'social proof'
    ];
    
    return checkKeywords(claims, cyberKeywords) || 
           checkTechniques(techniques, cyberTechniques);
}

function hasElectionIndicators(claims, biasTypes) {
    const electionKeywords = [
        'election', 'vote', 'candidate', 'party', 'polls', 'campaign', 'ballot',
        'democracy', 'government', 'political', 'policy'
    ];
    
    const politicalBias = [
        'political bias', 'partisan', 'ideological', 'propaganda'
    ];
    
    return checkKeywords(claims, electionKeywords) || 
           checkBiasTypes(biasTypes, politicalBias);
}

function hasHealthIndicators(claims, techniques) {
    const healthKeywords = [
        'cure', 'treatment', 'medicine', 'doctor', 'hospital', 'health', 'disease',
        'covid', 'vaccine', 'medical', 'therapy', 'healing'
    ];
    
    const healthTechniques = [
        'fear', 'authority', 'anecdotal evidence', 'miracle cure'
    ];
    
    return checkKeywords(claims, healthKeywords) || 
           checkTechniques(techniques, healthTechniques);
}

function checkKeywords(claims, keywords) {
    if (!claims || !Array.isArray(claims)) return false;
    
    const claimText = claims.join(' ').toLowerCase();
    return keywords.some(keyword => claimText.includes(keyword.toLowerCase()));
}

function checkTechniques(techniques, targetTechniques) {
    if (!techniques || !Array.isArray(techniques)) return false;
    
    return techniques.some(technique => 
        targetTechniques.some(target => 
            technique.toLowerCase().includes(target.toLowerCase())
        )
    );
}

function checkBiasTypes(biasTypes, targetBias) {
    if (!biasTypes || !Array.isArray(biasTypes)) return false;
    
    return biasTypes.some(bias => 
        targetBias.some(target => 
            bias.toLowerCase().includes(target.toLowerCase())
        )
    );
}

// Show reporting hub
function showReportingHub(results) {
    currentAnalysisResults = results;
    const threat = categorizeThreat(results);
    
    // Update threat assessment
    document.getElementById('threat-level').textContent = threat.level.toUpperCase();
    document.getElementById('threat-level').className = `threat-value ${threat.level}`;
    
    document.getElementById('threat-category').textContent = threat.category.toUpperCase();
    document.getElementById('threat-category').className = `threat-value ${threat.level}`;
    
    // Show relevant authorities
    showRelevantAuthorities(threat);
    
    // Show reporting hub with proper styling
    const reportingHub = document.getElementById('reporting-hub');
    if (reportingHub) {
        // Reset all inline styles to show properly
        reportingHub.style.display = 'block';
        reportingHub.style.visibility = 'visible';
        reportingHub.style.margin = '';
        reportingHub.style.padding = '';
        reportingHub.style.height = '';
        reportingHub.style.overflow = '';
        reportingHub.classList.add('show');
    }
    
    // Scroll to reporting hub
    document.getElementById('reporting-hub').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Show relevant authorities based on threat
function showRelevantAuthorities(threat) {
    const authoritiesGrid = document.getElementById('authorities-grid');
    authoritiesGrid.innerHTML = '';
    
    // Get relevant authorities based on category and threat level
    const relevantAuthorities = getRelevantAuthorities(threat);
    
    relevantAuthorities.forEach(authority => {
        const card = createAuthorityCard(authority);
        authoritiesGrid.appendChild(card);
    });
}

function getRelevantAuthorities(threat) {
    const authorities = [];
    
    // Always include the primary authority for the category
    if (AUTHORITIES[threat.category]) {
        authorities.push(AUTHORITIES[threat.category]);
    }
    
    // Add general authority as fallback
    if (threat.category !== 'general') {
        authorities.push(AUTHORITIES.general);
    }
    
    // For high threat levels, add additional relevant authorities
    if (threat.level === 'high') {
        if (threat.category === 'financial') {
            authorities.push(AUTHORITIES.cyber); // Financial scams often involve cyber elements
        }
        if (threat.category === 'election') {
            authorities.push(AUTHORITIES.cyber); // Election misinformation often spreads via social media
        }
    }
    
    return authorities;
}

function createAuthorityCard(authority) {
    const card = document.createElement('div');
    card.className = 'authority-card';
    card.dataset.authorityId = authority.id;
    card.onclick = () => selectAuthority(authority.id);
    
    card.innerHTML = `
        <div class="authority-header">
            <div class="authority-icon ${authority.id}">
                <i class="${authority.icon}"></i>
            </div>
            <div class="authority-info">
                <h4>${authority.name}</h4>
                <p>${authority.organization}</p>
            </div>
        </div>
        <div class="authority-description">
            ${authority.description}
        </div>
        <div class="authority-actions">
            ${authority.actions.map(action => 
                `<span class="action-badge ${action === authority.actions[0] ? 'primary' : 'secondary'}">${action}</span>`
            ).join('')}
        </div>
    `;
    
    return card;
}

function selectAuthority(authorityId) {
    // Remove previous selection
    document.querySelectorAll('.authority-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select new authority
    const selectedCard = document.querySelector(`[data-authority-id="${authorityId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedAuthority = AUTHORITIES[authorityId];
        
        // Enable report buttons
        document.getElementById('generate-report-btn').disabled = false;
        document.getElementById('preview-report-btn').disabled = false;
    }
}

// Generate report
function generateReport() {
    if (!selectedAuthority || !currentAnalysisResults) {
        showNotification('Please select an authority first', 'error');
        return;
    }
    
    const report = createReport(selectedAuthority, currentAnalysisResults);
    showReportModal(report);
}

function createReport(authority, results) {
    const threat = categorizeThreat(results);
    const entities = extractEntities(results);
    
    return {
        authority: authority,
        threat: threat,
        entities: entities,
        content: results.originalText || 'Content not available',
        analysis: results,
        timestamp: new Date().toISOString(),
        reportId: generateReportId()
    };
}

function extractEntities(results) {
    const entities = {
        people: [],
        organizations: [],
        locations: [],
        monetary: [],
        dates: [],
        urls: []
    };
    
    // Extract entities from claims and analysis
    const claims = results.factCheck?.claims || [];
    const sources = results.sourceVerification?.sources || [];
    
    // Simple entity extraction (in a real implementation, this would use NLP)
    const text = claims.join(' ') + ' ' + sources.join(' ');
    
    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    entities.urls = text.match(urlRegex) || [];
    
    // Extract monetary amounts
    const moneyRegex = /(?:Rs\.?|₹|INR)\s*[\d,]+(?:\.\d{2})?/g;
    entities.monetary = text.match(moneyRegex) || [];
    
    // Extract dates
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    entities.dates = text.match(dateRegex) || [];
    
    return entities;
}

function generateReportId() {
    return 'RPT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function showReportModal(report) {
    const modal = document.getElementById('report-modal');
    const content = document.getElementById('report-content');
    
    content.innerHTML = generateReportContent(report);
    modal.style.display = 'flex';
}

function generateReportContent(report) {
    const { authority, threat, entities, content, analysis } = report;
    
    return `
        <div class="report-content">
            <div class="report-section">
                <h4>Report Details</h4>
                <p><strong>Report ID:</strong> ${report.reportId}</p>
                <p><strong>Authority:</strong> ${authority.organization}</p>
                <p><strong>Threat Level:</strong> ${threat.level.toUpperCase()}</p>
                <p><strong>Category:</strong> ${threat.category.toUpperCase()}</p>
                <p><strong>Confidence:</strong> ${Math.round(threat.confidence * 100)}%</p>
            </div>
            
            <div class="report-section">
                <h4>Content Analysis</h4>
                <p><strong>Credibility Score:</strong> ${analysis.overallScore}/100</p>
                <p><strong>Analysis Summary:</strong> ${analysis.credibilityLevel}</p>
                <p><strong>Key Issues:</strong> ${getKeyIssues(analysis)}</p>
            </div>
            
            <div class="report-section">
                <h4>Extracted Entities</h4>
                <div class="report-entities">
                    ${entities.urls.map(url => `<span class="entity-tag">URL: ${url}</span>`).join('')}
                    ${entities.monetary.map(amount => `<span class="entity-tag">Amount: ${amount}</span>`).join('')}
                    ${entities.dates.map(date => `<span class="entity-tag">Date: ${date}</span>`).join('')}
                </div>
            </div>
            
            <div class="report-section">
                <h4>Reported Content</h4>
                <p style="background: #f8f9fa; padding: 1rem; border-radius: 4px; font-family: monospace;">
                    ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}
                </p>
            </div>
            
            <div class="report-section">
                <h4>Recommended Actions</h4>
                <p>This report will be submitted to ${authority.organization} for further investigation.</p>
                <p>You will receive a confirmation email at your registered address.</p>
            </div>
        </div>
    `;
}

function getKeyIssues(analysis) {
    const issues = [];
    
    if (analysis.overallScore < 50) issues.push('Low credibility');
    if (analysis.factCheck?.claims?.length > 0) issues.push('Unverified claims');
    if (analysis.biasAnalysis?.biasTypes?.length > 0) issues.push('Bias detected');
    if (analysis.emotionalManipulation?.techniques?.length > 0) issues.push('Manipulation techniques');
    
    return issues.join(', ') || 'No specific issues identified';
}

function previewReport() {
    generateReport();
}

function closeReportModal() {
    document.getElementById('report-modal').style.display = 'none';
}

function submitReport() {
    if (!selectedAuthority || !currentAnalysisResults) {
        showNotification('Please select an authority first', 'error');
        return;
    }
    
    // Create the report
    const report = createReport(selectedAuthority, currentAnalysisResults);
    
    // Add submission metadata
    report.status = 'submitted';
    report.submittedAt = new Date().toISOString();
    report.authorityContact = selectedAuthority.contact;
    
    // Save to localStorage
    saveReportToHistory(report);
    
    // In a real implementation, this would submit to the actual authority
    showNotification('Report submitted successfully! You will receive a confirmation email.', 'success');
    closeReportModal();
    
    // Reset form
    selectedAuthority = null;
    document.getElementById('generate-report-btn').disabled = true;
    document.getElementById('preview-report-btn').disabled = true;
    document.querySelectorAll('.authority-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Save report to history
function saveReportToHistory(report) {
    let reports = [];
    const saved = localStorage.getItem('submittedReports');
    if (saved) {
        try {
            reports = JSON.parse(saved);
        } catch (error) {
            console.error('Error loading reports:', error);
            reports = [];
        }
    }
    
    // Add new report at the beginning
    reports.unshift(report);
    
    // Keep only last 100 reports
    if (reports.length > 100) {
        reports = reports.slice(0, 100);
    }
    
    // Save back to localStorage
    localStorage.setItem('submittedReports', JSON.stringify(reports));
}

// Manual reporting function
function showReportingHubManually() {
    if (!currentAnalysisResults) {
        showNotification('No analysis results available', 'error');
        return;
    }
    
    showReportingHub(currentAnalysisResults);
}

// Get colors based on score
function getScoreColors(score) {
    if (score >= 85) {
        return {
            primary: '#28a745', // Green - High credibility
            secondary: '#d4edda',
            name: 'high'
        };
    } else if (score >= 70) {
        return {
            primary: '#17a2b8', // Blue - Good credibility
            secondary: '#d1ecf1',
            name: 'good'
        };
    } else if (score >= 50) {
        return {
            primary: '#ffc107', // Yellow - Moderate credibility
            secondary: '#fff3cd',
            name: 'moderate'
        };
    } else if (score >= 30) {
        return {
            primary: '#fd7e14', // Orange - Low credibility
            secondary: '#ffeaa7',
            name: 'low'
        };
    } else {
        return {
            primary: '#dc3545', // Red - Very low credibility
            secondary: '#f8d7da',
            name: 'very-low'
        };
    }
}

// Add detailed insights section with AI-generated content
function addDetailedInsights(results) {
    // Remove existing insights section if it exists
    const existingInsights = document.getElementById('detailed-insights');
    if (existingInsights) {
        existingInsights.remove();
    }
    
    // Create detailed insights section
    const insightsSection = document.createElement('div');
    insightsSection.id = 'detailed-insights';
    insightsSection.className = 'detailed-insights';
    insightsSection.innerHTML = '<h3>Detailed Analysis Insights</h3>';
    
    // Add insights from each analysis type
    if (results.analysisResults) {
        // Fact Check Insights
        if (results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK]) {
            const factCheck = results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK];
            if (factCheck.claims && factCheck.claims.length > 0) {
                const claimsSection = createClaimsSection(factCheck.claims);
                insightsSection.appendChild(claimsSection);
            }
        }
        
        // Source Verification Insights
        if (results.analysisResults[CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION]) {
            const sourceAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION];
            if (sourceAnalysis.suggested_sources && sourceAnalysis.suggested_sources.length > 0) {
                const sourcesSection = createSourcesSection(sourceAnalysis.suggested_sources);
                insightsSection.appendChild(sourcesSection);
            }
        }
        
        // Language Analysis Insights
        if (results.analysisResults[CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS]) {
            const languageAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS];
            if (languageAnalysis.manipulation_techniques && languageAnalysis.manipulation_techniques.length > 0) {
                const techniquesSection = createTechniquesSection(languageAnalysis.manipulation_techniques);
                insightsSection.appendChild(techniquesSection);
            }
        }
        
        // Bias Detection Insights
        if (results.analysisResults[CONFIG.ANALYSIS_TYPES.BIAS_DETECTION]) {
            const biasAnalysis = results.analysisResults[CONFIG.ANALYSIS_TYPES.BIAS_DETECTION];
            if (biasAnalysis.bias_types && biasAnalysis.bias_types.length > 0) {
                const biasSection = createBiasSection(biasAnalysis.bias_types);
                insightsSection.appendChild(biasSection);
            }
        }
    }
    
    // Insert insights section after the analysis details
    const analysisDetails = document.querySelector('.analysis-details');
    if (analysisDetails) {
        analysisDetails.parentNode.insertBefore(insightsSection, analysisDetails.nextSibling);
    }
}

// Create claims section from fact check analysis
function createClaimsSection(claims) {
    const section = document.createElement('div');
    section.className = 'insight-section';
    section.innerHTML = `
        <h4><i class="fas fa-search"></i> Claims Analysis</h4>
        <div class="claims-list">
            ${claims.map(claim => `
                <div class="claim-item">
                    <div class="claim-header">
                        <span class="claim-text">${claim.claim}</span>
                        <span class="verification-status ${claim.verification_status}">${claim.verification_status}</span>
                    </div>
                    <div class="claim-explanation">${claim.explanation}</div>
                    ${claim.red_flags && claim.red_flags.length > 0 ? `
                        <div class="red-flags">
                            <strong>Red Flags:</strong> ${claim.red_flags.join(', ')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
    return section;
}

// Create sources section from source verification analysis
function createSourcesSection(sources) {
    const section = document.createElement('div');
    section.className = 'insight-section';
    section.innerHTML = `
        <h4><i class="fas fa-link"></i> Recommended Sources</h4>
        <div class="sources-list">
            ${sources.map(source => `
                <div class="source-item">
                    <div class="source-name">${source.source}</div>
                    <div class="source-details">
                        <span class="source-type">${source.type}</span>
                        <span class="source-reliability ${source.reliability}">${source.reliability}</span>
                    </div>
                    <div class="verification-method">${source.verification_method}</div>
                </div>
            `).join('')}
        </div>
    `;
    return section;
}

// Create techniques section from language analysis
function createTechniquesSection(techniques) {
    const section = document.createElement('div');
    section.className = 'insight-section';
    section.innerHTML = `
        <h4><i class="fas fa-exclamation-triangle"></i> Manipulation Techniques Detected</h4>
        <div class="techniques-list">
            ${techniques.map(technique => `
                <div class="technique-item">
                    <div class="technique-header">
                        <span class="technique-name">${technique.technique}</span>
                        <span class="technique-severity ${technique.severity}">${technique.severity}</span>
                    </div>
                    <div class="technique-example">"${technique.example}"</div>
                    <div class="technique-impact">${technique.impact}</div>
                </div>
            `).join('')}
        </div>
    `;
    return section;
}

// Create bias section from bias detection analysis
function createBiasSection(biasTypes) {
    const section = document.createElement('div');
    section.className = 'insight-section';
    section.innerHTML = `
        <h4><i class="fas fa-balance-scale"></i> Bias Types Detected</h4>
        <div class="bias-list">
            ${biasTypes.map(bias => `
                <div class="bias-item">
                    <div class="bias-header">
                        <span class="bias-type">${bias.type}</span>
                        <span class="bias-severity ${bias.severity}">${bias.severity}</span>
                    </div>
                    <div class="bias-explanation">${bias.explanation}</div>
                    ${bias.examples && bias.examples.length > 0 ? `
                        <div class="bias-examples">
                            <strong>Examples:</strong> ${bias.examples.join(', ')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
    return section;
}

// Analyze new content
function analyzeNew() {
    // Use the same approach as tab switching - it works perfectly
    // Clear all results and UI state
    clearAnalysisResults();
    
    // Reset all forms
    resetForms();
    
    // Switch to text tab (first tab) - this will also call clearAnalysisResults() again
    switchTab('text');
    
    // Scroll to analyzer section
    document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' });
    
    // Show notification
    showNotification('Ready for new analysis!', 'success');
}

// Share results
function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'Veritas Analysis Results',
            text: 'Check out my content analysis results from Veritas Analyzer!',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        const resultsText = `Veritas Analysis Results:\nOverall Score: ${document.getElementById('overall-score').textContent}\n${document.getElementById('score-title').textContent}\n\n${document.getElementById('score-description').textContent}`;
        
        navigator.clipboard.writeText(resultsText).then(() => {
            showNotification('Results copied to clipboard!', 'success');
        });
    }
}

// Scroll functions
function scrollToAnalyzer() {
    document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' });
}

function scrollToExtension() {
    document.getElementById('extension').scrollIntoView({ behavior: 'smooth' });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
    }
    
    .notification-success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
    }
    
    .notification-error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
    }
    
    .notification-warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
    }
    
    .notification-info {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        margin-left: auto;
        opacity: 0.7;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .file-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    
    .file-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .file-info i {
        color: #007bff;
    }
    
    .file-size {
        color: #666666;
        font-size: 0.9rem;
    }
`;

// Add styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Test API connection
async function testAPIConnection() {
    try {
        if (!CONFIG.GEMINI_API_KEY) {
            showNotification('API key not configured. Please add your Gemini API key in config.js', 'warning');
            return false;
        }
        
        showNotification('Testing API connection...', 'info');
        console.log('Testing API with URL:', CONFIG.GEMINI_API_URL);
        console.log('API Key present:', CONFIG.GEMINI_API_KEY ? 'Yes' : 'No');
        
        const result = await geminiAPI.testConnection();
        console.log('API test result:', result);
        
        if (result.success) {
            showNotification('API connection successful! Ready for analysis.', 'success');
            return true;
        } else {
            showNotification(`API connection failed: ${result.message}`, 'error');
            console.error('API test failed:', result);
            return false;
        }
    } catch (error) {
        console.error('API test error:', error);
        showNotification(`API test failed: ${error.message}`, 'error');
        return false;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading animation to buttons
    document.querySelectorAll('.analyze-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.disabled) {
                this.classList.add('loading');
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 2000);
            }
        });
    });
    
    // Test API connection on page load (optional)
    // Uncomment the line below to test API connection automatically
    // setTimeout(testAPIConnection, 1000);
});

// URL-specific description functions
function getURLSafetyDescription(safetyAnalysis) {
    // Use AI-generated short description if available
    if (safetyAnalysis.card_description) {
        return truncateDescription(safetyAnalysis.card_description, 120);
    }
    
    // Create short, specific description
    const level = safetyAnalysis.safety_level || 'moderate';
    const score = safetyAnalysis.safety_score || 50;
    
    if (level === 'safe' || score >= 70) {
        return 'URL appears safe with no major security concerns detected.';
    } else if (level === 'suspicious' || score >= 40) {
        return 'URL shows suspicious patterns. Exercise caution before accessing.';
    } else {
        return 'URL flagged as potentially dangerous. Avoid accessing this link.';
    }
}

function getURLContentDescription(contentAnalysis) {
    // Use AI-generated short description if available, otherwise create concise one
    if (contentAnalysis.card_description) {
        return truncateDescription(contentAnalysis.card_description, 120);
    }
    
    // Create short, specific description based on quality
    const quality = contentAnalysis.content_quality || 'moderate';
    const score = contentAnalysis.content_score || 50;
    
    if (quality === 'excellent' || score >= 80) {
        return 'High-quality content with strong credibility indicators and reliable sources.';
    } else if (quality === 'good' || score >= 60) {
        return 'Generally reliable content with minor verification needs.';
    } else if (quality === 'moderate' || score >= 40) {
        return 'Mixed quality content requiring additional verification.';
    } else {
        return 'Low-quality content with significant credibility concerns.';
    }
}

function getClickbaitDescription(clickbaitAnalysis) {
    // Use AI-generated short description if available
    if (clickbaitAnalysis.card_description) {
        return truncateDescription(clickbaitAnalysis.card_description, 120);
    }
    
    // Create short, specific description
    const level = clickbaitAnalysis.clickbait_level || 'moderate';
    const score = clickbaitAnalysis.clickbait_score || 50;
    const techniques = clickbaitAnalysis.manipulation_techniques ? clickbaitAnalysis.manipulation_techniques.length : 0;
    
    if (level === 'low' || score < 40) {
        return 'Minimal clickbait detected. Content appears genuine and straightforward.';
    } else if (level === 'medium' || score < 70) {
        return `Some clickbait elements found. ${techniques > 0 ? `${techniques} manipulation technique${techniques > 1 ? 's' : ''} detected.` : 'Exercise caution.'}`;
    } else {
        return `High clickbait detected. ${techniques > 0 ? `${techniques} manipulative technique${techniques > 1 ? 's' : ''} used.` : 'Strong manipulation indicators.'}`;
    }
}

// Helper function to truncate long descriptions
function truncateDescription(text, maxLength) {
    if (!text || typeof text !== 'string') return '';
    
    // Remove extra whitespace and newlines
    text = text.trim().replace(/\s+/g, ' ');
    
    // If text is short enough, return it
    if (text.length <= maxLength) {
        return text;
    }
    
    // Truncate at word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
        return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
}

// Estimate token usage for content
function estimateTokenUsage(content) {
    if (!content) return 0;
    
    // Rough estimation: 1 token ≈ 0.75 words
    const wordCount = content.split(' ').length;
    const estimatedTokens = Math.ceil(wordCount / 0.75);
    
    return estimatedTokens;
}

// Analyze extracted file content using Gemini API
async function analyzeExtractedFileContent(extractionResult) {
    try {
        // Prepare content for analysis (same as text analysis)
        const contentToAnalyze = extractionResult.extractedText;
        
        // Use the same analysis types as text analysis
        const textAnalysisTypes = [
            CONFIG.ANALYSIS_TYPES.FACT_CHECK,
            CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION,
            CONFIG.ANALYSIS_TYPES.LANGUAGE_ANALYSIS,
            CONFIG.ANALYSIS_TYPES.BIAS_DETECTION,
            CONFIG.ANALYSIS_TYPES.EMOTIONAL_MANIPULATION
        ];

        // Analyze using Gemini API
        const result = await geminiAPI.analyzeText(contentToAnalyze, textAnalysisTypes);
        
        if (result.success) {
            // Enhance results with file-specific information
            result.data.fileInfo = {
                fileName: extractionResult.fileName,
                fileType: extractionResult.fileType,
                fileSize: extractionResult.fileSize,
                wordCount: extractionResult.wordCount,
                characterCount: extractionResult.characterCount,
                extractedAt: extractionResult.extractedAt
            };
            
            return result;
        } else {
            throw new Error(result.message || 'Analysis failed');
        }

    } catch (error) {
        console.error('File content analysis error:', error);
        throw new Error(`File content analysis failed: ${error.message}`);
    }
}

// Update detail card headers based on analysis type
function updateDetailCardHeaders(isURLAnalysis) {
    const detailCards = document.querySelectorAll('.detail-card');
    
    if (isURLAnalysis) {
        // Update headers for URL analysis (4 cards)
        // Card 1: URL Content
        if (detailCards[0]) {
            const header = detailCards[0].querySelector('.detail-header');
            const icon = header.querySelector('i');
            const title = header.querySelector('h4');
            icon.className = 'fas fa-file-alt';
            title.textContent = 'Content Quality';
        }
        
        // Card 2: Fact Check
        if (detailCards[1]) {
            const header = detailCards[1].querySelector('.detail-header');
            const icon = header.querySelector('i');
            const title = header.querySelector('h4');
            icon.className = 'fas fa-quote-left';
            title.textContent = 'Fact Checking';
        }
        
        // Card 3: URL Safety
        if (detailCards[2]) {
            const header = detailCards[2].querySelector('.detail-header');
            const icon = header.querySelector('i');
            const title = header.querySelector('h4');
            icon.className = 'fas fa-shield-alt';
            title.textContent = 'URL Safety';
        }
        
        // Card 4: Clickbait Detection
        if (detailCards[3]) {
            const header = detailCards[3].querySelector('.detail-header');
            const icon = header.querySelector('i');
            const title = header.querySelector('h4');
            icon.className = 'fas fa-exclamation-triangle';
            title.textContent = 'Clickbait Detection';
        }
    } else {
        // Reset headers for text analysis
        if (detailCards[0]) {
            const header = detailCards[0].querySelector('.detail-header');
            const icon = header.querySelector('i');
            const title = header.querySelector('h4');
            icon.className = 'fas fa-newspaper';
            title.textContent = 'Source Verification';
        }
        
        if (detailCards[1]) {
            const header = detailCards[1].querySelector('.detail-header');
            const icon = header.querySelector('i');
            const title = header.querySelector('h4');
            icon.className = 'fas fa-quote-left';
            title.textContent = 'Fact Checking';
        }
        
        if (detailCards[2]) {
            const header = detailCards[2].querySelector('.detail-header');
            const icon = header.querySelector('i');
            const title = header.querySelector('h4');
            icon.className = 'fas fa-language';
            title.textContent = 'Language Analysis';
        }
        
        if (detailCards[3]) {
            const header = detailCards[3].querySelector('.detail-header');
            const icon = header.querySelector('i');
            const title = header.querySelector('h4');
            icon.className = 'fas fa-calendar-alt';
            title.textContent = 'Bias Detection';
        }
    }
}
