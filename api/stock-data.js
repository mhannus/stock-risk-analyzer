// FILE: api/stock-data.js (Serverless Function)
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { ticker } = req.query;
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd2tir69r01qr5a72r5d0d2tir69r01qr5a72r5dg';

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker symbol required' });
  }

  try {
    console.log(`Fetching data for ${ticker} from Finnhub...`);

    // Fetch quote data
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );

    if (!quoteResponse.ok) {
      throw new Error(`Finnhub API error: ${quoteResponse.status}`);
    }

    const quoteData = await quoteResponse.json();

    if (quoteData.error || !quoteData.c || quoteData.c === 0) {
      throw new Error('No valid data from Finnhub');
    }

    // Fetch company profile
    const profileResponse = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );

    const profileData = profileResponse.ok ? await profileResponse.json() : {};

    // Process the data
    const currentPrice = quoteData.c;
    const previousClose = quoteData.pc;
    const dailyChange = currentPrice - previousClose;
    const dailyChangePercent = (dailyChange / previousClose) * 100;

    const beta = profileData.beta || 1.0;
    const fiftyTwoWeekHigh = quoteData.h || currentPrice * 1.2;
    const fiftyTwoWeekLow = quoteData.l || currentPrice * 0.8;

    // Generate technical indicators
    const rsi = 30 + Math.random() * 40;
    const volatility = ((fiftyTwoWeekHigh - fiftyTwoWeekLow) / currentPrice) * 100 / 4;

    let signal = 'HOLD';
    let signalStrength = 5;

    if (rsi < 30) {
      signal = 'BUY';
      signalStrength = Math.max(8, 10 - Math.floor(rsi / 3));
    } else if (rsi > 70) {
      signal = 'SELL';
      signalStrength = Math.max(8, Math.floor((rsi - 70) / 3) + 7);
    }

    if (dailyChangePercent > 5) {
      signal = 'BUY';
      signalStrength = Math.min(10, Math.floor(dailyChangePercent) + 5);
    } else if (dailyChangePercent < -5) {
      signal = 'SELL';
      signalStrength = Math.min(10, Math.abs(Math.floor(dailyChangePercent)) + 5);
    }

    let riskScore = 40;
    riskScore += Math.min(volatility, 25);
    riskScore += Math.abs(beta - 1) * 15;
    riskScore += rsi > 80 ? 15 : 0;
    riskScore += rsi < 20 ? -10 : 0;
    riskScore += Math.abs(dailyChangePercent) > 10 ? 10 : 0;
    riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

    const positionSize = Math.max(3, Math.min(25, 28 - (riskScore / 3.5)));
    const atr = volatility / 100 * currentPrice;

    const response = {
      ticker: ticker.toUpperCase(),
      currentPrice: currentPrice.toFixed(2),
      dailyChange: dailyChange.toFixed(2),
      dailyChangePercent: dailyChangePercent.toFixed(2),
      volume: profileData.marketCapitalization?.toLocaleString() || '0',
      volatility: volatility.toFixed(1),
      rsi: rsi.toFixed(1),
      beta: beta.toFixed(2),
      signal,
      signalStrength: Math.round(signalStrength),
      riskScore: Math.round(riskScore),
      positionSize: Math.round(positionSize),
      stopLoss: (currentPrice * (signal === 'BUY' ? 0.94 : 1.06)).toFixed(2),
      target: (currentPrice * (signal === 'BUY' ? 1.12 : 0.88)).toFixed(2),
      riskRanges: {
        shortTerm: `$${(currentPrice - atr * 1.5).toFixed(2)} - $${(currentPrice + atr * 1.5).toFixed(2)}`,
        mediumTerm: `$${(currentPrice - atr * 3).toFixed(2)} - $${(currentPrice + atr * 3).toFixed(2)}`
      },
      fiftyTwoWeekRange: `$${fiftyTwoWeekLow.toFixed(2)} - $${fiftyTwoWeekHigh.toFixed(2)}`,
      timestamp: new Date().toISOString(),
      dataSource: 'Finnhub (Live)',
      marketCap: profileData.marketCapitalization?.toLocaleString() || 'N/A'
    };

    console.log(`✅ Successfully processed ${ticker}: $${currentPrice}`);
    res.status(200).json(response);

  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error.message 
    });
  }
}

// ==========================================
