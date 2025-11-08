# 🛡️ FactChecker AI - Combatting Misinformation with AI-Powered Verification

<div align="center">

**A comprehensive, modular web platform for fact-checking and digital media literacy**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini-blue)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*Empowering users to verify information, detect misinformation, and report threats to authorities—all in one powerful platform.*

</div>

---

## 🎯 Problem Statement

In today's digital age, misinformation spreads faster than ever through social media, messaging apps, and news platforms. Users lack accessible tools to:
- Verify the credibility of content they encounter
- Learn how to identify misinformation techniques
- Report dangerous content to appropriate authorities
- Analyze voice notes and audio content for manipulation

**FactChecker AI** addresses these challenges with an all-in-one solution powered by Google Gemini AI.

---

## ✨ Key Features

### 1. 🔍 **Veritas Analyzer** - Multi-Format Content Analysis

The core fact-checking engine that analyzes content in multiple formats:

#### **Text Analysis**
- Paste any text content (articles, social media posts, forwarded messages)
- Real-time credibility scoring (0-100)
- Comprehensive breakdown of:
  - **Fact Checking**: Identifies specific claims and verifies their accuracy
  - **Source Verification**: Evaluates source credibility and suggests reliable sources
  - **Language Analysis**: Detects biased language and emotional manipulation
  - **Bias Detection**: Identifies various types of bias (political, confirmation, selection, etc.)
  - **Emotional Manipulation**: Flags persuasive techniques and manipulation tactics

#### **URL Analysis**
- Enter any URL (news articles, social media posts, blogs)
- Automatic content extraction from web pages
- URL safety assessment
- Clickbait detection
- Content quality evaluation

#### **File Upload Analysis**
- **Image Analysis**: OCR support for Hindi and English text extraction
- **PDF Analysis**: Extracts and analyzes PDF content
- **Text File Analysis**: Processes .txt files
- Drag-and-drop interface for easy file uploads

#### **Visual Dashboard**
- Interactive credibility score visualization
- Color-coded threat levels (High/Medium/Low)
- Detailed progress bars for each analysis category
- Comprehensive insights and recommendations

---

### 2. 🚨 **Automated Reporting Hub** - Smart Authority Detection

When threats are detected, the system automatically:

#### **Intelligent Threat Categorization**
- **Cyber Crime**: Detects hacking, phishing, malware, data breaches
- **Financial Scams**: Identifies investment fraud, banking scams, Ponzi schemes
- **Election Misinformation**: Flags political manipulation, fake news
- **Health Misinformation**: Detects medical scams, false cures, vaccine misinformation
- **General Fake News**: Catches other types of misinformation

#### **Authority Matching**
- Automatically suggests relevant Indian authorities:
  - **Cyber Crime Cell** (I4C) - For cyber threats
  - **RBI Sachet Portal** - For financial scams
  - **Election Commission of India** - For election misinformation
  - **Ministry of Health** - For health misinformation
  - **PIB Fact Check** - For general fake news

#### **Report Generation**
- One-click report generation with all analysis data
- Report preview before submission
- Export reports as JSON
- Complete report history tracking

#### **Reports & Authority Hub**
- View all submitted reports in one place
- Search and filter reports by category, threat level, or date
- Statistics dashboard showing:
  - Total reports submitted
  - High threat reports count
  - Categories reported
  - Monthly report statistics
- Export individual or all reports
- Detailed report view with full analysis data

---

### 3. 🎓 **Learn to Verify** - Interactive Digital Literacy Platform

Gamified learning system to build fact-checking skills:

#### **Content Library**
- Mini-courses on misinformation techniques
- Educational content on identifying fake news
- Best practices for information verification

#### **Adaptive Quizzes**
- Topic-based quizzes (politics, health, science, etc.)
- Immediate feedback and explanations
- Progress tracking and scoring
- Badge system for achievements

#### **Real-Life Simulations**
- Practice scenarios with real-world examples
- Learn to identify misinformation in context
- Interactive exercises with immediate feedback

---

### 4. 🎤 **Voice Note Analyzer** - Audio Content Verification

Revolutionary feature for analyzing voice content:

#### **Recording & Upload**
- Browser-based voice recording (up to 5 minutes)
- Upload audio files (MP3, WAV, OGG, M4A, AAC)
- Real-time audio waveform visualization
- High-quality audio processing with noise cancellation

#### **Speech-to-Text**
- Automatic transcription using Web Speech API
- Multi-language support (English, Hindi)
- Editable transcription for accuracy
- Real-time transcription display

#### **AI Analysis**
- Credibility scoring for voice content
- Emotional tone detection
- Manipulation technique identification
- Fact-checking of spoken claims
- Bias detection in speech

#### **Voice History**
- Persistent storage of all voice notes (localStorage)
- Filter by date or credibility score
- Search functionality
- Playback and re-analysis options
- Export analysis results

---

### 5. 🛡️ **ShieldMate** (Coming Soon)
- Dedicated tool for WhatsApp and SMS forwards
- Quick credibility checks for messaging app content
- Scam detection for forwarded messages

---

### 6. 🌐 **Browser Extension** (Release Soon)
- One-click analysis on any webpage
- Real-time credibility warnings
- Analysis history tracking
- Works on all major browsers (Chrome, Firefox, Safari, Edge)

---

## 🚀 Technology Stack

### **Frontend**
- **HTML5** - Semantic, accessible markup
- **CSS3** - Modern styling with gradients, animations, and responsive design
- **Vanilla JavaScript** - No framework dependencies, fast and lightweight
- **Font Awesome** - Icon library for UI elements

