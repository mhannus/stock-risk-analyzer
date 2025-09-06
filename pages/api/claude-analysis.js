import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  if (!process.env.CLAUDE_API_KEY) {
    return res.status(500).json({ 
      analysis: '**Configuration Error**\n\nClaude API key not found. Please add CLAUDE_API_KEY to your environment variables.',
      fallback: true,
      error: 'API key not configured',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { stockData, analysisType = 'quick', userRiskProfile = 'moderate' } = req.body;

    if (!stockData || !stockData.symbol) {
      return res.status(400).json({ error: 'Stock data with symbol is required' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    const prompt = `You are a professional risk analyst. Provide a CONCISE analysis for ${stockData.symbol}.

CURRENT DATA:
- Price: $${stockData.price}
- Change: ${stockData.changePercent}%
- Volume: ${stockData.volume}
- Sector: ${stockData.sector}

USER PROFILE: ${userRiskProfile} risk tolerance

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

    res.status(200).json({ 
      analysis: message.content[0].text,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claude API error:', error);
    
    // Provide fallback analysis
    const price = parseFloat(stockData?.price || 100);
    const change = parseFloat(stockData?.changePercent || 0);
    
    let riskScore = 5;
    let recommendation = 'HOLD';
    
    if (change > 2) { riskScore = 4; recommendation = 'BUY'; }
    else if (change < -2) { riskScore = 7; recommendation = 'SELL'; }
    
    const fallbackAnalysis = `**AUTOMATED ANALYSIS** (AI temporarily unavailable)

**RISK SCORE:** ${riskScore}/10
**RECOMMENDATION:** ${recommendation}
**KEY INSIGHT:** Based on current price action and volatility patterns.

**PRICE TARGETS (7 days):**
- Support: $${(price * 0.95).toFixed(2)}
- Resistance: $${(price * 1.05).toFixed(2)}
- Stop Loss: $${(price * 0.92).toFixed(2)}

**MAIN RISKS:**
- Market volatility uncertainty
- Technical indicator mixed signals
- Sector correlation risks

*AI analysis will resume once API connection is restored.*`;
    
    res.status(200).json({ 
      analysis: fallbackAnalysis,
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
