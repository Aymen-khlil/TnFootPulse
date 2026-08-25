import { describe, it, expect } from 'vitest'
import { normalizeStatus } from './statusMap'

describe('normalizeStatus', () => {
  it('keeps not-started fixtures as scheduled and visible', () => {
    expect(normalizeStatus('NS', null)).toEqual({
      visible: true,
      status: 'scheduled',
    })
  })

  it('maps every live state to visible/live with elapsed minutes', () => {
    for (const short of ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'SUSP', 'INT']) {
      const result = normalizeStatus(short, 34)
      expect(result.visible).toBe(true)
      expect(result.status).toBe('live')
      expect(result.minuteElapsed).toBe(34)
    }
  })

  it('hides finished, postponed, cancelled, abandoned, awarded and walkover states', () => {
    for (const short of ['TBD', 'FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO']) {
      expect(normalizeStatus(short, null).visible).toBe(false)
    }
  })

  it('treats unseen status codes as invisible rather than crashing', () => {
    expect(normalizeStatus('QQQ', null)).toEqual({ visible: false, status: 'scheduled' })
  })
})
