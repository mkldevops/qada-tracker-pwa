import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QadaDB } from './database';
import * as queries from './queries';

let db: QadaDB;

beforeEach(async () => {
	db = new QadaDB(`test-${Date.now()}-${Math.random()}`);
	await db.open();
	// populate hook already inserted 5 rows with total_owed=0; bump to 10 for tests
	await db.prayer_debts.toCollection().modify({ total_owed: 10 });
});

afterEach(async () => {
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
		// Insert log but manually set total_completed to 0 first
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
	it('returns 0 with no logs', async () => {
		expect(await queries.getStreak(db)).toBe(0);
	});

	it('returns 1 with only today logs', async () => {
		await queries.insertLog(db, 'fajr', 1);
		expect(await queries.getStreak(db)).toBe(1);
	});

	it('returns streak for consecutive days', async () => {
		const now = new Date();
		for (let i = 0; i < 3; i++) {
			const d = new Date(now);
			d.setDate(d.getDate() - i);
			await db.prayer_logs.add({
				prayer: 'fajr',
				quantity: 1,
				logged_at: d.toISOString(),
				session_id: null,
			});
		}
		expect(await queries.getStreak(db)).toBe(3);
	});

	it('breaks at the first non-consecutive day', async () => {
		const now = new Date();
		// today and yesterday, then gap, then 3 days ago
		for (const offset of [0, 1, 3]) {
			const d = new Date(now);
			d.setDate(d.getDate() - offset);
			await db.prayer_logs.add({
				prayer: 'fajr',
				quantity: 1,
				logged_at: d.toISOString(),
				session_id: null,
			});
		}
		expect(await queries.getStreak(db)).toBe(2);
	});
});