### **AI & APIs**
- **Google Gemini AI** - Advanced language model for content analysis
  - Gemini 2.5 Flash Preview for fast, accurate analysis
  - Custom prompts for different analysis types
  - Token optimization for efficient API usage

### **Libraries & Tools**
- **Tesseract.js** - OCR for Hindi and English text extraction from images
- **PDF.js** - PDF content extraction
- **Web Speech API** - Speech-to-text transcription
- **Web Audio API** - Voice recording and processing

### **Deployment**
- **Vercel** - Static site hosting with edge optimization
- **GitHub** - Version control and collaboration

---

## 📊 Technical Highlights

### **Performance Optimizations**
- ✅ Token limit management for API calls
- ✅ Content truncation for large files (800 words max)
- ✅ Parallel API requests for faster analysis
- ✅ LocalStorage for offline data persistence
- ✅ Efficient caching strategies

### **Security Features**
- ✅ Security headers (XSS protection, frame options)
- ✅ Input validation and sanitization
- ✅ Safe error handling without exposing sensitive data
- ✅ API key management (configurable)

### **Accessibility**
- ✅ Responsive design (mobile-first approach)
- ✅ Keyboard navigation support
- ✅ Screen reader friendly structure
- ✅ High contrast color schemes
- ✅ Clear visual feedback

### **Multi-Language Support**
- ✅ Hindi and English OCR support
- ✅ Multi-language speech recognition
- ✅ Localized content analysis

---

## 🎯 Use Cases

### **For Individuals**
- Verify news articles before sharing
- Check credibility of social media posts
- Analyze forwarded messages on WhatsApp
- Learn to identify misinformation
- Report dangerous content to authorities

### **For Educators**
- Teach digital literacy skills
- Demonstrate misinformation techniques
- Interactive learning modules
- Student progress tracking

### **For Organizations**
- Content verification workflows
- Team training on fact-checking
- Report generation for compliance
- Historical analysis tracking

---

## 📦 Installation & Setup

### **Quick Start (Local Development)**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/factchecker-ai.git
   cd factchecker-ai
   ```

2. **Configure API Key**
   - Get your Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Open `config.js`
   - Replace `GEMINI_API_KEY` with your API key

3. **Run Locally**
   - Open `index.html` in a web browser
   - Or use a local server:
     ```bash
     npx serve .
     ```

---

## 🎮 How to Use

### **Analyzing Content**

1. **Text Analysis**
   - Go to Veritas Analyzer
   - Select "Text Analysis" tab
   - Paste your content (minimum 50 characters)
   - Click "Analyze Content"
   - Review comprehensive results

2. **URL Analysis**
   - Select "URL Analysis" tab
   - Enter the URL
   - Click "Analyze URL"
   - View extracted content and analysis

3. **File Upload**
   - Select "Upload Content" tab
   - Drag and drop or select files
   - Click "Analyze" on uploaded files
   - Review OCR-extracted text and analysis

### **Reporting Threats**

1. When a threat is detected, the Reporting Hub appears automatically
2. Review threat level and category
3. Select appropriate authority
4. Preview the report
5. Generate and submit the report
6. Track all reports in Reports & Authority Hub

### **Voice Analysis**

1. Go to Voice Note Analyzer
2. Click "Start Recording" or upload an audio file
3. Wait for automatic transcription
4. Edit transcription if needed
5. Click "Analyze Voice"
6. Review comprehensive analysis results
7. Save to history for future reference

### **Learning Modules**

1. Go to Learn to Verify
2. Choose a mode:
   - Content Library for lessons
   - Quizzes for practice
   - Simulations for real-world scenarios
3. Track your progress and scores

---

## 📈 Impact & Innovation

### **Problem-Solving Approach**
- **Comprehensive**: Covers text, URLs, files, and voice content
- **Accessible**: No technical knowledge required
- **Actionable**: Direct reporting to authorities
- **Educational**: Builds user capability to identify misinformation

### **Innovation Highlights**
- First platform to combine multi-format analysis with authority reporting
- Voice note analysis for audio content verification
- Automatic threat categorization with authority matching
- Complete report tracking and management system
- Hindi OCR support for Indian content

### **Scalability**
- Static site architecture (low hosting costs)
- API-based AI (easy to scale)
- Modular architecture (easy to extend)
- Mobile-responsive (works everywhere)

---

## 🔮 Future Enhancements

- [ ] **Dark Mode** - Better user experience
- [ ] **PWA Support** - Offline functionality
- [ ] **Enhanced Browser Extension** - Full-featured extension
- [ ] **Mobile Apps** - Native iOS and Android apps
- [ ] **Multi-language UI** - Hindi and other languages
- [ ] **Advanced Analytics** - Detailed usage statistics
- [ ] **API Integration** - Connect with more fact-checking services
- [ ] **Community Features** - User contributions and discussions

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ by Asad Ali for the hackathon

---

## 🏆 Hackathon Submission

**FactChecker AI** is a complete, production-ready solution for combating misinformation. It demonstrates:

✅ **Technical Excellence**: Advanced AI integration, multi-format support, optimized performance  
✅ **User Experience**: Intuitive interface, comprehensive features, mobile-responsive  
✅ **Real-World Impact**: Addresses critical problem of misinformation  
✅ **Innovation**: Unique combination of analysis, reporting, and education  
✅ **Completeness**: Fully functional with deployment-ready code  

**Live Demo**:  https://fact-checker-gules.vercel.app/  (open in icognito window)

---

<div align="center">

**Made with ❤️ to make the internet a safer place**

[⭐ Star us on GitHub](https://github.com/yourusername/factchecker-ai) | [🐛 Report Bug](https://github.com/yourusername/factchecker-ai/issues) | [💡 Request Feature](https://github.com/yourusername/factchecker-ai/issues)

</div>

