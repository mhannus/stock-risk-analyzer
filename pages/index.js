import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Download, RefreshCw, TrendingUp, AlertTriangle, DollarSign, Activity, Play, Clock, TrendingDown, Trash2, FileText } from 'lucide-react';

// Simple, reliable tooltip component
const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded whitespace-nowrap"
          style={{ 
            zIndex: 10000,
            maxWidth: '300px',
            whiteSpace: 'normal'
          }}
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  );
};

export default function StockAnalyzer() {
  const [stocks, setStocks] = useState(['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']);
  const [newStock, setNewStock] = useState('');
  const [analysisData, setAnalysisData] = useState({});
  const [loading, setLoading] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [fullReportContent, setFullReportContent] = useState(null);
  const [selectedStock, setSelectedStock] = useState('');
  const [aiLoading, setAiLoading] = useState({});
  const [aiCache, setAiCache] = useState({});

  // Enhanced signal strength model with independent risk ranges
  const calculateSignalStrength = (stockData) => {
    const price = parseFloat(stockData.price);
    const volume = stockData.volume || 1000000; // Default if not available
    const volatility = parseFloat(stockData.volatility);
    const rsi = parseFloat(stockData.rsi);
    const beta = parseFloat(stockData.beta);
    
    // 1. VOLUME ANALYSIS - Compare current vs average
    const avgVolume = volume; // In real implementation, this would be 20-day average
    const volumeRatio = volume / avgVolume;
    const volumeStrength = Math.min(volumeRatio * 50, 100); // Scale to 0-100
    
    // 2. VOLATILITY NORMALIZATION - Account for regime changes
    const volRegime = volatility > 30 ? 'HIGH' : volatility > 15 ? 'NORMAL' : 'LOW';
    const volAdjustment = volRegime === 'HIGH' ? 1.5 : volRegime === 'LOW' ? 0.7 : 1.0;
    
    // 3. PRICE ACTION STRENGTH - Momentum and trend
    const momentumScore = Math.abs(parseFloat(stockData.dailyChangePercent));
    const trendStrength = rsi > 70 ? 'STRONG_UP' : rsi < 30 ? 'STRONG_DOWN' : 'NEUTRAL';
    
    // 4. CALCULATE INDEPENDENT RANGES using market structure
    // These ranges are NOT centered on current price
    const baseRange = volatility * volAdjustment;
    
    // Trade Range (1-4 weeks) - Based on technical levels
    const shortTermSupport = price * (1 - (baseRange * 0.008)); // ~0.8% per 10 vol points
    const shortTermResistance = price * (1 + (baseRange * 0.012)); // ~1.2% per 10 vol points
    
    // Trend Range (1-3 months) - Based on fundamental volatility
    const mediumTermSupport = price * (1 - (baseRange * 0.015)); // ~1.5% per 10 vol points  
    const mediumTermResistance = price * (1 + (baseRange * 0.020)); // ~2.0% per 10 vol points
    
    // 5. SIGNAL STRENGTH CALCULATION (0-100)
    const signalComponents = {
      volume: volumeStrength * 0.3,           // 30% weight
      momentum: momentumScore * 2 * 0.25,     // 25% weight  
      volatility: (100 - volatility) * 0.2,  // 20% weight (lower vol = higher signal)
      trend: rsi > 50 ? (rsi - 50) : (50 - rsi) * 0.25 // 25% weight
    };
    
    const totalSignalStrength = Math.min(
      Object.values(signalComponents).reduce((sum, val) => sum + val, 0), 
      100
    );
    
    // 6. POSITION WITHIN RANGE ANALYSIS
    const shortRangeSize = shortTermResistance - shortTermSupport;
    const positionInShortRange = (price - shortTermSupport) / shortRangeSize;
    
    let positionAnalysis = '';
    if (positionInShortRange < 0.2) {
      positionAnalysis = 'LOWER_RANGE - Near support levels';
    } else if (positionInShortRange > 0.8) {
      positionAnalysis = 'UPPER_RANGE - Near resistance levels';  
    } else {
      positionAnalysis = 'MID_RANGE - Balanced positioning';
    }
    
    // 7. RISK ASSESSMENT
    const riskScore = Math.min(100, Math.max(0,
      (volatility * 1.2) +                    // Base volatility risk
      (beta > 1.5 ? 20 : beta < 0.8 ? -10 : 0) + // Beta adjustment
      (momentumScore > 5 ? 15 : 0) +          // High momentum risk
      (volumeRatio < 0.5 ? 10 : 0) +         // Low volume risk
      (Math.abs(rsi - 50) * 0.4)             // Extreme RSI risk
    ));
    
    return {
      signalStrength: Math.round(totalSignalStrength),
      shortTermLow: shortTermSupport.toFixed(2),
      shortTermHigh: shortTermResistance.toFixed(2),
      mediumTermLow: mediumTermSupport.toFixed(2), 
      mediumTermHigh: mediumTermResistance.toFixed(2),
      positionAnalysis: positionAnalysis,
      positionInRange: (positionInShortRange * 100).toFixed(1),
      volumeStrength: Math.round(volumeStrength),
      volRegime: volRegime,
      riskScore: Math.round(riskScore),
      signalComponents: {
        volume: Math.round(signalComponents.volume),
        momentum: Math.round(signalComponents.momentum),
        volatility: Math.round(signalComponents.volatility),
        trend: Math.round(signalComponents.trend)
      }
    };
  };

  // Enhanced mock data generator with signal strength model
  const getMockData = (ticker) => {
    const basePrice = Math.random() * 500 + 50;
    const change = (Math.random() - 0.5) * 20;
    const changePercent = (change / basePrice) * 100;
    const rsi = Math.random() * 100;
    const beta = Math.random() * 3;
    const volatility = Math.random() * 50 + 10;
    const volume = Math.floor(Math.random() * 5000000) + 500000; // Random volume
    
    // Create base stock data
    const stockData = {
      symbol: ticker,
      companyName: `${ticker} Corp`,
      price: basePrice.toFixed(2),
      dailyChange: change.toFixed(2),
      dailyChangePercent: changePercent.toFixed(2),
      volatility: volatility.toFixed(1),
      rsi: rsi.toFixed(1),
      beta: beta.toFixed(2),
      volume: volume,
      lastUpdated: new Date().toISOString()
    };
    
    // Apply signal strength model
    const signalAnalysis = calculateSignalStrength(stockData);
    
    // Generate signal based on signal strength and position
    let signal = 'HOLD';
    if (signalAnalysis.signalStrength > 70 && signalAnalysis.positionInRange < 30) {
      signal = 'BUY';
    } else if (signalAnalysis.signalStrength > 70 && signalAnalysis.positionInRange > 70) {
      signal = 'SELL';
    } else if (signalAnalysis.signalStrength < 30) {
      signal = 'HOLD';
    }
    
    return {
      ...stockData,
      ...signalAnalysis,
      signal: signal
    };
  };

  // Fetch stock data from our API
  const fetchStockData = async (symbol) => {
    try {
      const response = await fetch(`/api/stock-data?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      // Return mock data as fallback
      return getMockData(symbol);
    }
  };

  // Run analysis for a single stock
  const runAnalysis = async (ticker) => {
    setLoading(prev => ({ ...prev, [ticker]: true }));
    
    try {
      const stockData = await fetchStockData(ticker);
      
      // Add signal generation based on signal strength model
      const signalAnalysis = calculateSignalStrength(stockData);
      
      // Enhanced signal logic based on Hedgeye methodology
      let signal = 'HOLD';
      const signalStrength = signalAnalysis.signalStrength;
      const positionInRange = parseFloat(signalAnalysis.positionInRange);
      
      if (signalStrength > 65) {
        // High signal strength
        if (positionInRange < 25) {
          signal = 'BUY';  // Strong signal + low in range = buy
        } else if (positionInRange > 75) {
          signal = 'SELL'; // Strong signal + high in range = sell
        } else {
          signal = 'HOLD'; // Strong signal but mid-range = hold
        }
      } else if (signalStrength > 35) {
        // Medium signal strength - more conservative
        if (positionInRange < 15) {
          signal = 'BUY';  // Only buy at extreme low of range
        } else if (positionInRange > 85) {
          signal = 'SELL'; // Only sell at extreme high of range
        } else {
          signal = 'HOLD';
        }
      } else {
        // Low signal strength - hold only
        signal = 'HOLD';
      }
      
      // Merge signal analysis into stock data
      Object.assign(stockData, signalAnalysis);
      stockData.signal = signal;
      
      setAnalysisData(prev => ({
        ...prev,
        [ticker]: stockData
      }));
      
    } catch (error) {
      console.error(`Analysis failed for ${ticker}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [ticker]: false }));
      setLastUpdate(new Date());
    }
  };

  // Run analysis for all stocks
  const runPreMarketAnalysis = async () => {
    for (const ticker of stocks) {
      await runAnalysis(ticker);
    }
  };

  // Query Claude AI for enhanced analysis with better debugging
  const getAIAnalysis = async (ticker, stockData) => {
    console.log('🤖 Starting AI analysis for:', ticker);
    
    // Check cache first (1 hour expiry)
    if (aiCache[ticker] && Date.now() - aiCache[ticker].timestamp < 3600000) {
      console.log('📦 Using cached AI data for:', ticker);
      return aiCache[ticker].analysis;
    }

    setAiLoading(prev => ({ ...prev, [ticker]: true }));

    try {
      console.log('🌐 Making API call to /api/claude-analysis');
      console.log('📊 Stock data being sent:', stockData);
      
      const response = await fetch('/api/claude-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          stockData
        })
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response data:', data);
      
      if (data.success && data.analysis) {
        console.log('🎉 AI analysis successful for:', ticker);
        // Cache the successful response
        setAiCache(prev => ({
          ...prev,
          [ticker]: {
            analysis: data.analysis,
            timestamp: Date.now()
          }
        }));

        setAiLoading(prev => ({ ...prev, [ticker]: false }));
        return data.analysis;
      } else {
        console.error('❌ Invalid response format:', data);
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('💥 AI Analysis error:', error);
      setAiLoading(prev => ({ ...prev, [ticker]: false }));
      
      // Show user-friendly error in the UI
      const errorAnalysis = {
        keyCatalysts: [
          `⚠️ AI analysis failed for ${ticker}: ${error.message}`,
          "Please check browser console for detailed error information",
          "Verify API key is correctly set in Vercel environment variables",
          "Ensure claude-analysis.js endpoint is properly deployed"
        ],
        moneyFlow: {
          institutional: "AI analysis unavailable",
          retail: "Please check API configuration",
          insiderActivity: "Error connecting to Claude AI",
          optionsFlow: "API response failed",
          volumeAnalysis: `Unable to analyze ${ticker} with AI`
        },
        recentEvents: [
          "AI service temporarily unavailable",
          "Check API key configuration in Vercel dashboard",
          "Verify network connectivity and API endpoint deployment"
        ],
        sentiment: {
          overall: "Error",
          analystConsensus: "AI analysis failed - check console for details",
          socialSentiment: "Unable to connect to Claude AI service",
          positioning: "API configuration may need review"
        }
      };
      
      return errorAnalysis;
    }
  };

  // Generate AI-enhanced report
  const generateAIReport = async (ticker, data) => {
    console.log('🔄 generateAIReport called for:', ticker);
    
    const currentDate = new Date().toLocaleDateString();
    const rsiCondition = data.rsi > 70 ? 'Overbought' : data.rsi < 30 ? 'Oversold' : 'Neutral';
    const riskLevel = data.riskScore > 70 ? 'HIGH' : data.riskScore > 40 ? 'MODERATE' : 'LOW';

    console.log('🧠 About to call getAIAnalysis...');
    // Get AI analysis
    const aiAnalysis = await getAIAnalysis(ticker, data);
    console.log('🎉 getAIAnalysis completed, result:', aiAnalysis);

    const aiSection = aiAnalysis ? `
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">🤖 AI Market Intelligence</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <h3 style="color: #6f42c1; margin: 10px 0; font-size: 16px;">🎯 Key Catalysts</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #333;">
                ${aiAnalysis.keyCatalysts.map(catalyst => `<li style="margin: 8px 0;">${catalyst}</li>`).join('')}
              </ul>
            </div>
            
            <div>
              <h3 style="color: #6f42c1; margin: 10px 0; font-size: 16px;">💰 Money Flow Analysis</h3>
              <div style="font-size: 14px; color: #333;">
                <p style="margin: 5px 0;"><strong>Institutional:</strong> ${aiAnalysis.moneyFlow.institutional}</p>
                <p style="margin: 5px 0;"><strong>Retail:</strong> ${aiAnalysis.moneyFlow.retail}</p>
                <p style="margin: 5px 0;"><strong>Options Flow:</strong> ${aiAnalysis.moneyFlow.optionsFlow}</p>
              </div>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <h3 style="color: #6f42c1; margin: 0 0 10px 0; font-size: 16px;">📰 Recent Events</h3>
            <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px;">
              ${aiAnalysis.recentEvents.map(event => `<li style="margin: 5px 0;">${event}</li>`).join('')}
            </ul>
          </div>

          <div style="background: ${aiAnalysis.sentiment.overall === 'Bullish' ? '#d4edda' : aiAnalysis.sentiment.overall === 'Bearish' ? '#f8d7da' : '#fff3cd'}; padding: 15px; border-radius: 6px; border-left: 4px solid ${aiAnalysis.sentiment.overall === 'Bullish' ? '#28a745' : aiAnalysis.sentiment.overall === 'Bearish' ? '#dc3545' : '#ffc107'};">
            <h3 style="color: ${aiAnalysis.sentiment.overall === 'Bullish' ? '#155724' : aiAnalysis.sentiment.overall === 'Bearish' ? '#721c24' : '#856404'}; margin: 0 0 10px 0; font-size: 16px;">📊 Market Sentiment: ${aiAnalysis.sentiment.overall}</h3>
            <div style="font-size: 14px; color: ${aiAnalysis.sentiment.overall === 'Bullish' ? '#155724' : aiAnalysis.sentiment.overall === 'Bearish' ? '#721c24' : '#856404'};">
              <p style="margin: 5px 0;">${aiAnalysis.sentiment.analystConsensus}</p>
              <p style="margin: 5px 0;">${aiAnalysis.sentiment.socialSentiment}</p>
            </div>
          </div>
        </div>
    ` : '';

    const signalStrengthSection = `
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">📊 Signal Strength Analysis</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <h3 style="color: #6f42c1; margin: 10px 0; font-size: 16px;">Signal Components</h3>
              <div style="font-size: 14px; color: #333;">
                <p style="margin: 5px 0;"><strong>Volume:</strong> ${data.signalComponents?.volume || 'N/A'}/30</p>
                <p style="margin: 5px 0;"><strong>Momentum:</strong> ${data.signalComponents?.momentum || 'N/A'}/25</p>
                <p style="margin: 5px 0;"><strong>Volatility:</strong> ${data.signalComponents?.volatility || 'N/A'}/20</p>
                <p style="margin: 5px 0;"><strong>Trend:</strong> ${data.signalComponents?.trend || 'N/A'}/25</p>
              </div>
            </div>
            
            <div>
              <h3 style="color: #6f42c1; margin: 10px 0; font-size: 16px;">Position Analysis</h3>
              <div style="font-size: 14px; color: #333;">
                <p style="margin: 5px 0;"><strong>Signal Strength:</strong> ${data.signalStrength || 'N/A'}/100</p>
                <p style="margin: 5px 0;"><strong>Range Position:</strong> ${data.positionInRange || 'N/A'}%</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${data.positionAnalysis || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Vol Regime:</strong> ${data.volRegime || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
    `;

    console.log('📝 Building HTML report...');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${ticker} - AI-Enhanced Signal Strength Analysis</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Generated on ${currentDate} • Powered by Hedgeye-Style Model + Claude AI</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #333;">$${data.price}</div>
            <div style="color: #666; margin-top: 5px;">Current Price</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${data.signalStrength > 65 ? '#28a745' : data.signalStrength > 35 ? '#ffc107' : '#dc3545'};">
              ${data.signalStrength || 'N/A'}/100
            </div>
            <div style="color: #666; margin-top: 5px;">Signal Strength</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${data.signal === 'BUY' ? '#28a745' : data.signal === 'SELL' ? '#dc3545' : '#ffc107'};">
              ${data.signal}
            </div>
            <div style="color: #666; margin-top: 5px;">Signal</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">
              ${data.positionInRange || 'N/A'}%
            </div>
            <div style="color: #666; margin-top: 5px;">Range Position</div>
          </div>
        </div>

        ${signalStrengthSection}
        ${aiSection}

        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Independent Risk Ranges</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4 style="color: #6f42c1; margin: 10px 0;">Trade Range (1-4 weeks)</h4>
              <p style="margin: 5px 0;"><strong>Support:</strong> $${data.shortTermLow}</p>
              <p style="margin: 5px 0;"><strong>Resistance:</strong> $${data.shortTermHigh}</p>
            </div>
            <div>
              <h4 style="color: #6f42c1; margin: 10px 0;">Trend Range (1-3 months)</h4>
              <p style="margin: 5px 0;"><strong>Support:</strong> $${data.mediumTermLow}</p>
              <p style="margin: 5px 0;"><strong>Resistance:</strong> $${data.mediumTermHigh}</p>
            </div>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 0; color: #1565c0;"><strong>Position Analysis:</strong> ${data.positionAnalysis || 'Analysis pending'}</p>
          </div>
        </div>

        <div style="background: ${data.signal === 'BUY' ? '#d4edda' : data.signal === 'SELL' ? '#f8d7da' : '#fff3cd'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${data.signal === 'BUY' ? '#28a745' : data.signal === 'SELL' ? '#dc3545' : '#ffc107'};">
          <h3 style="margin-top: 0; color: ${data.signal === 'BUY' ? '#155724' : data.signal === 'SELL' ? '#721c24' : '#856404'};">
            Signal Strength Recommendation: ${data.signal}
          </h3>
          <p style="margin-bottom: 0; color: ${data.signal === 'BUY' ? '#155724' : data.signal === 'SELL' ? '#721c24' : '#856404'};">
            Signal Strength: ${data.signalStrength}/100 | Position: ${data.positionInRange}% of range | ${data.positionAnalysis}
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Enhanced with Hedgeye-style Signal Strength Model + Claude AI Market Intelligence</p>
          <p style="margin: 5px 0 0 0;">For educational purposes only. Not financial advice.</p>
        </div>
      </div>
    `;

    const plainText = `${ticker} - AI-ENHANCED SIGNAL STRENGTH ANALYSIS
Generated: ${currentDate} • Hedgeye-Style Model + Claude AI

SIGNAL STRENGTH ANALYSIS
Signal Strength: ${data.signalStrength || 'N/A'}/100
Position in Range: ${data.positionInRange || 'N/A'}%
Status: ${data.positionAnalysis || 'N/A'}
Volatility Regime: ${data.volRegime || 'N/A'}

SIGNAL COMPONENTS
Volume: ${data.signalComponents?.volume || 'N/A'}/30
Momentum: ${data.signalComponents?.momentum || 'N/A'}/25  
Volatility: ${data.signalComponents?.volatility || 'N/A'}/20
Trend: ${data.signalComponents?.trend || 'N/A'}/25

INDEPENDENT RISK RANGES
Trade Range (1-4 weeks): $${data.shortTermLow} - $${data.shortTermHigh}
Trend Range (1-3 months): $${data.mediumTermLow} - $${data.mediumTermHigh}

EXECUTIVE SUMMARY
Current Price: $${data.price}
Daily Change: ${data.dailyChangePercent}%
Signal: ${data.signal}
Risk Score: ${data.riskScore}/100

AI MARKET INTELLIGENCE
Key Catalysts:
${aiAnalysis.keyCatalysts.map(catalyst => `• ${catalyst}`).join('\n')}

Money Flow Analysis:
• Institutional: ${aiAnalysis.moneyFlow.institutional}
• Retail: ${aiAnalysis.moneyFlow.retail}
• Options Flow: ${aiAnalysis.moneyFlow.optionsFlow}

Recent Events:
${aiAnalysis.recentEvents.map(event => `• ${event}`).join('\n')}

Market Sentiment: ${aiAnalysis.sentiment.overall}
• ${aiAnalysis.sentiment.analystConsensus}
• ${aiAnalysis.sentiment.socialSentiment}

RECOMMENDATION: ${data.signal}
${data.signal === 'BUY' ? 'Strong signal with favorable positioning for entry.' : 
  data.signal === 'SELL' ? 'Strong signal suggests taking profits or reducing exposure.' : 
  'Mixed or weak signals recommend monitoring before significant changes.'}

---
Enhanced with Hedgeye-style Signal Strength Model + Claude AI. For educational purposes only.`;

    console.log('✅ Report generation complete');
    return { html, plainText };
  };

  // Simple report generation that always works
  const
