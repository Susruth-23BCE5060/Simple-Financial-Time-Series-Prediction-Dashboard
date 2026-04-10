// Integration tests — DashboardController
// Tests that the controller correctly wires market data + prediction
// into the final chart-ready result object.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processForecastRequest } from '../controllers/DashboardController'

// Mock Firebase
vi.mock('../services/firebaseConfig', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc:             vi.fn(() => ({})),
  getDoc:          vi.fn(async () => ({ exists: () => false })),
  setDoc:          vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
}))

// Mock the two services so controller tests are isolated
vi.mock('../services/MarketDataService', () => ({
  fetchHistoricalData: vi.fn(async (ticker) => ({
    labels: Array.from({ length: 30 }, (_, i) => `Apr ${i + 1}`),
    prices: Array.from({ length: 30 }, (_, i) => 100 + i * 2),
  })),
}))

vi.mock('../services/PredictionService', () => ({
  generateAIPrediction: vi.fn(async () => [162, 164, 163, 166, 168, 167, 170]),
}))

describe('processForecastRequest — controller integration', () => {

  it('returns an object with all required chart fields', async () => {
    const result = await processForecastRequest('AAPL')
    expect(result).toHaveProperty('labels')
    expect(result).toHaveProperty('history')
    expect(result).toHaveProperty('prediction')
    expect(result).toHaveProperty('ticker')
    expect(result).toHaveProperty('lastPrice')
    expect(result).toHaveProperty('forecastedPrice')
    expect(result).toHaveProperty('priceChangePct')
  })

  it('ticker is always uppercased in the result', async () => {
    const result = await processForecastRequest('aapl')
    expect(result.ticker).toBe('AAPL')
  })

  it('total labels = historical days + 7 forecast days', async () => {
    const result = await processForecastRequest('TSLA')
    expect(result.labels).toHaveLength(30 + 7)
  })

  it('history array has 7 nulls padded at the end', async () => {
    const result = await processForecastRequest('TSLA')
    const tail = result.history.slice(-7)
    tail.forEach(v => expect(v).toBeNull())
  })

  it('prediction array has nulls before the bridge point', async () => {
    const result = await processForecastRequest('TSLA')
    // First 29 values should be null (before the bridge)
    const head = result.prediction.slice(0, 29)
    head.forEach(v => expect(v).toBeNull())
  })

  it('bridge point connects history and prediction at the last historical price', async () => {
    const result = await processForecastRequest('TSLA')
    // Index 29 (last history index) should be the bridge — same as lastPrice
    expect(result.prediction[29]).toBe(result.lastPrice)
  })

  it('priceChangePct is calculated correctly', async () => {
    const result = await processForecastRequest('BTC-USD')
    const expected = ((result.forecastedPrice - result.lastPrice) / result.lastPrice) * 100
    expect(result.priceChangePct).toBeCloseTo(expected, 5)
  })

  it('history and labels arrays have the same length', async () => {
    const result = await processForecastRequest('NVDA')
    expect(result.history.length).toBe(result.labels.length)
  })

  it('prediction and labels arrays have the same length', async () => {
    const result = await processForecastRequest('NVDA')
    expect(result.prediction.length).toBe(result.labels.length)
  })

  it('returns cached result on second call without re-fetching', async () => {
    const { getDoc } = await import('firebase/firestore')
    const { fetchHistoricalData } = await import('../services/MarketDataService')

    // Simulate a warm cache
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        result: { labels: ['cached'], history: [999], prediction: [999], ticker: 'AAPL',
                  lastPrice: 999, forecastedPrice: 1000, priceChangePct: 0.1, priceChange: 1 },
        fetchedAt: { toMillis: () => Date.now() - 1000 }, // 1 second old
      }),
    })

    const result = await processForecastRequest('AAPL')
    expect(result.labels).toEqual(['cached'])
    // fetchHistoricalData should NOT have been called (cache hit)
    expect(fetchHistoricalData).not.toHaveBeenCalled()
  })

})
