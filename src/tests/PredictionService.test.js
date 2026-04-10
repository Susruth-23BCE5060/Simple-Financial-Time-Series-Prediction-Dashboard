// Integration tests — PredictionService
// Tests that the prediction pipeline produces valid, usable output
// under all conditions (no token, bad data, normal data).

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAIPrediction, statisticalForecast } from '../services/PredictionService'

// ── statisticalForecast (pure function — no mocking needed) ────────────────

describe('statisticalForecast — core algorithm', () => {

  it('returns the correct number of forecast days', () => {
    const prices = [100, 102, 101, 105, 107, 110, 108, 112]
    const result = statisticalForecast(prices, 7)
    expect(result).toHaveLength(7)
  })

  it('returns only positive prices (prices cannot go negative)', () => {
    const prices = [50, 48, 46, 44, 42, 40, 38]  // strong downtrend
    const result = statisticalForecast(prices, 7)
    result.forEach(p => expect(p).toBeGreaterThanOrEqual(0))
  })

  it('returns all numbers (no NaN or undefined in output)', () => {
    const prices = [150, 152, 149, 155, 160]
    const result = statisticalForecast(prices, 5)
    result.forEach(p => {
      expect(typeof p).toBe('number')
      expect(isNaN(p)).toBe(false)
    })
  })

  it('handles crypto-scale prices (BTC ~65000) without overflow', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 65000 + i * 100)
    const result = statisticalForecast(prices, 7)
    result.forEach(p => {
      expect(p).toBeGreaterThan(0)
      expect(p).toBeLessThan(1_000_000)
    })
  })

  it('handles a single-element array without crashing', () => {
    const result = statisticalForecast([200], 3)
    expect(result).toHaveLength(3)
    result.forEach(p => expect(p).toBe(200))
  })

  it('forecast follows an uptrend in a rising market', () => {
    // Clear uptrend — forecast average should be above the last price
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 5) // 100→195
    const result = statisticalForecast(prices, 7)
    const avgForecast = result.reduce((s, v) => s + v, 0) / result.length
    expect(avgForecast).toBeGreaterThan(prices[prices.length - 1])
  })

  it('forecast follows a downtrend in a falling market', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 300 - i * 8) // 300→148
    const result = statisticalForecast(prices, 7)
    const avgForecast = result.reduce((s, v) => s + v, 0) / result.length
    expect(avgForecast).toBeLessThan(prices[prices.length - 1])
  })

})

// ── generateAIPrediction — integration (mocks the network) ────────────────

describe('generateAIPrediction — integration with HuggingFace', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', undefined)  // reset each test
  })

  it('falls back to statistical forecast when no HF token is set', async () => {
    vi.stubEnv('VITE_HUGGING_FACE_TOKEN', '')
    const prices = [100, 102, 105, 103, 108, 110]
    const result = await generateAIPrediction(prices, 7)
    expect(result).toHaveLength(7)
    result.forEach(p => expect(typeof p).toBe('number'))
  })

  it('falls back gracefully when fetch throws a network error', async () => {
    vi.stubEnv('VITE_HUGGING_FACE_TOKEN', 'fake-token-123')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const prices = [200, 205, 210, 208, 215]
    const result = await generateAIPrediction(prices, 7)
    expect(result).toHaveLength(7)
    result.forEach(p => expect(p).toBeGreaterThan(0))
  })

  it('falls back gracefully when HF returns a non-OK status (503 cold start)', async () => {
    vi.stubEnv('VITE_HUGGING_FACE_TOKEN', 'fake-token-123')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Model loading' }),
    }))
    const prices = [150, 155, 160, 158, 162]
    const result = await generateAIPrediction(prices, 7)
    expect(result).toHaveLength(7)
  })

  it('uses the HF median forecast when the API returns valid sequences', async () => {
    vi.stubEnv('VITE_HUGGING_FACE_TOKEN', 'valid-token')
    // Simulate HuggingFace returning 3 sampled sequences
    const mockSequences = [
      [210, 215, 220, 218, 225, 230, 228],
      [208, 212, 218, 216, 222, 227, 225],
      [212, 217, 222, 220, 227, 232, 230],
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sequences: mockSequences }),
    }))
    const prices = Array.from({ length: 30 }, (_, i) => 200 + i)
    const result = await generateAIPrediction(prices, 7)
    expect(result).toHaveLength(7)
    // Median of [210,208,212] at index 0 is 210
    expect(result[0]).toBe(210)
  })

  it('filters out null and NaN values before sending to HF', async () => {
    vi.stubEnv('VITE_HUGGING_FACE_TOKEN', 'valid-token')
    let capturedBody
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_, opts) => {
      capturedBody = JSON.parse(opts.body)
      return { ok: true, json: async () => ({ sequences: [[100,101,102,103,104,105,106]] }) }
    }))
    const dirtyPrices = [100, null, 102, NaN, 104, null, 106]
    await generateAIPrediction(dirtyPrices, 7)
    // None of the values sent to the model should be null/NaN
    capturedBody.inputs.past_values.forEach(v => {
      expect(v).not.toBeNull()
      expect(isNaN(v)).toBe(false)
    })
  })

})
