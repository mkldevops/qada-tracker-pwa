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
	vi.stubGlobal('location', { reload: vi.fn() });
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

async function mountAndSeedVersion(fetch: ReturnType<typeof vi.fn>) {
	vi.stubGlobal('fetch', fetch);
	const hook = renderHook(() => useVersionCheck());
	await act(async () => {});
	return hook;
}

describe('useVersionCheck', () => {
	it('does not reload when version is unchanged', async () => {
		await mountAndSeedVersion(buildFetch('1.0.0', '1.0.0'));
		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS + 100));
		await act(async () => {});
		expect(location.reload).not.toHaveBeenCalled();
	});

	it('reloads immediately when version changes and tab is hidden', async () => {
		Object.defineProperty(document, 'hidden', { value: true });
		await mountAndSeedVersion(buildFetch('1.0.0', '1.0.1'));
		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS + 100));
		await act(async () => {});
		expect(location.reload).toHaveBeenCalledOnce();
	});

	it('does not reload immediately when version changes and tab is visible', async () => {
		await mountAndSeedVersion(buildFetch('1.0.0', '1.0.1'));
		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS + 100));
		await act(async () => {});
		expect(location.reload).not.toHaveBeenCalled();
	});

	it('reloads when tab goes hidden after pending update', async () => {
		await mountAndSeedVersion(buildFetch('1.0.0', '1.0.0', '1.0.1'));
		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS + 100));
		await act(async () => {});
		expect(location.reload).not.toHaveBeenCalled();

		Object.defineProperty(document, 'hidden', { value: true });
		act(() => document.dispatchEvent(new Event('visibilitychange')));
		expect(location.reload).toHaveBeenCalledOnce();
	});

	it('stops polling when tab becomes hidden', async () => {
		const fetch = buildFetch('1.0.0');
		await mountAndSeedVersion(fetch);
		const callsAtMount = fetch.mock.calls.length;

		Object.defineProperty(document, 'hidden', { value: true });
		act(() => document.dispatchEvent(new Event('visibilitychange')));

		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2));
		await act(async () => {});

		expect(fetch.mock.calls.length).toBe(callsAtMount);
	});

	it('resumes polling when tab becomes visible again', async () => {
		const fetch = buildFetch('1.0.0');
		await mountAndSeedVersion(fetch);

		Object.defineProperty(document, 'hidden', { value: true });
		act(() => document.dispatchEvent(new Event('visibilitychange')));
		await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2));
		const callsWhileHidden = fetch.mock.calls.length;

		Object.defineProperty(document, 'hidden', { value: false });
		act(() => document.dispatchEvent(new Event('visibilitychange')));
		await act(async () => {});

		expect(fetch.mock.calls.length).toBeGreaterThan(callsWhileHidden);
	});

	it('ignores non-ok fetch responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }),
		);
		renderHook(() => useVersionCheck());
		await act(async () => {});
		expect(location.reload).not.toHaveBeenCalled();
	});

	it('ignores fetch errors silently', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
		renderHook(() => useVersionCheck());
		await act(async () => {});
		expect(location.reload).not.toHaveBeenCalled();
	});

	it('ignores response missing version field', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ builtAt: '2025-01-01' }),
			}),
		);
		renderHook(() => useVersionCheck());
		await act(async () => {});
		expect(location.reload).not.toHaveBeenCalled();
	});

	it('cleans up interval and listener on unmount', async () => {
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		const fetch = buildFetch('1.0.0');
		const { unmount } = await mountAndSeedVersion(fetch);

		unmount();

		expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
	});
});
