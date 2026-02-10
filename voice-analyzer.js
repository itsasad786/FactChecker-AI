// Voice Note Analyzer JavaScript Functionality

// Global variables
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let audioUrl = null;
let isRecording = false;
let recordingStartTime = null;
let recordingTimer = null;
let audioContext = null;
let analyser = null;
let microphone = null;
let animationFrame = null;
let voiceHistory = [];
let uploadedFile = null;
let uploadedFileUrl = null;
let currentAudio = null; // Track currently playing audio

// Initialize voice analyzer when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeVoiceAnalyzer();
    loadVoiceHistory();
    setupEventListeners();
    setupTestAPIButton();
    addNotificationStyles();
});

// Add notification styles
function addNotificationStyles() {
    // Check if styles already exist
    if (document.getElementById('voice-notification-styles')) return;
    
    const notificationStyles = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            gap: 0.75rem;
        }
        .notification-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
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
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'voice-notification-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}

// Setup Test API button
function setupTestAPIButton() {
    // Try multiple selectors to find the Test API button
    let testAPIButton = document.querySelector('button[onclick="testVoiceAPI()"]');
    
    if (!testAPIButton) {
        // Try finding by text content
        const buttons = document.querySelectorAll('button');
        testAPIButton = Array.from(buttons).find(btn => 
            btn.textContent.includes('Test API') || btn.textContent.includes('testVoiceAPI')
        );
    }
    
    if (testAPIButton) {
        // Keep the onclick attribute but also add event listener as backup
        testAPIButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Test API button clicked via event listener');
            testVoiceAPI();
        });
        
        // Also ensure the onclick works
        testAPIButton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Test API button clicked via onclick');
            testVoiceAPI();
        };
        
        console.log('Test API button setup complete');
    } else {
        console.log('Test API button not found');
    }
}

// Initialize voice analyzer
function initializeVoiceAnalyzer() {
    console.log('Initializing Voice Analyzer...');
    
    // Check for browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Your browser does not support voice recording. Please use a modern browser.', 'error');
        return;
    }
    
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('Speech recognition is not supported in your browser.', 'warning');
    }
    
    console.log('Voice Analyzer initialized successfully');
}

// Setup event listeners
function setupEventListeners() {
    // Filter change events
    const dateFilter = document.getElementById('date-filter');
    const credibilityFilter = document.getElementById('credibility-filter');
    
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);
    if (credibilityFilter) credibilityFilter.addEventListener('change', applyFilters);
    
    // Voice note item click events
    document.addEventListener('click', function(e) {
        if (e.target.closest('.voice-note-item')) {
            const voiceNote = e.target.closest('.voice-note-item');
            const noteId = voiceNote.dataset.noteId;
            if (noteId) {
                viewVoiceNote(noteId);
            }
        }
    });
    
    // Upload file input change
    const audioFileInput = document.getElementById('audio-file-input');
    if (audioFileInput) {
        audioFileInput.addEventListener('change', handleFileUpload);
    }
    
    // Drag and drop events
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            document.getElementById('audio-file-input').click();
        });
        
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
}

// Toggle recording
async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

// Start recording
async function startRecording() {
    try {
        showNotification('Requesting microphone access...', 'info');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        // Setup media recorder
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        audioChunks = [];
        
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = function() {
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioUrl = URL.createObjectURL(audioBlob);
            onRecordingComplete();
        };
        
        // Setup audio visualization
        setupAudioVisualization(stream);
        
        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        isRecording = true;
        recordingStartTime = Date.now();
        
        // Update UI
        updateRecordingUI();
        startRecordingTimer();
        
        showNotification('Recording started. Click stop when finished.', 'success');
        
    } catch (error) {
        console.error('Error starting recording:', error);
        showNotification(`Recording failed: ${error.message}`, 'error');
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        // Stop all tracks
        if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        // Stop audio visualization
        stopAudioVisualization();
        
        // Stop timer
        stopRecordingTimer();
        
        // Update UI
        updateRecordingUI();
        
        showNotification('Recording stopped. Processing...', 'info');
    }
}

// Setup audio visualization
function setupAudioVisualization(stream) {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        microphone.connect(analyser);
        
        // Show visualizer
        document.getElementById('audio-visualizer').style.display = 'block';
        
        // Start animation
        drawWaveform();
    } catch (error) {
        console.error('Error setting up audio visualization:', error);
    }
}

