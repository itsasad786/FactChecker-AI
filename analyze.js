// Vercel Serverless Function: /api/analyze
// Proxies analysis requests to the shared Gemini API wrapper (gemini-api.js)

const { geminiAPI } = require('../gemini-api');

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', chunk => {
      data += chunk;
      // Basic guard against very large bodies
      if (data.length > 1e6) {
        req.connection.destroy();
        reject(new Error('Request body too large'));
      }
    });

    req.on('end', () => {
      if (!data) {
        return resolve({});
      }
      try {
        const parsed = JSON.parse(data);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON in request body'));
      }
    });

    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, {
      success: false,
      message: 'Method Not Allowed. Use POST with JSON body { text, analysisTypes? }.'
    });
  }

  try {
    const body = await parseBody(req);
    const { text, analysisTypes } = body || {};

    if (!text || typeof text !== 'string') {
      return sendJson(res, 400, {
        success: false,
        message: 'Missing or invalid "text" field in request body'
      });
    }

    const result = await geminiAPI.analyzeText(text, analysisTypes || null);
    return sendJson(res, 200, result);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    return sendJson(res, 500, {
      success: false,
      message: error.message || 'Internal server error',
      error: error.message
    });
  }
};

