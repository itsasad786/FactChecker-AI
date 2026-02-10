// Vercel Serverless Function: /api/test-gemini
// Simple health-check for Gemini connectivity via the shared gemini-api.js wrapper

const { geminiAPI } = require('../gemini-api');

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, {
      success: false,
      message: 'Method Not Allowed. Use GET to test Gemini connectivity.'
    });
  }

  try {
    const result = await geminiAPI.testConnection();
    return sendJson(res, 200, result);
  } catch (error) {
    console.error('Error in /api/test-gemini:', error);
    return sendJson(res, 500, {
      success: false,
      message: error.message || 'Failed to test Gemini connection',
      error: error.message
    });
  }
};

