import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Plus, X, Download, FileText, Activity, Brain, Zap, RefreshCw, Clock } from 'lucide-react';

export default function StockAnalyzer() {
  const [stocks, setStocks] = useState(['AAPL', 'MSFT', 'GOOGL']);
  const [newStock, setNewStock] = useState('');
  const [stockData, setStockData] = useState({});
  const [analysisData, setAnalysisData] = useState({});
  const [loading, setLoading] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  const FINNHUB_API_KEY = 'd2tir69r01qr5a72r5d0d2tir69r01qr5a72r5dg';

  // Fetch stock data from Finnhub
  const fetchStockData = async (symbol) => {
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
      const quoteData = await response.json();
      
      if (quoteData.error) {
        throw new Error(quoteData.error);
      }

      const profileResponse = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
      const profileData = await profileResponse.json();

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
        sector: profileData.finnhubIndustry || 'Technology',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return getMockData(symbol);
    }
  };

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
      name: `${symbol} Corp`,
      sector: 'Technology',
      timestamp: new Date().toISOString()
    };
  };

  const runAIAnalysis = async (symbol) => {
    const data = stockData[symbol];
    if (!data) {
      await getStockData(symbol);
      return;
    }

    setAiLoading(prev => ({ ...prev, [symbol]: true }));

    try {
      const response = await fetch('/api/claude-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockData: data,
          analysisType: 'quick',
          userRiskProfile: 'moderate'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setAnalysisData(prev => ({ 
        ...prev, 
        [symbol]: {
          content: result.analysis,
          timestamp: result.timestamp,
          cached: result.cached || false,
          fallback: result.fallback || false
        }
      }));

    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisData(prev => ({ 
        ...prev, 
        [symbol]: {
          content: `**Analysis Error**\n\nUnable to generate AI analysis for ${symbol}. Please check your API configuration.`,
          timestamp: new Date().toISOString(),
          error: true
        }
      }));
    } finally {
      setAiLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  const addStock = () => {
    if (newStock && !stocks.includes(newStock.toUpperCase())) {
      setStocks([...stocks, newStock.toUpperCase()]);
      setNewStock('');
    }
  };

  const removeStock = (symbol) => {
    setStocks(stocks.filter(s => s !== symbol));
    const newStockData = { ...stockData };
    delete newStockData[symbol];
    setStockData(newStockData);
    const newAnalysisData = { ...analysisData };
    delete newAnalysisData[symbol];
    setAnalysisData(newAnalysisData);
  };

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

  const exportToCSV = () => {
    const headers = ['Symbol', 'Price', 'Change%', 'Volume', 'High', 'Low', 'AI Analysis'];
    const rows = stocks.map(symbol => {
      const data = stockData[symbol];
      const analysis = analysisData[symbol];
      return [
        symbol,
        data?.price || 'N/A',
        data?.changePercent || 'N/A',
        data?.volume || 'N/A',
        data?.high || 'N/A',
        data?.low || 'N/A',
        analysis ? 'Complete' : 'Pending'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
            <span className="text-gray-600">Finnhub (Live)</span>
            {lastUpdate && <span className="text-gray-500">• Updated {lastUpdate}</span>}
          </div>
        </div>

        {/* Controls */}
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
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stocks.map(symbol => {
          const data = stockData[symbol];
          const analysis = analysisData[symbol];
          const isLoading = loading[symbol];
          const isAiLoading = aiLoading[symbol];
          const changePercent = data ? parseFloat(data.changePercent) : 0;
          
          return (
            <div key={symbol} className="bg-white rounded-lg shadow-lg p-6">
              {/* Stock Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{symbol}</h3>
                  {data && <p className="text-sm text-gray-600">{data.name}</p>}
                </div>
                <button
                  onClick={() => removeStock(symbol)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
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
                    <div>Sector: <span className="font-medium">{data.sector}</span></div>
                  </div>

                  {/* AI Analysis Summary */}
                  {analysis && !analysis.error && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-purple-800 flex items-center gap-1">
                          <Brain size={14} />
                          AI Analysis
                        </h4>
                        {analysis.cached && <span className="bg-yellow-100 px-1 rounded text-xs">Cached</span>}
                      </div>
                      <div className="text-xs text-purple-700">
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
                  {isLoading ? 'Loading...' : 'Get Data'}
                </button>

                {data && (
                  <button
                    onClick={() => runAIAnalysis(symbol)}
                    disabled={isAiLoading}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? <Clock size={16} className="animate-spin" /> : <Zap size={16} />}
                    {isAiLoading ? 'Analyzing...' : 'AI Analysis'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
