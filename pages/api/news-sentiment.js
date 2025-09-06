// pages/api/news-sentiment.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,  // ✅ CORRECT
});

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Cache for news data
const newsCache = new Map();
const NEWS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol, timeframe = '24h' } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Check cache first
    const cacheKey = `${symbol}-${timeframe}`;
    const cached = getNewsFromCache(cacheKey);
    if (cached) {
      return res.status(200).json({ 
        news: cached.news,
        sentiment: cached.sentiment,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Fetch news from multiple sources
    const newsData = await fetchNewsData(symbol, timeframe);
    
    if (!newsData || newsData.length === 0) {
      return res.status(200).json({
        news: [],
        sentiment: {
          score: 0,
          sentiment: 'neutral',
          confidence: 0,
          summary: 'No recent news available for analysis'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Analyze sentiment with Claude
    const sentimentAnalysis = await analyzeSentimentWithClaude(symbol, newsData);

    // Cache the results
    setNewsCache(cacheKey, { news: newsData, sentiment: sentimentAnalysis });

    res.status(200).json({
      news: newsData,
      sentiment: sentimentAnalysis,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('News sentiment analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze news sentiment',
      fallback: true,
      sentiment: {
        score: 0,
        sentiment: 'neutral',
        confidence: 0,
        summary: 'News sentiment analysis temporarily unavailable'
      }
    });
  }
}

// Rest of the file remains the same...
// (Keeping it shorter since the key fix is just the API key reference)

// Utility functions
function getNewsFromCache(key) {
  const cached = newsCache.get(key);
  if (cached && Date.now() - cached.timestamp < NEWS_CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setNewsCache(key, data) {
  newsCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Clean old cache entries
  if (newsCache.size > 50) {
    const oldestKey = newsCache.keys().next().value;
    newsCache.delete(oldestKey);
  }
}

// Add the rest of the functions here...
