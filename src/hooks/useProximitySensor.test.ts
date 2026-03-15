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
	});

	describe('unsupported environment', () => {
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
});