// Draw waveform
function drawWaveform() {
    if (!analyser) return;
    
    const canvas = document.getElementById('waveform-canvas');
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!isRecording) return;
        
        animationFrame = requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height;
            
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, '#007bff');
            gradient.addColorStop(1, '#0056b3');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
    
    draw();
}

// Stop audio visualization
function stopAudioVisualization() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    document.getElementById('audio-visualizer').style.display = 'none';
}

// Recording complete callback
function onRecordingComplete() {
    // Enable play and analyze buttons
    document.getElementById('play-btn').disabled = false;
    document.getElementById('analyze-btn').disabled = false;
    
    // Start transcription
    transcribeAudio();
    
    showNotification('Recording complete! You can now play or analyze the recording.', 'success');
}

// Transcribe audio
async function transcribeAudio() {
    if (!audioBlob) return;
    
    try {
        showNotification('Transcribing audio...', 'info');
        
        // Convert audio to text using Web Speech API
        const transcription = await performSpeechRecognition(audioBlob);
        
        if (transcription) {
            document.getElementById('transcription-text').textContent = transcription;
            document.getElementById('transcription-section').style.display = 'block';
            showNotification('Transcription completed!', 'success');
        } else {
            showNotification('Transcription failed. You can still analyze the audio.', 'warning');
        }
        
    } catch (error) {
        console.error('Transcription error:', error);
        showNotification('Transcription failed. You can still analyze the audio.', 'warning');
    }
}

// Perform speech recognition
function performSpeechRecognition(audioBlob) {
    return new Promise((resolve, reject) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            resolve(null);
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        let finalTranscript = '';
        
        recognition.onresult = function(event) {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
        };
        
        recognition.onend = function() {
            resolve(finalTranscript.trim());
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            resolve(null);
        };
        
        // Start recognition
        recognition.start();
        
        // Note: Web Speech API doesn't work directly with audio blobs
        // This is a simplified implementation. In a real app, you'd need to:
        // 1. Convert the audio blob to a format the API can use
        // 2. Use a different speech recognition service
        // 3. Or implement a server-side solution
        
        // For now, we'll simulate transcription
        setTimeout(() => {
            recognition.stop();
            resolve("This is a simulated transcription. In a real implementation, this would be the actual transcribed text from your voice recording.");
        }, 2000);
    });
}

// Play recording
function playRecording() {
    if (audioUrl) {
        // Stop any currently playing audio
        stopCurrentAudio();
        
        const audio = new Audio(audioUrl);
        currentAudio = audio;
        
        // Update button state
        const playBtn = document.getElementById('play-btn');
        playBtn.innerHTML = '<i class="fas fa-pause"></i><span>Playing...</span>';
        playBtn.disabled = false; // Keep enabled so user can click to stop
        
        // Handle play/pause toggle
        playBtn.onclick = function() {
            if (currentAudio && !currentAudio.paused) {
                // Currently playing, so stop it
                stopCurrentAudio();
            } else {
                // Not playing, so start it
                currentAudio.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i><span>Playing...</span>';
            }
        };
        
        audio.onended = function() {
            playBtn.innerHTML = '<i class="fas fa-play"></i><span>Play Recording</span>';
            playBtn.onclick = playRecording; // Reset to original function
            currentAudio = null;
        };
        
        audio.play();
        showNotification('Playing recording...', 'info');
    }
}

// Analyze voice (DEMO ONLY - no real API calls)
async function analyzeVoice() {
    if (!audioBlob && !uploadedFile) {
        showNotification('No recording or file available to analyze', 'error');
        return;
    }
    
    // Stop any currently playing audio
    stopCurrentAudio();
    
    // Get transcription text
    const transcription = document.getElementById('transcription-text').textContent;
    if (!transcription || transcription.trim() === '') {
        showNotification('No transcription available. Please try recording again.', 'error');
        return;
    }
    
    // Update button state
    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Analyzing...</span>';
    analyzeBtn.disabled = true;
    
    try {
        // Pure demo: generate local mock results only, no external API usage
        const demoResults = generateMockVoiceResults();
        showNotification('Showing demo voice analysis (no external API used).', 'info');
        showVoiceAnalysisResults(demoResults, transcription);
    } catch (error) {
        console.error('Voice analysis demo error:', error);
        showNotification(`Voice analysis failed: ${error.message}`, 'error');
    } finally {
        // Reset button state
        analyzeBtn.innerHTML = '<i class="fas fa-search"></i><span>Analyze Voice</span>';
        analyzeBtn.disabled = false;
    }
}

