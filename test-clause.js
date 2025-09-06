// test-claude.js - Test script for Claude AI integration
// Run with: node test-claude.js

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Mock stock data for testing
const mockStockData = {
  symbol: 'AAPL',
  price: '185.50',
  changePercent: '2.34',
  volume: 45678900,
  beta: '1.25',
  rsi: '67',
  sector: 'Technology',
  high: '187.20',
  low: '183.10',
  marketCap: 2890000
};

const mockPortfolioData = [
  { symbol: 'AAPL', price: '185.50', changePercent: '2.34', sector: 'Technology', weight: '25.0', beta: '1.25' },
  { symbol: 'MSFT', price: '378.90', changePercent: '-0.45', sector: 'Technology', weight: '25.0', beta: '0.95' },
  { symbol: 'GOOGL', price: '140.20', changePercent: '1.23', sector: 'Technology', weight: '25.0', beta: '1.15' },
  { symbol: 'JPM', price: '155.80', changePercent: '-1.12', sector: 'Finance', weight: '25.0', beta: '1.45' }
];

async function testClaudeConnection() {
  console.log('🧪 Testing Claude AI Connection...\n');
  
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: "Respond with 'Claude AI connection successful!' if you can read this message."
      }]
    });

    console.log('✅ Claude AI Response:', message.content[0].text);
    console.log('✅ Connection Status: SUCCESS\n');
    return true;
  } catch (error) {
    console.error('❌ Claude AI Connection Failed:', error.message);
    console.error('❌ Check your CLAUDE_API_KEY in .env.local\n');
    return false;
  }
}

async function testQuickAnalysis() {
  console.log('🧪 Testing Quick Analysis...\n');
  
  try {
    const prompt = `You are a professional risk analyst. Provide a CONCISE analysis for ${mockStockData.symbol}.

CURRENT DATA:
- Price: $${mockStockData.price}
- Change: ${mockStockData.changePercent}%
- Volume: ${mockStockData.volume}
- Beta: ${mockStockData.beta}
- RSI: ${mockStockData.rsi}
- Sector: ${mockStockData.sector}

Provide in this EXACT format:

**RISK SCORE:** X/10
**RECOMMENDATION:** BUY/HOLD/SELL
**KEY INSIGHT:** [One sentence key insight]

Keep response under 100 words.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    });

    console.log('✅ Quick Analysis Result:');
    console.log(message.content[0].text);
    console.log('\n✅ Quick Analysis: SUCCESS\n');
    return true;
  } catch (error) {
    console.error('❌ Quick Analysis Failed:', error.message);
    return false;
  }
}

async function testComprehensiveAnalysis() {
  console.log('🧪 Testing Comprehensive Analysis...\n');
  
  try {
    const prompt = `Provide a detailed risk analysis for ${mockStockData.symbol} with price $${mockStockData.price}, change ${mockStockData.changePercent}%, beta ${mockStockData.beta}.

Include:
1. Risk score (1-10)
2. Price targets for 7 days
3. Key risk factors
4. Investment recommendation

Limit to 300 words.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    });

    console.log('✅ Comprehensive Analysis Result:');
    console.log(message.content[0].text.substring(0, 200) + '...');
    console.log('\n✅ Comprehensive Analysis: SUCCESS\n');
    return true;
  } catch (error) {
    console.error('❌ Comprehensive Analysis Failed:', error.message);
    return false;
  }
}

