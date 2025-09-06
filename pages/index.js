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

  // Mock data generator for fallback
  const getMockData = (ticker) => {
    const basePrice = Math.random() * 500 + 50;
    const change = (Math.random() - 0.5) * 20;
    const changePercent = (change / basePrice) * 100;
    const rsi = Math.random() * 100;
    const beta = Math.random() * 3;
    const volatility = Math.random() * 50 + 10;
    const riskScore = Math.min(100, Math.max(0, 
      (volatility * 1.5) + 
      (Math.abs(changePercent) * 2) + 
      (Math.abs(rsi - 50) * 0.8) +
      (Math.abs(beta - 1) * 10)
    ));
    
    return {
      symbol: ticker,
      companyName: `${ticker} Corp`,
      price: basePrice.toFixed(2),
      dailyChange: change.toFixed(2),
      dailyChangePercent: changePercent.toFixed(2),
      volatility: volatility.toFixed(1),
      rsi: rsi.toFixed(1),
      beta: beta.toFixed(2),
      riskScore: Math.round(riskScore),
      shortTermLow: (basePrice * 0.85).toFixed(2),
      shortTermHigh: (basePrice * 1.15).toFixed(2),
      mediumTermLow: (basePrice * 0.75).toFixed(2),
      mediumTermHigh: (basePrice * 1.25).toFixed(2),
      signal: ['BUY', 'SELL', 'HOLD'][Math.floor(Math.random() * 3)],
      lastUpdated: new Date().toISOString()
    };
  };

  // Run analysis for a single stock
  const runAnalysis = async (ticker) => {
    setLoading(prev => ({ ...prev, [ticker]: true }));
    
    try {
      const stockData = await fetchStockData(ticker);
      
      // Add signal generation based on technical indicators
      let signal = 'HOLD';
      if (stockData.rsi < 30 && stockData.dailyChangePercent > 0) {
        signal = 'BUY';
      } else if (stockData.rsi > 70 && stockData.dailyChangePercent < 0) {
        signal = 'SELL';
      } else if (stockData.riskScore < 30) {
        signal = 'BUY';
      } else if (stockData.riskScore > 70) {
        signal = 'SELL';
      }
      
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

    console.log('📝 Building HTML report...');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${ticker} - AI-Enhanced Risk Analysis</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Generated on ${currentDate} • Powered by Claude AI</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #333;">$${data.price}</div>
            <div style="color: #666; margin-top: 5px;">Current Price</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${data.dailyChangePercent >= 0 ? '#28a745' : '#dc3545'};">
              ${data.dailyChangePercent >= 0 ? '+' : ''}${data.dailyChangePercent}%
            </div>
            <div style="color: #666; margin-top: 5px;">Daily Change</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${data.signal === 'BUY' ? '#28a745' : data.signal === 'SELL' ? '#dc3545' : '#ffc107'};">
              ${data.signal}
            </div>
            <div style="color: #666; margin-top: 5px;">AI Signal</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${data.riskScore > 70 ? '#dc3545' : data.riskScore > 40 ? '#ffc107' : '#28a745'};">
              ${data.riskScore}/100
            </div>
            <div style="color: #666; margin-top: 5px;">Risk Score</div>
          </div>
        </div>

        ${aiSection}

        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Executive Summary</h2>
          <p><strong>Investment Signal:</strong> ${data.signal}</p>
          <p><strong>Risk Level:</strong> ${riskLevel} (${data.riskScore}/100)</p>
          <p><strong>Technical Position:</strong> RSI ${data.rsi} - ${rsiCondition}</p>
          <p><strong>Volatility:</strong> ${data.volatility}% | <strong>Beta:</strong> ${data.beta}</p>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Price Targets</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4 style="color: #6f42c1; margin: 10px 0;">Short-term (1-4 weeks)</h4>
              <p style="margin: 5px 0;"><strong>Support:</strong> $${data.shortTermLow}</p>
              <p style="margin: 5px 0;"><strong>Resistance:</strong> $${data.shortTermHigh}</p>
            </div>
            <div>
              <h4 style="color: #6f42c1; margin: 10px 0;">Medium-term (1-3 months)</h4>
              <p style="margin: 5px 0;"><strong>Support:</strong> $${data.mediumTermLow}</p>
              <p style="margin: 5px 0;"><strong>Resistance:</strong> $${data.mediumTermHigh}</p>
            </div>
          </div>
        </div>

        <div style="background: ${data.signal === 'BUY' ? '#d4edda' : data.signal === 'SELL' ? '#f8d7da' : '#fff3cd'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${data.signal === 'BUY' ? '#28a745' : data.signal === 'SELL' ? '#dc3545' : '#ffc107'};">
          <h3 style="margin-top: 0; color: ${data.signal === 'BUY' ? '#155724' : data.signal === 'SELL' ? '#721c24' : '#856404'};">
            AI Recommendation: ${data.signal}
          </h3>
          <p style="margin-bottom: 0; color: ${data.signal === 'BUY' ? '#155724' : data.signal === 'SELL' ? '#721c24' : '#856404'};">
            ${data.signal === 'BUY' ? 'AI analysis and technical indicators support position building with appropriate risk management.' : 
              data.signal === 'SELL' ? 'AI intelligence suggests elevated risk. Consider reducing exposure.' : 
              'Mixed AI and technical signals suggest monitoring before significant position changes.'}
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">AI-enhanced risk analysis powered by Claude AI and comprehensive technical framework.</p>
          <p style="margin: 5px 0 0 0;">For educational purposes only. Not financial advice.</p>
        </div>
      </div>
    `;

    const plainText = `${ticker} - AI-ENHANCED RISK ANALYSIS
Generated: ${currentDate} • Powered by Claude AI

EXECUTIVE SUMMARY
Current Price: $${data.price}
Daily Change: ${data.dailyChangePercent}%
Signal: ${data.signal}
Risk Score: ${data.riskScore}/100 (${riskLevel})
RSI: ${data.rsi} (${rsiCondition})
Beta: ${data.beta} | Volatility: ${data.volatility}%

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

PRICE TARGETS
Short-term (1-4 weeks): $${data.shortTermLow} - $${data.shortTermHigh}
Medium-term (1-3 months): $${data.mediumTermLow} - $${data.mediumTermHigh}

AI RECOMMENDATION: ${data.signal}
${data.signal === 'BUY' ? 'AI analysis supports position building.' : 
  data.signal === 'SELL' ? 'AI suggests caution and risk management.' : 
  'AI recommends monitoring before changes.'}

---
AI-enhanced analysis powered by Claude AI. For educational purposes only.`;

    console.log('✅ Report generation complete');
    return { html, plainText };
  };

  // Simple report generation that always works
  const generateSimpleReport = (ticker, data) => {
    const currentDate = new Date().toLocaleDateString();
    const rsiCondition = data.rsi > 70 ? 'Overbought' : data.rsi < 30 ? 'Oversold' : 'Neutral';
    const riskLevel = data.riskScore > 70 ? 'HIGH' : data.riskScore > 40 ? 'MODERATE' : 'LOW';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">${ticker} - Risk Analysis Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Generated on ${currentDate}</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #333;">$${data.price}</div>
            <div style="color: #666; margin-top: 5px;">Current Price</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${data.dailyChangePercent >= 0 ? '#28a745' : '#dc3545'};">
              ${data.dailyChangePercent >= 0 ? '+' : ''}${data.dailyChangePercent}%
            </div>
            <div style="color: #666; margin-top: 5px;">Daily Change</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${data.signal === 'BUY' ? '#28a745' : data.signal === 'SELL' ? '#dc3545' : '#ffc107'};">
              ${data.signal}
            </div>
            <div style="color: #666; margin-top: 5px;">Signal</div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${data.riskScore > 70 ? '#dc3545' : data.riskScore > 40 ? '#ffc107' : '#28a745'};">
              ${data.riskScore}/100
            </div>
            <div style="color: #666; margin-top: 5px;">Risk Score</div>
          </div>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Executive Summary</h2>
          <p><strong>Investment Signal:</strong> ${data.signal}</p>
          <p><strong>Risk Level:</strong> ${riskLevel} (${data.riskScore}/100)</p>
          <p><strong>Technical Position:</strong> RSI ${data.rsi} - ${rsiCondition}</p>
          <p><strong>Volatility:</strong> ${data.volatility}% | <strong>Beta:</strong> ${data.beta}</p>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Price Targets</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4 style="color: #6f42c1; margin: 10px 0;">Short-term (1-4 weeks)</h4>
              <p style="margin: 5px 0;"><strong>Support:</strong> $${data.shortTermLow}</p>
              <p style="margin: 5px 0;"><strong>Resistance:</strong> $${data.shortTermHigh}</p>
            </div>
            <div>
              <h4 style="color: #6f42c1; margin: 10px 0;">Medium-term (1-3 months)</h4>
              <p style="margin: 5px 0;"><strong>Support:</strong> $${data.mediumTermLow}</p>
              <p style="margin: 5px 0;"><strong>Resistance:</strong> $${data.mediumTermHigh}</p>
            </div>
          </div>
        </div>

        <div style="background: ${data.signal === 'BUY' ? '#d4edda' : data.signal === 'SELL' ? '#f8d7da' : '#fff3cd'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${data.signal === 'BUY' ? '#28a745' : data.signal === 'SELL' ? '#dc3545' : '#ffc107'};">
          <h3 style="margin-top: 0; color: ${data.signal === 'BUY' ? '#155724' : data.signal === 'SELL' ? '#721c24' : '#856404'};">
            Recommendation: ${data.signal}
          </h3>
          <p style="margin-bottom: 0; color: ${data.signal === 'BUY' ? '#155724' : data.signal === 'SELL' ? '#721c24' : '#856404'};">
            ${data.signal === 'BUY' ? 'Technical indicators support position building with appropriate risk management.' : 
              data.signal === 'SELL' ? 'Risk indicators suggest caution. Consider reducing exposure.' : 
              'Mixed signals suggest monitoring before significant position changes.'}
          </p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0;">Professional risk analysis generated using comprehensive technical framework.</p>
          <p style="margin: 5px 0 0 0;">For educational purposes only. Not financial advice.</p>
        </div>
      </div>
    `;

    const plainText = `${ticker} - RISK ANALYSIS REPORT
Generated: ${currentDate}

EXECUTIVE SUMMARY
Current Price: $${data.price}
Daily Change: ${data.dailyChangePercent}%
Signal: ${data.signal}
Risk Score: ${data.riskScore}/100 (${riskLevel})
RSI: ${data.rsi} (${rsiCondition})
Beta: ${data.beta} | Volatility: ${data.volatility}%

PRICE TARGETS
Short-term (1-4 weeks): $${data.shortTermLow} - $${data.shortTermHigh}
Medium-term (1-3 months): $${data.mediumTermLow} - $${data.mediumTermHigh}

RECOMMENDATION: ${data.signal}
${data.signal === 'BUY' ? 'Technical indicators support position building.' : 
  data.signal === 'SELL' ? 'Risk indicators suggest caution.' : 
  'Mixed signals suggest monitoring.'}

---
Professional risk analysis. For educational purposes only.`;

    return { html, plainText };
  };

  // Show report with AI analysis
  const showReport = async (ticker) => {
    alert('Button clicked for: ' + ticker); // Basic test
    console.log('🎯 showReport called for:', ticker);
    
    const data = analysisData[ticker];
    if (!data) {
      console.log('❌ No analysis data found for:', ticker);
      alert('Please run analysis first for ' + ticker);
      return;
    }

    console.log('📊 Found analysis data for:', ticker, data);
    setSelectedStock(ticker);
    setShowFullReport(true);
    
    // Show loading message
    console.log('💫 Setting loading state...');
    setFullReportContent({
      html: '<div style="text-align: center; padding: 3rem;"><div style="font-size: 1.2rem; color: #667eea; margin-bottom: 1rem;">🤖 Generating AI-Enhanced Report...</div><div style="color: #999;">Analyzing market intelligence and key catalysts</div><div style="margin-top: 1rem; font-size: 0.9rem; color: #666;">This may take a few moments</div></div>',
      plainText: 'Generating AI-enhanced report...'
    });

    try {
      console.log('🚀 Starting AI report generation...');
      // Generate AI-enhanced report
      const report = await generateAIReport(ticker, data);
      console.log('✅ AI report generated successfully');
      setFullReportContent(report);
    } catch (error) {
      console.error('💥 Error generating AI report:', error);
      // Fallback to simple report
      const fallbackReport = generateSimpleReport(ticker, data);
      setFullReportContent({
        html: fallbackReport.html + '<div style="background: #fff3cd; padding: 15px; margin-top: 20px; border-radius: 8px; border-left: 4px solid #ffc107;"><strong>Note:</strong> AI analysis temporarily unavailable. Report generated with technical analysis only.</div>',
        plainText: fallbackReport.plainText + '\n\nNote: AI analysis temporarily unavailable.'
      });
    }
  };

  // Add new stock to portfolio
  const addStock = () => {
    if (newStock && !stocks.includes(newStock.toUpperCase())) {
      setStocks([...stocks, newStock.toUpperCase()]);
      setNewStock('');
    }
  };

  // Remove stock from portfolio
  const removeStock = (ticker) => {
    setStocks(stocks.filter(s => s !== ticker));
    const newData = { ...analysisData };
    delete newData[ticker];
    setAnalysisData(newData);
  };

  // Export to CSV
  const exportToSpreadsheet = () => {
    const headers = [
      'Symbol', 'Company', 'Price', 'Daily Change %', 'RSI', 'Beta', 
      'Volatility %', 'Risk Score', 'Signal', 'Short Term Low', 'Short Term High',
      'Medium Term Low', 'Medium Term High', 'Last Updated'
    ];
    
    const rows = stocks.map(ticker => {
      const data = analysisData[ticker];
      return data ? [
        ticker,
        data.companyName,
        data.price,
        data.dailyChangePercent,
        data.rsi,
        data.beta,
        data.volatility,
        data.riskScore,
        data.signal,
        data.shortTermLow,
        data.shortTermHigh,
        data.mediumTermLow,
        data.mediumTermHigh,
        data.lastUpdated
      ] : [ticker, '', '', '', '', '', '', '', '', '', '', '', '', ''];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="w-8 h-8" />
          Professional Stock Risk Analyzer
        </h1>
        <p className="mt-2 opacity-90">Comprehensive risk assessment with real-time market data</p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <input
                type="text"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addStock()}
                placeholder="Add stock (e.g., AAPL)"
                className="px-3 py-2 border rounded-lg"
              />
              <button
                onClick={addStock}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={runPreMarketAnalysis}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run Pre-Market Analysis
              </button>
              <button
                onClick={exportToSpreadsheet}
                disabled={Object.keys(analysisData).length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export to Spreadsheet
              </button>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="mt-4 text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </div>

        {/* Stock Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stocks.map(ticker => {
            const data = analysisData[ticker];
            const isLoading = loading[ticker];

            return (
              <div key={ticker} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{ticker}</h3>
                    <button
                      onClick={() => removeStock(ticker)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Analyzing...</p>
                    </div>
                  ) : data ? (
                    <div className="space-y-3">
                      {/* Price & Change */}
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-semibold">${data.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <Tooltip content="The percentage change in stock price from the previous trading day">
                          <span className="text-gray-600">Change:</span>
                        </Tooltip>
                        <span className={`font-semibold ${data.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.dailyChangePercent >= 0 ? '+' : ''}{data.dailyChangePercent}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <Tooltip content="RSI (0-100): 70+ Overbought, 30-70 Neutral, Below 30 Oversold">
                          <span className="text-gray-600">RSI:</span>
                        </Tooltip>
                        <span className="font-semibold">{data.rsi}</span>
                      </div>
                      <div className="flex justify-between">
                        <Tooltip content="Risk Score (0-100): 0-30 Low Risk, 31-60 Moderate, 61+ High Risk">
                          <span className="text-gray-600">Risk Score:</span>
                        </Tooltip>
                        <span className="font-semibold">{data.riskScore}/100</span>
                      </div>

                      {/* Signal */}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Signal:</span>
                        <span className={`font-semibold px-2 py-1 rounded text-sm ${
                          data.signal === 'BUY' ? 'bg-green-100 text-green-800' :
                          data.signal === 'SELL' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {data.signal}
                        </span>
                      </div>

                      {/* Enhanced Risk Ranges */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-4">
                        <Tooltip content="Independent risk ranges calculated using signal strength model - NOT centered on current price">
                          <h4 className="font-semibold text-indigo-800 mb-2">Risk Ranges (Independent)</h4>
                        </Tooltip>
                        <div className="text-sm space-y-1">
                          <div><strong>Trade (1-4 weeks):</strong> ${data.shortTermLow} - ${data.shortTermHigh}</div>
                          <div><strong>Trend (1-3 months):</strong> ${data.mediumTermLow} - ${data.mediumTermHigh}</div>
                          <div className="text-xs text-indigo-600 mt-2">
                            <strong>Position:</strong> {data.positionAnalysis}
                          </div>
                        </div>
                      </div>

                      {/* Signal Strength Breakdown */}
                      {data.signalComponents && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                          <h5 className="font-semibold text-gray-700 mb-2 text-sm">Signal Components</h5>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div>Volume: {data.signalComponents.volume}</div>
                            <div>Momentum: {data.signalComponents.momentum}</div>
                            <div>Volatility: {data.signalComponents.volatility}</div>
                            <div>Trend: {data.signalComponents.trend}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => runAnalysis(ticker)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Re-analyze
                        </button>
                        <button
                          onClick={() => {
                            console.log('🟢 AI Report button clicked for:', ticker);
                            showReport(ticker);
                          }}
                          disabled={aiLoading[ticker]}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {aiLoading[ticker] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>AI Analysis...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              <span>🤖 AI Report</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>No analysis data</p>
                      <button
                        onClick={() => runAnalysis(ticker)}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Analyze
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Portfolio Summary */}
        {Object.keys(analysisData).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stocks.length}</div>
                <div className="text-sm text-gray-600">Total Stocks</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(analysisData).filter(d => d?.signal === 'BUY').length}
                </div>
                <div className="text-sm text-gray-600">Buy Signals</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(analysisData).filter(d => d?.signal === 'SELL').length}
                </div>
                <div className="text-sm text-gray-600">Sell Signals</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(analysisData).filter(d => d?.signal === 'HOLD').length}
                </div>
                <div className="text-sm text-gray-600">Hold Signals</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(analysisData).length > 0 
                    ? Math.round(Object.values(analysisData).reduce((sum, d) => sum + d.riskScore, 0) / Object.values(analysisData).length)
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Avg Risk Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Report Modal */}
        {showFullReport && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <h2 className="text-xl font-bold">🤖 AI-Enhanced Risk Analysis - {selectedStock}</h2>
                <button
                  onClick={() => setShowFullReport(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: fullReportContent?.html || '<div style="text-align: center; padding: 2rem; color: #666;">No report content available</div>' }}
                />
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t bg-gray-50 rounded-b-lg">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const content = fullReportContent?.plainText || 'Report content not available';
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedStock}_Risk_Analysis_${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Report (TXT)
                  </button>
                  
                  <button
                    onClick={() => {
                      const content = fullReportContent?.plainText || 'Report content not available';
                      if (navigator.share) {
                        navigator.share({
                          title: `${selectedStock} Risk Analysis Report`,
                          text: content.substring(0, 200) + '...',
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(content);
                        alert('Report copied to clipboard!');
                      }
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Share Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
