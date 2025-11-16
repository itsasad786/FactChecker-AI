# Veritas Analyzer Setup Guide

## Getting Started with Google Gemini API

### Step 1: Get Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Choose "Create API key in new project" or select existing project
   - Copy the generated API key

### Step 2: Configure Your API Key

1. **Open `config.js` file**
2. **Replace the empty API key**:
   ```javascript
   GEMINI_API_KEY: 'YOUR_API_KEY_HERE', // Replace with your actual API key
   ```

3. **Save the file**

### Step 3: Test Your Setup

1. **Open `veritas-analyzer.html` in your browser**
2. **Try analyzing some text**:
   - Go to the "Text Analysis" tab
   - Paste some text (at least 50 characters)
   - Click "Analyze Content"

3. **Check for success**:
   - You should see "Analysis completed successfully!" notification
   - Real analysis results will be displayed

### Step 4: Understanding the Analysis

The Veritas Analyzer performs **5 comprehensive analyses**:

#### 1. **Fact-Checking Analysis**
- Identifies specific claims in the text
- Flags red flags like sensationalist language
- Checks for logical fallacies and emotional manipulation
- Provides verification status for each claim

#### 2. **Source Verification**
- Evaluates source credibility
- Suggests questions critical thinkers should ask
- Recommends credible sources (WHO, RBI, PIB, etc.)
- Identifies source-related red flags

#### 3. **Language Analysis**
- Detects biased language and emotional manipulation
- Identifies manipulation techniques
- Analyzes emotional tone and neutrality
- Flags persuasive techniques

#### 4. **Bias Detection**
- Identifies various types of bias:
  - Confirmation bias
  - Selection bias
  - Availability bias
  - Political bias
  - Cultural bias

#### 5. **Emotional Manipulation Detection**
- Detects fear-mongering
- Identifies emotional appeals
- Flags guilt-tripping and bandwagon effects
- Analyzes authority appeals

### Step 5: API Usage and Limits

#### **Current Model: Gemini 2.0 Flash Experimental**
- **1000 requests per day** (FREE)
- **Fast response times**
- **Good for most fact-checking use cases**

#### **Alternative Models Available**
You can easily switch models in `config.js`:

- **gemini-2.0-flash-exp**: 1000 requests/day (FREE) - Current model
- **gemini-1.5-flash**: 15 requests/minute, 1M tokens/day (FREE) - More reliable
- **gemini-1.5-pro**: 2 requests/minute, 1M tokens/day (FREE) - Most capable
- **gemini-1.5-flash-8b**: 15 requests/minute, 1M tokens/day (FREE) - Lightweight

#### **Cost (if you exceed free tier)**
- **$0.00025 per 1K characters** for input
- **$0.0005 per 1K characters** for output

#### **Optimization Tips**
- Keep text under 10,000 characters for best performance
- The system automatically handles rate limiting
- Failed requests fall back to demo results
- With 1000 requests/day, you can analyze plenty of content for free!

### Troubleshooting

#### **"API key not configured" Error**
- Make sure you've added your API key to `config.js`
- Check that the key is properly quoted in the file

#### **"Analysis failed" Error**
- Check your internet connection
- Verify your API key is valid
- Check if you've exceeded rate limits
- The system will show demo results as fallback

#### **"Request timeout" Error**
- The API request took longer than 30 seconds
- Try with shorter text
- Check your internet connection

#### **Rate Limit Exceeded**
- Wait a few minutes before trying again
- The free tier allows 15 requests per minute
- Consider upgrading if you need higher limits

### Advanced Configuration

#### **Customizing Analysis Types**
You can modify which analyses to run by editing the `analyzeText` function in `veritas-script.js`:

```javascript
// Run only specific analyses
const result = await geminiAPI.analyzeText(text, [
    CONFIG.ANALYSIS_TYPES.FACT_CHECK,
    CONFIG.ANALYSIS_TYPES.SOURCE_VERIFICATION
]);
```

#### **Modifying Prompts**
Edit the prompts in `config.js` to customize the analysis behavior:

```javascript
const ANALYSIS_PROMPTS = {
    [CONFIG.ANALYSIS_TYPES.FACT_CHECK]: `Your custom prompt here...`
};
```

#### **Adjusting Timeouts**
Modify the timeout in `config.js`:

```javascript
REQUEST_TIMEOUT: 30000, // 30 seconds
```

### Security Notes

- **Never commit your API key to version control**
- **Keep your API key private**
- **Consider using environment variables for production**
- **Monitor your API usage regularly**

### Support

If you encounter issues:

1. **Check the browser console** for error messages
2. **Verify your API key** is correct
3. **Test with shorter text** first
4. **Check your internet connection**
5. **Review the troubleshooting section** above

### Example Usage

```javascript
// Test API connection
const testResult = await geminiAPI.testConnection();
console.log(testResult);

// Analyze text
const result = await geminiAPI.analyzeText("Your text here");
console.log(result.data);
```

---

**Ready to start analyzing content for misinformation!** 🚀

The Veritas Analyzer is now configured and ready to provide comprehensive fact-checking and credibility analysis using Google's powerful Gemini AI model.
