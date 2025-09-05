# stock-risk-analyzer
Risk Management Tool (inspired by Hedgeye)

# Professional Stock Risk Analyzer

A comprehensive stock analysis tool with real-time market data, risk assessment, and portfolio management capabilities.

## Features

- 📈 **Real-time Stock Data** - Live market data via Finnhub API
- 🎯 **Risk Analysis** - Comprehensive multi-factor risk assessment
- 📊 **Technical Indicators** - RSI, Beta, Volatility analysis
- 📋 **Portfolio Management** - Add/remove stocks, track performance
- 📄 **Comprehensive Reports** - Detailed analysis with investment recommendations
- 💾 **Data Export** - CSV and Markdown report downloads
- 📱 **Responsive Design** - Works on desktop and mobile

## Quick Deploy to Vercel

1. **Create a new repository** with these files
2. **Connect to Vercel** - Import your repository
3. **Deploy** - Vercel will automatically build and deploy

## File Structure

```
your-project/
├── package.json
├── next.config.js
├── vercel.json
├── README.md
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js
│   └── api/
│       └── stock-data.js
```

## Environment Setup

The Finnhub API key is already configured in `pages/api/stock-data.js`. For production, consider moving it to environment variables:

1. Add to Vercel environment variables: `FINNHUB_API_KEY`
2. Update `pages/api/stock-data.js` to use `process.env.FINNHUB_API_KEY`

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Usage

1. **Add Stocks** - Enter ticker symbols (AAPL, MSFT, etc.)
2. **View Analysis** - Real-time data with risk metrics
3. **Generate Reports** - Comprehensive analysis reports
4. **Export Data** - Download CSV or Markdown reports
5. **Manage Portfolio** - Add/remove stocks as needed

## API Integration

Uses Finnhub.io for real-time stock data:
- Quote data (price, change, volume)
- Company profiles
- Technical indicators

## Risk Analysis Framework

The app implements a comprehensive risk assessment including:
- **Multi-timeframe Analysis** - Short and medium-term ranges
- **Technical Indicators** - RSI, Beta, Volatility
- **Volume Analysis** - Trading patterns and sentiment
- **Risk Scoring** - 0-100 composite risk rating
- **Position Sizing** - Risk-based portfolio recommendations

## Deployment Notes

- **Serverless Functions** - API routes auto-deploy as serverless functions
- **CORS Configured** - Headers set for cross-origin requests
- **CDN Optimized** - Static assets served via Vercel's global CDN
- **Auto HTTPS** - SSL certificates automatically provisioned

## Support

For issues or questions:
1. Check the Vercel deployment logs
2. Verify API key is working
3. Test individual API endpoints

Built with Next.js, React, and Tailwind CSS.
