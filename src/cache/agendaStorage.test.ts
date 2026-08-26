import { describe, it, expect, beforeEach } from 'vitest'
import type { ScoredMatch } from '@/types/football'
import {
  saveAgenda,
  loadFreshAgenda,
  clearAgendaStorage,
  useStoreForTests,
} from './agendaStorage'

function resetStoreToMemory(): Map<string, string> {
  const backing = new Map<string, string>()
  useStoreForTests({
    getItem: (k) => backing.get(k) ?? null,
    setItem: (k, v) => void backing.set(k, v),
    removeItem: (k) => void backing.delete(k),
    keys: () => Array.from(backing.keys()),
  })
  return backing
}

function scored(id: string, kickoffIso: string): ScoredMatch {
  return {
    match: {
      id,
      homeTeam: { id: 'h', name: 'Espérance Sportive de Tunis', rating: 80 },
      awayTeam: { id: 'a', name: 'Club Africain', rating: 76 },
      competition: { id: 'tunisian-ligue-1', name: 'Ligue 1', country: 'Tunisia', rating: 14 },
      kickoff: new Date(kickoffIso),
      tunisDateKey: kickoffIso.slice(0, 10),
      tunisMinuteOfDay: 19 * 60,
      stage: 'league-match',
      status: 'scheduled',
      source: 'api-football',
    },
    priority: {
      total: 71,
      competition: 14,
      teams: 20,
      context: 15,
      tunisiaTime: 22,
      pedigree: 0,
      category: 'worth-watching',
      reasons: ['Derby'],
    },
  }
}

const NOW = Date.parse('2026-08-26T09:00:00Z')
const HOUR = 3_600_000

describe('agendaStorage — persistence semantics', () => {
  beforeEach(() => {
    useStoreForTests(null)
    clearAgendaStorage()
  })

  it('round-trips a snapshot and revives kickoff as a real Date', () => {
    const snapshot = {
      matches: [scored('m1', '2026-08-26T18:00:00Z')],
      providerNotices: ['European fixtures are running on the backup source — today and tomorrow only.'],
    }

    saveAgenda('2026-08-26', snapshot, 3 * HOUR, NOW)
    const loaded = loadFreshAgenda('2026-08-26', NOW + 1_000)

    expect(loaded).not.toBeNull()
    expect(loaded?.matches).toHaveLength(1)
    expect(loaded?.matches[0].match.kickoff).toBeInstanceOf(Date)
    expect(loaded?.matches[0].match.kickoff.getTime()).toBe(Date.parse('2026-08-26T18:00:00Z'))
    expect(loaded?.matches[0].priority.total).toBe(71)
    expect(loaded?.providerNotices).toEqual(snapshot.providerNotices)
  })

  it('returns null once the freshness window has passed', () => {
    saveAgenda('2026-08-26', { matches: [scored('m1', '2026-08-26T18:00:00Z')], providerNotices: [] }, HOUR, NOW)

    expect(loadFreshAgenda('2026-08-26', NOW + HOUR - 1)).not.toBeNull()
    expect(loadFreshAgenda('2026-08-26', NOW + HOUR)).toBeNull()
  })

  it('treats corrupt entries as absent and evicts them', () => {
    const backing = resetStoreToMemory()

    const key = 'tfp:agenda:v2:curated:2026-08-26'
    backing.set(key, '{not-json-at-all')

    expect(loadFreshAgenda('2026-08-26', NOW)).toBeNull()
    // The bad entry was evicted so it cannot wedge the date forever.
    expect(backing.has(key)).toBe(false)
  })

  it('namespaces snapshots per Source Mode so pipelines never collide', () => {
    const snapshotA = { matches: [scored('m1', '2026-08-26T18:00:00Z')], providerNotices: [] }
    const snapshotB = { matches: [scored('m2', '2026-08-26T19:00:00Z')], providerNotices: ['espn'] }

    saveAgenda('2026-08-26', snapshotA, 3 * HOUR, NOW, 'curated')
    saveAgenda('2026-08-26', snapshotB, 3 * HOUR, NOW, 'espn')

    expect(loadFreshAgenda('2026-08-26', NOW, 'curated')?.matches[0].match.id).toBe('m1')
    expect(loadFreshAgenda('2026-08-26', NOW, 'espn')?.matches[0].match.id).toBe('m2')
    // An unknown mode reads nothing — never silently falls back.
    expect(loadFreshAgenda('2026-08-26', NOW, 'unknown' as never)).toBeNull()

    clearAgendaStorage()
    expect(loadFreshAgenda('2026-08-26', NOW, 'curated')).toBeNull()
    expect(loadFreshAgenda('2026-08-26', NOW, 'espn')).toBeNull()
  })

  it('clearAgendaStorage drops every persisted date but nothing else survives a bad write', () => {
    saveAgenda('2026-08-26', { matches: [scored('m1', '2026-08-26T18:00:00Z')], providerNotices: [] }, 3 * HOUR, NOW)
    saveAgenda('2026-08-27', { matches: [scored('m2', '2026-08-27T18:00:00Z')], providerNotices: [] }, 3 * HOUR, NOW)

    expect(loadFreshAgenda('2026-08-26', NOW)).not.toBeNull()
    expect(loadFreshAgenda('2026-08-27', NOW)).not.toBeNull()

    clearAgendaStorage()

    expect(loadFreshAgenda('2026-08-26', NOW)).toBeNull()
    expect(loadFreshAgenda('2026-08-27', NOW)).toBeNull()
  })
})
