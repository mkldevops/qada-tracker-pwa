import { create } from 'zustand';
import { db } from '../db/database';
import * as queries from '../db/queries';
import type {
	BatchEntry,
	Milestone,
	Objective,
	Period,
	PrayerDebt,
	PrayerLog,
	PrayerName,
	StatsState,
} from '../types';
import { PRAYER_NAMES } from '../types';

const MILESTONES = [100, 500, 1000, 2500, 5000, 10000] as const;

function updateAppBadge(debts: Record<PrayerName, PrayerDebt>) {
	if (!('setAppBadge' in navigator)) return;
	const total = PRAYER_NAMES.reduce((sum, p) => sum + (debts[p]?.remaining ?? 0), 0);
	if (total > 0) {
		navigator.setAppBadge(total).catch(() => {});
	} else {
		navigator.clearAppBadge().catch(() => {});
	}
}

const PRAYERS_PER_MONTH = 150;
const PRAYERS_PER_YEAR = 1825;

function checkMilestone(allTime: number): Milestone | null {
	let largestMilestone: number | null = null;
	for (const milestone of MILESTONES) {
		if (milestone <= allTime) {
			largestMilestone = milestone;
		} else {
			break;
		}
	}

	if (largestMilestone !== null) {
		const key = `celebrated-milestone-${largestMilestone}`;
		if (!localStorage.getItem(key)) {
			localStorage.setItem(key, '1');
			return { kind: 'count', value: largestMilestone };
		}
	}

	const currentMonths = Math.floor(allTime / PRAYERS_PER_MONTH);
	const currentYears = Math.floor(allTime / PRAYERS_PER_YEAR);

	if (currentYears > 0) {
		const key = `celebrated-catchup-year-${currentYears}`;
		if (!localStorage.getItem(key)) {
			localStorage.setItem(key, '1');
			// Also mark the current month milestone to avoid double-fire
			localStorage.setItem(`celebrated-catchup-month-${currentMonths}`, '1');
			return { kind: 'year', years: currentYears };
		}
	}

	if (currentMonths > 0) {
		const key = `celebrated-catchup-month-${currentMonths}`;
		if (!localStorage.getItem(key)) {
			localStorage.setItem(key, '1');
			return { kind: 'month', months: currentMonths };
		}
	}

	return null;
}

