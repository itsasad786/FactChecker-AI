// Learn to Verify - Interactive Learning Module
// Educational platform for teaching misinformation detection techniques

class LearnToVerify {
    constructor() {
        this.currentMode = null;
        this.currentLesson = 0;
        this.currentQuiz = 0;
        this.currentSimulation = 0;
        this.userScore = 0;
        this.completedLessons = 0;
        this.selectedTheme = 'health';
        this.selectedDifficulty = 'beginner';
        this.quizAnswers = [];
        this.simulationAnalysis = '';
        
        this.lessons = this.initializeLessons();
        this.quizQuestions = this.initializeQuizQuestions();
        this.simulationExamples = this.initializeSimulationExamples();
        
        this.initializeEventListeners();
        this.updateStats();
    }

    initializeEventListeners() {
        // Character count for text areas
        document.addEventListener('input', (e) => {
            if (e.target.id === 'analysis-textarea') {
                this.updateAnalysisButton();
            }
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-modal')) {
                this.hideAllModals();
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
                // Also close mobile menu if open
                const sidebar = document.querySelector('.sidebar');
                const mobileToggle = document.querySelector('.mobile-menu-toggle');
                if (sidebar && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    mobileToggle.classList.remove('active');
                }
            }
        });

        // Click outside mobile menu to close
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            
            if (sidebar && sidebar.classList.contains('mobile-open') && 
                !sidebar.contains(e.target) && 
                !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
                mobileToggle.classList.remove('active');
            }
        });
    }

    initializeLessons() {
        return [
            {
                id: 'fake-images',
                title: 'Identifying Fake Images',
                description: 'Learn to spot manipulated images and deepfakes using visual analysis techniques.',
                duration: '5 min',
                icon: 'fas fa-image',
                status: 'available',
                content: [
                    {
                        type: 'text',
                        title: 'Introduction to Image Verification',
                        content: 'In today\'s digital age, images can be easily manipulated. Learn the key techniques to identify fake or altered images.'
                    },
                    {
                        type: 'text',
                        title: 'Visual Red Flags',
                        content: 'Look for inconsistencies in lighting, shadows, reflections, and proportions. Check for pixelation, blurriness, or unnatural color gradients.'
                    },
                    {
                        type: 'text',
                        title: 'Metadata Analysis',
                        content: 'Check image metadata for creation date, camera model, and editing software. Suspicious metadata can indicate manipulation.'
                    },
                    {
                        type: 'text',
                        title: 'Reverse Image Search',
                        content: 'Use tools like Google Images or TinEye to find the original source and verify if the image has been used out of context.'
                    },
                    {
                        type: 'quiz',
                        question: 'What is the first step when analyzing a suspicious image?',
                        options: [
                            'Check the metadata',
                            'Look for visual inconsistencies',
                            'Perform reverse image search',
                            'Ask the person who shared it'
                        ],
                        correct: 1,
                        explanation: 'Visual inconsistencies are often the most obvious red flags and should be checked first.'
                    }
                ]
            },
            {
                id: 'source-bias',
                title: 'Understanding Source Bias',
                description: 'Recognize biased sources and understand how to evaluate source credibility.',
                duration: '7 min',
                icon: 'fas fa-balance-scale',
                status: 'locked',
                content: [
                    {
                        type: 'text',
                        title: 'What is Source Bias?',
                        content: 'Source bias occurs when information is presented in a way that favors one perspective over others, often unconsciously.'
                    },
                    {
                        type: 'text',
                        title: 'Types of Bias',
                        content: 'Common types include confirmation bias, selection bias, framing bias, and political bias. Each affects how information is presented.'
                    },
                    {
                        type: 'text',
                        title: 'Evaluating Sources',
                        content: 'Check the author\'s credentials, publication history, funding sources, and whether they cite reliable references.'
                    },
                    {
                        type: 'text',
                        title: 'Cross-Referencing',
                        content: 'Always verify information by checking multiple independent sources. Look for consensus among reputable outlets.'
                    },
                    {
                        type: 'quiz',
                        question: 'Which is the best way to identify source bias?',
                        options: [
                            'Check only one source',
                            'Look for emotional language',
                            'Cross-reference multiple sources',
                            'Trust the first result'
                        ],
                        correct: 2,
                        explanation: 'Cross-referencing multiple independent sources is the most reliable way to identify and avoid bias.'
                    }
                ]
            },
            {
                id: 'financial-scams',
                title: 'Recognizing Financial Scams',
                description: 'Protect yourself from financial misinformation and investment scams.',
                duration: '8 min',
                icon: 'fas fa-shield-alt',
                status: 'locked',
                content: [
                    {
                        type: 'text',
                        title: 'Common Financial Scam Tactics',
                        content: 'Scammers use urgency, guaranteed returns, and complex jargon to pressure victims into quick decisions.'
                    },
                    {
                        type: 'text',
                        title: 'Red Flags to Watch For',
                        content: 'Be wary of unsolicited offers, pressure tactics, guaranteed high returns, and requests for upfront payments.'
                    },
                    {
                        type: 'text',
                        title: 'Verification Steps',
                        content: 'Always verify credentials with official regulatory bodies, check company registration, and consult independent financial advisors.'
                    },
                    {
                        type: 'text',
                        title: 'Protecting Your Money',
                        content: 'Never invest based on social media posts alone. Research thoroughly and be skeptical of "get rich quick" schemes.'
                    },
                    {
                        type: 'quiz',
                        question: 'What should you do if someone guarantees high returns with no risk?',
                        options: [
                            'Invest immediately',
                            'Research the company thoroughly',
                            'Ask for more information',
                            'Share with friends'
                        ],
                        correct: 1,
                        explanation: 'Guaranteed high returns with no risk are almost always scams. Always research thoroughly before investing.'
                    }
                ]
            },
            {
                id: 'social-media-misinfo',
                title: 'Social Media Misinformation',
                description: 'Navigate social media platforms while avoiding viral misinformation.',
                duration: '6 min',
                icon: 'fas fa-share-alt',
                status: 'locked',
                content: [
                    {
                        type: 'text',
                        title: 'How Misinformation Spreads',
                        content: 'Social media algorithms prioritize engagement over accuracy, making misinformation spread faster than facts.'
                    },
                    {
                        type: 'text',
                        title: 'Viral Content Red Flags',
                        content: 'Be suspicious of content that triggers strong emotions, lacks sources, or makes extraordinary claims.'
                    },
                    {
                        type: 'text',
                        title: 'Fact-Checking Before Sharing',
                        content: 'Always verify information before sharing. Check sources, dates, and context. When in doubt, don\'t share.'
                    },
                    {
                        type: 'text',
                        title: 'Building a Reliable Feed',
                        content: 'Follow reputable news sources, fact-checking organizations, and verified experts in your areas of interest.'
                    },
                    {
                        type: 'quiz',
                        question: 'What should you do before sharing a viral post?',
                        options: [
                            'Share immediately if it has many likes',
                            'Verify the information first',
                            'Share if it matches your beliefs',
                            'Share to get more information'
                        ],
                        correct: 1,
                        explanation: 'Always verify information before sharing to prevent spreading misinformation.'
                    }
                ]
            },
            {
                id: 'health-misinformation',
                title: 'Health Misinformation',
                description: 'Identify false health claims and find reliable medical information.',
                duration: '9 min',
                icon: 'fas fa-heartbeat',
                status: 'locked',
                content: [
                    {
                        type: 'text',
                        title: 'The Danger of Health Misinformation',
                        content: 'False health information can lead to harmful decisions, delayed treatment, and public health risks.'
                    },
                    {
                        type: 'text',
                        title: 'Red Flags in Health Claims',
                        content: 'Be wary of miracle cures, secret treatments, one-size-fits-all solutions, and claims that contradict established medical science.'
                    },
                    {
                        type: 'text',
                        title: 'Reliable Health Sources',
                        content: 'Trust information from medical institutions, peer-reviewed journals, government health agencies, and board-certified doctors.'
                    },
                    {
                        type: 'text',
                        title: 'Evaluating Health Studies',
                        content: 'Look for sample size, control groups, peer review, and replication. Be cautious of studies with small samples or conflicts of interest.'
                    },
                    {
                        type: 'quiz',
                        question: 'Which source is most reliable for health information?',
                        options: [
                            'Social media influencers',
                            'Peer-reviewed medical journals',
                            'Personal blogs',
                            'Anonymous forums'
                        ],
                        correct: 1,
                        explanation: 'Peer-reviewed medical journals undergo rigorous scientific review and are the gold standard for health information.'
                    }
                ]
            },
            {
                id: 'political-misinformation',
                title: 'Political Misinformation',
                description: 'Navigate political information and identify propaganda techniques.',
                duration: '10 min',
                icon: 'fas fa-vote-yea',
                status: 'locked',
                content: [
                    {
                        type: 'text',
                        title: 'Understanding Political Misinformation',
                        content: 'Political misinformation often uses emotional appeals, cherry-picked data, and false context to influence opinions.'
                    },
                    {
                        type: 'text',
                        title: 'Propaganda Techniques',
                        content: 'Watch for loaded language, false dichotomies, strawman arguments, and appeals to fear or anger.'
                    },
                    {
                        type: 'text',
                        title: 'Fact-Checking Political Claims',
                        content: 'Verify statistics, check original sources, look for context, and consult non-partisan fact-checking organizations.'
                    },
                    {
                        type: 'text',
                        title: 'Media Literacy in Politics',
                        content: 'Understand different media biases, read across the political spectrum, and focus on policy rather than personality.'
                    },
                    {
                        type: 'quiz',
                        question: 'What is the best approach to political information?',
                        options: [
                            'Trust your preferred news source',
                            'Read across the political spectrum',
                            'Avoid all political news',
                            'Share everything that supports your views'
                        ],
                        correct: 1,
                        explanation: 'Reading across the political spectrum helps you understand different perspectives and identify bias.'
                    }
                ]
            }
        ];
    }

    initializeQuizQuestions() {
        return {
            general: [
                {
                    question: "What is the most reliable way to verify a news story?",
                    options: [
                        "Check multiple independent sources",
                        "Trust the first result on Google",
                        "Share it on social media for feedback",
                        "Check if it has many likes"
                    ],
                    correct: 0,
                    explanation: "Cross-referencing multiple independent sources is the gold standard for verification."
                },
                {
                    question: "Which of these is a red flag for misinformation?",
                    options: [
                        "Clear source attribution",
                        "Emotional language and urgency",
                        "Recent publication date",
                        "Professional formatting"
                    ],
                    correct: 1,
                    explanation: "Emotional language and urgency are common tactics used to spread misinformation quickly."
                },
                {
                    question: "What should you do if you're unsure about information?",
                    options: [
                        "Share it anyway to get more opinions",
                        "Don't share it until you can verify",
                        "Share it with a disclaimer",
                        "Ask only your friends"
                    ],
                    correct: 1,
                    explanation: "When in doubt, don't share. It's better to verify first than to spread potentially false information."
                }
            ],
            images: [
                {
                    question: "What is the first thing to check when analyzing a suspicious image?",
                    options: [
                        "The file size",
                        "Visual inconsistencies",
                        "The file name",
                        "The upload date"
                    ],
                    correct: 1,
                    explanation: "Visual inconsistencies like lighting, shadows, or proportions are often the most obvious red flags."
                },
                {
                    question: "What does reverse image search help you find?",
                    options: [
                        "The image's file size",
                        "The original source and context",
                        "The image's resolution",
                        "The editing software used"
                    ],
                    correct: 1,
                    explanation: "Reverse image search helps you find where the image originally appeared and verify its context."
                }
            ],
            bias: [
                {
                    question: "What is confirmation bias?",
                    options: [
                        "The tendency to seek information that confirms existing beliefs",
                        "The ability to confirm facts quickly",
                        "A method of fact-checking",
                        "A type of reliable source"
                    ],
                    correct: 0,
                    explanation: "Confirmation bias is the tendency to seek and interpret information in a way that confirms pre-existing beliefs."
                }
            ],
            scams: [
                {
                    question: "What is a common red flag in financial scams?",
                    options: [
                        "Clear documentation",
                        "Guaranteed high returns with no risk",
                        "Professional website",
                        "Contact information provided"
                    ],
                    correct: 1,
                    explanation: "Guaranteed high returns with no risk are almost always indicators of a scam."
                }
            ]
        };
    }

    initializeSimulationExamples() {
        return {
            health: {
                beginner: [
                    {
                        title: "Miracle Cure Claim",
                        content: "BREAKING: New study shows that drinking 3 cups of green tea daily can cure cancer in just 30 days! Doctors don't want you to know this secret! Share this with everyone you know! #CancerCure #GreenTea #NaturalHealing",
                        analysis: "This example contains several red flags: extraordinary claims without credible sources, emotional language, conspiracy theory framing, and pressure to share."
                    },
                    {
                        title: "Vaccine Misinformation",
                        content: "URGENT: Local doctor reveals that vaccines contain dangerous chemicals that cause autism. The government is hiding this from you! Watch this video before it gets deleted!",
                        analysis: "This example uses urgency, false authority, conspiracy theories, and fear-mongering to spread misinformation about vaccines."
                    }
                ],
                intermediate: [
                    {
                        title: "Misleading Health Study",
                        content: "New research from the Institute of Natural Health shows that people who take vitamin D supplements have 50% fewer colds. The study followed 100 people for 6 months. This could revolutionize how we treat the common cold!",
                        analysis: "This example uses a small sample size, potential selection bias, correlation vs causation confusion, and lacks peer review or replication."
                    }
                ],
                advanced: [
                    {
                        title: "Sophisticated Health Scam",
                        content: "Dr. Sarah Johnson, MD, PhD, from Harvard Medical School (verified) shares groundbreaking research: A new compound found in rare mushrooms can reverse aging by 20 years. Clinical trials show 95% success rate. Limited time offer - only 100 bottles available!",
                        analysis: "This example uses false authority, fabricated credentials, fake scarcity, and mixes some truth (mushrooms have compounds) with false claims (reversing aging)."
                    }
                ]
            },
            politics: {
                beginner: [
                    {
                        title: "False Political Quote",
                        content: "Politician X said: 'I don't care about the middle class, they can fend for themselves.' This is why we need to vote them out! Share this everywhere!",
                        analysis: "This example uses a fabricated quote, emotional manipulation, and lacks source verification to spread political misinformation."
                    }
                ],
                intermediate: [
                    {
                        title: "Misleading Statistics",
                        content: "Crime rates have increased by 300% since the new policy was implemented! The data clearly shows this policy is a complete failure. We need immediate action!",
                        analysis: "This example uses cherry-picked data, lacks context, and presents correlation as causation to support a political agenda."
                    }
                ],
                advanced: [
                    {
                        title: "Deepfake Political Video",
                        content: "Video shows candidate saying controversial statements during a private meeting. The video appears authentic and has been shared by multiple news outlets.",
                        analysis: "This example represents sophisticated manipulation using deepfake technology to create false evidence that appears credible."
                    }
                ]
            },
            finance: {
                beginner: [
                    {
                        title: "Get Rich Quick Scheme",
                        content: "Make $10,000 in your first week! My secret trading method has made me millions. Join my exclusive group for just $99 and start earning today! Limited spots available!",
                        analysis: "This example uses unrealistic promises, false scarcity, and pressure tactics typical of financial scams."
                    }
                ],
                intermediate: [
                    {
                        title: "Pump and Dump Scheme",
                        content: "BREAKING: Insider information reveals that TechStock Inc. is about to announce a major partnership that will triple their stock price! Buy now before it's too late! #StockTip #InsiderInfo",
                        analysis: "This example uses false insider information, urgency tactics, and social media manipulation to manipulate stock prices."
                    }
                ],
                advanced: [
                    {
                        title: "Sophisticated Investment Scam",
                        content: "Exclusive investment opportunity in a new cryptocurrency backed by gold reserves. Our team of Wall Street veterans guarantees 200% returns in 6 months. SEC-approved and fully regulated. Minimum investment: $10,000.",
                        analysis: "This example uses false credentials, fabricated guarantees, and fake regulatory approval to appear legitimate while being a scam."
                    }
                ]
            },
            technology: {
                beginner: [
                    {
                        title: "Tech Scare Story",
                        content: "WARNING: Your phone is tracking your every move! This new app can see everything you do. Delete it immediately and share this warning!",
                        analysis: "This example uses fear-mongering, false urgency, and lacks technical accuracy to spread panic about technology."
                    }
                ],
                intermediate: [
                    {
                        title: "Misleading Tech News",
                        content: "New AI breakthrough means robots will replace all human workers by next year! Study shows 90% of jobs will be automated. Prepare for mass unemployment!",
                        analysis: "This example exaggerates AI capabilities, uses misleading statistics, and creates unnecessary panic about technology."
                    }
                ],
                advanced: [
                    {
                        title: "Sophisticated Tech Scam",
                        content: "Revolutionary quantum computing algorithm discovered by MIT researchers can predict stock market movements with 99% accuracy. Exclusive access available to first 50 investors. Minimum investment: $50,000.",
                        analysis: "This example uses false academic credentials, impossible claims about quantum computing, and fake exclusivity to create a sophisticated scam."
                    }
                ]
            }
        };
    }

    // Navigation Methods
    showContentLibrary() {
        this.hideAllModals();
        document.getElementById('content-library-modal').style.display = 'flex';
        this.currentMode = 'library';
        this.renderLessons();
    }

    hideContentLibrary() {
        document.getElementById('content-library-modal').style.display = 'none';
    }

    showQuizMode() {
        this.hideAllModals();
        document.getElementById('quiz-mode-modal').style.display = 'flex';
        this.currentMode = 'quiz';
    }

    hideQuizMode() {
        document.getElementById('quiz-mode-modal').style.display = 'none';
    }

    showSimulationMode() {
        this.hideAllModals();
        document.getElementById('simulation-mode-modal').style.display = 'flex';
        this.currentMode = 'simulation';
    }

    hideSimulationMode() {
        document.getElementById('simulation-mode-modal').style.display = 'none';
    }

    hideAllModals() {
        const modals = ['content-library-modal', 'quiz-mode-modal', 'simulation-mode-modal', 'lesson-content-modal', 'quiz-content-modal', 'simulation-content-modal'];
        modals.forEach(modal => {
            document.getElementById(modal).style.display = 'none';
        });
    }

    hideAllSections() {
        const sections = ['lesson-content-modal', 'quiz-content-modal', 'simulation-content-modal'];
        sections.forEach(section => {
            document.getElementById(section).style.display = 'none';
        });
    }

    // Lesson Management
    renderLessons() {
        const grid = document.getElementById('lessons-grid');
        grid.innerHTML = '';

        this.lessons.forEach((lesson, index) => {
            const lessonCard = document.createElement('div');
            lessonCard.className = `lesson-card ${lesson.status}`;
            lessonCard.onclick = () => this.startLesson(index);

            lessonCard.innerHTML = `
                <div class="lesson-header">
                    <div class="lesson-icon">
                        <i class="${lesson.icon}"></i>
                    </div>
                    <div>
                        <h3 class="lesson-title">${lesson.title}</h3>
                    </div>
                </div>
                <p class="lesson-description">${lesson.description}</p>
                <div class="lesson-meta">
                    <div class="lesson-duration">
                        <i class="fas fa-clock"></i>
                        <span>${lesson.duration}</span>
                    </div>
                    <div class="lesson-status ${lesson.status}">
                        <i class="fas fa-${lesson.status === 'completed' ? 'check-circle' : lesson.status === 'locked' ? 'lock' : 'play-circle'}"></i>
                        <span>${lesson.status === 'completed' ? 'Completed' : lesson.status === 'locked' ? 'Locked' : 'Start'}</span>
                    </div>
                </div>
            `;

            grid.appendChild(lessonCard);
        });
    }

    startLesson(lessonIndex) {
        if (this.lessons[lessonIndex].status === 'locked') {
            alert('Complete previous lessons to unlock this one!');
            return;
        }

        this.currentLesson = lessonIndex;
        this.hideAllModals();
        document.getElementById('lesson-content-modal').style.display = 'flex';
        this.renderLessonContent();
    }

    renderLessonContent() {
        const lesson = this.lessons[this.currentLesson];
        const body = document.getElementById('lesson-body');
        const progressFill = document.getElementById('lesson-progress-fill');
        const progressText = document.getElementById('lesson-progress-text');

        // Update progress
        const progress = ((this.currentLesson + 1) / this.lessons.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${this.currentLesson + 1}/${this.lessons.length}`;

        // Render content
        body.innerHTML = '';
        lesson.content.forEach((item, index) => {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'lesson-item-content';

            if (item.type === 'text') {
                contentDiv.innerHTML = `
                    <h3>${item.title}</h3>
                    <p>${item.content}</p>
                `;
            } else if (item.type === 'quiz') {
                contentDiv.innerHTML = `
                    <div class="question-card">
                        <h3>Quick Check</h3>
                        <p class="question-text">${item.question}</p>
                        <div class="question-options">
                            ${item.options.map((option, optIndex) => `
                                <button class="option-btn" onclick="learnToVerify.selectQuizOption(${optIndex}, ${item.correct})">
                                    <div class="option-letter">${String.fromCharCode(65 + optIndex)}</div>
                                    <span>${option}</span>
                                </button>
                            `).join('')}
                        </div>
                        <div class="explanation" style="display: none;">
                            <p><strong>Explanation:</strong> ${item.explanation}</p>
                        </div>
                    </div>
                `;
            }

            body.appendChild(contentDiv);
        });

        // Update navigation buttons
        document.getElementById('prev-btn').disabled = this.currentLesson === 0;
        document.getElementById('next-btn').onclick = () => this.nextLesson();
    }

    selectQuizOption(selectedIndex, correctIndex) {
        const buttons = document.querySelectorAll('.option-btn');
        const explanation = document.querySelector('.explanation');
        
        buttons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === correctIndex) {
                btn.classList.add('correct');
            } else if (index === selectedIndex && index !== correctIndex) {
                btn.classList.add('incorrect');
            }
        });

        if (explanation) {
            explanation.style.display = 'block';
        }

        if (selectedIndex === correctIndex) {
            this.userScore += 10;
            this.updateStats();
        }
    }

    nextLesson() {
        if (this.currentLesson < this.lessons.length - 1) {
            this.currentLesson++;
            this.renderLessonContent();
        } else {
            this.completeLesson();
        }
    }

    previousLesson() {
        if (this.currentLesson > 0) {
            this.currentLesson--;
            this.renderLessonContent();
        }
    }

    completeLesson() {
        this.lessons[this.currentLesson].status = 'completed';
        this.completedLessons++;
        
        // Unlock next lesson
        if (this.currentLesson < this.lessons.length - 1) {
            this.lessons[this.currentLesson + 1].status = 'available';
        }

        this.userScore += 50;
        this.updateStats();
        this.hideLessonContent();
        this.showContentLibrary();
        this.renderLessons();
        
        alert('Congratulations! Lesson completed! You earned 50 points.');
    }

    hideLessonContent() {
        document.getElementById('lesson-content-modal').style.display = 'none';
    }

    // Quiz Management
    startQuiz(type) {
        this.currentQuiz = 0;
        this.quizAnswers = [];
        this.hideAllModals();
        document.getElementById('quiz-content-modal').style.display = 'flex';
        this.renderQuizQuestion();
    }

    renderQuizQuestion() {
        const questions = this.quizQuestions[this.currentMode] || this.quizQuestions.general;
        const question = questions[this.currentQuiz];
        
        if (!question) {
            this.showQuizResults();
            return;
        }

        const body = document.getElementById('quiz-body');
        const progressFill = document.getElementById('quiz-progress-fill');
        const progressText = document.getElementById('quiz-progress-text');
        const currentScore = document.getElementById('current-score');

        // Update progress
        const progress = ((this.currentQuiz + 1) / questions.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${this.currentQuiz + 1}/${questions.length}`;
        currentScore.textContent = this.userScore;

        body.innerHTML = `
            <div class="question-card">
                <p class="question-text">${question.question}</p>
                <div class="question-options">
                    ${question.options.map((option, index) => `
                        <button class="option-btn" onclick="learnToVerify.selectQuizAnswer(${index})">
                            <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                            <span>${option}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('submit-btn').disabled = true;
    }

    selectQuizAnswer(selectedIndex) {
        this.quizAnswers[this.currentQuiz] = selectedIndex;
        
        // Update button states
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach((btn, index) => {
            btn.classList.remove('selected');
            if (index === selectedIndex) {
                btn.classList.add('selected');
            }
        });

        document.getElementById('submit-btn').disabled = false;
    }

    submitQuizAnswer() {
        const questions = this.quizQuestions[this.currentMode] || this.quizQuestions.general;
        const question = questions[this.currentQuiz];
        const selectedAnswer = this.quizAnswers[this.currentQuiz];

        if (selectedAnswer === undefined) {
            alert('Please select an answer!');
            return;
        }

        // Show correct answer
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === question.correct) {
                btn.classList.add('correct');
            } else if (index === selectedAnswer && index !== question.correct) {
                btn.classList.add('incorrect');
            }
        });

        // Add explanation
        const questionCard = document.querySelector('.question-card');
        const explanation = document.createElement('div');
        explanation.className = 'explanation';
        explanation.innerHTML = `<p><strong>Explanation:</strong> ${question.explanation}</p>`;
        questionCard.appendChild(explanation);

        // Update score
        if (selectedAnswer === question.correct) {
            this.userScore += 10;
            this.updateStats();
        }

        // Move to next question after delay
        setTimeout(() => {
            this.currentQuiz++;
            this.renderQuizQuestion();
        }, 3000);
    }

    showQuizResults() {
        const questions = this.quizQuestions[this.currentMode] || this.quizQuestions.general;
        let correctAnswers = 0;

        questions.forEach((question, index) => {
            if (this.quizAnswers[index] === question.correct) {
                correctAnswers++;
            }
        });

        const percentage = Math.round((correctAnswers / questions.length) * 100);
        
        this.showResultsModal('Quiz Results', `
            <div class="score-display">${percentage}%</div>
            <div class="results-summary">
                You answered ${correctAnswers} out of ${questions.length} questions correctly.
                ${percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
            </div>
        `);

        this.hideQuizContent();
    }

    hideQuizContent() {
        document.getElementById('quiz-content-modal').style.display = 'none';
    }

    // Simulation Management
    selectTheme(theme) {
        this.selectedTheme = theme;
        
        // Update button states
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        
        // Update button states
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    startSimulation() {
        this.currentSimulation = 0;
        this.simulationAnalysis = '';
        this.hideAllModals();
        document.getElementById('simulation-content-modal').style.display = 'flex';
        this.renderSimulationExample();
    }

    renderSimulationExample() {
        const examples = this.simulationExamples[this.selectedTheme][this.selectedDifficulty];
        const example = examples[this.currentSimulation];
        
        if (!example) {
            this.showSimulationResults();
            return;
        }

        const body = document.getElementById('simulation-body');
        const themeBadge = document.getElementById('current-theme');
        const difficultyBadge = document.getElementById('current-difficulty');
        const scoreDisplay = document.getElementById('simulation-score');

        themeBadge.textContent = this.selectedTheme.charAt(0).toUpperCase() + this.selectedTheme.slice(1);
        difficultyBadge.textContent = this.selectedDifficulty.charAt(0).toUpperCase() + this.selectedDifficulty.slice(1);
        scoreDisplay.textContent = this.userScore;

        body.innerHTML = `
            <div class="simulation-example">
                <h3 class="simulation-title">${example.title}</h3>
                <div class="simulation-content-text">${example.content}</div>
            </div>
            <div class="analysis-prompt">
                <h4>Your Analysis</h4>
                <p>Analyze this content and identify the misinformation techniques used. What red flags do you notice?</p>
                <textarea 
                    id="analysis-textarea" 
                    class="analysis-textarea" 
                    placeholder="Write your analysis here... Look for emotional language, false claims, missing sources, etc."
                ></textarea>
            </div>
        `;

        this.updateAnalysisButton();
    }

    updateAnalysisButton() {
        const textarea = document.getElementById('analysis-textarea');
        const submitBtn = document.getElementById('simulation-submit-btn');
        
        if (textarea && submitBtn) {
            submitBtn.disabled = textarea.value.trim().length < 20;
        }
    }

    submitSimulationAnalysis() {
        const textarea = document.getElementById('analysis-textarea');
        this.simulationAnalysis = textarea.value.trim();

        if (this.simulationAnalysis.length < 20) {
            alert('Please provide a more detailed analysis (at least 20 characters).');
            return;
        }

        // Simulate AI analysis
        this.analyzeSimulationResponse();
    }

    async analyzeSimulationResponse() {
        const examples = this.simulationExamples[this.selectedTheme][this.selectedDifficulty];
        const example = examples[this.currentSimulation];
        
        // Show loading
        const submitBtn = document.getElementById('simulation-submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        submitBtn.disabled = true;

        try {
            // Simulate AI analysis delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate AI feedback
            const feedback = this.generateAIFeedback(example, this.simulationAnalysis);
            
            // Show feedback
            this.showSimulationFeedback(feedback);
            
            // Update score based on analysis quality
            const score = this.calculateSimulationScore(feedback);
            this.userScore += score;
            this.updateStats();

        } catch (error) {
            console.error('Analysis error:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            submitBtn.innerHTML = 'Submit Analysis';
            submitBtn.disabled = false;
        }
    }

    generateAIFeedback(example, userAnalysis) {
        // Simple keyword-based feedback generation
        const keywords = ['emotional', 'urgency', 'false', 'misleading', 'bias', 'source', 'verify', 'red flag'];
        const userKeywords = keywords.filter(keyword => 
            userAnalysis.toLowerCase().includes(keyword)
        );

        const score = Math.min(100, (userKeywords.length / keywords.length) * 100);
        
        let feedback = `Your analysis identified ${userKeywords.length} key concepts. `;
        
        if (score >= 80) {
            feedback += "Excellent analysis! You correctly identified most of the misinformation techniques.";
        } else if (score >= 60) {
            feedback += "Good analysis! You caught several important red flags.";
        } else {
            feedback += "Keep practicing! Try to look for emotional language, missing sources, and extraordinary claims.";
        }

        feedback += `\n\nKey techniques in this example: ${example.analysis}`;

        return {
            score: Math.round(score),
            feedback: feedback,
            keywords: userKeywords
        };
    }

    calculateSimulationScore(feedback) {
        return Math.round(feedback.score / 10); // Convert to points
    }

    showSimulationFeedback(feedback) {
        const body = document.getElementById('simulation-body');
        body.innerHTML = `
            <div class="simulation-example">
                <h3>Analysis Complete!</h3>
                <div class="feedback-score">Score: ${feedback.score}/100</div>
                <div class="feedback-text">${feedback.feedback}</div>
                <div class="keywords-identified">
                    <strong>Keywords you identified:</strong> ${feedback.keywords.join(', ')}
                </div>
            </div>
        `;

        // Add next button
        const actions = document.querySelector('.simulation-actions');
        actions.innerHTML = `
            <button class="btn-primary" onclick="learnToVerify.nextSimulation()">
                Next Example
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    nextSimulation() {
        this.currentSimulation++;
        this.renderSimulationExample();
    }

    showSimulationResults() {
        this.showResultsModal('Simulation Complete', `
            <div class="score-display">Great Job!</div>
            <div class="results-summary">
                You've completed the simulation mode. Your analysis skills are improving!
            </div>
        `);

        this.hideSimulationContent();
    }

    hideSimulationContent() {
        document.getElementById('simulation-content-modal').style.display = 'none';
    }

    // Results Modal
    showResultsModal(title, content) {
        document.getElementById('results-title').textContent = title;
        document.getElementById('results-content').innerHTML = content;
        document.getElementById('results-modal').style.display = 'flex';
    }

    closeResultsModal() {
        document.getElementById('results-modal').style.display = 'none';
    }

    retryActivity() {
        this.closeResultsModal();
        // Restart current activity
        if (this.currentMode === 'quiz') {
            this.startQuiz(this.currentMode);
        } else if (this.currentMode === 'simulation') {
            this.startSimulation();
        }
    }

    // Stats Management
    updateStats() {
        document.getElementById('user-score').textContent = this.userScore;
        document.getElementById('completed-lessons').textContent = this.completedLessons;
        
        // Update progress bars
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            if (bar.id === 'lesson-progress-fill') {
                const progress = (this.completedLessons / this.lessons.length) * 100;
                bar.style.width = `${progress}%`;
            }
        });
    }
}

// Initialize the application
let learnToVerify;

document.addEventListener('DOMContentLoaded', () => {
    learnToVerify = new LearnToVerify();
});

// Global functions for HTML onclick handlers
function showContentLibrary() {
    learnToVerify.showContentLibrary();
}

function hideContentLibrary() {
    learnToVerify.hideContentLibrary();
}

function showQuizMode() {
    learnToVerify.showQuizMode();
}

function hideQuizMode() {
    learnToVerify.hideQuizMode();
}

function showSimulationMode() {
    learnToVerify.showSimulationMode();
}

function hideSimulationMode() {
    learnToVerify.hideSimulationMode();
}

function selectTheme(theme) {
    learnToVerify.selectTheme(theme);
}

function selectDifficulty(difficulty) {
    learnToVerify.selectDifficulty(difficulty);
}

function startSimulation() {
    learnToVerify.startSimulation();
}

function closeResultsModal() {
    learnToVerify.closeResultsModal();
}

function retryActivity() {
    learnToVerify.retryActivity();
}

// Lesson functions
function hideLessonContent() {
    learnToVerify.hideLessonContent();
}

function previousLesson() {
    learnToVerify.previousLesson();
}

function nextLesson() {
    learnToVerify.nextLesson();
}

// Quiz functions
function startQuiz(type) {
    learnToVerify.startQuiz(type);
}

function hideQuizContent() {
    learnToVerify.hideQuizContent();
}

function submitQuizAnswer() {
    learnToVerify.submitQuizAnswer();
}

function selectQuizOption(selectedIndex, correctIndex) {
    learnToVerify.selectQuizOption(selectedIndex, correctIndex);
}

function selectQuizAnswer(selectedIndex) {
    learnToVerify.selectQuizAnswer(selectedIndex);
}

// Simulation functions
function hideSimulationContent() {
    learnToVerify.hideSimulationContent();
}

function submitSimulationAnalysis() {
    learnToVerify.submitSimulationAnalysis();
}

function nextSimulation() {
    learnToVerify.nextSimulation();
}

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar && mobileToggle) {
        sidebar.classList.toggle('mobile-open');
        mobileToggle.classList.toggle('active');
    }
}
