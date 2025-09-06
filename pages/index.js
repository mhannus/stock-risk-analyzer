import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Plus, X, Download, FileText, Activity, Play, Clock, Trash2, Brain, Zap, BarChart3, Eye, Settings, RefreshCw } from 'lucide-react';

const EnhancedStockAnalyzer = () => {
  const [stocks, setStocks] = useState(['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']);
  const [newStock, setNewStock] = useState('');
  const [stockData, setStockData] = useState({});
  const [analysisData, setAnalysisData] = useState({});
  const [loading, setLoading] = useState({});
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState({});
  const [dataSource, setDataSource] = useState('Finnhub (Live)');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [userRiskProfile, setUserRiskProfile] = useState('moderate');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [showFullReport, setShowFullReport] = useState(false);
  const [fullReportContent, setFullReportContent] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [portfolioAnalysis, setPortfolioAnalysis] = useState(null);

  const FINNHUB_API_KEY = 'd2tir69r01qr5a72r5d0d2tir69r01qr5a72r5dg';

  // Risk profile options
  const riskProfiles = [
    { value: 'conservative', label: 'Conservative', color: 'green' },
    { value: 'moderate', label: 'Moderate', color: 'blue' },
    { value: 'aggressive', label: 'Aggressive', color: 'red' }
  ];

  // Analysis type options
  const analysisTypes = [
    { value: 'quick', label: 'Quick Analysis', icon: Zap, description: 'Fast, concise risk assessment' },
    { value: 'comprehensive', label: 'Comprehensive', icon: Brain, description: 'Detailed multi-factor analysis' },
    { value: 'sentiment', label: 'Sentiment Analysis', icon: Eye, description: 'News & market psychology' }
  ];

  // Fetch stock data from Finnhub
  const fetchStockData = async (symbol) => {
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
      const quoteData = await response.json();
      
      if (quoteData.error) {
        throw new Error(quoteData.error);
      }

      // Get additional company data
      const profileResponse = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
      const profileData = await profileResponse.json();

      // Calculate additional metrics
      const price = quoteData.c || 0;
      const previousClose = quoteData.pc || price;
      const change = quoteData.c - quoteData.pc;
      const changePercent = ((change / previousClose) * 100).toFixed(2);

      return {
        symbol,
        price: price.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent,
        high: quoteData.h?.toFixed(2) || 'N/A',
        low: quoteData.l?.toFixed(2) || 'N/A',
        volume: quoteData.v || 'N/A',
        previousClose: previousClose.toFixed(2),
        name: profileData.name || symbol,
        sector: profileData.finnhubIndustry || 'Unknown',
        marketCap: profileData.marketCapitalization || 'N/A',
        beta: (Math.random() * 2 + 0.5).toFixed(2), // Mock beta for demo
        rsi: (Math.random() * 100).toFixed(0), // Mock RSI for demo
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return getMockData(symbol);
    }
  };

  // Mock data fallback
  const getMockData = (symbol) => {
    const basePrice = Math.random() * 200 + 50;
    const change = (Math.random() - 0.5) * 10;
    return {
      symbol,
      price: basePrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: ((change / basePrice) * 100).toFixed(2),
      high: (basePrice + Math.random() * 5).toFixed(2),
      low: (basePrice - Math.random() * 5).toFixed(2),
      volume: Math.floor(Math.random() * 10000000),
      previousClose: (basePrice - change).toFixed(2),
      name: `${symbol} Corp`,
      sector: 'Technology',
      marketCap: Math.floor(Math.random() * 500000),
      beta: (Math.random() * 2 + 0.5).toFixed(2),
      rsi: (Math.random() * 100).toFixed(0),
      timestamp: new Date().toISOString()
    };
  };

  // Claude AI Analysis
  const runClaudeAnalysis = async (symbol, type = analysisType) => {
    const data = stockData[symbol];
    if (!data) {
      await getStockData(symbol);
      return;
    }

    setAiAnalysisLoading(prev => ({ ...prev, [symbol]: true }));

    try {
      const response = await fetch('/api/claude-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockData: data,
          analysisType: type,
          userRiskProfile: userRiskProfile,
          newsData: null // Could fetch news data here
        }),
      });

      const result = await response.json();
      
      if (result.error && result.fallback) {
        // Show warning but still display fallback analysis
        console.warn('Claude AI unavailable, using fallback analysis');
      }

      setAnalysisData(prev => ({ 
        ...prev, 
        [symbol]: {
          content: result.analysis,
          timestamp: result.timestamp,
          type: type,
          cached: result.cached || false,
          fallback: result.fallback || false
        }
      }));

    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisData(prev => ({ 
        ...prev, 
        [symbol]: {
          content: `**Analysis Error**\n\nUnable to generate AI analysis for ${symbol}. Please try again later.`,
          timestamp: new Date().toISOString(),
          type: type,
          error: true
        }
      }));
    } finally {
      setAiAnalysisLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  // Portfolio Analysis
  const runPortfolioAnalysis = async () => {
    const portfolioData = stocks
      .filter(symbol => stockData[symbol])
      .map(symbol => ({
        ...stockData[symbol],
        weight: (100 / stocks.length).toFixed(1) // Equal weight for demo
      }));

    if (portfolioData.length === 0) {
      alert('Please fetch stock data first before running portfolio analysis');
      return;
    }

    setAiAnalysisLoading(prev => ({ ...prev, portfolio: true }));

    try {
      const response = await fetch('/api/claude-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioData: portfolioData,
          analysisType: 'portfolio',
          userRiskProfile: userRiskProfile
        }),
      });

      const result = await response.json();
      setPortfolioAnalysis({
        content: result.analysis,
        timestamp: result.timestamp,
        cached: result.cached || false
      });

    } catch (error) {
      console.error('Portfolio analysis error:', error);
      setPortfolioAnalysis({
        content: 'Portfolio analysis temporarily unavailable. Please try again later.',
        error: true,
        timestamp: new Date().toISOString()
      });
    } finally {
      setAiAnalysisLoading(prev => ({ ...prev, portfolio: false }));
    }
  };

  // Bulk AI Analysis
  const runBulkAiAnalysis = async () => {
    for (const symbol of stocks) {
      if (stockData[symbol]) {
        await runClaudeAnalysis(symbol);
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // Add new stock
  const addStock = () => {
    if (newStock && !stocks.includes(newStock.toUpperCase())) {
      setStocks([...stocks, newStock.toUpperCase()]);
      setNewStock('');
    }
  };

  // Remove stock
  const removeStock = (symbol) => {
    setStocks(stocks.filter(s => s !== symbol));
    const newStockData = { ...stockData };
    delete newStockData[symbol];
    setStockData(newStockData);
    const newAnalysisData = { ...analysisData };
    delete newAnalysisData[symbol];
    setAnalysisData(newAnalysisData);
  };

  // Get stock data
  const getStockData = async (symbol) => {
    setLoading(prev => ({ ...prev, [symbol]: true }));
    try {
      const data = await fetchStockData(symbol);
      setStockData(prev => ({ ...prev, [symbol]: data }));
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  // Show full report modal
  const showFullReportModal = (symbol) => {
    setSelectedStock(symbol);
    const analysis = analysisData[symbol];
    setFullReportContent(analysis ? analysis.content : 'No analysis available');
    setShowFullReport(true);
  };

  // Export enhanced data
  const exportToCSV = () => {
    const headers = ['Symbol', 'Price', 'Change', 'Change%', 'Volume', 'High', 'Low', 'Beta', 'RSI', 'AI Analysis', 'Risk Profile'];
    const rows = stocks.map(symbol => {
      const data = stockData[symbol];
      const analysis = analysisData[symbol];
      return [
        symbol,
        data?.price || 'N/A',
        data?.change || 'N/A',
        data?.changePercent || 'N/A',
        data?.volume || 'N/A',
        data?.high || 'N/A',
        data?.low || 'N/A',
        data?.beta || 'N/A',
        data?.rsi || 'N/A',
        analysis ? 'Complete' : 'Pending',
        userRiskProfile
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_portfolio_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Portfolio summary with AI insights
  const getPortfolioSummary = () => {
    const totalStocks = stocks.length;
    const analyzedStocks = Object.keys(analysisData).length;
    const stocksWithData = Object.keys(stockData).length;
    const aiAnalyzedStocks = Object.values(analysisData).filter(a => !a.error).length;
    
    const signals = stocks.reduce((acc, symbol) => {
      const data = stockData[symbol];
      if (data) {
        if (parseFloat(data.changePercent) > 2) acc.buy++;
        else if (parseFloat(data.changePercent) < -2) acc.sell++;
        else acc.hold++;
      }
      return acc;
    }, { buy: 0, hold: 0, sell: 0 });

    return { totalStocks, analyzedStocks, stocksWithData, signals, aiAnalyzedStocks };
  };

  const summary = getPortfolioSummary();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Brain className="text-purple-600" />
            AI-Powered Stock Risk Analyzer
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">{dataSource}</span>
            {lastUpdate && <span className="text-gray-500">• Updated {lastUpdate}</span>}
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="text-purple-600" size={20} />
            <h3 className="font-semibold text-purple-800">AI Analysis Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Profile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Profile</label>
              <select
                value={userRiskProfile}
                onChange={(e) => setUserRiskProfile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {riskProfiles.map(profile => (
                  <option key={profile.value} value={profile.value}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Analysis Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Type</label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {analysisTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Portfolio Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.totalStocks}</div>
            <div className="text-sm text-gray-600">Total Stocks</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.aiAnalyzedStocks}</div>
            <div className="text-sm text-gray-600">AI Analyzed</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.signals.buy}</div>
            <div className="text-sm text-gray-600">Buy Signals</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{summary.signals.hold}</div>
            <div className="text-sm text-gray-600">Hold Signals</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.signals.sell}</div>
            <div className="text-sm text-gray-600">Sell Signals</div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <input
              type="text"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value.toUpperCase())}
              placeholder="Enter stock symbol (e.g., AAPL)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && addStock()}
            />
            <button
              onClick={addStock}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Stock
            </button>
          </div>
          
          <button
            onClick={runBulkAiAnalysis}
            disabled={Object.values(aiAnalysisLoading).some(loading => loading)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {Object.values(aiAnalysisLoading).some(loading => loading) ? (
              <Clock size={16} className="animate-spin" />
            ) : (
              <Brain size={16} />
            )}
            AI Bulk Analysis
          </button>

          <button
            onClick={runPortfolioAnalysis}
            disabled={aiAnalysisLoading.portfolio}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {aiAnalysisLoading.portfolio ? (
              <Clock size={16} className="animate-spin" />
            ) : (
              <BarChart3 size={16} />
            )}
            Portfolio Analysis
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={16} />
            Export Enhanced CSV
          </button>
        </div>
      </div>

      {/* Portfolio Analysis Card */}
      {portfolioAnalysis && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" />
              Portfolio Risk Analysis
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {portfolioAnalysis.cached && <span className="bg-yellow-100 px-2 py-1 rounded">Cached</span>}
              <span>{new Date(portfolioAnalysis.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
              {portfolioAnalysis.content}
            </pre>
          </div>
        </div>
      )}

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stocks.map(symbol => {
          const data = stockData[symbol];
          const analysis = analysisData[symbol];
          const isLoading = loading[symbol];
          const isAiLoading = aiAnalysisLoading[symbol];
          const changePercent = data ? parseFloat(data.changePercent) : 0;
          
          return (
            <div key={symbol} className="bg-white rounded-lg shadow-lg p-6">
              {/* Stock Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{symbol}</h3>
                  {data && <p className="text-sm text-gray-600">{data.name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {analysis && !analysis.error && (
                    <div className={`w-3 h-3 rounded-full ${
                      analysis.fallback ? 'bg-yellow-500' : 'bg-green-500'
                    }`} title={analysis.fallback ? 'Fallback Analysis' : 'AI Analysis'}></div>
                  )}
                  <button
                    onClick={() => removeStock(symbol)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Price Data */}
              {data ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${data.price}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                      changePercent > 0 ? 'bg-green-100 text-green-800' : 
                      changePercent < 0 ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {changePercent > 0 ? <TrendingUp size={14} /> : 
                       changePercent < 0 ? <TrendingDown size={14} /> : 
                       <AlertTriangle size={14} />}
                      {data.changePercent}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>High: <span className="font-medium">${data.high}</span></div>
                    <div>Low: <span className="font-medium">${data.low}</span></div>
                    <div>Volume: <span className="font-medium">{typeof data.volume === 'number' ? data.volume.toLocaleString() : data.volume}</span></div>
                    <div>Beta: <span className="font-medium">{data.beta}</span></div>
                    <div>RSI: <span className="font-medium">{data.rsi}</span></div>
                    <div>Sector: <span className="font-medium">{data.sector}</span></div>
                  </div>

                  {/* AI Analysis Summary */}
                  {analysis && !analysis.error && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-purple-800 flex items-center gap-1">
                          <Brain size={14} />
                          AI Insights
                        </h4>
                        <div className="flex items-center gap-1 text-xs">
                          {analysis.cached && <span className="bg-yellow-100 px-1 rounded">Cached</span>}
                          {analysis.fallback && <span className="bg-orange-100 px-1 rounded">Fallback</span>}
                          <span className="text-purple-600">{analysis.type}</span>
                        </div>
                      </div>
                      <div className="text-xs text-purple-700 line-clamp-3">
                        {analysis.content.split('\n').slice(0, 3).join(' ').substring(0, 150)}...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-500">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="animate-spin" />
                      Loading data...
                    </div>
                  ) : (
                    'No data loaded'
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => getStockData(symbol)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Clock size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {isLoading ? 'Loading...' : 'Refresh Data'}
                </button>

                {data && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => runClaudeAnalysis(symbol, 'quick')}
                      disabled={isAiLoading}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1 text-sm"
                    >
                      {isAiLoading ? <Clock size={14} className="animate-spin" /> : <Zap size={14} />}
                      Quick AI
                    </button>

                    <button
                      onClick={() => runClaudeAnalysis(symbol, analysisType)}
                      disabled={isAiLoading}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1 text-sm"
                    >
                      {isAiLoading ? <Clock size={14} className="animate-spin" /> : <Brain size={14} />}
                      Full AI
                    </button>
                  </div>
                )}

                {analysis && !analysis.error && (
                  <button
                    onClick={() => showFullReportModal(symbol)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    View Full Report
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Report Modal */}
      {showFullReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="text-purple-600" />
                AI Risk Analysis Report - {selectedStock}
              </h2>
              <button
                onClick={() => setShowFullReport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg border">
                  {fullReportContent}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  const blob = new Blob([fullReportContent], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${selectedStock}_ai_analysis_${new Date().toISOString().split('T')[0]}.md`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={16} />
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStockAnalyzer;
