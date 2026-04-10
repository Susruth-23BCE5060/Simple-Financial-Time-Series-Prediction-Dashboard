# Testing Guide — Financial Dashboard

## Test Type: Integration Testing

Integration tests verify that individual service modules work correctly
**together** — MarketDataService feeding data into PredictionService,
and DashboardController wiring both into a chart-ready result.

---

## Setup

```bash
# 1. Install all dependencies (includes vitest, jsdom, coverage)
npm install

# 2. Run all tests
npm test

# 3. Run with coverage report
npm run test:coverage
```

---

## Test Files

| File | Tests | What it covers |
|------|-------|----------------|
| `src/tests/PredictionService.test.js` | 11 | Statistical forecast algorithm, HuggingFace API integration, fallback behaviour, null filtering |
| `src/tests/MarketDataService.test.js` | 7 | Yahoo Finance fetch, proxy fallback chain, null price filtering, mock data per ticker |
| `src/tests/DashboardController.test.js` | 10 | Full pipeline wiring, chart array padding, cache hit/miss, priceChangePct formula |

**Total: 28 integration tests**

---

## Expected Output

```
 RUN  v2.x.x

 ✓ src/tests/PredictionService.test.js (11 tests) 
 ✓ src/tests/MarketDataService.test.js (7 tests) 
 ✓ src/tests/DashboardController.test.js (10 tests) 

 Test Files  3 passed (3)
 Tests       28 passed (28)
 Duration    ~1.5s
```

---

## Docker

```bash
# Build the image
docker build -t financial-dashboard .

# Run on port 8080
docker run -p 8080:8080 financial-dashboard

# Open in browser
http://localhost:8080
```

---

## Environment Variables

Create a `.env` file in the project root:

```
VITE_HUGGING_FACE_TOKEN=your_token_here
```

If no token is provided, the app automatically uses the built-in
statistical forecast (weighted linear regression). No crashes.