// Show voice analysis results
function showVoiceAnalysisResults(results, transcription) {
    // Update overall score
    document.getElementById('overall-score').textContent = results.overallScore || 85;
    document.getElementById('score-title').textContent = results.credibilityLevel || 'High Credibility';
    document.getElementById('score-description').textContent = getVoiceDescription(results);
    
    // Update score circle with colors
    const scoreCircle = document.querySelector('.score-circle');
    const percentage = ((results.overallScore || 85) / 100) * 360;
    const colors = getScoreColors(results.overallScore || 85);
    
    scoreCircle.style.background = `conic-gradient(${colors.primary} 0deg, ${colors.primary} ${percentage}deg, #e9ecef ${percentage}deg)`;
    
    const scoreValue = document.querySelector('.score-value');
    if (scoreValue) {
        scoreValue.style.color = colors.primary;
    }
    
    // Update detail cards
    updateVoiceDetailCards(results);
    
    // Add voice insights
    addVoiceInsights(results);
    
    // Show results section
    const resultsSection = document.getElementById('results');
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    resultsSection.classList.add('fade-in-up');
    
    // Save to history
    saveVoiceNoteToHistory(transcription, results);
}

// Get voice description
function getVoiceDescription(results) {
    if (results.analysisResults && results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK]) {
        const factCheck = results.analysisResults[CONFIG.ANALYSIS_TYPES.FACT_CHECK];
        return factCheck.summary || 'Voice content analysis completed. Review detailed findings below.';
    }
    return 'Voice content analysis completed. Review detailed findings below.';
}

