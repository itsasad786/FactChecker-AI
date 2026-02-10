// URL Content Extraction Service for Veritas Analyzer
// Simplified and rebuilt from scratch

class URLExtractor {
    constructor() {
        // Simple CORS proxy
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
        this.timeout = 30000; // 30 seconds
    }

    // Main method to extract content from URL
    async extractContent(url) {
        try {
            // Validate URL
            if (!this.isValidURL(url)) {
                throw new Error('Invalid URL format');
            }

            // Extract content from web page
            return await this.extractWebPageContent(url);

        } catch (error) {
            console.error('URL extraction error:', error);
            throw error;
        }
    }

    // Extract content from web pages
    async extractWebPageContent(url) {
        try {
            // Build proxy URL
            const proxyUrl = this.corsProxy + encodeURIComponent(url);
            
            // Fetch content through proxy
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to fetch: HTTP ${response.status}`);
            }

            const html = await response.text();
            
            if (!html || html.trim().length === 0) {
                throw new Error('Empty response from server');
            }

            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract basic information
            const title = this.extractTitle(doc);
            const description = this.extractDescription(doc);
            const content = this.extractMainContent(doc);
            const source = this.extractSource(url);

            return {
                success: true,
                data: {
                    url: url,
                    title: title || 'Untitled',
                    description: description || '',
                    content: content || '',
                    author: '',
                    publishDate: '',
                    source: source,
                    contentType: 'webpage',
                    wordCount: content ? content.split(/\s+/).length : 0,
                    extractedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            throw new Error(`Web page extraction failed: ${error.message}`);
        }
    }

    // Extract title from document
    extractTitle(doc) {
        // Try meta tags first
        const ogTitle = doc.querySelector('meta[property="og:title"]');
        if (ogTitle) return ogTitle.getAttribute('content');

        const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) return twitterTitle.getAttribute('content');

        // Try title tag
        const titleTag = doc.querySelector('title');
        if (titleTag) return titleTag.textContent;

        // Try h1
        const h1 = doc.querySelector('h1');
        if (h1) return h1.textContent;

        return null;
    }

    // Extract description from document
    extractDescription(doc) {
        // Try meta tags
        const ogDesc = doc.querySelector('meta[property="og:description"]');
        if (ogDesc) return ogDesc.getAttribute('content');

        const twitterDesc = doc.querySelector('meta[name="twitter:description"]');
        if (twitterDesc) return twitterDesc.getAttribute('content');

        const metaDesc = doc.querySelector('meta[name="description"]');
        if (metaDesc) return metaDesc.getAttribute('content');

        return null;
    }

    // Extract main content from document
    extractMainContent(doc) {
        // Remove unwanted elements
        const unwanted = doc.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .menu, .navigation, .comments, .comment');
        unwanted.forEach(el => el.remove());

        // Try to find main content areas
        const selectors = [
            'article',
            'main',
            '.content',
            '.post-content',
            '.article-content',
            '.entry-content',
            '.main-content',
            '[role="main"]'
        ];

        for (const selector of selectors) {
            const element = doc.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                if (text.length > 200) {
                    return this.trimContent(text);
                }
            }
        }

        // Fallback to body
        const body = doc.body;
        if (body) {
            return this.trimContent(body.textContent.trim());
        }

        return '';
    }

    // Trim content to reasonable length
    trimContent(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }
        
        // Use a more conservative limit to ensure we don't hit token limits
        const maxWords = CONFIG?.MAX_URL_CONTENT_LENGTH || 600;
        const words = content.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length <= maxWords) {
            return content;
        }

        // Take first maxWords words
        const truncated = words.slice(0, maxWords).join(' ');
        
        // Try to end at a sentence boundary
        const lastPeriod = truncated.lastIndexOf('.');
        const lastExclamation = truncated.lastIndexOf('!');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        // If we found a sentence end within 80% of the target, use it
        if (lastSentenceEnd > truncated.length * 0.7 && lastSentenceEnd > 0) {
            return truncated.substring(0, lastSentenceEnd + 1);
        }

        // Otherwise, just truncate and add ellipsis
        return truncated.trim() + '...';
    }

    // Extract source from URL
    extractSource(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (e) {
            return 'Unknown';
        }
    }

    // Validate URL
    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Create global instance
const urlExtractor = new URLExtractor();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { URLExtractor, urlExtractor };
}
