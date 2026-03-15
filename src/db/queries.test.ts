import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QadaDB } from './database';
import * as queries from './queries';

// Pinned to noon UTC to avoid any midnight-boundary flakiness
const PINNED_NOW = new Date('2025-06-15T12:00:00.000Z');

let db: QadaDB;

beforeEach(async () => {
	db = new QadaDB(`test-${Date.now()}-${Math.random()}`);
	await db.open();
	// populate hook already inserted 5 rows with total_owed=0; bump to 10 for tests
	await db.prayer_debts.toCollection().modify({ total_owed: 10 });
});

afterEach(async () => {
	vi.useRealTimers();
	await db.delete();
});

// ─── insertLog ────────────────────────────────────────────────────────────────

describe('insertLog', () => {
	it('adds a log row and increments total_completed', async () => {
		await queries.insertLog(db, 'fajr', 2);
		const logs = await db.prayer_logs.toArray();
		expect(logs).toHaveLength(1);
		expect(logs[0].prayer).toBe('fajr');
		expect(logs[0].quantity).toBe(2);

		const debt = await db.prayer_debts.where('prayer').equals('fajr').first();
		expect(debt?.total_completed).toBe(2);
	});

	it('stores session_id when provided', async () => {
		await queries.insertLog(db, 'dhuhr', 1, 'session-abc');
		const log = await db.prayer_logs.toArray();
		expect(log[0].session_id).toBe('session-abc');
	});

	it('stores null session_id when not provided', async () => {
		await queries.insertLog(db, 'asr', 1);
		const log = await db.prayer_logs.toArray();
		expect(log[0].session_id).toBeNull();
	});
});

// ─── getLastSessionLogs ───────────────────────────────────────────────────────

describe('getLastSessionLogs', () => {
	it('returns empty array when no logs exist', async () => {
		const result = await queries.getLastSessionLogs(db);
		expect(result).toEqual([]);
	});

	it('returns the single log when last log has no session_id', async () => {
		await queries.insertLog(db, 'fajr', 1);
		const result = await queries.getLastSessionLogs(db);
		expect(result).toHaveLength(1);
		expect(result[0].prayer).toBe('fajr');
	});

	it('returns all logs sharing the same session_id as the last log', async () => {
		await queries.insertLog(db, 'fajr', 1, 'session-1');
		await queries.insertLog(db, 'dhuhr', 1, 'session-1');
		await queries.insertLog(db, 'maghrib', 1, 'session-1');
		const result = await queries.getLastSessionLogs(db);
		expect(result).toHaveLength(3);
	});

	it('does not include logs from a previous session', async () => {
		await queries.insertLog(db, 'fajr', 1, 'session-old');
		await queries.insertLog(db, 'dhuhr', 1, 'session-new');
		const result = await queries.getLastSessionLogs(db);
		expect(result).toHaveLength(1);
		expect(result[0].prayer).toBe('dhuhr');
	});
});

// ─── deleteLogsAndRollback ────────────────────────────────────────────────────

describe('deleteLogsAndRollback', () => {
	it('does nothing when passed an empty array', async () => {
		await queries.deleteLogsAndRollback(db, []);
		const logs = await db.prayer_logs.toArray();
		expect(logs).toHaveLength(0);
	});

	it('deletes the log row and decrements total_completed', async () => {
		await queries.insertLog(db, 'fajr', 3);
		const logs = await queries.getLastSessionLogs(db);
		await queries.deleteLogsAndRollback(db, logs);

		const remaining = await db.prayer_logs.toArray();
		expect(remaining).toHaveLength(0);

		const debt = await db.prayer_debts.where('prayer').equals('fajr').first();
		expect(debt?.total_completed).toBe(0);
	});

	it('does not decrement total_completed below 0', async () => {
		await queries.insertLog(db, 'fajr', 5);
		await db.prayer_debts.where('prayer').equals('fajr').modify({ total_completed: 0 });
		const logs = await queries.getLastSessionLogs(db);
		await queries.deleteLogsAndRollback(db, logs);

		const debt = await db.prayer_debts.where('prayer').equals('fajr').first();
		expect(debt?.total_completed).toBe(0);
	});
});

