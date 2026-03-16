import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QadaDB } from '../db/database';
import * as queries from '../db/queries';
import { PRAYER_NAMES } from '../types';

// Test the store logic via the underlying queries + store actions directly
// We test the pure logic functions the store depends on, and store action contracts.

let db: QadaDB;

beforeEach(async () => {
	db = new QadaDB(`store-test-${Date.now()}-${Math.random()}`);
	await db.open();
	await db.prayer_debts.toCollection().modify({ total_owed: 20 });
});

afterEach(async () => {
	await db.delete();
});

describe('setDebtFromYears calculation', () => {
	it('converts 1 year to 365 days per prayer (5 prayers × 365)', async () => {
		const years = 1;
		const excludedDays = 0;
		const effectiveDays = Math.max(0, Math.round(years * 365.25) - excludedDays);
		await queries.setAllDebts(db, effectiveDays);
		const debts = await queries.getAllDebts(db);
		for (const p of PRAYER_NAMES) {
			expect(debts[p].total_owed).toBe(Math.round(365.25));
		}
	});

	it('deducts excluded days from total', async () => {
		const years = 1;
		const excludedDays = 30;
		const effectiveDays = Math.max(0, Math.round(years * 365.25) - excludedDays);
		await queries.setAllDebts(db, effectiveDays);
		const debts = await queries.getAllDebts(db);
		expect(debts.fajr.total_owed).toBe(Math.round(365.25) - 30);
	});

	it('never produces negative debt (excluded days > years days)', async () => {
		const effectiveDays = Math.max(0, Math.round(1 * 365.25) - 500);
		expect(effectiveDays).toBe(0);
		await queries.setAllDebts(db, effectiveDays);
		const debts = await queries.getAllDebts(db);
		for (const p of PRAYER_NAMES) {
			expect(debts[p].total_owed).toBe(0);
		}
	});

	it('handles fractional years (0.5 year = ~183 days)', async () => {
		const effectiveDays = Math.max(0, Math.round(0.5 * 365.25) - 0);
		await queries.setAllDebts(db, effectiveDays);
		const debts = await queries.getAllDebts(db);
		expect(debts.fajr.total_owed).toBe(Math.round(0.5 * 365.25));
	});
});

describe('logPrayer store contract', () => {
	it('inserts a log and decrements remaining', async () => {
		await queries.insertLog(db, 'fajr', 1);
		const debts = await queries.getAllDebts(db);
		expect(debts.fajr.total_completed).toBe(1);
		expect(debts.fajr.remaining).toBe(19);
	});

	it('logging more than owed clamps remaining to 0', async () => {
		await queries.insertLog(db, 'fajr', 25);
		const debts = await queries.getAllDebts(db);
		expect(debts.fajr.remaining).toBe(0);
	});

	it('does not affect other prayers', async () => {
		await queries.insertLog(db, 'fajr', 5);
		const debts = await queries.getAllDebts(db);
		expect(debts.dhuhr.total_completed).toBe(0);
		expect(debts.dhuhr.remaining).toBe(20);
	});
});

describe('undoLastLog (deleteLogsAndRollback)', () => {
	it('removes the log and restores total_completed', async () => {
		await queries.insertLog(db, 'fajr', 3);
		const logs = await queries.getLastSessionLogs(db);
		await queries.deleteLogsAndRollback(db, logs);

		const debts = await queries.getAllDebts(db);
		expect(debts.fajr.total_completed).toBe(0);
		expect(debts.fajr.remaining).toBe(20);
	});

	it('no-op when there are no logs', async () => {
		const logs = await queries.getLastSessionLogs(db);
		expect(logs).toHaveLength(0);
		// Should not throw
		await queries.deleteLogsAndRollback(db, logs);
		const debts = await queries.getAllDebts(db);
		expect(debts.fajr.total_completed).toBe(0);
	});
});

describe('resetAll', () => {
	it('clears all logs and resets completed counts', async () => {
		await queries.insertLog(db, 'fajr', 5);
		await queries.insertLog(db, 'asr', 3);
		await queries.resetAll(db);

		const logs = await db.prayer_logs.toArray();
		expect(logs).toHaveLength(0);

		const debts = await queries.getAllDebts(db);
		for (const p of PRAYER_NAMES) {
			expect(debts[p].total_completed).toBe(0);
		}
	});
});

describe('useTotalRemaining selector logic', () => {
	it('sums remaining across all prayers', async () => {
		// Each prayer has total_owed=20, no logs yet
		const debts = await queries.getAllDebts(db);
		const total = PRAYER_NAMES.reduce((sum, p) => sum + (debts[p]?.remaining ?? 0), 0);
		expect(total).toBe(20 * PRAYER_NAMES.length);
	});

	it('decreases total after logging', async () => {
		await queries.insertLog(db, 'fajr', 3);
		await queries.insertLog(db, 'maghrib', 2);
		const debts = await queries.getAllDebts(db);
		const total = PRAYER_NAMES.reduce((sum, p) => sum + (debts[p]?.remaining ?? 0), 0);
		expect(total).toBe(20 * PRAYER_NAMES.length - 5);
	});
});

describe('setObjective / getActiveObjective', () => {
	it('creates and retrieves an objective', async () => {
		await queries.createObjective(db, 'daily', 5);
		const obj = await queries.getActiveObjective(db);
		expect(obj).not.toBeNull();
		expect(obj?.period).toBe('daily');
		expect(obj?.target).toBe(5);
	});

	it('replaces objective when a new one is created', async () => {
		await queries.createObjective(db, 'daily', 5);
		await queries.createObjective(db, 'weekly', 30);
		const obj = await queries.getActiveObjective(db);
		expect(obj?.period).toBe('weekly');
		expect(obj?.target).toBe(30);
	});
});