const EMPTY_STATS: StatsState = {
	today: 0,
	thisWeek: 0,
	thisMonth: 0,
	allTime: 0,
	streak: 0,
	avgPerDay: 0,
	estimatedDays: null,
	bestStreak: 0,
	bestDay: 0,
	bestWeek: 0,
	lastWeek: 0,
	consistencyRate: 0,
	nextMilestone: null,
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
const RAKA_BY_RAKA_KEY = 'raka-by-raka-enabled';
const SESSIONS_PER_DAY_KEY = 'sessions-per-day';
const TASHAHD_DURATION_KEY = 'tashahd-duration-ms';
const ESTIMATION_WINDOW_KEY = 'estimation-window-days';
const ESTIMATION_HAYD_KEY = 'estimation-hayd-days';

function readEstimationSettings(): { windowDays: number | null; haydAvgDays: number } {
	const rawWindow = localStorage.getItem(ESTIMATION_WINDOW_KEY);
	const windowDays: number | null =
		rawWindow === 'all-time'
			? null
			: [10, 30].includes(Number.parseInt(rawWindow ?? '', 10))
				? Number.parseInt(rawWindow ?? '', 10)
				: 30;
	const rawHayd = Number.parseInt(localStorage.getItem(ESTIMATION_HAYD_KEY) ?? '', 10);
	const haydAvgDays = rawHayd >= 1 && rawHayd <= 15 ? rawHayd : 0;
	return { windowDays, haydAvgDays };
}

interface PrayerStore {
	debts: Record<PrayerName, PrayerDebt>;
	stats: StatsState;
	recentLogs: PrayerLog[];
	activeObjective: Objective | null;
	isLoading: boolean;
	sessionOrder: SessionOrder;
	sujoodTrackingEnabled: boolean;
	rakaByRaka: boolean;
	sessionsPerDay: number;
	tashahdDurationMs: number;
	estimationWindowDays: number | null;
	estimationHaydDays: number;
	pendingMilestone: Milestone | null;

	loadAll: () => Promise<void>;
	refresh: () => Promise<void>;
	logPrayer: (prayer: PrayerName, quantity?: number) => Promise<void>;
	logBatch: (entries: BatchEntry[], sessionId: string) => Promise<void>;
	undoLastLog: () => Promise<void>;
	deleteLog: (id: number, prayer: PrayerName, quantity: number) => Promise<void>;
	setDebtManual: (prayer: PrayerName, amount: number) => Promise<void>;
	setDebtFromYears: (years: number, excludedDays: number) => Promise<void>;
	setObjective: (period: Period, target: number) => Promise<void>;
	setSessionOrder: (order: SessionOrder) => void;
	setSujoodTrackingEnabled: (enabled: boolean) => void;
	setRakaByRaka: (enabled: boolean) => void;
	setSessionsPerDay: (value: number) => void;
	setTashahdDurationMs: (ms: number) => void;
	setEstimationWindowDays: (days: number | null) => void;
	setEstimationHaydDays: (days: number) => void;
	clearMilestone: () => void;
	resetAll: () => Promise<void>;
}

export const usePrayerStore = create<PrayerStore>()((set, get) => {
	async function syncAll() {
		const { windowDays, haydAvgDays } = readEstimationSettings();
		const [debts, stats, recentLogs] = await Promise.all([
			queries.getAllDebts(db),
			queries.getStats(db, windowDays, haydAvgDays),
			queries.getRecentLogs(db, 50),
		]);
		set({ debts, stats, recentLogs });
		updateAppBadge(debts);
		return { debts, stats };
	}

	async function syncDebtsStats() {
		const { windowDays, haydAvgDays } = readEstimationSettings();
		const [debts, stats] = await Promise.all([
			queries.getAllDebts(db),
			queries.getStats(db, windowDays, haydAvgDays),
		]);
		set({ debts, stats });
		updateAppBadge(debts);
	}

	return {
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
		rakaByRaka: (() => {
			if (localStorage.getItem(RAKA_BY_RAKA_KEY) === 'true') return true;
			if (localStorage.getItem(SUJOOD_TRACKING_KEY) === 'true') {
				localStorage.setItem(RAKA_BY_RAKA_KEY, 'true');
				return true;
			}
			return false;
		})(),
		sessionsPerDay: (() => {
			const raw = parseInt(localStorage.getItem(SESSIONS_PER_DAY_KEY) ?? '', 10);
			return [1, 2, 3, 4, 5].includes(raw) ? raw : 1;
		})(),
		tashahdDurationMs: (() => {
			const raw = parseInt(localStorage.getItem(TASHAHD_DURATION_KEY) ?? '', 10);
			return raw >= 5000 && raw <= 300000 ? raw : 30000;
		})(),
		estimationWindowDays: (() => {
			const raw = localStorage.getItem(ESTIMATION_WINDOW_KEY);
			if (raw === 'all-time') return null;
			const n = parseInt(raw ?? '', 10);
			return [10, 30].includes(n) ? n : 30;
		})(),
		estimationHaydDays: (() => {
			const raw = parseInt(localStorage.getItem(ESTIMATION_HAYD_KEY) ?? '', 10);
			return raw >= 1 && raw <= 15 ? raw : 0;
		})(),
		pendingMilestone: null,

		loadAll: async () => {
			set({ isLoading: true });
			const { windowDays, haydAvgDays } = readEstimationSettings();
			const [debts, stats, recentLogs, activeObjective] = await Promise.all([
				queries.getAllDebts(db),
				queries.getStats(db, windowDays, haydAvgDays),
				queries.getRecentLogs(db, 50),
				queries.getActiveObjective(db),
			]);
			set({ debts, stats, recentLogs, activeObjective, isLoading: false });
			updateAppBadge(debts);
		},

		refresh: async () => {
			await get().loadAll();
		},

		logPrayer: async (prayer, quantity = 1) => {
			await queries.insertLog(db, prayer, quantity);
			const { stats } = await syncAll();
			const milestone = checkMilestone(stats.allTime);
			if (milestone) set({ pendingMilestone: milestone });
		},

		logBatch: async (entries, sessionId) => {
			for (const entry of entries) {
				if (entry.quantity > 0) {
					await queries.insertLog(db, entry.prayer, entry.quantity, sessionId);
				}
			}
			const { stats } = await syncAll();
			const milestone = checkMilestone(stats.allTime);
			if (milestone) set({ pendingMilestone: milestone });
		},

		undoLastLog: async () => {
			const logs = await queries.getLastSessionLogs(db);
			if (logs.length === 0) return;
			await queries.deleteLogsAndRollback(db, logs);
			await syncAll();
		},

		deleteLog: async (id, prayer, quantity) => {
			await queries.deleteLogsAndRollback(db, [{ id, prayer, quantity }]);
			await syncAll();
		},

		setDebtManual: async (prayer, amount) => {
			await queries.setDebt(db, prayer, Math.max(0, amount));
			await syncDebtsStats();
		},

		setDebtFromYears: async (years, excludedDays) => {
			const effectiveDays = Math.max(0, Math.round(years * 365.25) - excludedDays);
			await queries.setAllDebts(db, effectiveDays);
			await syncDebtsStats();
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
			if (enabled && !get().rakaByRaka) {
				localStorage.setItem(RAKA_BY_RAKA_KEY, 'true');
				set({ sujoodTrackingEnabled: true, rakaByRaka: true });
			} else {
				set({ sujoodTrackingEnabled: enabled });
			}
		},

		setRakaByRaka: (enabled) => {
			localStorage.setItem(RAKA_BY_RAKA_KEY, String(enabled));
			if (!enabled) {
				localStorage.setItem(SUJOOD_TRACKING_KEY, 'false');
				set({ rakaByRaka: false, sujoodTrackingEnabled: false });
			} else {
				set({ rakaByRaka: true });
			}
		},

		setSessionsPerDay: (value) => {
			if (![1, 2, 3, 4, 5].includes(value)) return;
			localStorage.setItem(SESSIONS_PER_DAY_KEY, String(value));
			set({ sessionsPerDay: value });
		},

		setTashahdDurationMs: (ms) => {
			const clamped = Math.max(5000, Math.min(300000, ms));
			localStorage.setItem(TASHAHD_DURATION_KEY, String(clamped));
			set({ tashahdDurationMs: clamped });
		},

		setEstimationWindowDays: (days) => {
			localStorage.setItem(ESTIMATION_WINDOW_KEY, days === null ? 'all-time' : String(days));
			set({ estimationWindowDays: days });
			syncDebtsStats();
		},

		setEstimationHaydDays: (days) => {
			const clamped = Math.max(0, Math.min(15, days));
			localStorage.setItem(ESTIMATION_HAYD_KEY, String(clamped));
			set({ estimationHaydDays: clamped });
			syncDebtsStats();
		},

		clearMilestone: () => {
			set({ pendingMilestone: null });
		},

		resetAll: async () => {
			for (const key of Object.keys(localStorage)) {
				if (key.startsWith('celebrated-')) localStorage.removeItem(key);
			}
			await queries.resetAll(db);
			await get().loadAll();
		},
	};
});

export const useDebts = () => usePrayerStore((s) => s.debts);
export const useStats = () => usePrayerStore((s) => s.stats);
export const useActiveObjective = () => usePrayerStore((s) => s.activeObjective);
export const useTotalRemaining = () =>
	usePrayerStore((s) => PRAYER_NAMES.reduce((sum, p) => sum + (s.debts[p]?.remaining ?? 0), 0));
