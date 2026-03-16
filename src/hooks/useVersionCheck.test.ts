import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVersionCheck } from './useVersionCheck';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

function buildFetch(...versions: string[]) {
	let call = 0;
	return vi.fn().mockImplementation(() => {
		const version = versions[Math.min(call++, versions.length - 1)];
		return Promise.resolve({
			ok: true,
			json: () => Promise.resolve({ version }),
		});
	});
}

beforeEach(() => {
	vi.useFakeTimers();
	Object.defineProperty(document, 'hidden', { value: false, configurable: true, writable: true });
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

async function mountAndSeedVersion(fetch: ReturnType<typeof vi.fn>) {
	vi.stubGlobal('fetch', fetch);
	const hook = renderHook(() => useVersionCheck());
	// Flush the initial checkVersion() promise
	await act(async () => {});
	return hook;
}

describe('useVersionCheck', () => {
	it('initializes with updateAvailable = false', async () => {
		const { result } = await mountAndSeedVersion(buildFetch('1.0.0'));
		expect(result.current.updateAvailable).toBe(false);
	});

	it('stays false when version has not changed across polls', async () => {
		const { result } = await mountAndSeedVersion(buildFetch('1.0.0', '1.0.0'));
		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS + 100));
		await act(async () => {});
		expect(result.current.updateAvailable).toBe(false);
	});

	it('sets updateAvailable = true when version changes', async () => {
		const { result } = await mountAndSeedVersion(buildFetch('1.0.0', '1.0.1'));
		await act(async () => {
			vi.advanceTimersByTime(POLL_INTERVAL_MS + 100);
		});
		await act(async () => {});
		expect(result.current.updateAvailable).toBe(true);
	});

	it('dismiss sets updateAvailable back to false', async () => {
		const { result } = await mountAndSeedVersion(buildFetch('1.0.0', '1.0.1'));
		await act(async () => {
			vi.advanceTimersByTime(POLL_INTERVAL_MS + 100);
		});
		await act(async () => {});
		expect(result.current.updateAvailable).toBe(true);

		act(() => result.current.dismiss());
		expect(result.current.updateAvailable).toBe(false);
	});

	it('dismiss prevents re-triggering for the same new version (regression guard)', async () => {
		// Bug fixed in #46: dismiss() must advance currentVersionRef so polling does not re-show the dialog
		const { result } = await mountAndSeedVersion(buildFetch('1.0.0', '1.0.1', '1.0.1'));
		await act(async () => {
			vi.advanceTimersByTime(POLL_INTERVAL_MS + 100);
		});
		await act(async () => {});
		expect(result.current.updateAvailable).toBe(true);

		act(() => result.current.dismiss());
		expect(result.current.updateAvailable).toBe(false);

		// Next poll returns same new version — must NOT re-open
		await act(async () => {
			vi.advanceTimersByTime(POLL_INTERVAL_MS + 100);
		});
		await act(async () => {});
		expect(result.current.updateAvailable).toBe(false);
	});

	it('ignores non-ok fetch responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }),
		);
		const { result } = renderHook(() => useVersionCheck());
		await act(async () => {});
		expect(result.current.updateAvailable).toBe(false);
	});

	it('ignores fetch errors silently', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
		const { result } = renderHook(() => useVersionCheck());
		await act(async () => {});
		expect(result.current.updateAvailable).toBe(false);
	});

	it('ignores response missing version field', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ builtAt: '2025-01-01' }),
			}),
		);
		const { result } = renderHook(() => useVersionCheck());
		await act(async () => {});
		expect(result.current.updateAvailable).toBe(false);
	});

	it('stops polling when tab becomes hidden', async () => {
		const fetch = buildFetch('1.0.0');
		const { result: _ } = await mountAndSeedVersion(fetch);
		const callsAtMount = fetch.mock.calls.length;

		Object.defineProperty(document, 'hidden', { value: true });
		act(() => document.dispatchEvent(new Event('visibilitychange')));

		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2));
		await act(async () => {});

		expect(fetch.mock.calls.length).toBe(callsAtMount);
	});

	it('resumes polling when tab becomes visible again', async () => {
		const fetch = buildFetch('1.0.0');
		const { result: _ } = await mountAndSeedVersion(fetch);

		// Hide tab and wait
		Object.defineProperty(document, 'hidden', { value: true });
		act(() => document.dispatchEvent(new Event('visibilitychange')));
		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2));
		const callsWhileHidden = fetch.mock.calls.length;

		// Show tab — should trigger immediate check
		Object.defineProperty(document, 'hidden', { value: false });
		act(() => document.dispatchEvent(new Event('visibilitychange')));
		await act(async () => {});

		expect(fetch.mock.calls.length).toBeGreaterThan(callsWhileHidden);
	});

	it('cleans up interval and listener on unmount', async () => {
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		const fetch = buildFetch('1.0.0');
		const { unmount } = await mountAndSeedVersion(fetch);

		unmount();

		expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
	});
});
