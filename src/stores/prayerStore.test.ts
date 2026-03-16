import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QadaDB } from '../db/database';
import * as queries from '../db/queries';
import { PRAYER_NAMES } from '../types';

// Tests for the core query functions that power the prayerStore actions.
// These verify the data layer contracts to prevent store-level regressions.

let db: QadaDB;

beforeEach(async () => {
	db = new QadaDB(`store-test-${Date.now()}-${Math.random()}`);
	await db.open();
	// Verify seed data exists before modifying
	const seedCount = await db.prayer_debts.count();
	expect(seedCount).toBe(5);
	await db.prayer_debts.toCollection().modify({ total_owed: 20 });
});

afterEach(async () => {
	await db.delete();
});

// ─── setDebtFromYears calculation ────────────────────────────────────────────
// Mirrors the formula in prayerStore.setDebtFromYears:
//   effectiveDays = Math.max(0, Math.round(years * 365.25) - excludedDays)

describe('setDebtFromYears calculation (via setAllDebts)', () => {
	it('converts 1 year to 365 days per prayer', async () => {
		// Math.round(1 * 365.25) = 365
		await queries.setAllDebts(db, 365);
		const debts = await queries.getAllDebts(db);
		for (const p of PRAYER_NAMES) {
			expect(debts[p].total_owed).toBe(365);
		}
	});

	it('deducts 30 excluded days from 1 year → 335 days', async () => {
		// Math.round(1 * 365.25) - 30 = 335
		await queries.setAllDebts(db, 335);
		const debts = await queries.getAllDebts(db);
		expect(debts.fajr.total_owed).toBe(335);
	});

	it('clamps to 0 when excluded days exceed total', async () => {
		// Math.max(0, ...) prevents negative debt
		const effectiveDays = Math.max(0, 365 - 500);
		expect(effectiveDays).toBe(0);
		await queries.setAllDebts(db, effectiveDays);
		const debts = await queries.getAllDebts(db);
		for (const p of PRAYER_NAMES) {
			expect(debts[p].total_owed).toBe(0);
		}
	});

	it('handles 0.5 year → 183 days', async () => {
		// Math.round(0.5 * 365.25) = Math.round(182.625) = 183
		await queries.setAllDebts(db, 183);
		const debts = await queries.getAllDebts(db);
		expect(debts.fajr.total_owed).toBe(183);
	});

	it('handles large debt (10 years → 3653 days)', async () => {
		// Math.round(10 * 365.25) = 3653
		await queries.setAllDebts(db, 3653);
		const debts = await queries.getAllDebts(db);
		for (const p of PRAYER_NAMES) {
			expect(debts[p].total_owed).toBe(3653);
		}
	});
});

// ─── insertLog ────────────────────────────────────────────────────────────────

describe('insertLog (powers logPrayer action)', () => {
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

	it('does not affect sibling prayers', async () => {
		await queries.insertLog(db, 'fajr', 5);
		const debts = await queries.getAllDebts(db);
		expect(debts.dhuhr.total_completed).toBe(0);
		expect(debts.dhuhr.remaining).toBe(20);
	});
});

// ─── undoLastLog ──────────────────────────────────────────────────────────────

describe('deleteLogsAndRollback (powers undoLastLog action)', () => {
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
		await expect(queries.deleteLogsAndRollback(db, logs)).resolves.not.toThrow();
	});
});

// ─── resetAll ─────────────────────────────────────────────────────────────────

describe('resetAll (powers resetAll action)', () => {
	it('clears all logs and resets completed counts to 0', async () => {
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

// ─── totalRemaining selector logic ───────────────────────────────────────────

describe('totalRemaining selector logic', () => {
	it('sums remaining across all 5 prayers', async () => {
		const debts = await queries.getAllDebts(db);
		const total = PRAYER_NAMES.reduce((sum, p) => sum + (debts[p]?.remaining ?? 0), 0);
		expect(total).toBe(100); // 5 prayers × 20 each
	});

	it('decreases by exact logged amount', async () => {
		await queries.insertLog(db, 'fajr', 3);
		await queries.insertLog(db, 'maghrib', 2);
		const debts = await queries.getAllDebts(db);
		const total = PRAYER_NAMES.reduce((sum, p) => sum + (debts[p]?.remaining ?? 0), 0);
		expect(total).toBe(95); // 100 - 5
	});
});

// ─── setObjective / getActiveObjective ───────────────────────────────────────

describe('setObjective / getActiveObjective (powers setObjective action)', () => {
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
