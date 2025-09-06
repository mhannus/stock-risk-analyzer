// pages/api/news-sentiment.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

// Fetch news from multiple sources
async function fetchNewsData(symbol, timeframe) {
  const newsArticles = [];

  try {
    // Source 1: NewsAPI (if available)
    if (NEWS_API_KEY) {
      const newsApiData = await fetchFromNewsAPI(symbol, timeframe);
      newsArticles.push(...newsApiData);
    }

    // Source 2: Finnhub News
    const finnhubNews = await fetchFromFinnhub(symbol, timeframe);
    newsArticles.push(...finnhubNews);

    // Source 3: Alpha Vantage News (if available)
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      const alphaNews = await fetchFromAlphaVantage(symbol);
      newsArticles.push(...alphaNews);
    }

    // Remove duplicates and sort by date
    const uniqueArticles = removeDuplicateNews(newsArticles);
    return uniqueArticles.slice(0, 10); // Limit to 10 most recent articles

  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// NewsAPI integration
async function fetchFromNewsAPI(symbol, timeframe) {
  try {
    const fromDate = getDateFromTimeframe(timeframe);
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${symbol}&from=${fromDate}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'ok' && data.articles) {
      return data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        sentiment: null // Will be analyzed by Claude
      }));
    }
    
    return [];
  } catch (error) {
    console.error('NewsAPI error:', error);
    return [];
  }
}

// Finnhub news integration
async function fetchFromFinnhub(symbol, timeframe) {
  try {
    const fromDate = getDateFromTimeframe(timeframe);
    const toDate = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_API_KEY}`
    );
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map(article => ({
        title: article.headline,
        description: article.summary,
        url: article.url,
        publishedAt: new Date(article.datetime * 1000).toISOString(),
        source: article.source,
        sentiment: null
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Finnhub news error:', error);
    return [];
  }
}

// Alpha Vantage news integration
async function fetchFromAlphaVantage(symbol) {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.feed) {
      return data.feed.slice(0, 5).map(article => ({
        title: article.title,
        description: article.summary,
        url: article.url,
        publishedAt: article.time_published,
        source: article.source,
        sentiment: article.overall_sentiment_score // Alpha Vantage provides sentiment
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Alpha Vantage news error:', error);
    return [];
  }
}

// Analyze sentiment with Claude
async function analyzeSentimentWithClaude(symbol, newsData) {
  const prompt = `You are a financial sentiment analyst. Analyze the following news articles for ${symbol} and provide a comprehensive sentiment assessment.

## NEWS ARTICLES:
${newsData.map((article, index) => `
${index + 1}. **${article.title}**
   Source: ${article.source}
   Date: ${article.publishedAt}
   Summary: ${article.description || 'No description available'}
   URL: ${article.url}
`).join('\n')}

## ANALYSIS REQUIREMENTS:

Provide your analysis in this EXACT JSON format:

{
  "overallScore": <number between -100 and 100>,
  "sentiment": "<bullish|neutral|bearish>",
  "confidence": <number between 0 and 100>,
  "summary": "<2-3 sentence summary of key sentiment drivers>",
  "keyThemes": [
    "<theme 1>",
    "<theme 2>",
    "<theme 3>"
  ],
  "articleSentiments": [
    {
      "title": "<article title>",
      "sentiment": "<positive|neutral|negative>",
      "impact": "<high|medium|low>",
      "reasoning": "<brief explanation>"
    }
  ],
  "tradingImplications": {
    "shortTerm": "<impact on stock in next 1-7 days>",
    "mediumTerm": "<impact on stock in next 1-4 weeks>",
    "keyRisks": ["<risk 1>", "<risk 2>"],
    "keyCatalysts": ["<catalyst 1>", "<catalyst 2>"]
  },
  "recommendedAction": "<buy|hold|sell|monitor>",
  "newsQuality": "<high|medium|low> - based on source credibility and relevance"
}

## SCORING GUIDELINES:
- +100: Extremely bullish (major positive catalysts)
- +50: Moderately bullish (several positive factors)
- 0: Neutral (mixed or no significant news)
- -50: Moderately bearish (several negative factors)
- -100: Extremely bearish (major negative catalysts)

Focus on:
1. Corporate developments (earnings, guidance, partnerships)
2. Regulatory news and legal issues
3. Market sentiment and analyst opinions
4. Competitive landscape changes
5. Economic factors affecting the sector

Respond ONLY with the JSON object, no additional text.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });

    // Parse Claude's JSON response
    const responseText = message.content[0].text.trim();
    const sentimentData = JSON.parse(responseText);

    return {
      score: sentimentData.overallScore,
      sentiment: sentimentData.sentiment,
      confidence: sentimentData.confidence,
      summary: sentimentData.summary,
      keyThemes: sentimentData.keyThemes,
      articleSentiments: sentimentData.articleSentiments,
      tradingImplications: sentimentData.tradingImplications,
      recommendedAction: sentimentData.recommendedAction,
      newsQuality: sentimentData.newsQuality,
      analysisTimestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Claude sentiment analysis error:', error);
    
    // Fallback sentiment analysis
    return {
      score: 0,
      sentiment: 'neutral',
      confidence: 30,
      summary: 'Unable to analyze sentiment with AI. Manual review recommended.',
      keyThemes: ['Analysis unavailable'],
      articleSentiments: [],
      tradingImplications: {
        shortTerm: 'Uncertain due to analysis failure',
        mediumTerm: 'Uncertain due to analysis failure',
        keyRisks: ['Analysis unavailable'],
        keyCatalysts: ['Analysis unavailable']
      },
      recommendedAction: 'monitor',
      newsQuality: 'unknown',
      analysisTimestamp: new Date().toISOString(),
      fallback: true
    };
  }
}

// Utility functions
function getDateFromTimeframe(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
}

function removeDuplicateNews(articles) {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

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