// Update voice detail cards
function updateVoiceDetailCards(results) {
    const detailCards = document.querySelectorAll('.detail-card');
    
    // Speech Quality Card
    if (detailCards[0]) {
        const speechQuality = results.speechQuality || { score: 90, description: 'Clear speech with good pronunciation and minimal background noise.' };
        const progressFill = detailCards[0].querySelector('.progress-fill');
        const description = detailCards[0].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${speechQuality.score}%`;
        }
        if (description) {
            description.textContent = speechQuality.description;
        }
    }
    
    // Emotional Analysis Card
    if (detailCards[1]) {
        const emotionalAnalysis = results.emotionalAnalysis || { score: 75, description: 'Neutral emotional tone with minimal signs of manipulation or stress.' };
        const progressFill = detailCards[1].querySelector('.progress-fill');
        const description = detailCards[1].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${emotionalAnalysis.score}%`;
        }
        if (description) {
            description.textContent = emotionalAnalysis.description;
        }
    }
    
    // Content Credibility Card
    if (detailCards[2]) {
        const contentCredibility = results.contentCredibility || { score: 80, description: 'Content appears factual with minimal bias or misleading information.' };
        const progressFill = detailCards[2].querySelector('.progress-fill');
        const description = detailCards[2].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${contentCredibility.score}%`;
        }
        if (description) {
            description.textContent = contentCredibility.description;
        }
    }
    
    // Manipulation Detection Card
    if (detailCards[3]) {
        const manipulationDetection = results.manipulationDetection || { score: 85, description: 'Low risk of emotional manipulation or persuasive techniques detected.' };
        const progressFill = detailCards[3].querySelector('.progress-fill');
        const description = detailCards[3].querySelector('.detail-content p');
        
        if (progressFill) {
            progressFill.style.width = `${manipulationDetection.score}%`;
        }
        if (description) {
            description.textContent = manipulationDetection.description;
        }
    }
}

// Add voice insights
function addVoiceInsights(results) {
    const insightsContainer = document.getElementById('voice-insights');
    
    // Remove existing insights
    const existingInsights = insightsContainer.querySelector('.insight-grid');
    if (existingInsights) {
        existingInsights.remove();
    }
    
    // Create insights grid
    const insightsGrid = document.createElement('div');
    insightsGrid.className = 'insight-grid';
    
    // Voice-specific insights
    const insights = [
        {
            icon: 'emotion',
            title: 'Emotional Tone',
            value: results.emotionalTone || 'Neutral',
            description: results.emotionalDescription || 'The voice maintains a calm and neutral emotional tone throughout the recording.'
        },
        {
            icon: 'credibility',
            title: 'Trust Score',
            value: `${results.trustScore || 85}%`,
            description: results.trustDescription || 'High trustworthiness based on voice characteristics and content analysis.'
        },
        {
            icon: 'manipulation',
            title: 'Manipulation Risk',
            value: results.manipulationRisk || 'Low',
            description: results.manipulationDescription || 'Minimal signs of emotional manipulation or persuasive techniques detected.'
        },
        {
            icon: 'quality',
            title: 'Audio Quality',
            value: results.audioQuality || 'Good',
            description: results.qualityDescription || 'Clear audio with good pronunciation and minimal background noise.'
        }
    ];
    
    insights.forEach(insight => {
        const insightCard = document.createElement('div');
        insightCard.className = 'insight-card';
        insightCard.innerHTML = `
            <div class="insight-header">
                <div class="insight-icon ${insight.icon}">
                    <i class="fas fa-${getInsightIcon(insight.icon)}"></i>
                </div>
                <h4 class="insight-title">${insight.title}</h4>
            </div>
            <div class="insight-value">${insight.value}</div>
            <div class="insight-description">${insight.description}</div>
        `;
        insightsGrid.appendChild(insightCard);
    });
    
    insightsContainer.appendChild(insightsGrid);
}

// Get insight icon
function getInsightIcon(type) {
    const icons = {
        emotion: 'heart',
        credibility: 'shield-alt',
        manipulation: 'exclamation-triangle',
        quality: 'microphone'
    };
    return icons[type] || 'info-circle';
}

// Generate mock voice results
function generateMockVoiceResults() {
    const score = Math.floor(Math.random() * 40) + 60; // Score between 60-100
    
    return {
        overallScore: score,
        credibilityLevel: score >= 85 ? 'High Credibility' : score >= 70 ? 'Moderate Credibility' : 'Low Credibility',
        speechQuality: {
            score: Math.floor(Math.random() * 30) + 70,
            description: 'Clear speech with good pronunciation and minimal background noise.'
        },
        emotionalAnalysis: {
            score: Math.floor(Math.random() * 30) + 70,
            description: 'Neutral emotional tone with minimal signs of manipulation or stress.'
        },
        contentCredibility: {
            score: Math.floor(Math.random() * 30) + 70,
            description: 'Content appears factual with minimal bias or misleading information.'
        },
        manipulationDetection: {
            score: Math.floor(Math.random() * 30) + 70,
            description: 'Low risk of emotional manipulation or persuasive techniques detected.'
        },
        emotionalTone: 'Neutral',
        trustScore: score,
        manipulationRisk: 'Low',
        audioQuality: 'Good'
    };
}

// Update recording UI
function updateRecordingUI() {
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');
    const status = document.getElementById('recording-status');
    
    if (isRecording) {
        recordBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Recording...</span>';
        recordBtn.disabled = true;
        recordBtn.classList.add('recording');
        stopBtn.disabled = false;
        status.style.display = 'flex';
    } else {
        recordBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Start Recording</span>';
        recordBtn.disabled = false;
        recordBtn.classList.remove('recording');
        stopBtn.disabled = true;
        status.style.display = 'none';
    }
}

// Start recording timer
function startRecordingTimer() {
    recordingStartTime = Date.now();
    recordingTimer = setInterval(updateRecordingTimer, 1000);
}

// Stop recording timer
function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

// Update recording timer
function updateRecordingTimer() {
    if (!recordingStartTime) return;
    
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const timer = document.getElementById('recording-timer');
    if (timer) {
        timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Auto-stop after 5 minutes
    if (elapsed >= 300) {
        stopRecording();
        showNotification('Recording automatically stopped after 5 minutes.', 'info');
    }
}

// Edit transcription
function editTranscription() {
    const transcriptionText = document.getElementById('transcription-text');
    const currentText = transcriptionText.textContent;
    
    const newText = prompt('Edit transcription:', currentText);
    if (newText !== null && newText !== currentText) {
        transcriptionText.textContent = newText;
        showNotification('Transcription updated!', 'success');
    }
}

// Analyze transcription
function analyzeTranscription() {
    const transcription = document.getElementById('transcription-text').textContent;
    if (transcription.trim()) {
        analyzeVoice();
    } else {
        showNotification('No transcription available to analyze', 'error');
    }
}

// Save voice note to history
function saveVoiceNoteToHistory(transcription, results) {
    const voiceNote = {
        id: Date.now().toString(),
        transcription: transcription,
        results: results,
        timestamp: new Date().toISOString(),
        duration: recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0,
        score: results.overallScore || 85
    };
    
    voiceHistory.unshift(voiceNote);
    
    // Keep only last 50 notes
    if (voiceHistory.length > 50) {
        voiceHistory = voiceHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('voiceHistory', JSON.stringify(voiceHistory));
    
    // Update history display
    updateVoiceHistoryDisplay();
}

// Load voice history
function loadVoiceHistory() {
    const saved = localStorage.getItem('voiceHistory');
    if (saved) {
        try {
            voiceHistory = JSON.parse(saved);
            updateVoiceHistoryDisplay();
        } catch (error) {
            console.error('Error loading voice history:', error);
            voiceHistory = [];
        }
    }
}

// Update voice history display
function updateVoiceHistoryDisplay() {
    const historyContainer = document.getElementById('voice-history');
    
    if (voiceHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-microphone-slash"></i>
                <h3>No Voice Notes Yet</h3>
                <p>Start recording to see your voice analysis history here.</p>
                <button class="btn-primary" onclick="scrollToRecorder()">
                    <i class="fas fa-microphone"></i>
                    Start Recording
                </button>
            </div>
        `;
        return;
    }
    
    const filteredHistory = applyHistoryFilters(voiceHistory);
    
    historyContainer.innerHTML = filteredHistory.map(note => `
        <div class="voice-note-item" data-note-id="${note.id}">
            <div class="voice-note-header">
                <h4 class="voice-note-title">Voice Note ${note.id.slice(-6)}</h4>
                <span class="voice-note-date">${formatDate(note.timestamp)}</span>
            </div>
            <div class="voice-note-preview">${note.transcription.substring(0, 150)}${note.transcription.length > 150 ? '...' : ''}</div>
            <div class="voice-note-meta">
                <div class="voice-note-duration">
                    <i class="fas fa-clock"></i>
                    <span>${formatDuration(note.duration)}</span>
                </div>
                <div class="voice-note-score ${getScoreClass(note.score)}">
                    <i class="fas fa-${getScoreIcon(note.score)}"></i>
                    <span>${note.score}/100</span>
                </div>
            </div>
            <div class="voice-note-actions">
                <button class="play-action" onclick="playVoiceNote('${note.id}')" title="Play audio (demo mode - no audio stored)">
                    <i class="fas fa-play"></i>
                    Play
                </button>
                <button class="analyze-action" onclick="viewVoiceNote('${note.id}')" title="View analysis results">
                    <i class="fas fa-search"></i>
                    View
                </button>
                <button class="delete-action" onclick="deleteVoiceNote('${note.id}')" title="Delete from history">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Apply history filters
function applyHistoryFilters(notes) {
    const dateFilter = document.getElementById('date-filter').value;
    const credibilityFilter = document.getElementById('credibility-filter').value;
    
    let filtered = [...notes];
    
    // Date filter
    if (dateFilter !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        
        switch (dateFilter) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
        }
        
        filtered = filtered.filter(note => new Date(note.timestamp) >= filterDate);
    }
    
    // Credibility filter
    if (credibilityFilter !== 'all') {
        filtered = filtered.filter(note => {
            const score = note.score;
            switch (credibilityFilter) {
                case 'high':
                    return score >= 80;
                case 'medium':
                    return score >= 50 && score < 80;
                case 'low':
                    return score < 50;
                default:
                    return true;
            }
        });
    }
    
    return filtered;
}

// Apply filters
function applyFilters() {
    updateVoiceHistoryDisplay();
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
        return `${Math.floor(diff / 3600000)}h ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Format duration
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Get score class
function getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

// Get score icon
function getScoreIcon(score) {
    if (score >= 80) return 'check-circle';
    if (score >= 50) return 'exclamation-triangle';
    return 'times-circle';
}

// View voice note
function viewVoiceNote(noteId) {
    const note = voiceHistory.find(n => n.id === noteId);
    if (note) {
        // Stop any currently playing audio
        stopCurrentAudio();
        
        // Display the transcription
        const transcriptionText = document.getElementById('transcription-text');
        const transcriptionSection = document.getElementById('transcription-section');
        
        if (transcriptionText) {
            transcriptionText.textContent = note.transcription;
        }
        if (transcriptionSection) {
            transcriptionSection.style.display = 'block';
        }
        
        // Display the analysis results without copying files
        displayHistoryResults(note.results);
        
        // Scroll to results
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        showNotification('Voice note loaded from history', 'info');
    }
}

// Play voice note
function playVoiceNote(noteId) {
    // Stop any currently playing audio first
    stopCurrentAudio();
    
    // In a real implementation, you would need to store the audio blob
    // and recreate the audio URL for playback
    showNotification('Voice playback not available in demo mode. Audio files are not stored in history.', 'info');
}

// Display history results without file operations
function displayHistoryResults(results) {
    // Update overall score
    const overallScore = document.getElementById('overall-score');
    const scoreTitle = document.getElementById('score-title');
    const scoreDescription = document.getElementById('score-description');
    
    if (overallScore) overallScore.textContent = results.overallScore || 85;
    if (scoreTitle) scoreTitle.textContent = results.credibilityLevel || 'High Credibility';
    if (scoreDescription) scoreDescription.textContent = getVoiceDescription(results);
    
    // Update score circle with colors
    const scoreCircle = document.querySelector('.score-circle');
    if (scoreCircle) {
        const percentage = ((results.overallScore || 85) / 100) * 360;
        const colors = getScoreColors(results.overallScore || 85);
        scoreCircle.style.background = `conic-gradient(${colors.primary} 0deg, ${colors.primary} ${percentage}deg, #e9ecef ${percentage}deg)`;
    }
    
    const scoreValue = document.querySelector('.score-value');
    if (scoreValue) {
        const colors = getScoreColors(results.overallScore || 85);
        scoreValue.style.color = colors.primary;
    }
    
    // Update detail cards
    updateVoiceDetailCards(results);
    
    // Add voice insights
    addVoiceInsights(results);
    
    // Show results section
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in-up');
    }
}

