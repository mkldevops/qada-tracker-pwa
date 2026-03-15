import { describe, expect, it } from 'vitest';
import type { PrayerLog } from '@/types';
import { groupBySession } from './groupBySession';

const makeLog = (id: number, session_id: string | null, prayer = 'fajr' as const): PrayerLog => ({
	id,
	prayer,
	quantity: 1,
	logged_at: new Date().toISOString(),
	session_id,
});

describe('groupBySession', () => {
	it('returns empty array for empty input', () => {
		expect(groupBySession([])).toEqual([]);
	});

	it('single log with null session_id → one group', () => {
		const groups = groupBySession([makeLog(1, null)]);
		expect(groups).toHaveLength(1);
		expect(groups[0].sessionId).toBeNull();
		expect(groups[0].entries).toHaveLength(1);
	});

	it('consecutive logs with same session_id are merged', () => {
		const logs = [makeLog(1, 'session-1'), makeLog(2, 'session-1'), makeLog(3, 'session-1')];
		const groups = groupBySession(logs);
		expect(groups).toHaveLength(1);
		expect(groups[0].entries).toHaveLength(3);
	});

	it('logs with different session_ids produce separate groups', () => {
		const logs = [makeLog(1, 'session-1'), makeLog(2, 'session-2')];
		const groups = groupBySession(logs);
		expect(groups).toHaveLength(2);
		expect(groups[0].sessionId).toBe('session-1');
		expect(groups[1].sessionId).toBe('session-2');
	});

	it('consecutive null session_ids are NOT merged (each is its own group)', () => {
		const logs = [makeLog(1, null), makeLog(2, null), makeLog(3, null)];
		const groups = groupBySession(logs);
		expect(groups).toHaveLength(3);
	});

	it('mixed null and session_id logs produce correct groups', () => {
		const logs = [
			makeLog(1, null),
			makeLog(2, 'session-1'),
			makeLog(3, 'session-1'),
			makeLog(4, null),
		];
		const groups = groupBySession(logs);
		expect(groups).toHaveLength(3);
		expect(groups[0].sessionId).toBeNull();
		expect(groups[1].sessionId).toBe('session-1');
		expect(groups[1].entries).toHaveLength(2);
		expect(groups[2].sessionId).toBeNull();
	});

	it('group date uses the first log in the group', () => {
		const date = '2024-01-15T10:00:00.000Z';
		const log = { ...makeLog(1, 'session-1'), logged_at: date };
		const groups = groupBySession([log]);
		expect(groups[0].date).toBe(date);
	});
});
