// FILE: README.md
# Stock Risk Management Analyzer

A professional stock analysis tool with live Finnhub data integration, comprehensive risk scoring, and portfolio management features.

## Features

- **Live Stock Data**: Real-time prices from Finnhub API
- **Risk Analysis**: Advanced scoring algorithm with RSI, volatility, and beta calculations
- **Portfolio Management**: Add/remove stocks, bulk analysis, export capabilities
- **Professional Reports**: Detailed risk assessments with buy/sell signals
- **Modern UI**: Responsive design with interactive tooltips and real-time updates

## One-Click Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/stock-risk-analyzer&env=FINNHUB_API_KEY&envDescription=Your%20Finnhub%20API%20key%20for%20live%20stock%20data)

## Setup Instructions

1. **Clone/Download** this repository
2. **Get Finnhub API Key**: Sign up at [finnhub.io](https://finnhub.io) (free tier available)
3. **Deploy to Vercel**:
   - Connect your GitHub repository
   - Add your Finnhub API key as environment variable `FINNHUB_API_KEY`
   - Deploy automatically

## Environment Variables

```
FINNHUB_API_KEY=your_finnhub_api_key_here
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

- `GET /api/stock-data?ticker=AAPL` - Fetch stock data and analysis for a given ticker

## Technologies Used

- **Next.js 14** - React framework with serverless functions
- **React 18** - UI components and state management
- **Tailwind CSS** - Styling and responsive design
- **Lucide React** - Modern icon library
- **Finnhub API** - Live stock market data

## License

MIT License - feel free to use for personal or commercial projects.

// ==========================================
