import type { Objective, Period, PrayerDebt, PrayerLog, PrayerName, StatsState } from '../types';
import { PRAYER_NAMES } from '../types';
import type { QadaDB } from './database';

function isValidPrayerName(value: unknown): value is PrayerName {
	return typeof value === 'string' && PRAYER_NAMES.includes(value as PrayerName);
}

function isValidPeriod(value: unknown): value is Period {
	return value === 'daily' || value === 'weekly' || value === 'monthly';
}

function isValidIsoDate(value: unknown): boolean {
	if (typeof value !== 'string') return false;
	const date = new Date(value);
	return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

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
		.modify({ total_owed: amount, total_completed: 0, updated_at: new Date().toISOString() });
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

const NEXT_MILESTONES = [100, 500, 1000, 2500, 5000, 10000] as const;

function getNextMilestone(allTime: number): { target: number; remaining: number } | null {
	for (const milestone of NEXT_MILESTONES) {
		if (milestone > allTime) {
			return { target: milestone, remaining: milestone - allTime };
		}
	}
	return null;
}

async function getExtendedTemporalStats(
	db: QadaDB,
	windowDays: number | null = 30,
	haydAvgDays = 0,
): Promise<{
	today: number;
	thisWeek: number;
	thisMonth: number;
	allTime: number;
	avgPerDay: number;
	bestDay: number;
	bestWeek: number;
	lastWeek: number;
	consistencyRate: number;
	streak: number;
	bestStreak: number;
}> {
	const all = await db.prayer_logs.toArray();
	const now = new Date();

	const startOfToday = new Date(now);
	startOfToday.setHours(0, 0, 0, 0);

	const weekAgo = new Date(now);
	weekAgo.setDate(weekAgo.getDate() - 7);

	const twoWeeksAgo = new Date(now);
	twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

	const monthAgo = new Date(now);
	monthAgo.setDate(monthAgo.getDate() - 30);

	let today = 0;
	let thisWeek = 0;
	let lastWeek = 0;
	let thisMonth = 0;
	let allTime = 0;
	let firstLogDate: Date | null = null;
	const byDate = new Map<string, number>();

	for (const log of all) {
		const logDate = new Date(log.logged_at);
		const dateKey = log.logged_at.slice(0, 10);

		allTime += log.quantity;
		byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + log.quantity);

		if (logDate >= startOfToday) today += log.quantity;
		if (logDate >= weekAgo) thisWeek += log.quantity;
		if (logDate >= twoWeeksAgo && logDate < weekAgo) lastWeek += log.quantity;
		if (logDate >= monthAgo) thisMonth += log.quantity;
		if (!firstLogDate || logDate < firstLogDate) firstLogDate = logDate;
	}

	let avgPerDay = 0;
	if (allTime > 0 && firstLogDate) {
		const daysSinceFirst = Math.max(
			1,
			Math.floor((now.getTime() - firstLogDate.getTime()) / 86_400_000),
		);
		const effectiveDays =
			windowDays === null ? daysSinceFirst : Math.min(daysSinceFirst, windowDays);
		const windowStart = new Date(now);
		windowStart.setDate(windowStart.getDate() - effectiveDays);
		let logsInWindow = 0;
		for (const log of all) {
			const logDate = new Date(log.logged_at);
			if (logDate >= windowStart) logsInWindow += log.quantity;
		}
		const prayableDays =
			haydAvgDays > 0 ? Math.max(1, effectiveDays * (1 - haydAvgDays / 30)) : effectiveDays;
		avgPerDay = logsInWindow > 0 ? logsInWindow / prayableDays : 0;
	}

	const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	let daysWithPrayers = 0;
	for (let i = 0; i < 30; i++) {
		const key = new Date(todayUtcMs - i * 86_400_000).toISOString().slice(0, 10);
		if ((byDate.get(key) ?? 0) > 0) daysWithPrayers++;
	}
	const consistencyRate = Math.min(100, Math.round((daysWithPrayers / 30) * 100));

	const sortedDates = [...byDate.keys()].sort();

	let bestDay = 0;
	let bestStreak = 0;
	let currentRun = 0;
	let prevMs = 0;
	for (const dateStr of sortedDates) {
		const count = byDate.get(dateStr) ?? 0;
		if (count > bestDay) bestDay = count;

		const ms = new Date(dateStr).getTime();
		if (prevMs === 0 || ms - prevMs === 86_400_000) {
			currentRun++;
		} else {
			currentRun = 1;
		}
		if (currentRun > bestStreak) bestStreak = currentRun;
		prevMs = ms;
	}

	const todayNorm = new Date(now);
	todayNorm.setHours(0, 0, 0, 0);
	const reversedDates = [...sortedDates].reverse();
	let streak = 0;
	for (let i = 0; i < reversedDates.length; i++) {
		const rowDate = new Date(reversedDates[i]);
		rowDate.setHours(0, 0, 0, 0);
		const expected = new Date(todayNorm);
		expected.setDate(todayNorm.getDate() - i);
		if (rowDate.getTime() === expected.getTime()) {
			streak++;
		} else {
			break;
		}
	}

	let bestWeek = 0;
	for (const dateStr of byDate.keys()) {
		const [y, m, d] = dateStr.split('-').map(Number);
		const baseMs = Date.UTC(y, m - 1, d);
		let windowSum = 0;
		for (let j = 0; j < 7; j++) {
			const key = new Date(baseMs + j * 86_400_000).toISOString().slice(0, 10);
			windowSum += byDate.get(key) ?? 0;
		}
		if (windowSum > bestWeek) bestWeek = windowSum;
	}

	return {
		today,
		thisWeek,
		thisMonth,
		allTime,
		avgPerDay,
		bestDay,
		bestWeek,
		lastWeek,
		consistencyRate,
		streak,
		bestStreak,
	};
}

