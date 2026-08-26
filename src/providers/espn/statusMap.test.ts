import { describe, it, expect } from 'vitest'
import { normalizeEspnStatus } from './statusMap'

describe('espnStatusMap', () => {
  it('maps pre-state to a visible scheduled match', () => {
    const result = normalizeEspnStatus('pre', undefined)
    expect(result.visible).toBe(true)
    expect(result.status).toBe('scheduled')
    expect(result.minuteElapsed).toBeUndefined()
  })

  it('maps in-state to live with minutes derived from the clock', () => {
    // Live probe evidence: clock 420s ↔ displayClock "7'"
    const result = normalizeEspnStatus('in', 420)
    expect(result.visible).toBe(true)
    expect(result.status).toBe('live')
    expect(result.minuteElapsed).toBe(7)
  })

  it('rounds fractional clocks down to whole minutes', () => {
    expect(normalizeEspnStatus('in', 2760).minuteElapsed).toBe(46)
  })

  it('keeps half-time live without an elapsed minute', () => {
    const result = normalizeEspnStatus('in', undefined)
    expect(result.visible).toBe(true)
    expect(result.status).toBe('live')
    expect(result.minuteElapsed).toBeUndefined()
  })

  it('hides finished matches (spec §12 parity: no finals anywhere)', () => {
    expect(normalizeEspnStatus('post', 5400).visible).toBe(false)
    expect(normalizeEspnStatus('post', 5400).status).toBe('scheduled')
  })

  it('treats unknown or missing states as hidden', () => {
    expect(normalizeEspnStatus(undefined, undefined).visible).toBe(false)
    expect(normalizeEspnStatus('weird', 100).visible).toBe(false)
  })
})
