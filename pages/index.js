import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Download, RefreshCw, TrendingUp, AlertTriangle, DollarSign, Activity } from 'lucide-react';

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
  const [portfolio, setPortfolio] = useState(['AAPL', 'MSFT', 'GOOGL']);
  const [stockData, setStockData] = useState({});
  const [newStock, setNewStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportContent, setReportContent] = useState('');

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
      return null;
    }
  };

  // Load data for all stocks in portfolio
  const loadPortfolioData = async () => {
    setLoading(true);
    const newStockData = {};
    
    for (const symbol of portfolio) {
      const data = await fetchStockData(symbol);
      if (data) {
        newStockData[symbol] = data;
      }
    }
    
    setStockData(newStockData);
    setLastUpdated(new Date());
    setLoading(false);
  };

  // Add new stock to portfolio
  const addStock = async () => {
    if (!newStock.trim() || portfolio.includes(newStock.toUpperCase())) return;
    
    const symbol = newStock.toUpperCase();
    setLoading(true);
    
    const data = await fetchStockData(symbol);
    if (data) {
      setPortfolio([...portfolio, symbol]);
      setStockData(prev => ({ ...prev, [symbol]: data }));
    }
    
    setNewStock('');
    setLoading(false);
  };

  // Remove stock from portfolio
  const removeStock = (symbol) => {
    setPortfolio(portfolio.filter(s => s !== symbol));
    setStockData(prev => {
      const newData = { ...prev };
      delete newData[symbol];
      return newData;
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Symbol', 'Company', 'Price', 'Daily Change %', 'RSI', 'Beta', 
      'Volatility %', 'Risk Score', 'Short Term Low', 'Short Term High',
      'Medium Term Low', 'Medium Term High', 'Last Updated'
    ];
    
    const rows = Object.entries(stockData).map(([symbol, data]) => [
      symbol,
      data.companyName,
      data.price,
      data.dailyChangePercent,
      data.rsi,
      data.beta,
      data.volatility,
      data.riskScore,
      data.shortTermLow,
      data.shortTermHigh,
      data.mediumTermLow,
      data.mediumTermHigh,
      data.lastUpdated
    ]);

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

  // Generate comprehensive report
  const generateComprehensiveReport = (stockData) => {
    const currentDate = new Date().toLocaleDateString();
    
    return `# Comprehensive Stock Risk Analysis Report
Generated: ${currentDate}

## Executive Summary

This analysis covers ${Object.keys(stockData).length} stocks using our enhanced multi-factor risk assessment framework. The analysis incorporates current market data, technical indicators, volume analysis, and macro-economic factors to provide comprehensive risk ranges and investment recommendations.

**Key Market Context:**
- Current market volatility (VIX) levels and trend direction
- Federal Reserve policy stance and interest rate environment  
- USD strength/weakness impact on multinational revenues
- Sector rotation patterns and institutional money flows

## Individual Stock Analysis

${Object.entries(stockData).map(([ticker, data]) => {
  const riskLevel = data.riskScore > 70 ? 'HIGH' : data.riskScore > 40 ? 'MODERATE' : 'LOW';
  const rsiCondition = data.rsi > 70 ? 'Overbought' : data.rsi < 30 ? 'Oversold' : 'Neutral';
  const priceAction = data.dailyChangePercent > 5 ? 'Strong Upward Movement' : 
                     data.dailyChangePercent < -5 ? 'Significant Decline' :
                     data.dailyChangePercent > 0 ? 'Modest Gains' : 'Slight Decline';
  
  return `### ${ticker} - ${data.companyName}

**Current Price Position:** $${data.price}
**Daily Movement:** ${data.dailyChangePercent}% (${priceAction})
**Risk Assessment:** ${riskLevel} RISK (Score: ${data.riskScore}/100)
**Technical Position:** RSI ${data.rsi} - ${rsiCondition}

**Market Context Analysis:**
The current price of $${data.price} reflects ${priceAction.toLowerCase()} in recent trading. With an RSI of ${data.rsi}, the stock is in ${rsiCondition.toLowerCase()} territory, suggesting ${
  data.rsi > 70 ? 'potential for near-term consolidation or pullback' :
  data.rsi < 30 ? 'possible oversold bounce opportunity' :
  'balanced momentum conditions'
}.

**Risk Range Analysis:**
- **Short-term Range (1-4 weeks):** ${data.shortTermLow} - ${data.shortTermHigh}
- **Medium-term Range (1-3 months):** ${data.mediumTermLow} - ${data.mediumTermHigh}

**Current Position within Ranges:**
${data.price < data.shortTermLow ? '⚠️ Trading BELOW short-term range - potential oversold condition' :
  data.price > data.shortTermHigh ? '⚠️ Trading ABOVE short-term range - extended/overbought' :
  'Trading within established short-term range parameters'}

**Volume & Momentum Indicators:**
- Beta: ${data.beta} (${data.beta > 1.5 ? 'High volatility vs market' : data.beta > 1 ? 'Above-market volatility' : 'Below-market volatility'})
- Volatility: ${data.volatility}% (${data.volatility > 30 ? 'High' : data.volatility > 20 ? 'Moderate' : 'Low'} volatility environment)

**Investment Recommendation:**
${data.riskScore < 30 ? '✅ FAVORABLE RISK PROFILE - Consider for position building' :
  data.riskScore < 60 ? '⚖️ MODERATE RISK - Suitable for balanced portfolios' :
  '⚠️ ELEVATED RISK - Exercise caution, consider smaller position sizes'}

**Key Catalysts to Monitor:**
- Earnings announcements and guidance updates
- Sector-specific developments and competitive dynamics
- Macro-economic shifts affecting the industry
- Technical breakout/breakdown levels: Watch ${data.shortTermLow} support and ${data.shortTermHigh} resistance

---`;
}).join('\n')}

## Portfolio Risk Assessment

**Overall Portfolio Characteristics:**
- **Average Risk Score:** ${(Object.values(stockData).reduce((sum, data) => sum + data.riskScore, 0) / Object.keys(stockData).length).toFixed(1)}/100
- **High-Risk Positions:** ${Object.values(stockData).filter(data => data.riskScore > 70).length} stocks
- **Conservative Positions:** ${Object.values(stockData).filter(data => data.riskScore < 40).length} stocks

**Correlation & Diversification Analysis:**
${Object.keys(stockData).length > 1 ? 
`The portfolio contains ${Object.keys(stockData).length} positions across multiple risk profiles. Monitor for sector concentration and ensure adequate diversification across industries and market capitalizations.` :
'Single position analysis - consider portfolio diversification across sectors and risk levels.'}

## Risk Management Recommendations

**Position Sizing Guidelines:**
- High-risk stocks (70+ risk score): Maximum 3-5% portfolio weight
- Moderate-risk stocks (40-69 risk score): Standard 5-10% portfolio weight  
- Low-risk stocks (<40 risk score): Core positions up to 15% portfolio weight

**Stop-Loss & Take-Profit Levels:**
${Object.entries(stockData).map(([ticker, data]) => 
`- **${ticker}:** Stop-loss: ${(data.price * 0.92).toFixed(2)} (-8%), Take-profit: ${(data.price * 1.15).toFixed(2)} (+15%)`
).join('\n')}

**Market Environment Considerations:**
- Monitor VIX levels above 25 for increased market stress
- Watch for Federal Reserve policy shifts affecting interest-sensitive sectors
- Track USD movements for international exposure impacts
- Maintain adequate cash reserves for opportunity deployment

## Conclusion

This comprehensive analysis provides a framework for managing portfolio risk while capitalizing on identified opportunities. Regular updates to this analysis (recommended weekly) will ensure alignment with changing market conditions and emerging risks.

**Next Review Date:** ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

---
*Analysis generated using enhanced multi-factor risk assessment framework incorporating technical analysis, fundamental metrics, and macro-economic factors.*`;
  };

  // Generate and show report
  const showFullReport = () => {
    const report = generateComprehensiveReport(stockData);
    setReportContent(report);
    setShowReport(true);
  };

  // Initial load
  useEffect(() => {
    loadPortfolioData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        padding: '2rem 0' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <TrendingUp style={{ width: '2rem', height: '2rem', marginRight: '0.75rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              Professional Stock Risk Analyzer
            </h1>
          </div>
          <p style={{ opacity: 0.9, margin: 0 }}>
            Comprehensive risk assessment and portfolio management with real-time market data
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Controls */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '0.5rem', 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flex: '1', minWidth: '300px' }}>
              <input
                type="text"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addStock()}
                placeholder="Enter stock symbol (e.g., AAPL)"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem 0 0 0.375rem',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={addStock}
                disabled={loading}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0 0.375rem 0.375rem 0',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <Plus style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={loadPortfolioData}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Refresh
              </button>
              
              <button
                onClick={exportToCSV}
                disabled={Object.keys(stockData).length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: Object.keys(stockData).length === 0 ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(stockData).length === 0 ? 0.6 : 1
                }}
              >
                <Download style={{ width: '1rem', height: '1rem' }} />
                Export CSV
              </button>

              <button
                onClick={showFullReport}
                disabled={Object.keys(stockData).length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: Object.keys(stockData).length === 0 ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(stockData).length === 0 ? 0.6 : 1
                }}
              >
                <Activity style={{ width: '1rem', height: '1rem' }} />
                Full Report
              </button>
            </div>
          </div>
          
          {lastUpdated && (
            <p style={{ 
              marginTop: '1rem', 
              marginBottom: 0, 
              fontSize: '0.875rem', 
              color: '#6b7280' 
            }}>
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <RefreshCw style={{ 
              width: '2rem', 
              height: '2rem', 
              animation: 'spin 1s linear infinite',
              color: '#3b82f6',
              marginBottom: '0.5rem'
            }} />
            <p style={{ color: '#6b7280', margin: 0 }}>Loading stock data...</p>
          </div>
        )}

        {/* Portfolio Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {portfolio.map(ticker => {
            const data = stockData[ticker];
            if (!data) return null;

            return (
              <div
                key={ticker}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      margin: '0 0 0.25rem 0',
                      color: '#1f2937'
                    }}>
                      {ticker}
                    </h3>
                    <p style={{ 
                      color: '#6b7280', 
                      margin: 0, 
                      fontSize: '0.875rem' 
                    }}>
                      {data.companyName}
                    </p>
                  </div>
                  <button
                    onClick={() => removeStock(ticker)}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>

                {/* Price & Change */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'baseline', 
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold',
                      color: '#1f2937'
                    }}>
                      ${data.price}
                    </span>
                    <span style={{ 
                      fontSize: '1rem',
                      color: data.dailyChangePercent >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: '600'
                    }}>
                      {data.dailyChangePercent >= 0 ? '+' : ''}{data.dailyChangePercent}%
                    </span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <Tooltip
                      id={`change-${ticker}`}
                      content={
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Daily Price Change</div>
                          <div>The percentage change in stock price from the previous trading day. Positive values (green) indicate price increases, negative values (red) indicate price decreases.</div>
                        </div>
                      }
                    >
                      <span style={{ color: '#6b7280' }}>Change:</span>
                    </Tooltip>
                    <span style={{ 
                      marginLeft: '0.5rem', 
                      fontWeight: '500',
                      color: data.dailyChangePercent >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {data.dailyChangePercent}%
                    </span>
                  </div>
                  <div>
                    <Tooltip
                      id={`rsi-${ticker}`}
                      content={
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Relative Strength Index (RSI)</div>
                          <div style={{ marginBottom: '0.5rem' }}>A momentum indicator measuring the speed and magnitude of price changes (0-100 scale):</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div>• <span style={{ color: '#ef4444' }}>70+</span>: Potentially overbought</div>
                            <div>• <span style={{ color: '#f59e0b' }}>30-70</span>: Neutral range</div>
                            <div>• <span style={{ color: '#10b981' }}>Below 30</span>: Potentially oversold</div>
                          </div>
                        </div>
                      }
                    >
                      <span style={{ color: '#6b7280' }}>RSI:</span>
                    </Tooltip>
                    <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>{data.rsi}</span>
                  </div>
                  <div>
                    <Tooltip
                      id={`risk-${ticker}`}
                      content={
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Risk Score (0-100)</div>
                          <div style={{ marginBottom: '0.5rem' }}>A composite risk rating based on volatility, technical indicators, and market conditions:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div>• <span style={{ color: '#10b981' }}>0-30</span>: Low risk</div>
                            <div>• <span style={{ color: '#f59e0b' }}>31-60</span>: Moderate risk</div>
                            <div>• <span style={{ color: '#fb7185' }}>61-80</span>: High risk</div>
                            <div>• <span style={{ color: '#ef4444' }}>81-100</span>: Very high risk</div>
                          </div>
                        </div>
                      }
                    >
                      <span style={{ color: '#6b7280' }}>Risk Score:</span>
                    </Tooltip>
                    <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>{data.riskScore}/100</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Beta:</span>
                    <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>{data.beta}</span>
                  </div>
                </div>

                {/* Risk Ranges */}
                <div style={{ 
                  backgroundColor: '#f3f4f6', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  padding: '0.75rem' 
                }}>
                  <Tooltip
                    id={`ranges-${ticker}`}
                    content={
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Risk Range Analysis</div>
                        <div style={{ marginBottom: '0.5rem' }}>Price ranges calculated independently from current price position.</div>
                        <div style={{ marginBottom: '0.5rem' }}><strong>Short-term:</strong> Expected 1-4 week trading range based on current volatility</div>
                        <div><strong>Medium-term:</strong> Expected 1-3 month range incorporating fundamental factors</div>
                      </div>
                    }
                  >
                    <h4 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      margin: '0 0 0.5rem 0',
                      color: '#374151'
                    }}>
                      Risk Ranges
                    </h4>
                  </Tooltip>
                  <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '500' }}>Short-term:</span> ${data.shortTermLow} - ${data.shortTermHigh}
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Medium-term:</span> ${data.mediumTermLow} - ${data.mediumTermHigh}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Report Modal */}
        {showReport && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                  Comprehensive Risk Analysis Report
                </h2>
                <button
                  onClick={() => setShowReport(false)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
              <div style={{
                padding: '1.5rem',
                overflow: 'auto',
                flex: 1
              }}>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {reportContent}
                </pre>
              </div>
              <div style={{
                padding: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    const blob = new Blob([reportContent], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `comprehensive_stock_analysis_${new Date().toISOString().split('T')[0]}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  <Download style={{ width: '1rem', height: '1rem' }} />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Live Market Data</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Risk Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Portfolio Management</span>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
            Professional stock analysis powered by real-time market data. For educational purposes only.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

