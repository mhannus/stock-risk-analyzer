// pages/api/claude-analysis.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Cache for storing analyses (in production, use Redis or similar)
const analysisCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      stockData, 
      analysisType = 'comprehensive', 
      portfolioData = null,
      newsData = null,
      userRiskProfile = 'moderate'
    } = req.body;

    // Validate required data
    if (!stockData || !stockData.symbol) {
      return res.status(400).json({ error: 'Stock data with symbol is required' });
    }

    // Check cache first
    const cacheKey = generateCacheKey(stockData, analysisType, userRiskProfile);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.status(200).json({ 
        analysis: cached, 
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Generate analysis based on type
    let analysis;
    switch (analysisType) {
      case 'quick':
        analysis = await generateQuickAnalysis(stockData, userRiskProfile);
        break;
      case 'comprehensive':
        analysis = await generateComprehensiveAnalysis(stockData, userRiskProfile, newsData);
        break;
      case 'portfolio':
        analysis = await generatePortfolioAnalysis(portfolioData, userRiskProfile);
        break;
      case 'sentiment':
        analysis = await generateSentimentAnalysis(stockData, newsData, userRiskProfile);
        break;
      default:
        analysis = await generateComprehensiveAnalysis(stockData, userRiskProfile, newsData);
    }

    // Cache the result
    setCache(cacheKey, analysis);

    res.status(200).json({ 
      analysis,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claude API error:', error);
    
    // Provide fallback analysis
    const fallbackAnalysis = generateFallbackAnalysis(req.body.stockData);
    
    res.status(200).json({ 
      analysis: fallbackAnalysis,
      fallback: true,
      error: 'AI analysis temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}

// Quick Analysis (fast, concise)
async function generateQuickAnalysis(stockData, riskProfile) {
  const prompt = `You are a professional risk analyst. Provide a CONCISE analysis for ${stockData.symbol}.

CURRENT DATA:
- Price: $${stockData.price}
- Change: ${stockData.changePercent}%
- Volume: ${stockData.volume}
- Beta: ${stockData.beta || 'N/A'}
- RSI: ${stockData.rsi || 'N/A'}
- Sector: ${stockData.sector || 'Unknown'}

USER PROFILE: ${riskProfile} risk tolerance

Provide in this EXACT format:

**RISK SCORE:** X/10
**RECOMMENDATION:** BUY/HOLD/SELL
**KEY INSIGHT:** [One sentence key insight]

**PRICE TARGETS (7 days):**
- Support: $X.XX
- Resistance: $X.XX
- Stop Loss: $X.XX

**MAIN RISKS:** [2-3 bullet points max]

Keep response under 150 words.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }]
  });

  return message.content[0].text;
}

// Comprehensive Analysis (detailed, multi-factor)
async function generateComprehensiveAnalysis(stockData, riskProfile, newsData) {
  const prompt = `You are a senior risk analyst at a top investment firm. Conduct a comprehensive risk analysis for ${stockData.symbol}.

## MARKET DATA:
- Current Price: $${stockData.price}
- Daily Change: ${stockData.changePercent}%
- Volume: ${stockData.volume} (vs avg: ${stockData.avgVolume || 'N/A'})
- High/Low: $${stockData.high}/$${stockData.low}
- Beta: ${stockData.beta || 'Calculating...'}
- RSI: ${stockData.rsi || 'Calculating...'}
- Market Cap: ${stockData.marketCap || 'N/A'}
- Sector: ${stockData.sector || 'Unknown'}
- Previous Close: $${stockData.previousClose}

## RISK PROFILE: ${riskProfile.toUpperCase()}

${newsData ? `## RECENT NEWS CONTEXT:\n${JSON.stringify(newsData, null, 2)}` : '## NEWS: No recent news data available'}

## ANALYSIS FRAMEWORK:
Provide a detailed analysis covering:

### 1. EXECUTIVE SUMMARY
- Overall risk score (1-10 scale)
- Primary recommendation (BUY/HOLD/SELL)
- Confidence level (0-100%)
- Key thesis in 2-3 sentences

### 2. TECHNICAL RISK ASSESSMENT
- Price momentum analysis
- Volume patterns and significance
- Support/resistance levels
- RSI interpretation and trend signals
- Beta analysis and market correlation

### 3. MULTI-TIMEFRAME PRICE TARGETS

**Short-term (1-7 days):**
- Conservative range (68% confidence): $X.XX - $X.XX
- Moderate range (90% confidence): $X.XX - $X.XX
- Extreme scenario (99% confidence): $X.XX - $X.XX

**Medium-term (1-4 weeks):**
- Conservative range (68% confidence): $X.XX - $X.XX
- Moderate range (90% confidence): $X.XX - $X.XX
- Extreme scenario (99% confidence): $X.XX - $X.XX

### 4. RISK FACTORS & CATALYSTS
**Upside Catalysts:**
- [List 2-3 potential positive drivers]

**Downside Risks:**
- [List 2-3 key risk factors]

**Black Swan Events:**
- [List 1-2 low-probability, high-impact risks]

### 5. POSITION MANAGEMENT
- Recommended position size (% of portfolio)
- Entry strategy and timing
- Stop-loss levels with rationale
- Take-profit targets
- Risk/reward ratio assessment

### 6. SECTOR & MARKET CONTEXT
- Sector performance and trends
- Market correlation analysis
- Relative strength vs benchmarks
- Economic sensitivity factors

### 7. MONITORING CHECKLIST
- Key metrics to watch daily
- Important upcoming events/dates
- Trigger points for position review

Provide specific numerical targets and actionable insights. Be precise, professional, and data-driven.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }]
  });

  return message.content[0].text;
}

// Portfolio Analysis (correlation and diversification)
async function generatePortfolioAnalysis(portfolioData, riskProfile) {
  if (!portfolioData || !Array.isArray(portfolioData)) {
    throw new Error('Valid portfolio data required for portfolio analysis');
  }

  const prompt = `You are a portfolio risk manager. Analyze this portfolio for diversification, correlation risks, and optimization opportunities.

## PORTFOLIO HOLDINGS:
${portfolioData.map(stock => `
- ${stock.symbol}: $${stock.price} (${stock.changePercent}%) - ${stock.sector} - Weight: ${stock.weight || 'N/A'}%
  Beta: ${stock.beta || 'N/A'} | RSI: ${stock.rsi || 'N/A'} | Volume: ${stock.volume}`).join('\n')}

## RISK PROFILE: ${riskProfile.toUpperCase()}

## COMPREHENSIVE PORTFOLIO ANALYSIS:

### 1. PORTFOLIO HEALTH SCORE
- Overall risk score (1-10)
- Diversification rating (A-F)
- Correlation risk level (Low/Medium/High)
- Sector concentration assessment

### 2. RISK DECOMPOSITION
**Systematic Risk:**
- Market beta and correlation
- Sector concentration analysis
- Geographic/style exposure

**Idiosyncratic Risk:**
- Company-specific risks
- Single-stock concentration
- Event risk assessment

### 3. CORRELATION MATRIX INSIGHTS
- Highly correlated pairs (risk clusters)
- Diversification effectiveness
- Hidden correlation risks
- Market stress scenario impact

### 4. SECTOR ANALYSIS
- Sector allocation vs benchmarks
- Over/under-weighted sectors
- Sector momentum and trends
- Recommended rebalancing

### 5. OPTIMIZATION RECOMMENDATIONS
**Immediate Actions:**
- Position size adjustments
- Risk reduction opportunities
- Hedging suggestions

**Strategic Improvements:**
- Asset class diversification
- Geographic diversification
- Alternative investment opportunities

### 6. RISK SCENARIOS
**Bull Market (+20%):** Expected portfolio performance
**Bear Market (-20%):** Downside protection analysis
**Sector Rotation:** Impact of style/sector shifts
**Interest Rate Shock:** Sensitivity analysis

### 7. REBALANCING PLAN
- Target allocations
- Trading priorities
- Tax considerations
- Implementation timeline

Provide specific, actionable recommendations with clear rationale.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }]
  });

  return message.content[0].text;
}

// Sentiment Analysis (news and market psychology)
async function generateSentimentAnalysis(stockData, newsData, riskProfile) {
  const prompt = `You are a market psychology expert specializing in sentiment analysis. Analyze ${stockData.symbol} combining technical data with news sentiment.

## STOCK DATA:
- Symbol: ${stockData.symbol}
- Price: $${stockData.price} (${stockData.changePercent}%)
- Volume: ${stockData.volume}
- Sector: ${stockData.sector}

## NEWS & SENTIMENT DATA:
${newsData ? JSON.stringify(newsData, null, 2) : 'No news data available - conduct analysis based on market behavior patterns'}

## SENTIMENT ANALYSIS FRAMEWORK:

### 1. SENTIMENT SCORE
- Overall sentiment: [Bullish/Neutral/Bearish] (Score: X/10)
- Sentiment trend: [Improving/Stable/Deteriorating]
- Sentiment reliability: [High/Medium/Low confidence]

### 2. NEWS IMPACT ANALYSIS
- Headline sentiment classification
- Key narrative themes
- Sentiment vs price action divergence
- Social media/retail sentiment indicators

### 3. MARKET PSYCHOLOGY FACTORS
- Fear vs Greed indicators
- Institutional vs retail sentiment
- Options flow sentiment signals
- Insider trading patterns (if available)

### 4. CONTRARIAN OPPORTUNITIES
- Oversold/overbought sentiment levels
- Sentiment extremes and reversal signals
- Market overreaction opportunities
- Value vs momentum sentiment disconnect

### 5. SENTIMENT-DRIVEN PRICE TARGETS
- Sentiment-supported upside: $X.XX
- Sentiment floor/support: $X.XX
- Panic selling potential: $X.XX
- FOMO buying ceiling: $X.XX

### 6. RISK ASSESSMENT
- Sentiment volatility risk
- News flow sensitivity
- Event-driven sentiment risks
- Crowd psychology pitfalls

### 7. TRADING IMPLICATIONS
- Sentiment timing opportunities
- Risk management for sentiment trades
- Position sizing based on conviction
- Exit strategies for sentiment shifts

Integrate sentiment analysis with technical factors for holistic view.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }]
  });

  return message.content[0].text;
}

