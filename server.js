// Simple Express backend for FactChecker AI
// - Serves the static frontend
// - Proxies analysis requests to Gemini via gemini-api.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { geminiAPI } = require('./gemini-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FactChecker backend running' });
});

// Test Gemini connection (used by frontend "Test API" buttons)
app.get('/api/test-gemini', async (req, res) => {
  try {
    const result = await geminiAPI.testConnection();
    return res.json(result);
  } catch (error) {
    console.error('Error in /api/test-gemini:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to test Gemini connection',
      error: error.message
    });
  }
});

// Main analysis endpoint
// Body: { text: string, analysisTypes?: string[] }
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, analysisTypes } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid "text" field in request body'
      });
    }

    const result = await geminiAPI.analyzeText(text, analysisTypes || null);
    return res.json(result);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Serve static frontend files from this directory
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FactChecker backend listening on http://localhost:${PORT}`);
});

