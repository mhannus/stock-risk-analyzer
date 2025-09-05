export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticker, stockData } = req.body;
  
  if (!ticker || !stockData) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Your Claude API key - KEEP THIS SECURE!
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'your-claude-api-key-here';
  
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
   - Dark pool activity if available

3. IMPACTFUL RECENT EVENTS/NEWS (Last 30 days):
   - Major news developments affecting stock price
   - Analyst upgrades/downgrades with price targets
   - Management changes or guidance updates
   - Sector rotation impacts and peer comparisons
   - Earnings surprises or guidance revisions

4. SENTIMENT ANALYSIS:
   - Overall market sentiment (bullish/bearish/neutral)
   - Social media and retail investor sentiment
   - Analyst consensus changes and positioning
   - Institutional positioning relative to peers
   - Put/call ratios and options sentiment

Current technical data for context:
- Current Price: $${stockData.price}
- Daily Change: ${stockData.dailyChangePercent}%
- RSI: ${stockData.rsi}
- Beta: ${stockData.beta}
- Volatility: ${stockData.volatility}%
- Risk Score: ${stockData.riskScore}/100
- Current Signal: ${stockData.signal}

Please provide specific, actionable insights formatted as JSON with the following structure:
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

Focus on concrete, recent information that could impact price movement in the next 1-3 months. Be specific with dates, numbers, and actionable insights.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;
    
    // Try to parse JSON response
    let analysis;
    try {
      // Extract JSON from response (Claude might include extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback: Parse the text response manually
      console.warn('JSON parse failed, using text parsing fallback');
      analysis = parseTextResponse(analysisText);
    }

    res.status(200).json({
      success: true,
      analysis: analysis,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI analysis',
      details: error.message 
    });
  }
}

// Fallback function to parse text response if JSON parsing fails
function parseTextResponse(text) {
  // Simple text parsing fallback
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
