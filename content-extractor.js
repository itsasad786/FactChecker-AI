// Content Extraction Service for Veritas Analyzer
// Handles image OCR, PDF text extraction, and content validation

class ContentExtractor {
    constructor() {
        this.maxContentLength = CONFIG.MAX_URL_CONTENT_LENGTH || 800; // 800 words limit
        this.supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.supportedPdfTypes = ['application/pdf'];
        this.supportedTextTypes = ['text/plain', 'text/csv'];
    }

    // Main method to extract content from uploaded files
    async extractContentFromFiles(files) {
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                const result = await this.extractContentFromFile(file);
                results.push(result);
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                results.push({
                    success: false,
                    fileName: file.name,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Extract content from a single file
    async extractContentFromFile(file) {
        // Validate file type
        if (!this.isValidFileType(file)) {
            throw new Error(`Unsupported file type: ${file.type}. Supported types: Images (JPEG, PNG, GIF, WebP), PDF, Text files.`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File too large: ${file.name}. Maximum size: 10MB.`);
        }

        let extractedText = '';

        if (this.supportedImageTypes.includes(file.type)) {
            extractedText = await this.extractTextFromImage(file);
        } else if (this.supportedPdfTypes.includes(file.type)) {
            extractedText = await this.extractTextFromPDF(file);
        } else if (this.supportedTextTypes.includes(file.type)) {
            extractedText = await this.extractTextFromTextFile(file);
        }

        // Validate content length
        const wordCount = this.countWords(extractedText);
        if (wordCount > this.maxContentLength) {
            throw new Error(`Content too long: ${wordCount} words. Maximum allowed: ${this.maxContentLength} words. Please use a shorter document or extract specific sections.`);
        }

        if (wordCount < 10) {
            throw new Error(`Content too short: ${wordCount} words. Minimum required: 10 words.`);
        }

        return {
            success: true,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            extractedText: extractedText,
            wordCount: wordCount,
            characterCount: extractedText.length,
            extractedAt: new Date().toISOString()
        };
    }

    // Extract text from image using OCR (Tesseract.js)
    async extractTextFromImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = async () => {
                try {
                    // Set canvas dimensions
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0);
                    
                    // Try multiple language combinations for better text recognition
                    const languageCombinations = [
                        'hin+eng',  // Hindi + English (most common)
                        'eng+hin',  // English + Hindi
                        'hin',      // Hindi only
                        'eng'       // English only (fallback)
                    ];
                    
                    let bestResult = null;
                    let bestConfidence = 0;
                    
                    // Try each language combination
                    for (const lang of languageCombinations) {
                        try {
                            console.log(`Trying OCR with language: ${lang}`);
                            
                            const { data } = await Tesseract.recognize(
                                canvas,
                                lang,
                                {
                                    logger: m => console.log(m),
                                    // OCR engine options for better accuracy
                                    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                                    tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
                                }
                            );
                            
                            // Check confidence and text quality
                            const confidence = data.confidence || 0;
                            const text = data.text || '';
                            
                            console.log(`Language ${lang}: Confidence ${confidence}, Text length: ${text.length}`);
                            
                            // Use the result with highest confidence and meaningful text
                            if (confidence > bestConfidence && text.trim().length > 0) {
                                bestResult = text.trim();
                                bestConfidence = confidence;
                            }
                            
                            // If we get a good result, break early
                            if (confidence > 60 && text.trim().length > 10) {
                                break;
                            }
                            
                        } catch (langError) {
                            console.warn(`OCR failed for language ${lang}:`, langError);
                            continue;
                        }
                    }
                    
                    if (!bestResult || bestResult.length === 0) {
                        throw new Error('No readable text found in image. Please ensure the image contains clear, readable text in Hindi or English.');
                    }
                    
                    console.log(`Best OCR result: ${bestResult.substring(0, 100)}... (Confidence: ${bestConfidence})`);
                    resolve(bestResult);
                    
                } catch (error) {
                    reject(new Error(`OCR failed: ${error.message}`));
                }
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            // Load image
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => {
                reject(new Error('Failed to read image file'));
            };
            reader.readAsDataURL(file);
        });
    }

    // Extract text from PDF using PDF.js
    async extractTextFromPDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const typedArray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    
                    let fullText = '';
                    const maxPages = 5; // Limit to first 5 pages to control content length
                    
                    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, maxPages); pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + ' ';
                        
                        // Check word count after each page
                        const currentWordCount = this.countWords(fullText);
                        if (currentWordCount > this.maxContentLength) {
                            break; // Stop if we exceed the limit
                        }
                    }
                    
                    if (!fullText || fullText.trim().length === 0) {
                        throw new Error('No text found in PDF. Please ensure the PDF contains readable text.');
                    }
                    
                    resolve(fullText.trim());
                } catch (error) {
                    reject(new Error(`PDF text extraction failed: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read PDF file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // Extract text from plain text file
    async extractTextFromTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const text = e.target.result;
                if (!text || text.trim().length === 0) {
                    reject(new Error('Text file is empty'));
                } else {
                    resolve(text.trim());
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read text file'));
            };
            
            reader.readAsText(file);
        });
    }

    // Validate file type
    isValidFileType(file) {
        const allSupportedTypes = [
            ...this.supportedImageTypes,
            ...this.supportedPdfTypes,
            ...this.supportedTextTypes
        ];
        
        return allSupportedTypes.includes(file.type);
    }

    // Count words in text (supports multiple languages including Hindi)
    countWords(text) {
        if (!text) return 0;
        
        // For Hindi and other languages, we need to count words differently
        // Hindi words are separated by spaces, but we also need to count Devanagari characters
        const trimmedText = text.trim();
        
        // Split by whitespace and filter out empty strings
        const words = trimmedText.split(/\s+/).filter(word => word.length > 0);
        
        // For languages like Hindi, also count individual characters as potential "words"
        // This gives a more accurate token count for non-English text
        const hasDevanagari = /[\u0900-\u097F]/.test(trimmedText);
        const hasChinese = /[\u4e00-\u9fff]/.test(trimmedText);
        const hasArabic = /[\u0600-\u06FF]/.test(trimmedText);
        
        if (hasDevanagari || hasChinese || hasArabic) {
            // For non-Latin scripts, count characters as well as words
            // This provides a better estimate for token counting
            const characterCount = trimmedText.replace(/\s/g, '').length;
            const wordCount = words.length;
            
            // Return the higher of word count or character count / 4
            // This accounts for the fact that non-Latin scripts often have more tokens per character
            return Math.max(wordCount, Math.ceil(characterCount / 4));
        }
        
        return words.length;
    }

    // Truncate content to word limit
    truncateContent(text, maxWords = this.maxContentLength) {
        const words = text.split(/\s+/);
        if (words.length <= maxWords) {
            return text;
        }
        
        const truncatedWords = words.slice(0, maxWords);
        return truncatedWords.join(' ') + '...';
    }

    // Get file type icon
    getFileTypeIcon(fileType) {
        if (this.supportedImageTypes.includes(fileType)) {
            return 'fas fa-image';
        } else if (this.supportedPdfTypes.includes(fileType)) {
            return 'fas fa-file-pdf';
        } else if (this.supportedTextTypes.includes(fileType)) {
            return 'fas fa-file-alt';
        }
        return 'fas fa-file';
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Get supported file types description
    getSupportedTypesDescription() {
        return 'Supported file types: Images (JPEG, PNG, GIF, WebP), PDF, Text files. Maximum content: 800 words.';
    }
}

// Create global instance
const contentExtractor = new ContentExtractor();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContentExtractor, contentExtractor };
}