// Fallback analysis when Claude API is unavailable
function generateFallbackAnalysis(stockData) {
  const price = parseFloat(stockData.price);
  const change = parseFloat(stockData.changePercent);
  const rsi = parseFloat(stockData.rsi) || 50;
  const beta = parseFloat(stockData.beta) || 1.0;

  // Simple rule-based analysis
  let riskScore = 5; // Default medium risk
  let recommendation = 'HOLD';

  // Adjust based on change
  if (change > 5) riskScore += 2;
  else if (change > 2) riskScore += 1;
  else if (change < -5) riskScore += 3;
  else if (change < -2) riskScore += 1;

  // Adjust based on RSI
  if (rsi > 70) riskScore += 1;
  else if (rsi < 30) riskScore -= 1;

  // Adjust based on Beta
  if (beta > 1.5) riskScore += 1;
  else if (beta < 0.5) riskScore -= 1;

  // Cap risk score
  riskScore = Math.max(1, Math.min(10, riskScore));

  // Generate recommendation
  if (riskScore <= 3 && change > 0) recommendation = 'BUY';
  else if (riskScore >= 7) recommendation = 'SELL';

  return `**AUTOMATED ANALYSIS** (AI temporarily unavailable)

**RISK SCORE:** ${riskScore}/10
**RECOMMENDATION:** ${recommendation}
**CONFIDENCE:** Medium

**PRICE TARGETS (7 days):**
- Support: $${(price * 0.95).toFixed(2)}
- Resistance: $${(price * 1.05).toFixed(2)}
- Stop Loss: $${(price * 0.92).toFixed(2)}

**KEY FACTORS:**
- Daily change: ${change}%
- RSI level: ${rsi}
- Beta: ${beta}

*This is a basic analysis. Full AI analysis will resume shortly.*`;
}

// Utility functions
function generateCacheKey(stockData, analysisType, riskProfile) {
  const timestamp = Math.floor(Date.now() / CACHE_DURATION);
  return `${stockData.symbol}-${analysisType}-${riskProfile}-${timestamp}`;
}

function getFromCache(key) {
  const cached = analysisCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  analysisCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Clean old cache entries
  if (analysisCache.size > 100) {
    const oldestKey = analysisCache.keys().next().value;
    analysisCache.delete(oldestKey);
  }
}
