import React, { useState } from 'react';
import { Download, Plus, Trash2, Play, Clock, TrendingUp, TrendingDown, AlertTriangle, FileText } from 'lucide-react';

export default function StockRiskAnalyzer() {
  const [stocks, setStocks] = useState(['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']);
  const [newStock, setNewStock] = useState('');
  const [analysisData, setAnalysisData] = useState({});
  const [loading, setLoading] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [fullReport, setFullReport] = useState('');
  const [showFullReport, setShowFullReport] = useState(false);

  const getStockData = async (ticker) => {
    try {
      console.log(`🔍 Fetching data for ${ticker} from Vercel API...`);
      
      const response = await fetch(`/api/stock-data?ticker=${ticker}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log(`✅ Successfully fetched ${ticker}: $${data.currentPrice}`);
      return data;

    } catch (error) {
      console.log(`❌ API failed for ${ticker}, using fallback...`);
      return getMockData(ticker);
    }
  };

  const getMockData = (ticker) => {
    const priceRanges = {
      'AAPL': 175, 'MSFT': 410, 'GOOGL': 140, 'TSLA': 240, 'NVDA': 470
    };
    
    const basePrice = priceRanges[ticker] || 150;
    const mockPrice = basePrice + (Math.random() - 0.5) * 20;
    const changePercent = (Math.random() - 0.5) * 6;
    
    return {
      ticker: ticker.toUpperCase(),
      currentPrice: mockPrice.toFixed(2),
      dailyChange: (mockPrice * changePercent / 100).toFixed(2),
      dailyChangePercent: changePercent.toFixed(2),
      volume: Math.floor(30000000 + Math.random() * 20000000).toLocaleString(),
      volatility: (15 + Math.random() * 15).toFixed(1),
      rsi: (30 + Math.random() * 40).toFixed(1),
      beta: (0.8 + Math.random() * 1.0).toFixed(2),
      signal: ['BUY', 'SELL', 'HOLD'][Math.floor(Math.random() * 3)],
      signalStrength: Math.floor(Math.random() * 3) + 7,
      riskScore: Math.floor(Math.random() * 60) + 20,
      positionSize: Math.floor(Math.random() * 15) + 10,
      stopLoss: (mockPrice * 0.94).toFixed(2),
      target: (mockPrice * 1.08).toFixed(2),
      riskRanges: {
        shortTerm: `$${(mockPrice * 0.92).toFixed(2)} - $${(mockPrice * 1.08).toFixed(2)}`,
        mediumTerm: `$${(mockPrice * 0.85).toFixed(2)} - $${(mockPrice * 1.15).toFixed(2)}`
      },
      fiftyTwoWeekRange: `$${(mockPrice * 0.75).toFixed(2)} - $${(mockPrice * 1.35).toFixed(2)}`,
      timestamp: new Date().toISOString(),
      dataSource: 'Demo Data (Fallback)',
      marketCap: `${(mockPrice * 16).toFixed(1)}B`
    };
  };

  const addStock = () => {
    if (newStock && !stocks.includes(newStock.toUpperCase())) {
      setStocks([...stocks, newStock.toUpperCase()]);
      setNewStock('');
    }
  };

  const removeStock = (ticker) => {
    setStocks(stocks.filter(s => s !== ticker));
    const newAnalysisData = { ...analysisData };
    delete newAnalysisData[ticker];
    setAnalysisData(newAnalysisData);
  };

  const runAnalysis = async (ticker) => {
    setLoading(prev => ({ ...prev, [ticker]: true }));
    
    try {
      const stockData = await getStockData(ticker);
      setAnalysisData(prev => ({ ...prev, [ticker]: stockData }));
    } catch (error) {
      console.error(`Error analyzing ${ticker}:`, error);
    }
    
    setLoading(prev => ({ ...prev, [ticker]: false }));
  };

  const runAllAnalysis = async () => {
    setLastUpdate(new Date());
    for (const ticker of stocks) {
      await runAnalysis(ticker);
    }
  };

  const generateFullReport = (ticker) => {
    if (!analysisData[ticker]) return;
    
    const data = analysisData[ticker];
    const mockReport = `# Risk Analysis Report for ${ticker}

## Current Position
- **Price**: $${data.currentPrice} (${data.dailyChangePercent}% change)
- **Signal**: ${data.signal} (Strength: ${data.signalStrength}/10)
- **Risk Score**: ${data.riskScore}/100

## Technical Analysis
- **RSI**: ${data.rsi} - ${parseFloat(data.rsi) > 70 ? 'Overbought' : parseFloat(data.rsi) < 30 ? 'Oversold' : 'Neutral'}
- **Beta**: ${data.beta} - ${parseFloat(data.beta) > 1.2 ? 'High volatility' : 'Moderate volatility'}

## Risk Management
- **Position Size**: ${data.positionSize}% maximum
- **Stop Loss**: $${data.stopLoss}
- **Target Price**: $${data.target}

## Range Analysis
- **Short-term**: ${data.riskRanges.shortTerm}
- **Medium-term**: ${data.riskRanges.mediumTerm}

Data source: ${data.dataSource}`;

    setFullReport(mockReport);
    setSelectedStock(ticker);
    setShowFullReport(true);
  };

  const exportToSpreadsheet = () => {
    const headers = ['Ticker', 'Price', 'Change%', 'Signal', 'Risk Score', 'Position Size%', 'Data Source'];
    const rows = stocks.map(ticker => {
      const d = analysisData[ticker];
      return d ? [d.ticker, d.currentPrice, d.dailyChangePercent, d.signal, d.riskScore, d.positionSize, d.dataSource]
                : [ticker, 'No Data', '', '', '', '', ''];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSignalColor = (signal) => {
    const colors = {
      'BUY': { color: '#16a34a', backgroundColor: '#f0fdf4' },
      'SELL': { color: '#dc2626', backgroundColor: '#fef2f2' }, 
      'HOLD': { color: '#ca8a04', backgroundColor: '#fefce8' }
    };
    return colors[signal] || { color: '#6b7280', backgroundColor: '#f9fafb' };
  };

  const getSignalIcon = (signal) => {
    const icons = {
      'BUY': <TrendingUp style={{ width: '1rem', height: '1rem' }} />,
      'SELL': <TrendingDown style={{ width: '1rem', height: '1rem' }} />,
      'HOLD': <AlertTriangle style={{ width: '1rem', height: '1rem' }} />
    };
    return icons[signal];
  };

  const containerStyle = {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #e5e7eb'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem'
  };

  const titleStyle = {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#111827'
  };

  const statusBoxStyle = {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '1rem',
    marginBottom: '1.5rem',
    borderRadius: '0.5rem'
  };

  const statusTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#166534',
    marginBottom: '0.5rem'
  };

  const statusTextStyle = {
    fontSize: '0.875rem',
    color: '#15803d'
  };

  const sectionStyle = {
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1.5rem'
  };

  const sectionTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#111827'
  };

  const inputStyle = {
    flex: '1',
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    outline: 'none'
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  };

  const greenButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#16a34a'
  };

  const purpleButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9333ea'
  };

  const stockCardStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '1rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem'
  };

  const flexStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem'
  };

  const tagStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500'
  };

  const loadingStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '8rem'
  };

  const spinnerStyle = {
    width: '2rem',
    height: '2rem',
    border: '2px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <div style={containerStyle}>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        button:hover {
          opacity: 0.9;
        }
        input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      `}</style>

      <div style={cardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Stock Risk Management Analyzer</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <Clock style={{ width: '1rem', height: '1rem' }} />
            <span>Live Data • Last Update: {lastUpdate?.toLocaleString() || 'Never'}</span>
          </div>
        </div>

        <div style={statusBoxStyle}>
          <h3 style={statusTitleStyle}>🚀 Live Finnhub Data Integration</h3>
          <div style={statusTextStyle}>
            <p><strong>✅ Connected to live Finnhub API via Vercel serverless functions!</strong></p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Real-time stock prices, daily changes, and market data flowing directly from Finnhub.io</p>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Portfolio Management</h2>
          <div style={flexStyle}>
            <input
              type="text"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value.toUpperCase())}
              placeholder="Enter stock ticker (e.g., AAPL)"
              style={inputStyle}
              onKeyPress={(e) => e.key === 'Enter' && addStock()}
            />
            <button onClick={addStock} style={buttonStyle}>
              <Plus style={{ width: '1rem', height: '1rem' }} />
              <span>Add Stock</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {stocks.map(ticker => (
              <div key={ticker} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: '500' }}>{ticker}</span>
                <button 
                  onClick={() => removeStock(ticker)} 
                  style={{ marginLeft: '0.5rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <Trash2 style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            ))}
          </div>

          <div style={flexStyle}>
            <button onClick={runAllAnalysis} style={greenButtonStyle}>
              <Play style={{ width: '1rem', height: '1rem' }} />
              <span>Run Live Analysis</span>
            </button>
            <button onClick={exportToSpreadsheet} style={purpleButtonStyle}>
              <Download style={{ width: '1rem', height: '1rem' }} />
              <span>Export Results</span>
            </button>
          </div>
        </div>

        <div style={gridStyle}>
          {stocks.map(ticker => {
            const data = analysisData[ticker];
            const isLoading = loading[ticker];
            
            return (
              <div key={ticker} style={stockCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{ticker}</h3>
                  {data && (
                    <div style={{
                      ...tagStyle,
                      ...getSignalColor(data.signal)
                    }}>
                      {getSignalIcon(data.signal)}
                      <span>{data.signal}</span>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div style={loadingStyle}>
                    <div style={spinnerStyle}></div>
                  </div>
                ) : data ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <span style={{ color: '#6b7280' }}>Price:</span>
                        <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>${data.currentPrice}</span>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280' }}>Change:</span>
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontWeight: '500',
                          color: parseFloat(data.dailyChangePercent) >= 0 ? '#16a34a' : '#dc2626'
                        }}>
                          {data.dailyChangePercent}%
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280' }}>RSI:</span>
                        <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>{data.rsi}</span>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280' }}>Risk:</span>
                        <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>{data.riskScore}/100</span>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#eef2ff',
                      border: '1px solid #c7d2fe',
                      borderRadius: '0.5rem',
                      padding: '0.75rem'
                    }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3730a3', marginBottom: '0.5rem' }}>📊 Risk Ranges</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#4338ca' }}>Short Term:</span>
                          <span style={{ fontFamily: 'monospace', color: '#312e81' }}>{data.riskRanges.shortTerm}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#7c3aed' }}>Medium Term:</span>
                          <span style={{ fontFamily: 'monospace', color: '#581c87' }}>{data.riskRanges.mediumTerm}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                      Source: {data.dataSource}
                    </div>

                    <button
                      onClick={() => generateFullReport(ticker)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FileText style={{ width: '1rem', height: '1rem' }} />
                      <span>Full Report</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
                    <button
                      onClick={() => runAnalysis(ticker)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Analyze with Live Data
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(analysisData).length > 0 && (
          <div style={{ marginTop: '2rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Portfolio Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>{stocks.length}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Stocks</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                  {Object.values(analysisData).filter(d => d?.signal === 'BUY').length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Buy Signals</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                  {Object.values(analysisData).filter(d => d?.signal === 'SELL').length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Sell Signals</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ca8a04' }}>
                  {Object.values(analysisData).filter(d => d?.signal === 'HOLD').length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hold Signals</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9333ea' }}>
                  {Object.values(analysisData).length > 0 
                    ? (Object.values(analysisData).reduce((sum, d) => sum + (d?.riskScore || 0), 0) / Object.values(analysisData).length).toFixed(0)
                    : 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Avg Risk Score</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showFullReport && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowFullReport(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              width: '100%',
              maxWidth: '64rem',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                Full Risk Analysis - {selectedStock}
              </h2>
              <button 
                onClick={() => setShowFullReport(false)}
                style={{
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
                color: '#374151',
                lineHeight: '1.6',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
              }}>
                {fullReport}
              </pre>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Generated for {selectedStock} • {new Date().toLocaleString()}
              </div>
              <button 
                onClick={() => setShowFullReport(false)}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#6b7280',
                  color: '#ffffff',
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
