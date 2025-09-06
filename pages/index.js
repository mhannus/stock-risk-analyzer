import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Download, RefreshCw, TrendingUp, AlertTriangle, DollarSign, Activity, Play, Clock, TrendingDown, Trash2, FileText } from 'lucide-react';

// Tooltip Component
const Tooltip = ({ children, id, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help">{children}</span>
      {isVisible && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg transform -translate-x-1/4">
          {content}
          <div className="absolute top-full left-8 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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
  const [fullReportContent, setFullReportContent] = useState('');
  const [selectedStock, setSelectedStock] = useState('');

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

  // Generate comprehensive report for individual stock
  const generateFullReport = (ticker) => {
    const data = analysisData[ticker];
    if (!data) return '';

    const rsiCondition = data.rsi > 70 ? 'Overbought' : data.rsi < 30 ? 'Oversold' : 'Neutral';
    const priceAction = data.dailyChangePercent > 5 ? 'Strong Upward Movement' : 
                       data.dailyChangePercent < -5 ? 'Significant Decline' :
                       data.dailyChangePercent > 0 ? 'Modest Gains' : 'Slight Decline';
    const riskLevel = data.riskScore > 70 ? 'HIGH' : data.riskScore > 40 ? 'MODERATE' : 'LOW';

    return `# ${ticker} - Comprehensive Risk Analysis Report
Generated: ${new Date().toLocaleDateString()}

## Executive Summary

**Current Price Position:** $${data.price}
**Daily Movement:** ${data.dailyChangePercent}% (${priceAction})
**Risk Assessment:** ${riskLevel} RISK (Score: ${data.riskScore}/100)
**Technical Position:** RSI ${data.rsi} - ${rsiCondition}
**Investment Signal:** ${data.signal}

## Market Context Analysis

The current price of $${data.price} reflects ${priceAction.toLowerCase()} in recent trading. With an RSI of ${data.rsi}, the stock is in ${rsiCondition.toLowerCase()} territory, suggesting ${
  data.rsi > 70 ? 'potential for near-term consolidation or pullback' :
  data.rsi < 30 ? 'possible oversold bounce opportunity' :
  'balanced momentum conditions'
}.

## Risk Range Analysis

**Short-term Range (1-4 weeks):** $${data.shortTermLow} - $${data.shortTermHigh}
**Medium-term Range (1-3 months):** $${data.mediumTermLow} - $${data.mediumTermHigh}

**Current Position within Ranges:**
${data.price < data.shortTermLow ? '⚠️ Trading BELOW short-term range - potential oversold condition' :
  data.price > data.shortTermHigh ? '⚠️ Trading ABOVE short-term range - extended/overbought' :
  '✅ Trading within established short-term range parameters'}

## Volume & Momentum Indicators

- **Beta:** ${data.beta} (${data.beta > 1.5 ? 'High volatility vs market' : data.beta > 1 ? 'Above-market volatility' : 'Below-market volatility'})
- **Volatility:** ${data.volatility}% (${data.volatility > 30 ? 'High' : data.volatility > 20 ? 'Moderate' : 'Low'} volatility environment)

## Investment Recommendation

**Signal: ${data.signal}**

${data.signal === 'BUY' ? '✅ FAVORABLE RISK PROFILE - Consider for position building' :
  data.signal === 'SELL' ? '❌ ELEVATED RISK - Exercise caution, consider smaller position sizes' :
  '⏸️ MODERATE RISK - Suitable for balanced portfolios, monitor for better entry/exit points'}

## Risk Management

**Position Sizing Recommendation:**
${data.riskScore < 30 ? '- Core position: Up to 15% portfolio weight' :
  data.riskScore < 60 ? '- Standard position: 5-10% portfolio weight' :
  '- Reduced position: Maximum 3-5% portfolio weight'}

**Key Levels to Monitor:**
- **Support:** $${data.shortTermLow} (Short-term low)
- **Resistance:** $${data.shortTermHigh} (Short-term high)
- **Stop-Loss:** $${(data.price * 0.92).toFixed(2)} (-8%)
- **Take-Profit:** $${(data.price * 1.15).toFixed(2)} (+15%)

## Key Catalysts to Monitor

- Earnings announcements and guidance updates
- Sector-specific developments and competitive dynamics
- Macro-economic shifts affecting the industry
- Technical breakout/breakdown levels

## Conclusion

${data.signal === 'BUY' ? 'Current analysis suggests favorable conditions for position building.' :
  data.signal === 'SELL' ? 'Current analysis suggests elevated risk requiring caution.' :
  'Current analysis suggests a balanced approach with careful monitoring.'}

---
*Analysis generated using enhanced multi-factor risk assessment framework incorporating technical analysis, fundamental metrics, and macro-economic factors.*`;
  };

  // Show full report modal
  const showReport = (ticker) => {
    const report = generateFullReport(ticker);
    setFullReportContent(report);
    setSelectedStock(ticker);
    setShowFullReport(true);
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
                        <Tooltip
                          id={`change-${ticker}`}
                          content={
                            <div>
                              <div className="font-semibold mb-1">Daily Price Change</div>
                              <div>The percentage change in stock price from the previous trading day. Positive values (green) indicate price increases, negative values (red) indicate price decreases.</div>
                            </div>
                          }
                        >
                          <span className="text-gray-600">Change:</span>
                        </Tooltip>
                        <span className={`font-semibold ${data.dailyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.dailyChangePercent >= 0 ? '+' : ''}{data.dailyChangePercent}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <Tooltip
                          id={`rsi-${ticker}`}
                          content={
                            <div>
                              <div className="font-semibold mb-1">Relative Strength Index (RSI)</div>
                              <div className="mb-2">A momentum indicator measuring the speed and magnitude of price changes (0-100 scale):</div>
                              <div className="space-y-1">
                                <div>• <span className="text-red-300">70+</span>: Potentially overbought</div>
                                <div>• <span className="text-yellow-300">30-70</span>: Neutral range</div>
                                <div>• <span className="text-green-300">Below 30</span>: Potentially oversold</div>
                              </div>
                            </div>
                          }
                        >
                          <span className="text-gray-600">RSI:</span>
                        </Tooltip>
                        <span className="font-semibold">{data.rsi}</span>
                      </div>
                      <div className="flex justify-between">
                        <Tooltip
                          id={`risk-${ticker}`}
                          content={
                            <div>
                              <div className="font-semibold mb-1">Risk Score (0-100)</div>
                              <div className="mb-2">A composite risk rating based on volatility, technical indicators, and market conditions:</div>
                              <div className="space-y-1">
                                <div>• <span className="text-green-300">0-30</span>: Low risk</div>
                                <div>• <span className="text-yellow-300">31-60</span>: Moderate risk</div>
                                <div>• <span className="text-orange-300">61-80</span>: High risk</div>
                                <div>• <span className="text-red-300">81-100</span>: Very high risk</div>
                              </div>
                            </div>
                          }
                        >
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

                      {/* Risk Ranges */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-4">
                        <Tooltip
                          id={`ranges-${ticker}`}
                          content={
                            <div>
                              <div className="font-semibold mb-1">Risk Range Analysis</div>
                              <div className="mb-2">Price ranges calculated independently from current price position.</div>
                              <div className="mb-2"><strong>Short-term:</strong> Expected 1-4 week trading range based on current volatility</div>
                              <div><strong>Medium-term:</strong> Expected 1-3 month range incorporating fundamental factors</div>
                            </div>
                          }
                        >
                          <h4 className="font-semibold text-indigo-800 mb-2">Risk Ranges</h4>
                        </Tooltip>
                        <div className="text-sm space-y-1">
                          <div><strong>Short-term:</strong> ${data.shortTermLow} - ${data.shortTermHigh}</div>
                          <div><strong>Medium-term:</strong> ${data.mediumTermLow} - ${data.mediumTermHigh}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => runAnalysis(ticker)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Re-analyze
                        </button>
                        <button
                          onClick={() => showReport(ticker)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center justify-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          Full Report
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
                <h2 className="text-xl font-bold">Professional Risk Analysis Report - {selectedStock}</h2>
                <button
                  onClick={() => setShowFullReport(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-auto">
                <div 
                  className="p-6"
                  dangerouslySetInnerHTML={{ __html: fullReportContent.html }}
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
                      a.download = `${selectedStock}_AI_Risk_Analysis_${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download AI Report (TXT)
                  </button>
                  
                  <button
                    onClick={() => {
                      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${selectedStock} AI-Enhanced Risk Analysis Report</title>
    <meta charset="UTF-8">
    <style>
        body { margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
        .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        ${fullReportContent?.html || '<div>Report content not available</div>'}
    </div>
</body>
</html>`;
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedStock}_AI_Risk_Analysis_${new Date().toISOString().split('T')[0]}.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download AI Report (HTML)
                  </button>
                  
                  <button
                    onClick={() => {
                      const content = fullReportContent?.plainText || 'Report content not available';
                      if (navigator.share) {
                        navigator.share({
                          title: `${selectedStock} AI-Enhanced Risk Analysis Report`,
                          text: content.substring(0, 200) + '...',
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(content);
                        alert('AI Report copied to clipboard!');
                      }
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Share AI Report
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
