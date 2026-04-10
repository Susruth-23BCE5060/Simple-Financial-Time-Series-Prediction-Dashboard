// src/controllers/DashboardController.js
import { fetchHistoricalData } from "../services/MarketDataService";
import { generateAIPrediction } from "../services/PredictionService";
import { db } from "../services/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const PREDICTION_CACHE = "predictionCache";
const PREDICTION_TTL_MS = 24 * 60 * 60 * 1000;

const firestoreWithTimeout = (promise, ms = 4000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore timeout")), ms)
    ),
  ]);

export const processForecastRequest = async (ticker) => {
  const key = ticker.toUpperCase();

  // 1. Check prediction cache and fetch market data IN PARALLEL
  //    — don't wait for Firestore before starting the market fetch
  const [cachedSnap, marketData] = await Promise.all([
    firestoreWithTimeout(getDoc(doc(db, PREDICTION_CACHE, key))).catch(() => null),
    fetchHistoricalData(key),
  ]);

  // 2. Return cached prediction if still valid
  if (cachedSnap?.exists?.()) {
    const { result, fetchedAt } = cachedSnap.data();
    if (Date.now() - fetchedAt.toMillis() < PREDICTION_TTL_MS) {
      console.log(`Prediction cache hit for ${key}`);
      return result;
    }
  }

  // 3. Run forecast (instant statistical if no HF token)
  const FORECAST_DAYS = 7;
  const futurePrices = await generateAIPrediction(marketData.prices, FORECAST_DAYS);

  // 4. Build date labels for forecast window
  const futureLabels = Array.from({ length: FORECAST_DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const lastHistoricalPrice = marketData.prices[marketData.prices.length - 1];

  const finalResult = {
    labels: [...marketData.labels, ...futureLabels],
    history: [...marketData.prices, ...Array(FORECAST_DAYS).fill(null)],
    prediction: [
      ...Array(marketData.prices.length - 1).fill(null),
      lastHistoricalPrice,
      ...futurePrices,
    ],
    ticker: key,
    lastPrice: lastHistoricalPrice,
    forecastedPrice: futurePrices[futurePrices.length - 1],
    priceChange: futurePrices[futurePrices.length - 1] - lastHistoricalPrice,
    priceChangePct:
      ((futurePrices[futurePrices.length - 1] - lastHistoricalPrice) /
        lastHistoricalPrice) * 100,
  };

  // 5. Cache in background — never block the UI on this
  firestoreWithTimeout(
    setDoc(doc(db, PREDICTION_CACHE, key), {
      result: finalResult,
      fetchedAt: serverTimestamp(),
    })
  ).catch(() => {});

  return finalResult;
};
