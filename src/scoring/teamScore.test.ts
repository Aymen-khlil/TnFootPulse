import { describe, it, expect } from 'vitest'
import { teamScore } from './teamScore'
import type { Team } from '@/types/football'

function team(rating: number): Team {
  return { id: 'x', name: 'X', rating }
}

describe('teamScore', () => {
  it('reaches the 25 cap only for top-rated pairs', () => {
    expect(teamScore(team(100), team(100))).toBe(25)
  })

  it('rounds the scaled average to an integer', () => {
    // (100 + 99) / 2 = 99.5 → 99.5% of 25 = 24.875 → 25
    expect(teamScore(team(100), team(99))).toBe(25)
    // (96 + 95) / 2 = 95.5 → 23.875 → 24
    expect(teamScore(team(96), team(95))).toBe(24)
  })

  it('scores two unknown-quality teams (rating 30) as 8', () => {
    expect(teamScore(team(30), team(30))).toBe(8)
  })

  it('averages a rated opponent with an unknown side', () => {
    // (100 + 30) / 2 = 65 → 16.25 → 16
    expect(teamScore(team(100), team(30))).toBe(16)
  })

  it('never exceeds 25 or drops below 0', () => {
    expect(teamScore(team(200), team(200))).toBe(25)
    expect(teamScore(team(-50), team(-50))).toBe(0)
  })
})