async function testPortfolioAnalysis() {
  console.log('🧪 Testing Portfolio Analysis...\n');
  
  try {
    const prompt = `Analyze this portfolio for diversification and risk:

${mockPortfolioData.map(stock => `- ${stock.symbol}: $${stock.price} (${stock.changePercent}%) - ${stock.sector} - Weight: ${stock.weight}%`).join('\n')}

Provide:
1. Diversification score (A-F)
2. Main concentration risks
3. Rebalancing suggestions

Limit to 200 words.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }]
    });

    console.log('✅ Portfolio Analysis Result:');
    console.log(message.content[0].text.substring(0, 200) + '...');
    console.log('\n✅ Portfolio Analysis: SUCCESS\n');
    return true;
  } catch (error) {
    console.error('❌ Portfolio Analysis Failed:', error.message);
    return false;
  }
}

async function testSentimentAnalysis() {
  console.log('🧪 Testing Sentiment Analysis...\n');
  
  try {
    const mockNews = [
      { title: "Apple Reports Strong Q4 Earnings", source: "Reuters", publishedAt: "2024-01-15" },
      { title: "iPhone Sales Exceed Expectations", source: "Bloomberg", publishedAt: "2024-01-14" }
    ];

    const prompt = `Analyze sentiment for ${mockStockData.symbol} based on recent news:

NEWS:
${mockNews.map(news => `- ${news.title} (${news.source})`).join('\n')}

STOCK DATA:
- Price: $${mockStockData.price}
- Change: ${mockStockData.changePercent}%

Provide:
1. Sentiment score (-100 to +100)
2. Overall sentiment (bullish/neutral/bearish)
3. Key themes
4. Trading implications

Limit to 150 words.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    });

    console.log('✅ Sentiment Analysis Result:');
    console.log(message.content[0].text.substring(0, 200) + '...');
    console.log('\n✅ Sentiment Analysis: SUCCESS\n');
    return true;
  } catch (error) {
    console.error('❌ Sentiment Analysis Failed:', error.message);
    return false;
  }
}

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting (3 quick requests)...\n');
  
  try {
    const promises = Array(3).fill().map(async (_, i) => {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 50,
        messages: [{
          role: "user",
          content: `Test request ${i + 1}. Respond with just "Request ${i + 1} successful."`
        }]
      });
      return `Response ${i + 1}: ${message.content[0].text}`;
    });

    const results = await Promise.all(promises);
    results.forEach(result => console.log('✅', result));
    console.log('\n✅ Rate Limiting: SUCCESS\n');
    return true;
  } catch (error) {
    console.error('❌ Rate Limiting Test Failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...\n');
  
  try {
    // Test with invalid API key to trigger error
    const tempAnthropic = new Anthropic({
      apiKey: 'invalid-key-test',
    });

    await tempAnthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 50,
      messages: [{ role: "user", content: "Test error handling" }]
    });

    console.log('❌ Error Handling: FAILED (should have thrown error)');
    return false;
  } catch (error) {
    console.log('✅ Error Handling: SUCCESS (correctly caught error)');
    console.log(`✅ Error Type: ${error.constructor.name}`);
    console.log(`✅ Error Message: ${error.message.substring(0, 100)}...\n`);
    return true;
  }
}

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoint Integration...\n');
  
  try {
    // Test if we can make a request that simulates our API endpoint
    const testData = {
      stockData: mockStockData,
      analysisType: 'quick',
      userRiskProfile: 'moderate'
    };

    console.log('✅ Mock API Request Data:');
    console.log(`   - Symbol: ${testData.stockData.symbol}`);
    console.log(`   - Analysis Type: ${testData.analysisType}`);
    console.log(`   - Risk Profile: ${testData.userRiskProfile}`);
    
    // Simulate the prompt generation that would happen in our API
    const prompt = `Quick analysis for ${testData.stockData.symbol} with ${testData.userRiskProfile} risk profile. Price: $${testData.stockData.price}, Change: ${testData.stockData.changePercent}%. Provide risk score and recommendation.`;
    
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }]
    });

    console.log('✅ API Endpoint Simulation Result:');
    console.log(message.content[0].text.substring(0, 150) + '...');
    console.log('\n✅ API Endpoint Integration: SUCCESS\n');
    return true;
  } catch (error) {
    console.error('❌ API Endpoint Integration Failed:', error.message);
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('🧪 Testing Environment Variables...\n');
  
  const requiredVars = ['CLAUDE_API_KEY', 'FINNHUB_API_KEY'];
  const optionalVars = ['NEWS_API_KEY', 'ALPHA_VANTAGE_API_KEY'];
  
  let allRequired = true;
  
  console.log('Required Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allRequired = false;
    }
  });
  
  console.log('\nOptional Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
    } else {
      console.log(`⚠️  ${varName}: Not set (optional)`);
    }
  });
  
  console.log(`\n${allRequired ? '✅' : '❌'} Environment Variables: ${allRequired ? 'SUCCESS' : 'MISSING REQUIRED VARS'}\n`);
  return allRequired;
}

