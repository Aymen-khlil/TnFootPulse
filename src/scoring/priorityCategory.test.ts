import { describe, it, expect } from 'vitest'
import {
  getPriorityCategory,
  PRIORITY_CATEGORY_ORDER,
  priorityCategoryMeta,
} from './priorityCategory'

describe('priority categories', () => {
  it('maps every score to its band', () => {
    expect(getPriorityCategory(95)).toBe('must-watch')
    expect(getPriorityCategory(85)).toBe('high-priority')
    expect(getPriorityCategory(72)).toBe('worth-watching')
    expect(getPriorityCategory(60)).toBe('if-you-have-time')
    expect(getPriorityCategory(10)).toBe('low-priority')
  })

  it('places boundary values correctly', () => {
    expect(getPriorityCategory(54)).toBe('low-priority')
    expect(getPriorityCategory(55)).toBe('if-you-have-time')
    expect(getPriorityCategory(69)).toBe('if-you-have-time')
    expect(getPriorityCategory(70)).toBe('worth-watching')
    expect(getPriorityCategory(79)).toBe('worth-watching')
    expect(getPriorityCategory(80)).toBe('high-priority')
    expect(getPriorityCategory(89)).toBe('high-priority')
    expect(getPriorityCategory(90)).toBe('must-watch')
  })

  it('exposes metadata for every category in display order', () => {
    expect(PRIORITY_CATEGORY_ORDER).toEqual([
      'must-watch',
      'high-priority',
      'worth-watching',
      'if-you-have-time',
      'low-priority',
    ])
    for (const name of PRIORITY_CATEGORY_ORDER) {
      const meta = priorityCategoryMeta(name)
      expect(meta.label.length).toBeGreaterThan(0)
      expect(meta.emoji.length).toBeGreaterThan(0)
    }
  })
})
