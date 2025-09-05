// Serverless function for fetching stock data via Finnhub API
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  // Your Finnhub API key
  const FINNHUB_API_KEY = 'd2tir69r01qr5a72r5d0d2tir69r01qr5a72r5dg';
  
  try {
    // Fetch basic quote data
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    const quoteData = await quoteResponse.json();

    // Fetch company profile
    const profileResponse = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    const profileData = await profileResponse.json();

    // Calculate technical indicators (simplified versions)
    const currentPrice = quoteData.c || 0;
    const previousClose = quoteData.pc || currentPrice;
    const dailyChange = currentPrice - previousClose;
    const dailyChangePercent = previousClose ? ((dailyChange / previousClose) * 100) : 0;
    
    // Generate mock technical data (in production, you'd calculate these properly)
    const volatility = Math.abs(dailyChangePercent) * 3 + Math.random() * 15 + 10;
    const rsi = 30 + Math.random() * 40; // Mock RSI between 30-70
    const beta = 0.5 + Math.random() * 2; // Mock beta between 0.5-2.5
    
    // Calculate risk score based on volatility, price change, and other factors
    let riskScore = Math.min(100, Math.max(0, 
      (volatility * 1.5) + 
      (Math.abs(dailyChangePercent) * 2) + 
      (Math.abs(rsi - 50) * 0.8) +
      (Math.abs(beta - 1) * 10)
    ));
    
    // Calculate risk ranges
    const shortTermLow = currentPrice * (1 - (volatility / 100) * 0.8);
    const shortTermHigh = currentPrice * (1 + (volatility / 100) * 0.8);
    const mediumTermLow = currentPrice * (1 - (volatility / 100) * 1.5);
    const mediumTermHigh = currentPrice * (1 + (volatility / 100) * 1.5);

    const stockData = {
      symbol: symbol.toUpperCase(),
      companyName: profileData.name || symbol.toUpperCase(),
      price: currentPrice.toFixed(2),
      dailyChange: dailyChange.toFixed(2),
      dailyChangePercent: dailyChangePercent.toFixed(2),
      volatility: volatility.toFixed(1),
      rsi: rsi.toFixed(1),
      beta: beta.toFixed(2),
      riskScore: Math.round(riskScore),
      shortTermLow: shortTermLow.toFixed(2),
      shortTermHigh: shortTermHigh.toFixed(2),
      mediumTermLow: mediumTermLow.toFixed(2),
      mediumTermHigh: mediumTermHigh.toFixed(2),
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(stockData);
    
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      details: error.message 
    });
  }
}
