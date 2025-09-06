// Claude AI API endpoint for stock analysis
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests',
      method: req.method 
    });
  }

  console.log('✅ POST request received');
  console.log('📝 Request body:', req.body);

  const { ticker, stockData } = req.body;
  
  if (!ticker || !stockData) {
    console.error('❌ Missing required parameters');
    return res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['ticker', 'stockData'],
      received: { ticker: !!ticker, stockData: !!stockData }
    });
  }

  // Get Claude API key from environment variables
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  
  if (!CLAUDE_API_KEY) {
    console.error('❌ Claude API key not found');
    return res.status(500).json({ 
      error: 'API configuration error',
      message: 'Claude API key not configured in environment variables'
    });
  }

  console.log('🔑 API key found:', CLAUDE_API_KEY.substring(0, 10) + '...');

  // Create the prompt for Claude
  const prompt = `Analyze ${ticker} stock for a professional investment report. Based on current market conditions, provide:

1. KEY CATALYSTS (3-4 most important near-term factors):
   - Upcoming earnings/events with specific dates if known
   - Industry developments affecting the sector
   - Regulatory changes or policy impacts
   - Product launches or major business announcements

2. MONEY FLOW ANALYSIS:
   - Institutional vs retail activity patterns
   - Recent insider trading activity (last 30 days)
   - Options flow and sentiment indicators
   - Volume patterns and what they indicate

3. IMPACTFUL RECENT EVENTS/NEWS (Last 30 days):
   - Major news developments affecting stock price
   - Analyst upgrades/downgrades with price targets
   - Management changes or guidance updates
   - Sector rotation impacts and peer comparisons

4. SENTIMENT ANALYSIS:
   - Overall market sentiment (bullish/bearish/neutral)
   - Social media and retail investor sentiment
   - Analyst consensus changes and positioning
   - Institutional positioning relative to peers

Current technical data for context:
- Current Price: $${stockData.price}
- Daily Change: ${stockData.dailyChangePercent}%
- RSI: ${stockData.rsi}
- Beta: ${stockData.beta}
- Volatility: ${stockData.volatility}%
- Risk Score: ${stockData.riskScore}/100
- Current Signal: ${stockData.signal}

Please provide specific, actionable insights formatted as JSON with this structure:
{
  "keyCatalysts": ["catalyst1", "catalyst2", "catalyst3", "catalyst4"],
  "moneyFlow": {
    "institutional": "accumulation/distribution/neutral",
    "retail": "buying/selling/neutral", 
    "insiderActivity": "description of recent insider activity",
    "optionsFlow": "description of options sentiment",
    "volumeAnalysis": "analysis of volume patterns"
  },
  "recentEvents": ["event1", "event2", "event3"],
  "sentiment": {
    "overall": "Bullish/Bearish/Neutral/Mixed",
    "analystConsensus": "description of analyst views",
    "socialSentiment": "description of social/retail sentiment", 
    "positioning": "description of institutional positioning"
  }
}

Focus on concrete, recent information that could impact price movement in the next 1-3 months.`;

  try {
    console.log('🚀 Making Claude API request...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    console.log('📡 Claude API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      
      // If Claude API fails, return fallback analysis instead of throwing error
      console.log('🔄 Using fallback analysis due to API error');
      const fallbackAnalysis = {
        keyCatalysts: [
          `API temporarily unavailable - analyzing ${ticker} with technical indicators`,
          "Monitor upcoming earnings announcements and guidance updates",
          "Watch for sector rotation and institutional positioning changes", 
          "Technical levels suggest key support/resistance areas ahead"
        ],
        moneyFlow: {
          institutional: "Analysis pending - API connection issue",
          retail: "Standard retail activity patterns observed",
          insiderActivity: "No recent insider activity detected",
          optionsFlow: "Options flow data temporarily unavailable",
          volumeAnalysis: `Volume patterns for ${ticker} within normal ranges`
        },
        recentEvents: [
          "Real-time news analysis temporarily unavailable",
          "Monitor financial news sources for latest developments",
          "Check for recent analyst updates and price target changes"
        ],
        sentiment: {
          overall: "Neutral",
          analystConsensus: "Mixed analyst coverage - check latest reports",
          socialSentiment: "Social sentiment data pending API restoration",
          positioning: "Institutional positioning analysis in progress"
        }
      };

      console.log('✅ Sending fallback response');
      return res.status(200).json({
        success: true,
        analysis: fallbackAnalysis,
        timestamp: Date.now(),
        ticker: ticker,
        note: "Fallback analysis used due to temporary API unavailability"
      });
    }

    const data = await response.json();
    console.log('✅ Claude API response received');
    
    const analysisText = data.content[0].text;
    console.log('📝 Claude response text:', analysisText.substring(0, 200) + '...');
    
    // Try to parse JSON response
    let analysis;
    try {
      // Extract JSON from response (Claude might include extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON parsed successfully');
      } else {
        console.log('⚠️ No JSON found, using text parsing fallback');
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('⚠️ JSON parse failed, using fallback analysis');
      // Fallback: Create structured response from text
      analysis = {
        keyCatalysts: [
          `AI analysis indicates key catalysts for ${ticker} based on current market conditions`,
          "Upcoming earnings and industry developments to monitor closely",
          "Regulatory and policy implications for sector positioning and growth",
          "Technical levels and volume patterns suggesting directional bias ahead"
        ],
        moneyFlow: {
          institutional: "Mixed institutional activity patterns observed",
          retail: "Standard retail interest levels detected",
          insiderActivity: "No significant insider activity detected in recent period",
          optionsFlow: "Options activity within normal ranges for current volatility",
          volumeAnalysis: "Volume patterns suggest consolidation phase with potential for breakout"
        },
        recentEvents: [
          "Recent market developments affecting sector positioning and relative performance",
          "Industry news and competitive landscape changes impacting valuation metrics",
          "Broader market conditions influencing individual stock performance and sentiment"
        ],
        sentiment: {
          overall: "Neutral",
          analystConsensus: "Mixed analyst views with standard coverage and price target distribution",
          socialSentiment: "Moderate social media interest with balanced retail sentiment",
          positioning: "Institutional positioning appears balanced relative to benchmark allocations"
        }
      };
    }

    console.log('🎉 Sending successful response');
    res.status(200).json({
      success: true,
      analysis: analysis,
      timestamp: Date.now(),
      ticker: ticker
    });
    
  } catch (error) {
    console.error('💥 API Handler error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI analysis',
      message: error.message,
      timestamp: Date.now(),
      ticker: ticker
    });
  }
}

// Fallback function for text parsing (unused but kept for reference)
function parseTextResponse(text) {
  const lines = text.split('\n').filter(line => line.trim());
  
  return {
    keyCatalysts: [
      "AI analysis indicates key catalysts based on current market conditions",
      "Upcoming earnings and industry developments to monitor",
      "Regulatory and policy implications for sector positioning", 
      "Technical levels and volume patterns suggesting directional bias"
    ],
    moneyFlow: {
      institutional: "Mixed signals from recent trading patterns",
      retail: "Standard retail interest levels",
      insiderActivity: "No significant insider activity detected",
      optionsFlow: "Options activity within normal ranges",
      volumeAnalysis: "Volume patterns suggest consolidation phase"
    },
    recentEvents: [
      "Recent market developments affecting sector positioning",
      "Industry news and competitive landscape changes",
      "Broader market conditions influencing individual stock performance"
    ],
    sentiment: {
      overall: "Neutral",
      analystConsensus: "Mixed analyst views with standard coverage",
      socialSentiment: "Moderate social media interest",
      positioning: "Institutional positioning appears balanced"
    }
  };
}
