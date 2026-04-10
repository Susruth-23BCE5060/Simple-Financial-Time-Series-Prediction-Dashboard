// src/services/PredictionService.js
const HUGGING_FACE_TOKEN = import.meta.env.VITE_HUGGING_FACE_TOKEN;
const MODEL_URL = "https://api-inference.huggingface.co/models/amazon/chronos-t5-small";

const fetchWithTimeout = (url, options, ms = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

export const generateAIPrediction = async (historicalPrices, forecastDays = 7) => {
  const cleanPrices = historicalPrices.filter((p) => p != null && !isNaN(p));

  if (!HUGGING_FACE_TOKEN || HUGGING_FACE_TOKEN === "your_token_here") {
    return statisticalForecast(cleanPrices, forecastDays);
  }

  try {
    const response = await fetchWithTimeout(
      MODEL_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: { past_values: cleanPrices, prediction_length: forecastDays },
        }),
      },
      12000 // 12s hard timeout — if HuggingFace doesn't respond, bail out
    );

    if (!response.ok) {
      console.warn(`HuggingFace ${response.status} — using statistical fallback`);
      return statisticalForecast(cleanPrices, forecastDays);
    }

    const result = await response.json();
    if (result?.sequences?.length > 0) {
      return Array.from({ length: forecastDays }, (_, i) => {
        const values = result.sequences.map((s) => s[i]).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        return values.length % 2 !== 0
          ? values[mid]
          : (values[mid - 1] + values[mid]) / 2;
      });
    }
  } catch (e) {
    console.warn("HuggingFace timed out or failed — using statistical fallback:", e.message);
  }

  return statisticalForecast(cleanPrices, forecastDays);
};

// Weighted linear regression + volatility noise
export const statisticalForecast = (prices, days = 7) => {
  const n = prices.length;
  if (n < 2) return Array(days).fill(prices[0] ?? 0);

  const weights = prices.map((_, i) => Math.pow(1.5, i / n));
  const W   = weights.reduce((s, w)    => s + w, 0);
  const Wx  = weights.reduce((s, w, i) => s + w * i, 0);
  const Wy  = weights.reduce((s, w, i) => s + w * prices[i], 0);
  const Wxx = weights.reduce((s, w, i) => s + w * i * i, 0);
  const Wxy = weights.reduce((s, w, i) => s + w * i * prices[i], 0);
  const det = W * Wxx - Wx * Wx;
  const slope = det !== 0 ? (W * Wxy - Wx * Wy) / det : 0;
  const intercept = (Wy - slope * Wx) / W;

  const residuals = prices.map((p, i) => p - (intercept + slope * i));
  const stdDev = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n);

  return Array.from({ length: days }, (_, j) => {
    const trend = intercept + slope * (n + j);
    const noise = (Math.random() - 0.5) * stdDev * 0.4;
    return Math.max(0, trend + noise);
  });
};
