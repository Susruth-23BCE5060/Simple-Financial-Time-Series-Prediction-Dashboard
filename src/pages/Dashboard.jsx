// src/pages/Dashboard.jsx
import { useState } from "react";
import { logoutUser } from "../services/AuthService";
import StockChart from "../components/StockChart";
import { processForecastRequest } from "../controllers/DashboardController";

const QUICK_TICKERS = ["BTC-USD", "AAPL", "TSLA", "NVDA", "ETH-USD", "MSFT"];

export default function Dashboard() {
  const [ticker, setTicker] = useState("BTC-USD");
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async (t) => {
    const sym = (t || ticker).trim().toUpperCase();
    if (!sym) return;
    setError(null);
    setIsLoading(true);
    try {
      const data = await processForecastRequest(sym);
      setChartData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handlePredict();
  };

  const fmt = (n) =>
    n == null
      ? "—"
      : n >= 1000
      ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${n.toFixed(2)}`;

  const pctColor = (n) => (n >= 0 ? "#34D399" : "#F87171");
  const arrow = (n) => (n >= 0 ? "↑" : "↓");

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">↗</span>
          <span className="logo-text">FinSight</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Quick Picks</span>
          {QUICK_TICKERS.map((t) => (
            <button
              key={t}
              className={`quick-btn ${chartData?.ticker === t ? "active" : ""}`}
              onClick={() => { setTicker(t); handlePredict(t); }}
            >
              {t}
            </button>
          ))}
        </nav>

        <button className="logout-btn" onClick={logoutUser}>
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="dash-main">
        {/* Top bar */}
        <header className="dash-header">
          <h2 className="dash-heading">AI Price Forecast</h2>
          <div className="search-row">
            <input
              className="ticker-input"
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={handleKey}
              placeholder="Enter symbol…"
              spellCheck={false}
            />
            <button
              className="predict-btn"
              onClick={() => handlePredict()}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                "Run Forecast →"
              )}
            </button>
          </div>
        </header>

        {/* Stats row */}
        {chartData && !isLoading && (
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Ticker</span>
              <span className="stat-value">{chartData.ticker}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Current Price</span>
              <span className="stat-value">{fmt(chartData.lastPrice)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">7-Day Forecast</span>
              <span className="stat-value">{fmt(chartData.forecastedPrice)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Expected Δ</span>
              <span
                className="stat-value"
                style={{ color: pctColor(chartData.priceChangePct) }}
              >
                {arrow(chartData.priceChangePct)}{" "}
                {Math.abs(chartData.priceChangePct).toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="chart-card">
          {isLoading ? (
            <div className="chart-placeholder">
              <div className="loading-pulse" />
              <p>Fetching market data &amp; running AI inference…</p>
            </div>
          ) : error ? (
            <div className="chart-placeholder error">
              <p>⚠ {error}</p>
              <button className="retry-btn" onClick={() => handlePredict()}>
                Retry
              </button>
            </div>
          ) : chartData ? (
            <StockChart
              labels={chartData.labels}
              historicalData={chartData.history}
              predictedData={chartData.prediction}
              ticker={chartData.ticker}
            />
          ) : (
            <div className="chart-placeholder">
              <p className="placeholder-hint">
                Select a ticker above or pick a quick symbol to generate your AI forecast.
              </p>
            </div>
          )}
        </div>

        <p className="disclaimer">
          ⚠ AI forecasts are for educational purposes only and do not constitute financial advice.
        </p>
      </main>
    </div>
  );
}
