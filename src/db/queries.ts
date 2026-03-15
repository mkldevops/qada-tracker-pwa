import type { Objective, Period, PrayerDebt, PrayerLog, PrayerName, StatsState } from '../types';
import { PRAYER_NAMES } from '../types';
import type { QadaDB } from './database';

export async function getAllDebts(db: QadaDB): Promise<Record<PrayerName, PrayerDebt>> {
	const rows = await db.prayer_debts.toArray();
	const result = {} as Record<PrayerName, PrayerDebt>;
	for (const row of rows) {
		result[row.prayer] = {
			id: row.id ?? 0,
			prayer: row.prayer,
			total_owed: row.total_owed,
			total_completed: row.total_completed,
			remaining: Math.max(0, row.total_owed - row.total_completed),
			created_at: row.created_at,
			updated_at: row.updated_at,
		};
	}
	return result;
}

export async function setDebt(db: QadaDB, prayer: PrayerName, totalOwed: number): Promise<void> {
	await db.prayer_debts
		.where('prayer')
		.equals(prayer)
		.modify({ total_owed: totalOwed, updated_at: new Date().toISOString() });
}

export async function setAllDebts(db: QadaDB, amount: number): Promise<void> {
	await db.prayer_debts
		.toCollection()
		.modify({ total_owed: amount, updated_at: new Date().toISOString() });
}

export async function insertLog(
	db: QadaDB,
	prayer: PrayerName,
	quantity: number,
	sessionId?: string,
): Promise<void> {
	await db.transaction('rw', db.prayer_logs, db.prayer_debts, async () => {
		await db.prayer_logs.add({
			prayer,
			quantity,
			logged_at: new Date().toISOString(),
			session_id: sessionId ?? null,
		});
		await db.prayer_debts
			.where('prayer')
			.equals(prayer)
			.modify((row) => {
				row.total_completed += quantity;
				row.updated_at = new Date().toISOString();
			});
	});
}

export async function getLastSessionLogs(
	db: QadaDB,
): Promise<{ prayer: PrayerName; quantity: number; id: number }[]> {
	const last = await db.prayer_logs.orderBy('id').last();
	if (!last || last.id === undefined) return [];

	if (last.session_id) {
		const rows = await db.prayer_logs.where('session_id').equals(last.session_id).toArray();
		return rows.map((r) => ({ id: r.id as number, prayer: r.prayer, quantity: r.quantity }));
	}

	return [{ id: last.id, prayer: last.prayer, quantity: last.quantity }];
}

export async function deleteLogsAndRollback(
	db: QadaDB,
	logs: { prayer: PrayerName; quantity: number; id: number }[],
): Promise<void> {
	if (logs.length === 0) return;

	await db.transaction('rw', db.prayer_logs, db.prayer_debts, async () => {
		for (const log of logs) {
			await db.prayer_logs.delete(log.id);
			await db.prayer_debts
				.where('prayer')
				.equals(log.prayer)
				.modify((row) => {
					row.total_completed = Math.max(0, row.total_completed - log.quantity);
					row.updated_at = new Date().toISOString();
				});
		}
	});
}

export async function getRecentLogs(db: QadaDB, limit = 50): Promise<PrayerLog[]> {
	return db.prayer_logs.orderBy('id').reverse().limit(limit).toArray();
}

async function getTemporalStats(db: QadaDB): Promise<{
	today: number;
	thisWeek: number;
	thisMonth: number;
	allTime: number;
	avgPerDay: number;
}> {
	const all = await db.prayer_logs.toArray();
	const now = new Date();

	const startOfToday = new Date(now);
	startOfToday.setHours(0, 0, 0, 0);

	const weekAgo = new Date(now);
	weekAgo.setDate(weekAgo.getDate() - 7);

	const monthAgo = new Date(now);
	monthAgo.setDate(monthAgo.getDate() - 30);

	let today = 0;
	let thisWeek = 0;
	let thisMonth = 0;
	let allTime = 0;

	for (const log of all) {
		const logDate = new Date(log.logged_at);
		allTime += log.quantity;
		if (logDate >= startOfToday) today += log.quantity;
		if (logDate >= weekAgo) thisWeek += log.quantity;
		if (logDate >= monthAgo) thisMonth += log.quantity;
	}

	const avgPerDay = allTime > 0 ? thisMonth / 30 : 0;

	return { today, thisWeek, thisMonth, allTime, avgPerDay };
}

export async function getStreak(db: QadaDB): Promise<number> {
	const rows = await db.prayer_logs.orderBy('logged_at').reverse().toArray();

	const uniqueDates = [...new Set(rows.map((r) => r.logged_at.slice(0, 10)))];

	if (uniqueDates.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let streak = 0;
	for (let i = 0; i < uniqueDates.length; i++) {
		const rowDate = new Date(uniqueDates[i]);
		rowDate.setHours(0, 0, 0, 0);
		const expected = new Date(today);
		expected.setDate(today.getDate() - i);

		if (rowDate.getTime() === expected.getTime()) {
			streak++;
		} else {
			break;
		}
	}

	return streak;
}

export async function getStats(db: QadaDB): Promise<StatsState> {
	const [temporal, streak, debts] = await Promise.all([
		getTemporalStats(db),
		getStreak(db),
		getAllDebts(db),
	]);

	const totalRemaining = PRAYER_NAMES.reduce((sum, p) => sum + (debts[p]?.remaining ?? 0), 0);

	const estimatedDays =
		temporal.avgPerDay > 0 ? Math.ceil(totalRemaining / temporal.avgPerDay) : null;

	return {
		today: temporal.today,
		thisWeek: temporal.thisWeek,
		thisMonth: temporal.thisMonth,
		allTime: temporal.allTime,
		streak,
		avgPerDay: temporal.avgPerDay,
		estimatedDays,
	};
}

export async function getActiveObjective(db: QadaDB): Promise<Objective | null> {
	const result = await db.objectives.where('is_active').equals(1).last();
	return result ?? null;
}

export async function createObjective(db: QadaDB, period: Period, target: number): Promise<void> {
	await db.transaction('rw', db.objectives, async () => {
		await db.objectives.toCollection().modify({ is_active: 0 });
		await db.objectives.add({
			period,
			target,
			is_active: 1,
			created_at: new Date().toISOString(),
		});
	});
}

export async function resetAll(db: QadaDB): Promise<void> {
	await db.transaction('rw', db.prayer_logs, db.objectives, db.prayer_debts, async () => {
		await db.prayer_logs.clear();
		await db.objectives.clear();
		await db.prayer_debts.toCollection().modify({
			total_completed: 0,
			updated_at: new Date().toISOString(),
		});
	});
}