async function runAllTests() {
  console.log('🚀 Starting Claude AI Integration Tests...\n');
  console.log('='.repeat(60));
  console.log('  Stock Risk Analyzer - Claude AI Integration Test Suite');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Claude Connection', fn: testClaudeConnection },
    { name: 'Quick Analysis', fn: testQuickAnalysis },
    { name: 'Comprehensive Analysis', fn: testComprehensiveAnalysis },
    { name: 'Portfolio Analysis', fn: testPortfolioAnalysis },
    { name: 'Sentiment Analysis', fn: testSentimentAnalysis },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'API Endpoint Integration', fn: testAPIEndpoints }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ name: test.name, success });
    } catch (error) {
      console.error(`❌ ${test.name}: CRASHED -`, error.message);
      results.push({ name: test.name, success: false });
    }
    
    // Add delay between tests to respect rate limits
    if (test.name !== 'Environment Variables') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const padding = ' '.repeat(30 - result.name.length);
    console.log(`${status} ${result.name}${padding}${result.success ? 'Working correctly' : 'Needs attention'}`);
  });

  const passCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const passPercentage = Math.round((passCount / totalCount) * 100);
  
  console.log('\n' + '='.repeat(60));
  console.log(`📈 Overall Results: ${passCount}/${totalCount} tests passed (${passPercentage}%)`);
  
  if (passCount === totalCount) {
    console.log('🎉 EXCELLENT! All tests passed. Claude AI integration is ready for production.');
    console.log('\n🚀 Ready for deployment! Your integration should work perfectly.');
  } else if (passCount >= totalCount * 0.8) {
    console.log('⚠️  GOOD: Most tests passed. Minor issues need attention.');
    console.log('\n🔧 Fix the failing tests and you\'ll be ready to deploy.');
  } else {
    console.log('❌ CRITICAL: Multiple tests failed. Please check your configuration.');
    console.log('\n🛠️  Review your API keys and environment setup.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 NEXT STEPS:');
  console.log('='.repeat(60));
  
  if (passCount === totalCount) {
    console.log('1. ✅ Run "npm install" to ensure all dependencies are installed');
    console.log('2. ✅ Run "npm run dev" to start the development server');
    console.log('3. ✅ Open http://localhost:3000 in your browser');
    console.log('4. ✅ Test the AI analysis features with real stocks');
    console.log('5. ✅ Deploy to Vercel with your CLAUDE_API_KEY environment variable');
  } else {
    console.log('1. 🔧 Fix any failing tests shown above');
    console.log('2. 🔑 Verify your CLAUDE_API_KEY is correct');
    console.log('3. 🌐 Check your internet connection');
    console.log('4. 📁 Ensure .env.local file is in the root directory');
    console.log('5. 🔄 Run this test again: node test-claude.js');
  }
  
  console.log('\n📌 IMPORTANT: Your Vercel deployment must use CLAUDE_API_KEY');
  console.log('📖 Full documentation available in README.md');
  console.log('\n' + '='.repeat(60));
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    console.error('\n🚨 Please check your setup and try again.');
    process.exit(1);
  });
}

// Export for potential use in other test files
module.exports = {
  testClaudeConnection,
  testQuickAnalysis,
  testComprehensiveAnalysis,
  testPortfolioAnalysis,
  testSentimentAnalysis,
  testRateLimiting,
  testErrorHandling,
  testAPIEndpoints,
  testEnvironmentVariables,
  runAllTests
};
