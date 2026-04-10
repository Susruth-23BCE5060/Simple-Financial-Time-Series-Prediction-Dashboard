// Integration tests — MarketDataService
// Tests the full fetch → parse → fallback pipeline.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchHistoricalData } from '../services/MarketDataService'

// Mock Firebase so tests never need a real Firestore connection
vi.mock('../services/firebaseConfig', () => ({
  db: {},
}))
vi.mock('firebase/firestore', () => ({
  doc:             vi.fn(() => ({})),
  getDoc:          vi.fn(async () => ({ exists: () => false })),
  setDoc:          vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => ({ toMillis: () => Date.now() })),
}))

const makeYahooResponse = (ticker, days = 30) => {
  const base = ticker.includes('BTC') ? 65000 : 150
  const now = Math.floor(Date.now() / 1000)
  const timestamps = Array.from({ length: days }, (_, i) => now - (days - i) * 86400)
  const close = timestamps.map(() => base + (Math.random() - 0.5) * base * 0.05)
  return {
    chart: { result: [{ timestamp: timestamps, indicators: { quote: [{ close }] } }] },
  }
}

describe('fetchHistoricalData — integration', () => {

  afterEach(() => { vi.restoreAllMocks() })

  it('returns labels and prices arrays for a valid ticker', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeYahooResponse('AAPL'),
    }))
    const result = await fetchHistoricalData('AAPL')
    expect(result).toHaveProperty('labels')
    expect(result).toHaveProperty('prices')
    expect(result.labels.length).toBe(result.prices.length)
    expect(result.prices.length).toBeGreaterThan(0)
  })

  it('returns mock data when all proxies fail (no crash)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')))
    const result = await fetchHistoricalData('TSLA')
    expect(result.prices.length).toBeGreaterThan(0)
    expect(result.labels.length).toBe(result.prices.length)
  })

  it('returns mock data when proxy returns a non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    const result = await fetchHistoricalData('NVDA')
    expect(result.prices).toBeDefined()
    expect(result.prices.every(p => typeof p === 'number')).toBe(true)
  })

  it('filters out null close prices from Yahoo response', async () => {
    const now = Math.floor(Date.now() / 1000)
    const timestamps = [now - 4*86400, now - 3*86400, now - 2*86400, now - 86400, now]
    const closeWithNulls = [150, null, 155, null, 160]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: { result: [{ timestamp: timestamps, indicators: { quote: [{ close: closeWithNulls }] } }] },
      }),
    }))
    const result = await fetchHistoricalData('AAPL')
    result.prices.forEach(p => {
      expect(p).not.toBeNull()
      expect(isNaN(p)).toBe(false)
    })
  })

  it('uses correct base price for BTC in mock fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const result = await fetchHistoricalData('BTC-USD')
    const avg = result.prices.reduce((s, p) => s + p, 0) / result.prices.length
    // BTC base is 65000 — average should be in a reasonable range
    expect(avg).toBeGreaterThan(40000)
    expect(avg).toBeLessThan(100000)
  })

  it('uses correct base price for ETH in mock fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const result = await fetchHistoricalData('ETH-USD')
    const avg = result.prices.reduce((s, p) => s + p, 0) / result.prices.length
    expect(avg).toBeGreaterThan(1000)
    expect(avg).toBeLessThan(10000)
  })

  it('all returned prices are positive numbers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const result = await fetchHistoricalData('MSFT')
    result.prices.forEach(p => {
      expect(p).toBeGreaterThan(0)
      expect(typeof p).toBe('number')
    })
  })

})