// ─── getStreak ────────────────────────────────────────────────────────────────

describe('getStreak', () => {
	// Only mock Date — leaving setTimeout/Promise intact so Dexie doesn't hang
	beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: PINNED_NOW }));

	const addLog = (offsetDays: number) =>
		db.prayer_logs.add({
			prayer: 'fajr',
			quantity: 1,
			logged_at: new Date(PINNED_NOW.getTime() - offsetDays * 86_400_000).toISOString(),
			session_id: null,
		});

	it('returns 0 with no logs', async () => {
		expect(await queries.getStreak(db)).toBe(0);
	});

	it('returns 1 with only today logs', async () => {
		await addLog(0);
		expect(await queries.getStreak(db)).toBe(1);
	});

	it('returns streak for consecutive days', async () => {
		await addLog(0);
		await addLog(1);
		await addLog(2);
		expect(await queries.getStreak(db)).toBe(3);
	});

	it('breaks at the first non-consecutive day', async () => {
		await addLog(0);
		await addLog(1);
		await addLog(3); // gap on day 2
		expect(await queries.getStreak(db)).toBe(2);
	});

	it('counts multiple logs on the same day as one streak day', async () => {
		await addLog(0);
		await addLog(0); // second log same day
		expect(await queries.getStreak(db)).toBe(1);
	});
});

// ─── setDebt ──────────────────────────────────────────────────────────────────

describe('setDebt', () => {
	it('updates total_owed for a single prayer', async () => {
		await queries.setDebt(db, 'fajr', 42);
		const debt = await db.prayer_debts.where('prayer').equals('fajr').first();
		expect(debt?.total_owed).toBe(42);
	});

	it('does not affect other prayers', async () => {
		await queries.setDebt(db, 'fajr', 99);
		const dhuhr = await db.prayer_debts.where('prayer').equals('dhuhr').first();
		expect(dhuhr?.total_owed).toBe(10);
	});
});

// ─── resetAll ────────────────────────────────────────────────────────────────

describe('resetAll', () => {
	it('clears all logs', async () => {
		await queries.insertLog(db, 'fajr', 3);
		await queries.insertLog(db, 'dhuhr', 2);
		await queries.resetAll(db);
		expect(await db.prayer_logs.count()).toBe(0);
	});

	it('resets total_owed and total_completed to 0 for all prayers', async () => {
		await queries.insertLog(db, 'fajr', 5);
		await queries.resetAll(db);
		const debts = await db.prayer_debts.toArray();
		for (const d of debts) {
			expect(d.total_owed).toBe(0);
			expect(d.total_completed).toBe(0);
		}
	});

	it('clears objectives', async () => {
		await queries.createObjective(db, 'daily', 10);
		await queries.resetAll(db);
		expect(await db.objectives.count()).toBe(0);
	});
});

// ─── getStats ────────────────────────────────────────────────────────────────

describe('getStats', () => {
	beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: PINNED_NOW }));

	it('returns zeros when no logs exist', async () => {
		const stats = await queries.getStats(db);
		expect(stats.today).toBe(0);
		expect(stats.allTime).toBe(0);
		expect(stats.streak).toBe(0);
		expect(stats.estimatedDays).toBeNull();
	});

	it('counts today logs correctly', async () => {
		await queries.insertLog(db, 'fajr', 3);
		await queries.insertLog(db, 'dhuhr', 2);
		const stats = await queries.getStats(db);
		expect(stats.today).toBe(5);
		expect(stats.allTime).toBe(5);
		expect(stats.streak).toBe(1);
	});

	it('computes estimatedDays when avgPerDay > 0', async () => {
		await queries.insertLog(db, 'fajr', 30);
		const stats = await queries.getStats(db);
		expect(stats.estimatedDays).not.toBeNull();
		expect(stats.estimatedDays).toBeGreaterThan(0);
	});
});
