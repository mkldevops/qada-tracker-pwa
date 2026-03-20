import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProximitySensor } from './useProximitySensor';

const PINNED_NOW = new Date('2025-06-15T12:00:00.000Z').getTime();

function dispatchProximity(value: number) {
	const event = Object.assign(new Event('deviceproximity'), { value });
	window.dispatchEvent(event);
}

describe('useProximitySensor', () => {
	afterEach(() => {
		vi.useRealTimers();
		delete (window as any).ondeviceproximity;
		delete (window as any).DeviceOrientationEvent;
	});

	describe('unsupported environment', () => {
		beforeEach(() => {
			delete (window as any).DeviceOrientationEvent;
		});

		it('returns isSupported: false when no sensor API available', () => {
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));
			expect(result.current.isSupported).toBe(false);
		});

		it('returns currentState: unsupported when active but no sensor', () => {
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));
			expect(result.current.currentState).toBe('unsupported');
			expect(result.current.isActive).toBe(false);
		});
	});

	describe('supported via deviceproximity', () => {
		beforeEach(() => {
			(window as any).ondeviceproximity = null;
			vi.useFakeTimers({ toFake: ['Date'], now: PINNED_NOW });
		});

		it('returns isSupported: true', () => {
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));
			expect(result.current.isSupported).toBe(true);
		});

		it('starts in waiting_first when active', () => {
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));
			expect(result.current.currentState).toBe('waiting_first');
			expect(result.current.isActive).toBe(true);
		});

		it('stays idle when not active', () => {
			const { result } = renderHook(() => useProximitySensor(false, vi.fn(), vi.fn()));
			expect(result.current.currentState).toBe('idle');
			expect(result.current.isActive).toBe(false);
		});

		it('transitions to waiting_second after first near event', () => {
			const onFirst = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchProximity(1));

			expect(result.current.currentState).toBe('waiting_second');
			expect(onFirst).toHaveBeenCalledOnce();
		});

		it('transitions back to waiting_first after second near event', () => {
			const onSecond = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), onSecond));

			act(() => dispatchProximity(1));
			vi.setSystemTime(PINNED_NOW + 1000);
			act(() => dispatchProximity(1));

			expect(result.current.currentState).toBe('waiting_first');
			expect(onSecond).toHaveBeenCalledOnce();
		});

		it('ignores far events (value >= 5)', () => {
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchProximity(20));

			expect(onFirst).not.toHaveBeenCalled();
		});

		it('debounces: ignores second event within 800ms', () => {
			const onFirst = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchProximity(1));
			vi.setSystemTime(PINNED_NOW + 500);
			act(() => dispatchProximity(1));

			expect(onFirst).toHaveBeenCalledOnce();
			expect(result.current.currentState).toBe('waiting_second');
		});

		it('allows second event after 800ms debounce passes', () => {
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchProximity(1));
			vi.setSystemTime(PINNED_NOW + 900);
			act(() => dispatchProximity(1));

			// First event → waiting_second, second near event → onSecond (not onFirst again)
			expect(onFirst).toHaveBeenCalledOnce();
		});

		it('resets to idle when active changes to false', () => {
			const { result, rerender } = renderHook(
				({ active }: { active: boolean }) => useProximitySensor(active, vi.fn(), vi.fn()),
				{ initialProps: { active: true } },
			);

			expect(result.current.currentState).toBe('waiting_first');

			rerender({ active: false });

			expect(result.current.currentState).toBe('idle');
			expect(result.current.isActive).toBe(false);
		});

		it('removes deviceproximity listener on unmount', () => {
			const removeSpy = vi.spyOn(window, 'removeEventListener');
			const { unmount } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			unmount();

			expect(removeSpy).toHaveBeenCalledWith('deviceproximity', expect.any(Function));
		});
	});

	describe('supported via DeviceOrientationEvent', () => {
		function dispatchOrientation(beta: number | null) {
			const event = Object.assign(new Event('deviceorientation'), { beta, alpha: 0, gamma: 0 });
			window.dispatchEvent(event);
		}

		beforeEach(() => {
			vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'], now: PINNED_NOW });
		});

		afterEach(() => {
			vi.runAllTimers();
			delete (window as any).DeviceOrientationEvent;
		});

		it('returns isSupported: true when DeviceOrientationEvent is available', () => {
			(window as any).DeviceOrientationEvent = class {};
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));
			expect(result.current.isSupported).toBe(true);
		});

		it('falls back to unsupported when first event has beta: null (desktop)', () => {
			(window as any).DeviceOrientationEvent = class {};
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			act(() => dispatchOrientation(null));

			expect(result.current.isSupported).toBe(false);
			expect(result.current.currentState).toBe('unsupported');
		});

		it('captures baseline on first event and fires no callback', () => {
			(window as any).DeviceOrientationEvent = class {};
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchOrientation(10));

			expect(onFirst).not.toHaveBeenCalled();
		});

		it('detects sujood: down > 50° then up < 25° after 300ms fires onFirstSujood', () => {
			(window as any).DeviceOrientationEvent = class {};
			const onFirst = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchOrientation(10)); // baseline = 10
			act(() => dispatchOrientation(65)); // delta = 55 > 50 → sujood down
			vi.setSystemTime(PINNED_NOW + 400);
			act(() => dispatchOrientation(12)); // delta = 2 < 25 && elapsed 400ms ≥ 300 → sujood up

			expect(onFirst).toHaveBeenCalledOnce();
			expect(result.current.currentState).toBe('waiting_second');
		});

		it('does not fire if return is too fast (< 300ms minimum)', () => {
			(window as any).DeviceOrientationEvent = class {};
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchOrientation(10)); // baseline = 10
			act(() => dispatchOrientation(65)); // delta = 55 → down (at PINNED_NOW)
			vi.setSystemTime(PINNED_NOW + 200);
			act(() => dispatchOrientation(12)); // delta = 2 < 25 but elapsed 200ms < 300 → ignored

			expect(onFirst).not.toHaveBeenCalled();
		});

		it('detects two sujoods in sequence', () => {
			(window as any).DeviceOrientationEvent = class {};
			const onFirst = vi.fn();
			const onSecond = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, onFirst, onSecond));

			act(() => dispatchOrientation(10)); // baseline
			act(() => dispatchOrientation(65)); // down 1
			vi.setSystemTime(PINNED_NOW + 400);
			act(() => dispatchOrientation(12)); // up 1 → onFirst
			vi.setSystemTime(PINNED_NOW + 1300);
			act(() => dispatchOrientation(65)); // down 2
			vi.setSystemTime(PINNED_NOW + 1700);
			act(() => dispatchOrientation(12)); // up 2 → onSecond

			expect(onFirst).toHaveBeenCalledOnce();
			expect(onSecond).toHaveBeenCalledOnce();
			expect(result.current.currentState).toBe('waiting_first');
		});

		it('removes deviceorientation listener on unmount', () => {
			(window as any).DeviceOrientationEvent = class {};
			const removeSpy = vi.spyOn(window, 'removeEventListener');
			const { unmount } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			unmount();

			expect(removeSpy).toHaveBeenCalledWith('deviceorientation', expect.any(Function));
		});

		it('falls back to unsupported after 3s startup timeout with no events', () => {
			(window as any).DeviceOrientationEvent = class {};
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			expect(result.current.isSupported).toBe(true);

			act(() => vi.advanceTimersByTime(3000));

			expect(result.current.isSupported).toBe(false);
			expect(result.current.currentState).toBe('unsupported');
		});

		it('cancels startup timeout once baseline is captured', () => {
			(window as any).DeviceOrientationEvent = class {};
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			act(() => dispatchOrientation(10)); // baseline captured → timer cleared
			act(() => vi.advanceTimersByTime(3000));

			expect(result.current.isSupported).toBe(true);
		});

		it('resets sujood-down state after 5s without returning to baseline', () => {
			(window as any).DeviceOrientationEvent = class {};
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchOrientation(10)); // baseline = 10
			act(() => dispatchOrientation(65)); // delta = 55 → sujood down at PINNED_NOW
			vi.setSystemTime(PINNED_NOW + 5001);
			act(() => dispatchOrientation(12)); // elapsed > 5000 → reset, no callback

			expect(onFirst).not.toHaveBeenCalled();

			// A fresh sujood sequence now works
			act(() => dispatchOrientation(65)); // delta = 55 → new sujood down
			vi.setSystemTime(PINNED_NOW + 5500);
			act(() => dispatchOrientation(12)); // delta = 2 < 25, elapsed 499ms → fires

			expect(onFirst).toHaveBeenCalledOnce();
		});
	});
});
