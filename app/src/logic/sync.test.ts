/**
 * Unit tests for the pullCheckIns last-write-wins (LWW) merge in src/logic/sync.ts.
 *
 * pullCheckIns pulls remote check-ins from Supabase and merges them into the
 * local pulselog (AsyncStorage). Conflicts are resolved by timestamp: the entry
 * with the newer updated_at (parsed to epoch ms) wins. Rows without an
 * updated_at fall back to parsing the local_date string so older rows are still
 * ingested.
 *
 * Run with:
 *   npx jest --testPathPattern=sync.test.ts
 *
 * The shared src/__mocks__/supabase.ts exports supabase = null, which makes
 * every sync function a no-op. To exercise the merge we replace that module
 * here with a controllable chainable query-builder stub.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PulseEntry } from './pulselog';

// --- Controllable Supabase stub --------------------------------------------
// rowsToReturn is what the query chain resolves to as { data }.
let rowsToReturn: any[] | null = [];
const USER_ID = 'user-123';

jest.mock('./supabase', () => {
  // A chainable builder: every filter/order method returns the builder itself,
  // and the builder is awaitable, resolving to { data: rowsToReturn }.
  const makeBuilder = () => {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      gte: () => builder,
      order: () => builder,
      limit: () => builder,
      then: (resolve: (v: any) => any) =>
        resolve({ data: rowsToReturn, error: null }),
    };
    return builder;
  };
  return {
    supabase: {
      auth: {
        getUser: async () => ({ data: { user: { id: USER_ID } } }),
      },
      from: () => makeBuilder(),
    },
  };
});

// Pull in pullCheckIns AFTER the mock is registered.
import { pullCheckIns } from './sync';

const KEY = 'circadia.pulselog';

async function seedLocal(entries: PulseEntry[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}
async function readLocal(): Promise<PulseEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

// Helper: an ISO timestamp for a given day at a given hour (UTC).
const at = (day: string, hour = 12) =>
  new Date(day + 'T' + String(hour).padStart(2, '0') + ':00:00Z').toISOString();

beforeEach(async () => {
  rowsToReturn = [];
  await AsyncStorage.clear();
});

describe('pullCheckIns - LWW merge', () => {
  it('seeds local storage from remote when local is empty', async () => {
    rowsToReturn = [
      { local_date: '2026-01-10', level: 'steady', reason: 'sleep', updated_at: at('2026-01-10') },
      { local_date: '2026-01-11', level: 'wired', reason: null, updated_at: at('2026-01-11') },
    ];

    await pullCheckIns();

    const local = await readLocal();
    expect(local).toHaveLength(2);
    expect(local.map((e) => e.date)).toEqual(['2026-01-10', '2026-01-11']);
    expect(local[0].level).toBe('steady');
    // null reason from the row becomes undefined on the merged entry.
    expect(local[1].reason).toBeUndefined();
  });

  it('lets a strictly-newer remote entry overwrite the local one', async () => {
    await seedLocal([
      { date: '2026-01-10', level: 'flat', reason: 'work', ts: Date.parse(at('2026-01-10', 8)) },
    ]);
    rowsToReturn = [
      { local_date: '2026-01-10', level: 'wired', reason: 'people', updated_at: at('2026-01-10', 20) },
    ];

    await pullCheckIns();

    const local = await readLocal();
    expect(local).toHaveLength(1);
    expect(local[0].level).toBe('wired');
    expect(local[0].reason).toBe('people');
    expect(local[0].ts).toBe(Date.parse(at('2026-01-10', 20)));
  });

  it('keeps the local entry when the remote one is older', async () => {
    const localTs = Date.parse(at('2026-01-10', 20));
    await seedLocal([{ date: '2026-01-10', level: 'wired', reason: 'people', ts: localTs }]);
    rowsToReturn = [
      { local_date: '2026-01-10', level: 'flat', reason: 'work', updated_at: at('2026-01-10', 8) },
    ];

    await pullCheckIns();

    const local = await readLocal();
    expect(local).toHaveLength(1);
    expect(local[0].level).toBe('wired');
    expect(local[0].ts).toBe(localTs);
  });

  it('does not overwrite on an equal timestamp (strictly-newer only)', async () => {
    const ts = Date.parse(at('2026-01-10', 12));
    await seedLocal([{ date: '2026-01-10', level: 'steady', reason: 'body', ts }]);
    rowsToReturn = [
      { local_date: '2026-01-10', level: 'wired', reason: 'work', updated_at: at('2026-01-10', 12) },
    ];

    await pullCheckIns();

    const local = await readLocal();
    expect(local[0].level).toBe('steady');
    expect(local[0].reason).toBe('body');
  });

  it('falls back to the date string when a remote row has no updated_at', async () => {
    rowsToReturn = [{ local_date: '2026-01-10', level: 'steady', reason: null, updated_at: null }];

    await pullCheckIns();

    const local = await readLocal();
    expect(local).toHaveLength(1);
    expect(local[0].ts).toBe(Date.parse('2026-01-10'));
  });

  it('merges remote with existing local and sorts by date ascending', async () => {
    await seedLocal([
      { date: '2026-01-05', level: 'flat', reason: 'sleep', ts: Date.parse(at('2026-01-05')) },
    ]);
    rowsToReturn = [
      { local_date: '2026-01-12', level: 'wired', reason: 'work', updated_at: at('2026-01-12') },
      { local_date: '2026-01-08', level: 'steady', reason: 'body', updated_at: at('2026-01-08') },
    ];

    await pullCheckIns();

    const local = await readLocal();
    expect(local.map((e) => e.date)).toEqual(['2026-01-05', '2026-01-08', '2026-01-12']);
  });

  it('is a no-op when there are no remote rows', async () => {
    await seedLocal([
      { date: '2026-01-10', level: 'steady', reason: 'work', ts: Date.parse(at('2026-01-10')) },
    ]);
    rowsToReturn = null;

    await pullCheckIns();

    const local = await readLocal();
    expect(local).toHaveLength(1);
    expect(local[0].level).toBe('steady');
  });
});
