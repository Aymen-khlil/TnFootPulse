import { describe, it, expect } from 'vitest'
import { contextScore } from './contextScore'

describe('contextScore', () => {
  it('assigns the documented stage bases', () => {
    expect(contextScore('final', false)).toBe(25)
    expect(contextScore('semi-final', false)).toBe(23)
    expect(contextScore('quarter-final', false)).toBe(20)
    expect(contextScore('knockout-round', false)).toBe(18)
    expect(contextScore('playoff', false)).toBe(16)
    expect(contextScore('group-phase', false)).toBe(8)
    expect(contextScore('league-match', false)).toBe(5)
  })

  it('adds the rivalry bonus to mid-stakes matches', () => {
    expect(contextScore('league-match', true)).toBe(15)
    expect(contextScore('group-phase', true)).toBe(18)
  })

  it('caps the combined score at 25', () => {
    expect(contextScore('final', true)).toBe(25)
    expect(contextScore('semi-final', true)).toBe(25)
  })
})