export async function getStreak(db: QadaDB): Promise<number> {
	const temporal = await getExtendedTemporalStats(db);
	return temporal.streak;
}

export async function getStats(
	db: QadaDB,
	windowDays: number | null = 30,
	haydAvgDays = 0,
): Promise<StatsState> {
	const [temporal, debts] = await Promise.all([
		getExtendedTemporalStats(db, windowDays, haydAvgDays),
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
		streak: temporal.streak,
		avgPerDay: temporal.avgPerDay,
		estimatedDays,
		bestStreak: temporal.bestStreak,
		bestDay: temporal.bestDay,
		bestWeek: temporal.bestWeek,
		lastWeek: temporal.lastWeek,
		consistencyRate: temporal.consistencyRate,
		nextMilestone: getNextMilestone(temporal.allTime),
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

export async function getLogsByPeriod(
	db: QadaDB,
	days: number,
): Promise<{ date: string; count: number }[]> {
	const since = new Date();
	since.setDate(since.getDate() - days);
	since.setHours(0, 0, 0, 0);

	const logs = await db.prayer_logs.where('logged_at').aboveOrEqual(since.toISOString()).toArray();

	const byDate: Record<string, number> = {};
	for (const log of logs) {
		const day = log.logged_at.slice(0, 10);
		byDate[day] = (byDate[day] ?? 0) + log.quantity;
	}

	const result: { date: string; count: number }[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const key = d.toISOString().slice(0, 10);
		result.push({ date: key, count: byDate[key] ?? 0 });
	}
	return result;
}

export async function resetAll(db: QadaDB): Promise<void> {
	await db.transaction('rw', db.prayer_logs, db.objectives, db.prayer_debts, async () => {
		await db.prayer_logs.clear();
		await db.objectives.clear();
		await db.prayer_debts.toCollection().modify({
			total_owed: 0,
			total_completed: 0,
			updated_at: new Date().toISOString(),
		});
	});
}

export async function exportBackup(db: QadaDB): Promise<void> {
	try {
		const [prayer_logs, prayer_debts, objectives] = await Promise.all([
			db.prayer_logs.toArray(),
			db.prayer_debts.toArray(),
			db.objectives.toArray(),
		]);
		const data = {
			version: 1,
			exported_at: new Date().toISOString(),
			prayer_logs,
			prayer_debts,
			objectives,
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `qada-backup-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 100);
	} catch {
		throw new Error("Impossible d'exporter la sauvegarde");
	}
}

export async function importBackup(
	db: QadaDB,
	file: File,
	loadAll: () => Promise<void>,
): Promise<void> {
	const text = await file.text();
	const data = JSON.parse(text);
	if (
		!data.version ||
		!Array.isArray(data.prayer_logs) ||
		!Array.isArray(data.prayer_debts) ||
		!Array.isArray(data.objectives)
	) {
		throw new Error('Fichier de backup invalide');
	}

	// Validate prayer_logs
	for (const log of data.prayer_logs) {
		if (
			!isValidPrayerName(log.prayer) ||
			typeof log.quantity !== 'number' ||
			log.quantity < 0 ||
			!isValidIsoDate(log.logged_at) ||
			(log.session_id !== null && typeof log.session_id !== 'string')
		) {
			throw new Error('Format de log invalide');
		}
	}

	// Validate prayer_debts
	for (const debt of data.prayer_debts) {
		if (
			!isValidPrayerName(debt.prayer) ||
			typeof debt.total_owed !== 'number' ||
			debt.total_owed < 0 ||
			typeof debt.total_completed !== 'number' ||
			debt.total_completed < 0 ||
			!isValidIsoDate(debt.created_at) ||
			!isValidIsoDate(debt.updated_at)
		) {
			throw new Error('Format de dette invalide');
		}
	}

	// Validate objectives
	for (const obj of data.objectives) {
		if (
			!isValidPeriod(obj.period) ||
			typeof obj.target !== 'number' ||
			obj.target <= 0 ||
			(obj.is_active !== 0 && obj.is_active !== 1) ||
			!isValidIsoDate(obj.created_at)
		) {
			throw new Error("Format d'objectif invalide");
		}
	}

	await db.transaction('rw', db.prayer_logs, db.prayer_debts, db.objectives, async () => {
		await db.prayer_logs.clear();
		await db.prayer_debts.clear();
		await db.objectives.clear();

		// Import logs
		if (data.prayer_logs.length > 0) {
			const logsToAdd = data.prayer_logs.map(({ id: _, ...r }: PrayerLog) => r);
			await db.prayer_logs.bulkAdd(logsToAdd);
		}

		// Import debts
		const importedPrayers = new Set<PrayerName>();
		if (data.prayer_debts.length > 0) {
			const debtsToAdd = data.prayer_debts.map(({ id: _, ...r }: PrayerDebt) => {
				importedPrayers.add(r.prayer);
				return r;
			});
			await db.prayer_debts.bulkAdd(debtsToAdd);
		}

		// Ensure all 5 prayers exist
		const missingPrayers = PRAYER_NAMES.filter((p) => !importedPrayers.has(p));
		if (missingPrayers.length > 0) {
			const now = new Date().toISOString();
			const defaultDebts = missingPrayers.map((prayer) => ({
				prayer,
				total_owed: 0,
				total_completed: 0,
				created_at: now,
				updated_at: now,
			}));
			await db.prayer_debts.bulkAdd(defaultDebts);
		}

		// Import objectives
		if (data.objectives.length > 0) {
			const objToAdd = data.objectives.map(({ id: _, ...r }: Objective) => r);
			await db.objectives.bulkAdd(objToAdd);
		}
	});

	await loadAll();
}

export async function getDebtEvolution(
	db: QadaDB,
	days: number,
): Promise<{ date: string; remaining: number }[]> {
	const debts = await db.prayer_debts.toArray();
	const currentRemaining = debts.reduce(
		(s, r) => s + Math.max(0, r.total_owed - r.total_completed),
		0,
	);

	const dateLimitISO = new Date(Date.now() - (days + 1) * 86400000).toISOString();
	const logs = await db.prayer_logs.where('logged_at').aboveOrEqual(dateLimitISO).toArray();

	const byDate = new Map<string, number>();
	for (const log of logs) {
		const d = log.logged_at.slice(0, 10);
		byDate.set(d, (byDate.get(d) ?? 0) + log.quantity);
	}

	const points: { date: string; remaining: number }[] = [];
	let remaining = currentRemaining;
	const now = Date.now();
	for (let i = 0; i < days; i++) {
		const date = new Date(now - i * 86400000).toISOString().slice(0, 10);
		points.push({ date, remaining });
		remaining += byDate.get(date) ?? 0;
	}

	return points.reverse();
}

export async function getActivityByDay(db: QadaDB, days: number): Promise<Map<string, number>> {
	const sinceDate = new Date();
	sinceDate.setDate(sinceDate.getDate() - days);
	sinceDate.setHours(0, 0, 0, 0);
	const since = sinceDate.toISOString();
	const logs = await db.prayer_logs.where('logged_at').aboveOrEqual(since).toArray();
	const map = new Map<string, number>();
	for (const log of logs) {
		const date = log.logged_at.slice(0, 10);
		map.set(date, (map.get(date) ?? 0) + log.quantity);
	}
	return map;
}
