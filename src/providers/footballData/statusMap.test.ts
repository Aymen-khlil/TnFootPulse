import { describe, it, expect } from 'vitest'
import { normalizeStatus } from './statusMap'

describe('footballData statusMap', () => {
  it('maps pre-match statuses to visible/scheduled', () => {
    expect(normalizeStatus('SCHEDULED')).toEqual({ visible: true, status: 'scheduled' })
    expect(normalizeStatus('TIMED')).toEqual({ visible: true, status: 'scheduled' })
  })

  it('maps in-play statuses to visible/live', () => {
    for (const status of ['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'SUSPENDED']) {
      const result = normalizeStatus(status)
      expect(result.visible).toBe(true)
      expect(result.status).toBe('live')
    }
  })

  it('hides finished/postponed/cancelled/awarded', () => {
    for (const status of ['FINISHED', 'POSTPONED', 'CANCELLED', 'AWARDED']) {
      expect(normalizeStatus(status).visible).toBe(false)
    }
  })

  it('treats unseen codes as invisible rather than crashing', () => {
    expect(normalizeStatus('SOMETHING_NEW')).toEqual({ visible: false, status: 'scheduled' })
  })
})
