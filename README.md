# FactChecker AI

A comprehensive, modular web platform for fact-checking and digital media literacy. Featuring instant article, file, URL, and voice analysis, interactive learning modules, and automated reporting to Indian authorities—all in a mobile-first, privacy-friendly interface.

## Major Modules & Features

- **Veritas Analyzer**: Instantly analyze articles, URLs (including social media/news), images, PDFs, and text files. AI-powered breakdown of factual accuracy, bias, emotional manipulation, and source quality, with detailed visual dashboards. Automatic content extraction (with OCR for Hindi and English), and file upload support.
  - **Authority/Reporting Hub**: If a threat is detected, auto-detects risk category (cyber, financial, election, health, general) and allows you to generate and preview reports for relevant authorities (Indian official channels).
- **Learn to Verify**: Interactive, gamified learning area. Includes a content library (mini-courses on misinformation techniques), adaptive quizzes (by content type), and real-life simulation/practice scenarios. Progress, scoring, and badges built-in.
- **Voice Note Analyzer**: Record or upload audio for instant, AI-powered fact-checking and emotional tone detection. Full speech-to-text transcription (editable), credibility scoring, and voice history with filters by date/credibility.
- **ShieldMate (Coming Soon)**: Dedicated credibility tool for WhatsApp and SMS forwards—detects scams and viral fakes (currently UI only).
- **Browser Extension (Prototype)**: One-click credential and manipulation analysis on any website/news/social feed; works on major browsers; track your history for digital hygiene.
- **Profile & Leaderboard (Planned)**: Track accuracy, progress, and learning milestones. Compare with others (code and UI scaffolding in place).

## Project File Structure

```
FactChecker/
├── index.html                 # Main landing page
├── veritas-analyzer.html      # Main AI fact-checker UI
├── learn-to-verify.html       # Interactive learning hub
├── voice-analyzer.html        # Voice note analysis area
├── voice-demo.html            # Standalone demo for voice analyzer
├── script.js                  # App-wide JS (UI shell)
├── veritas-script.js          # Veritas Analyzer/authority/report logic
├── learn-to-verify.js         # Learning/quiz/simulation logic
├── voice-analyzer.js          # Voice note record/upload/history analysis
├── content-extractor.js       # File/image/PDF extraction & OCR
├── url-extractor.js           # Web and social media content extraction
├── gemini-api.js              # Google Gemini AI integration
├── config.js                  # API keys, endpoints, and prompts
├── styles.css                 # Core styling
├── veritas-styles.css         # Veritas-specific styles
├── learn-to-verify-styles.css # Learning UI styles
├── voice-analyzer-styles.css  # Voice analysis UI styles
├── README.md                  # Docs (this file)
├── SETUP.md                   # Advanced setup, troubleshooting, and local dev
├── TOKEN_LIMITS_FIXED.md      # Notes/optimizations for AI usage
├── HINDI_SUPPORT.md           # Details on Hindi/English OCR support
├── ... (other docs)
```

## Setup & Configuration

1. **Clone the repository** or deploy as a static web app.
2. **Get a Google Gemini API Key** ([instructions in SETUP.md]). Paste it into `config.js` (`GEMINI_API_KEY`).
3. *Optional*: Tesseract.js OCR and PDF.js libraries are loaded via CDN for image/PDF support; no server/backend is needed.
4. For offline or advanced use, see SETUP.md for token/usage optimization and more.

## How to Use: Module Overview

### Veritas Analyzer
- Paste text, enter a URL, or upload a file (image/PDF/text).
- Hit "Analyze"—see a breakdown of credibility, fact-checks, detail cards (source, facts, bias, recency, emotional manipulation).
- If high-risk, review and generate a report to the suggested authority (with preview/download).
- Share, copy or export results for your own use.

### Voice Note Analyzer
- Record using your browser mic or upload an audio file (MP3, WAV, OGG, M4A, AAC).
- Automatically transcribe audio (editable), then analyze for facts, manipulation, and trust score.
- Filter/search your voice history by date or credibility.
- Export JSON analysis for records.

### Learn to Verify
- Choose a mode: Content Library (mini-lessons), Quizzes (by topic), or Simulations (practice IDing fakes in real scenarios).
- Progress through each mode with scoring & feedback. Your best scores/streaks tracked on your browser.

### Upcoming / Special Features
- **ShieldMate**: (UI present; backend/logic planned) For WhatsApp/SMS message checking.
- **Browser Extension**: (See UI in veritas-analyzer.html; install prototype via the download card.)
- **Profiles & Leaderboards**: Compare your learning and fact-checking scores with others (feature visible, full logic in progress).

## Customization & Advanced Settings
- All API endpoints, analysis modes, and scoring weights are configurable in `config.js`.
- Text/image/voice/PDF handling: See `content-extractor.js`, `voice-analyzer.js`, etc.
- For OCR, supports Hindi and English natively—See [HINDI_SUPPORT.md].

## Future Enhancements (Planned)
- Dark Mode
- Finished Profiles/Leaderboard
- Full-featured ShieldMate (for WhatsApp/SMS/forwards)
- PWA/Offline mode
- Enhanced browser extension & mobile app
- Localization (UI Hindi/other languages)
- Accessibility/ARIA & WAI compliance
- More API options & user privacy controls

---
For more setup details, troubleshooting tips, or FAQs, see `SETUP.md`.
