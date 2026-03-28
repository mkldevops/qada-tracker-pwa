import { create } from 'zustand';
import { db } from '../db/database';
import * as queries from '../db/queries';
import type {
	BatchEntry,
	Objective,
	Period,
	PrayerDebt,
	PrayerLog,
	PrayerName,
	StatsState,
} from '../types';
import { PRAYER_NAMES } from '../types';

const MILESTONES = [100, 500, 1000, 2500, 5000, 10000] as const;

function checkMilestone(allTime: number): number | null {
	let largestMilestone: number | null = null;
	for (const milestone of MILESTONES) {
		if (milestone <= allTime) {
			largestMilestone = milestone;
		} else {
			break;
		}
	}

	if (largestMilestone === null) return null;

	const key = `celebrated-milestone-${largestMilestone}`;
	if (localStorage.getItem(key)) {
		return null;
	}

	localStorage.setItem(key, '1');
	return largestMilestone;
}

const EMPTY_STATS: StatsState = {
	today: 0,
	thisWeek: 0,
	thisMonth: 0,
	allTime: 0,
	streak: 0,
	avgPerDay: 0,
	estimatedDays: null,
};

const EMPTY_DEBT: PrayerDebt = {
	id: 0,
	prayer: 'fajr',
	total_owed: 0,
	total_completed: 0,
	remaining: 0,
	created_at: '',
	updated_at: '',
};

const initialDebts = (): Record<PrayerName, PrayerDebt> => {
	const result = {} as Record<PrayerName, PrayerDebt>;
	for (const p of PRAYER_NAMES) {
		result[p] = { ...EMPTY_DEBT, prayer: p };
	}
	return result;
};

export type SessionOrder = 'chronological' | 'highest-debt';

const SESSION_ORDER_KEY = 'session-order';
const SUJOOD_TRACKING_KEY = 'sujood-tracking-enabled';
const SESSIONS_PER_DAY_KEY = 'sessions-per-day';

interface PrayerStore {
	debts: Record<PrayerName, PrayerDebt>;
	stats: StatsState;
	recentLogs: PrayerLog[];
	activeObjective: Objective | null;
	isLoading: boolean;
	sessionOrder: SessionOrder;
	sujoodTrackingEnabled: boolean;
	sessionsPerDay: number;
	pendingMilestone: number | null;

	loadAll: () => Promise<void>;
	refresh: () => Promise<void>;
	logPrayer: (prayer: PrayerName, quantity?: number) => Promise<void>;
	logBatch: (entries: BatchEntry[], sessionId: string) => Promise<void>;
	undoLastLog: () => Promise<void>;
	setDebtManual: (prayer: PrayerName, amount: number) => Promise<void>;
	setDebtFromYears: (years: number, excludedDays: number) => Promise<void>;
	setObjective: (period: Period, target: number) => Promise<void>;
	setSessionOrder: (order: SessionOrder) => void;
	setSujoodTrackingEnabled: (enabled: boolean) => void;
	setSessionsPerDay: (value: number) => void;
	clearMilestone: () => void;
	resetAll: () => Promise<void>;
}

export const usePrayerStore = create<PrayerStore>()((set, get) => ({
	debts: initialDebts(),
	stats: EMPTY_STATS,
	recentLogs: [],
	activeObjective: null,
	isLoading: true,
	sessionOrder: (() => {
		const raw = localStorage.getItem(SESSION_ORDER_KEY);
		return raw === 'chronological' || raw === 'highest-debt' ? raw : 'chronological';
	})(),
	sujoodTrackingEnabled: localStorage.getItem(SUJOOD_TRACKING_KEY) === 'true',
	sessionsPerDay: (() => {
		const raw = parseInt(localStorage.getItem(SESSIONS_PER_DAY_KEY) ?? '', 10);
		return [1, 2, 3, 4, 5].includes(raw) ? raw : 1;
	})(),
	pendingMilestone: null,

	loadAll: async () => {
		set({ isLoading: true });
		const [debts, stats, recentLogs, activeObjective] = await Promise.all([
			queries.getAllDebts(db),
			queries.getStats(db),
			queries.getRecentLogs(db, 50),
			queries.getActiveObjective(db),
		]);
		set({ debts, stats, recentLogs, activeObjective, isLoading: false });
	},

	refresh: async () => {
		await get().loadAll();
	},

	logPrayer: async (prayer, quantity = 1) => {
		await queries.insertLog(db, prayer, quantity);
		const [debts, stats, recentLogs] = await Promise.all([
			queries.getAllDebts(db),
			queries.getStats(db),
			queries.getRecentLogs(db, 50),
		]);
		set({ debts, stats, recentLogs });
		const milestone = checkMilestone(stats.allTime);
		if (milestone) set({ pendingMilestone: milestone });
	},

	logBatch: async (entries, sessionId) => {
		for (const entry of entries) {
			if (entry.quantity > 0) {
				await queries.insertLog(db, entry.prayer, entry.quantity, sessionId);
			}
		}
		const [debts, stats, recentLogs] = await Promise.all([
			queries.getAllDebts(db),
			queries.getStats(db),
			queries.getRecentLogs(db, 50),
		]);
		set({ debts, stats, recentLogs });
		const milestone = checkMilestone(stats.allTime);
		if (milestone) set({ pendingMilestone: milestone });
	},

	undoLastLog: async () => {
		const logs = await queries.getLastSessionLogs(db);
		if (logs.length === 0) return;
		await queries.deleteLogsAndRollback(db, logs);
		const [debts, stats, recentLogs] = await Promise.all([
			queries.getAllDebts(db),
			queries.getStats(db),
			queries.getRecentLogs(db, 50),
		]);
		set({ debts, stats, recentLogs });
	},

	setDebtManual: async (prayer, amount) => {
		await queries.setDebt(db, prayer, Math.max(0, amount));
		const [debts, stats] = await Promise.all([queries.getAllDebts(db), queries.getStats(db)]);
		set({ debts, stats });
	},

	setDebtFromYears: async (years, excludedDays) => {
		const effectiveDays = Math.max(0, Math.round(years * 365.25) - excludedDays);
		await queries.setAllDebts(db, effectiveDays);
		const [debts, stats] = await Promise.all([queries.getAllDebts(db), queries.getStats(db)]);
		set({ debts, stats });
	},

	setObjective: async (period, target) => {
		await queries.createObjective(db, period, target);
		const activeObjective = await queries.getActiveObjective(db);
		set({ activeObjective });
	},

	setSessionOrder: (order) => {
		localStorage.setItem(SESSION_ORDER_KEY, order);
		set({ sessionOrder: order });
	},

	setSujoodTrackingEnabled: (enabled) => {
		localStorage.setItem(SUJOOD_TRACKING_KEY, String(enabled));
		set({ sujoodTrackingEnabled: enabled });
	},

	setSessionsPerDay: (value) => {
		if (![1, 2, 3, 4, 5].includes(value)) return;
		localStorage.setItem(SESSIONS_PER_DAY_KEY, String(value));
		set({ sessionsPerDay: value });
	},

	clearMilestone: () => {
		set({ pendingMilestone: null });
	},

	resetAll: async () => {
		await queries.resetAll(db);
		await get().loadAll();
	},
}));

export const useDebts = () => usePrayerStore((s) => s.debts);
export const useStats = () => usePrayerStore((s) => s.stats);
export const useActiveObjective = () => usePrayerStore((s) => s.activeObjective);
export const useTotalRemaining = () =>
	usePrayerStore((s) => PRAYER_NAMES.reduce((sum, p) => sum + (s.debts[p]?.remaining ?? 0), 0));