// Delete voice note
function deleteVoiceNote(noteId) {
    if (confirm('Are you sure you want to delete this voice note?')) {
        voiceHistory = voiceHistory.filter(n => n.id !== noteId);
        localStorage.setItem('voiceHistory', JSON.stringify(voiceHistory));
        updateVoiceHistoryDisplay();
        showNotification('Voice note deleted', 'success');
    }
}

// Save voice note
function saveVoiceNote() {
    const transcription = document.getElementById('transcription-text').textContent;
    if (transcription.trim()) {
        // This would save the current recording and analysis
        showNotification('Voice note saved to history!', 'success');
    } else {
        showNotification('No recording to save', 'error');
    }
}

// Share results
function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'Voice Analysis Results',
            text: 'Check out my voice analysis results from FactChecker AI!',
            url: window.location.href
        });
    } else {
        const resultsText = `Voice Analysis Results:\nOverall Score: ${document.getElementById('overall-score').textContent}\n${document.getElementById('score-title').textContent}\n\n${document.getElementById('score-description').textContent}`;
        
        navigator.clipboard.writeText(resultsText).then(() => {
            showNotification('Results copied to clipboard!', 'success');
        });
    }
}

// Record new
function recordNew() {
    // Clear current recording
    audioBlob = null;
    audioUrl = null;
    
    // Reset UI
    document.getElementById('play-btn').disabled = true;
    document.getElementById('analyze-btn').disabled = true;
    document.getElementById('transcription-section').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    
    // Scroll to recorder
    scrollToRecorder();
    
    showNotification('Ready for new recording!', 'success');
}

