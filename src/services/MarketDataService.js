// src/services/MarketDataService.js
import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const CACHE_COLLECTION = "marketDataCache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Fetch with a hard timeout — never hangs forever
const fetchWithTimeout = (url, ms = 6000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
};

// Firestore read with timeout
const firestoreWithTimeout = (promise, ms = 4000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore timeout")), ms)
    ),
  ]);

// Multiple CORS proxies — try them in order until one works
const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://cors-anywhere.herokuapp.com/${url}`,
];

const fetchYahoo = async (ticker) => {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`;

  for (const makeProxy of PROXIES) {
    try {
      const res = await fetchWithTimeout(makeProxy(yahooUrl), 6000);
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const timestamps = result.timestamp;
      const closePrices = result.indicators.quote[0].close;

      const filtered = timestamps.reduce(
        (acc, ts, i) => {
          if (closePrices[i] != null && !isNaN(closePrices[i])) {
            acc.labels.push(
              new Date(ts * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            );
            acc.prices.push(closePrices[i]);
          }
          return acc;
        },
        { labels: [], prices: [] }
      );

      if (filtered.prices.length > 5) return filtered; // valid data
    } catch (e) {
      console.warn(`Proxy failed (${makeProxy(yahooUrl).slice(0, 40)}…):`, e.message);
    }
  }
  return null; // all proxies failed
};

export const fetchHistoricalData = async (ticker) => {
  const key = ticker.toUpperCase();

  // 1. Try Firestore cache (with timeout so it never blocks)
  try {
    const ref = doc(db, CACHE_COLLECTION, key);
    const snap = await firestoreWithTimeout(getDoc(ref));
    if (snap.exists()) {
      const { data, fetchedAt } = snap.data();
      if (Date.now() - fetchedAt.toMillis() < CACHE_TTL_MS) {
        console.log(`Cache hit for ${key}`);
        return data;
      }
    }
  } catch (e) {
    console.warn("Cache read skipped:", e.message);
  }

  // 2. Try live Yahoo Finance
  try {
    const liveData = await fetchYahoo(key);
    if (liveData) {
      // Cache in background — don't await, never block the UI
      firestoreWithTimeout(
        setDoc(doc(db, CACHE_COLLECTION, key), {
          data: liveData,
          fetchedAt: serverTimestamp(),
        })
      ).catch(() => {});
      return liveData;
    }
  } catch (e) {
    console.warn("Live fetch error:", e.message);
  }

  // 3. Always-works mock fallback
  console.warn("All sources failed — using mock data");
  return generateMockHistory(key);
};

const generateMockHistory = (ticker) => {
  const count = 60;
  const labels = Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const basePrices = {
    BTC: 65000, ETH: 3200, TSLA: 280,
    AAPL: 190, NVDA: 870, MSFT: 420,
  };
  let basePrice = 150;
  for (const [k, v] of Object.entries(basePrices)) {
    if (ticker.includes(k)) { basePrice = v; break; }
  }

  let price = basePrice;
  const prices = labels.map(() => {
    const drift = price * 0.001 * (Math.random() > 0.48 ? 1 : -1);
    const noise = price * 0.025 * (Math.random() - 0.5);
    price = Math.max(price * 0.8, price + drift + noise);
    return parseFloat(price.toFixed(2));
  });

  return { labels, prices };
};