// Scroll functions
function scrollToRecorder() {
    document.getElementById('recorder').scrollIntoView({ behavior: 'smooth' });
}

function scrollToHistory() {
    document.getElementById('history').scrollIntoView({ behavior: 'smooth' });
}

// Test voice API - DEMO ONLY (no real API call)
window.testVoiceAPI = async function() {
    console.log('testVoiceAPI called (demo mode)');
    showNotification('Voice analyzer is in demo mode. No real API call is made.', 'info');
    return true;
};

// Also keep the original function for compatibility
async function testVoiceAPI() {
    return window.testVoiceAPI();
}

// Close voice modal
function closeVoiceModal() {
    document.getElementById('voice-modal').style.display = 'none';
}

// Export analysis
function exportAnalysis() {
    const results = {
        timestamp: new Date().toISOString(),
        transcription: document.getElementById('transcription-text').textContent,
        overallScore: document.getElementById('overall-score').textContent,
        credibilityLevel: document.getElementById('score-title').textContent,
        description: document.getElementById('score-description').textContent
    };
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `voice-analysis-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Analysis exported successfully!', 'success');
}

// Get score colors (reuse from veritas-script.js)
function getScoreColors(score) {
    if (score >= 85) {
        return {
            primary: '#28a745',
            secondary: '#d4edda',
            name: 'high'
        };
    } else if (score >= 70) {
        return {
            primary: '#17a2b8',
            secondary: '#d1ecf1',
            name: 'good'
        };
    } else if (score >= 50) {
        return {
            primary: '#ffc107',
            secondary: '#fff3cd',
            name: 'moderate'
        };
    } else if (score >= 30) {
        return {
            primary: '#fd7e14',
            secondary: '#ffeaa7',
            name: 'low'
        };
    } else {
        return {
            primary: '#dc3545',
            secondary: '#f8d7da',
            name: 'very-low'
        };
    }
}

// Show notification (reuse from veritas-script.js)
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

// Get notification icon (reuse from veritas-script.js)
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// --- File Upload Functions ---

// Stop any currently playing audio
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Reset all play buttons to their original state
    const playButtons = document.querySelectorAll('.play-btn, .play-upload-btn');
    playButtons.forEach(btn => {
        if (btn.classList.contains('play-btn')) {
            btn.innerHTML = '<i class="fas fa-play"></i><span>Play Recording</span>';
        } else {
            btn.innerHTML = '<i class="fas fa-play"></i> Play';
        }
        btn.disabled = false;
    });
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processUploadedFile(file);
    }
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

// Handle drop
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('audio/')) {
            processUploadedFile(file);
        } else {
            showNotification('Please upload an audio file only.', 'error');
        }
    }
}

// Process uploaded file
function processUploadedFile(file) {
    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/webm'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Unsupported file type. Please upload MP3, WAV, OGG, M4A, or AAC files.', 'error');
        return;
    }
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        showNotification('File too large. Please upload files smaller than 50MB.', 'error');
        return;
    }
    
    // Store file
    uploadedFile = file;
    uploadedFileUrl = URL.createObjectURL(file);
    
    // Update UI
    displayUploadedFileInfo(file);
    
    // Clear any existing recording
    clearRecording();
    
    showNotification(`File "${file.name}" uploaded successfully!`, 'success');
}

// Display uploaded file info
function displayUploadedFileInfo(file) {
    const uploadArea = document.getElementById('upload-area');
    const uploadedFileInfo = document.getElementById('uploaded-file-info');
    const fileName = document.getElementById('uploaded-file-name');
    const fileSize = document.getElementById('uploaded-file-size');
    const fileType = document.getElementById('uploaded-file-type');
    
    // Hide upload area, show file info
    uploadArea.style.display = 'none';
    uploadedFileInfo.style.display = 'block';
    
    // Update file details
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileType.textContent = file.type;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove uploaded file
function removeUploadedFile() {
    // Stop any currently playing audio
    stopCurrentAudio();
    
    uploadedFile = null;
    if (uploadedFileUrl) {
        URL.revokeObjectURL(uploadedFileUrl);
        uploadedFileUrl = null;
    }
    
    // Reset UI
    const uploadArea = document.getElementById('upload-area');
    const uploadedFileInfo = document.getElementById('uploaded-file-info');
    const audioFileInput = document.getElementById('audio-file-input');
    
    uploadArea.style.display = 'block';
    uploadedFileInfo.style.display = 'none';
    audioFileInput.value = '';
    
    // Clear any existing transcription and results
    clearTranscription();
    clearAnalysisResults();
    
    showNotification('File removed successfully!', 'info');
}

// Play uploaded file
function playUploadedFile() {
    if (uploadedFileUrl) {
        // Stop any currently playing audio
        stopCurrentAudio();
        
        const audio = new Audio(uploadedFileUrl);
        currentAudio = audio;
        
        // Update button state
        const playBtn = document.querySelector('.play-upload-btn');
        playBtn.innerHTML = '<i class="fas fa-pause"></i> Playing...';
        playBtn.disabled = false; // Keep enabled so user can click to stop
        
        // Handle play/pause toggle
        playBtn.onclick = function() {
            if (currentAudio && !currentAudio.paused) {
                // Currently playing, so stop it
                stopCurrentAudio();
            } else {
                // Not playing, so start it
                currentAudio.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i> Playing...';
            }
        };
        
        audio.onended = function() {
            playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            playBtn.onclick = playUploadedFile; // Reset to original function
            currentAudio = null;
        };
        
        audio.play();
        showNotification('Playing uploaded file...', 'info');
    } else {
        showNotification('No file to play', 'error');
    }
}

// Analyze uploaded file
async function analyzeUploadedFile() {
    if (!uploadedFile) {
        showNotification('No file uploaded to analyze', 'error');
        return;
    }
    
    try {
        // Stop any currently playing audio
        stopCurrentAudio();
        
        showNotification('Starting analysis of uploaded file...', 'info');
        
        // Update button state
        const analyzeBtn = document.querySelector('.analyze-upload-btn');
        const originalHTML = analyzeBtn.innerHTML;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        analyzeBtn.disabled = true;
        
        // For uploaded files, we'll simulate transcription since Web Speech API
        // doesn't work directly with file blobs. In a real implementation,
        // you'd use a server-side speech-to-text service.
        const transcription = await simulateTranscriptionFromFile(uploadedFile);
        
        // Display transcription
        document.getElementById('transcription-text').textContent = transcription;
        document.getElementById('transcription-section').style.display = 'block';
        
        // Proceed with analysis
        await analyzeVoice();
        
        // Reset button
        analyzeBtn.innerHTML = originalHTML;
        analyzeBtn.disabled = false;
        
    } catch (error) {
        console.error('Upload analysis error:', error);
        showNotification(`Analysis failed: ${error.message}`, 'error');
        
        // Reset button
        const analyzeBtn = document.querySelector('.analyze-upload-btn');
        analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze';
        analyzeBtn.disabled = false;
    }
}

// Simulate transcription from uploaded file
function simulateTranscriptionFromFile(file) {
    return new Promise((resolve) => {
        // In a real implementation, you would:
        // 1. Send the file to a speech-to-text service
        // 2. Use a library like Web Speech API with proper file handling
        // 3. Implement server-side transcription
        
        // For demo purposes, we'll simulate with a delay
        setTimeout(() => {
            const simulatedTranscription = `This is a simulated transcription of the uploaded file "${file.name}". 
            
In a real implementation, this would be the actual transcribed text from your uploaded audio file. The system would process the audio and convert it to text using advanced speech recognition technology.

This transcription would then be analyzed for credibility, emotional tone, bias detection, and other factors to determine the authenticity and trustworthiness of the content.`;
            
            resolve(simulatedTranscription);
        }, 2000);
    });
}

// Clear recording data
function clearRecording() {
    // Stop any currently playing audio
    stopCurrentAudio();
    
    audioBlob = null;
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        audioUrl = null;
    }
    
    // Reset recording buttons
    document.getElementById('play-btn').disabled = true;
    document.getElementById('analyze-btn').disabled = true;
    
    // Clear transcription and results
    clearTranscription();
    clearAnalysisResults();
}

// Clear transcription
function clearTranscription() {
    const transcriptionText = document.getElementById('transcription-text');
    const transcriptionSection = document.getElementById('transcription-section');
    
    if (transcriptionText) transcriptionText.textContent = '';
    if (transcriptionSection) transcriptionSection.style.display = 'none';
}

// Clear analysis results
function clearAnalysisResults() {
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
}
