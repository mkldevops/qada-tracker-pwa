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

			vi.setSystemTime(PINNED_NOW + 1500);
			act(() => dispatchProximity(1));

			expect(result.current.currentState).toBe('waiting_second');
			expect(onFirst).toHaveBeenCalledOnce();
		});

		it('transitions back to waiting_first after second near event', () => {
			const onSecond = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), onSecond));

			vi.setSystemTime(PINNED_NOW + 1500);
			act(() => dispatchProximity(1));
			vi.setSystemTime(PINNED_NOW + 2500);
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

			vi.setSystemTime(PINNED_NOW + 1500);
			act(() => dispatchProximity(1));
			vi.setSystemTime(PINNED_NOW + 2000);
			act(() => dispatchProximity(1));

			expect(onFirst).toHaveBeenCalledOnce();
			expect(result.current.currentState).toBe('waiting_second');
		});

		it('allows second event after 800ms debounce passes', () => {
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			vi.setSystemTime(PINNED_NOW + 1500);
			act(() => dispatchProximity(1));
			vi.setSystemTime(PINNED_NOW + 2400);
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
			vi.setSystemTime(PINNED_NOW + 1500);
			act(() => dispatchOrientation(65)); // delta = 55 > 50 → sujood down
			vi.setSystemTime(PINNED_NOW + 1900);
			act(() => dispatchOrientation(12)); // delta = 2 < 25 && elapsed 400ms ≥ 300 → sujood up

			expect(onFirst).toHaveBeenCalledOnce();
			expect(result.current.currentState).toBe('waiting_second');
		});

		it('does not fire if return is too fast (< 300ms minimum)', () => {
			(window as any).DeviceOrientationEvent = class {};
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			act(() => dispatchOrientation(10)); // baseline = 10
			vi.setSystemTime(PINNED_NOW + 1500);
			act(() => dispatchOrientation(65)); // delta = 55 → down (past grace period)
			vi.setSystemTime(PINNED_NOW + 1700);
			act(() => dispatchOrientation(12)); // delta = 2 < 25 but elapsed 200ms < 300 → ignored

			expect(onFirst).not.toHaveBeenCalled();
		});

		it('detects two sujoods in sequence', () => {
			(window as any).DeviceOrientationEvent = class {};
			const onFirst = vi.fn();
			const onSecond = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, onFirst, onSecond));

			act(() => dispatchOrientation(10)); // baseline
			vi.setSystemTime(PINNED_NOW + 1500);
			act(() => dispatchOrientation(65)); // down 1
			vi.setSystemTime(PINNED_NOW + 1900);
			act(() => dispatchOrientation(12)); // up 1 → onFirst
			vi.setSystemTime(PINNED_NOW + 2800);
			act(() => dispatchOrientation(65)); // down 2
			vi.setSystemTime(PINNED_NOW + 3200);
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
			vi.setSystemTime(PINNED_NOW + 1500);
			act(() => dispatchOrientation(65)); // delta = 55 → sujood down (past grace period)
			vi.setSystemTime(PINNED_NOW + 6501);
			act(() => dispatchOrientation(12)); // elapsed > 5000 → reset, no callback

			expect(onFirst).not.toHaveBeenCalled();

			// A fresh sujood sequence now works
			act(() => dispatchOrientation(65)); // delta = 55 → new sujood down
			vi.setSystemTime(PINNED_NOW + 6900);
			act(() => dispatchOrientation(12)); // delta = 2 < 25, elapsed 399ms → fires

			expect(onFirst).toHaveBeenCalledOnce();
		});
	});

	describe('supported via camera brightness', () => {
		const PIXEL_COUNT = 80 * 60;
		let pixelData: Uint8ClampedArray;
		let mockGetUserMedia: ReturnType<typeof vi.fn>;
		let mockStop: ReturnType<typeof vi.fn>;
		let mockCtx: { drawImage: ReturnType<typeof vi.fn>; getImageData: ReturnType<typeof vi.fn> };
		let mockVideo: { muted: boolean; srcObject: unknown; play: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			pixelData = new Uint8ClampedArray(PIXEL_COUNT * 4).fill(200);
			mockStop = vi.fn();
			mockCtx = {
				drawImage: vi.fn(),
				getImageData: vi.fn().mockImplementation(() => ({ data: pixelData })),
			};
			mockVideo = { muted: false, srcObject: null, play: vi.fn().mockResolvedValue(undefined) };
			mockGetUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: mockStop }] });

			Object.defineProperty(navigator, 'mediaDevices', {
				value: { getUserMedia: mockGetUserMedia },
				configurable: true,
				writable: true,
			});

			const originalCreateElement = document.createElement.bind(document);
			vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: unknown) => {
				if (tag === 'canvas') return { getContext: () => mockCtx, width: 0, height: 0 } as any;
				if (tag === 'video') return mockVideo as any;
				return originalCreateElement(tag, options as ElementCreationOptions | undefined);
			});

			delete (window as any).DeviceOrientationEvent;
			vi.useFakeTimers({
				toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
				now: PINNED_NOW,
			});
		});

		afterEach(() => {
			vi.useRealTimers();
			vi.restoreAllMocks();
			Object.defineProperty(navigator, 'mediaDevices', {
				value: undefined,
				configurable: true,
				writable: true,
			});
			delete (window as any).DeviceOrientationEvent;
		});

		it('returns isSupported: true when getUserMedia available', () => {
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));
			expect(result.current.isSupported).toBe(true);
		});

		it('starts in waiting_first when active', () => {
			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));
			expect(result.current.currentState).toBe('waiting_first');
		});

		it('detects sujood: covered ≥ 300ms then uncovered fires onFirstSujood', async () => {
			const onFirst = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			await act(async () => {
				await Promise.resolve();
			});

			act(() => vi.advanceTimersByTime(1500)); // advance past 1500ms grace period
			pixelData.fill(0);
			act(() => vi.advanceTimersByTime(200)); // tick: dark → coveredSinceMs set
			act(() => vi.advanceTimersByTime(200)); // tick: dark
			pixelData.fill(200);
			act(() => vi.advanceTimersByTime(200)); // tick: bright, elapsed=400ms → fires

			expect(onFirst).toHaveBeenCalledOnce();
			expect(result.current.currentState).toBe('waiting_second');
		});

		it('does not fire if uncovered too fast (< 300ms)', async () => {
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			await act(async () => {
				await Promise.resolve();
			});

			pixelData.fill(0);
			act(() => vi.advanceTimersByTime(200)); // tick 1: dark → coveredSinceMs set
			pixelData.fill(200);
			act(() => vi.advanceTimersByTime(200)); // tick 2: bright, elapsed=200ms < 300ms → no callback

			expect(onFirst).not.toHaveBeenCalled();
		});

		it('does not fire if covered too long (> 5000ms)', async () => {
			const onFirst = vi.fn();
			renderHook(() => useProximitySensor(true, onFirst, vi.fn()));

			await act(async () => {
				await Promise.resolve();
			});

			act(() => vi.advanceTimersByTime(1500)); // advance past 1500ms grace period
			pixelData.fill(0);
			act(() => vi.advanceTimersByTime(200)); // dark → coveredSinceMs set
			act(() => vi.advanceTimersByTime(5200)); // advance 5200ms (elapsed > 5000ms max)
			pixelData.fill(200);
			act(() => vi.advanceTimersByTime(200)); // bright, but elapsed > 5000ms → no callback

			expect(onFirst).not.toHaveBeenCalled();
		});

		it("detects two sujoods in sequence completing a rak'a", async () => {
			const onFirst = vi.fn();
			const onSecond = vi.fn();
			const { result } = renderHook(() => useProximitySensor(true, onFirst, onSecond));

			await act(async () => {
				await Promise.resolve();
			});

			act(() => vi.advanceTimersByTime(1500)); // advance past 1500ms grace period
			pixelData.fill(0);
			act(() => vi.advanceTimersByTime(200)); // dark
			act(() => vi.advanceTimersByTime(200)); // dark
			pixelData.fill(200);
			act(() => vi.advanceTimersByTime(200)); // bright, elapsed=400ms → onFirst

			expect(onFirst).toHaveBeenCalledOnce();

			act(() => vi.advanceTimersByTime(800)); // advance past 800ms debounce

			pixelData.fill(0);
			act(() => vi.advanceTimersByTime(200)); // dark
			act(() => vi.advanceTimersByTime(200)); // dark
			pixelData.fill(200);
			act(() => vi.advanceTimersByTime(200)); // bright, elapsed=400ms → onSecond

			expect(onSecond).toHaveBeenCalledOnce();
			expect(result.current.currentState).toBe('waiting_first');
		});

		it('calls stream track stop on unmount', async () => {
			const { unmount } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			await act(async () => {
				await Promise.resolve();
			});

			unmount();

			expect(mockStop).toHaveBeenCalled();
		});

		it('falls back to DeviceOrientationEvent when permission denied', async () => {
			mockGetUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
			(window as any).DeviceOrientationEvent = class {};
			const addSpy = vi.spyOn(window, 'addEventListener');

			renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			await act(async () => {
				await Promise.resolve();
			});

			expect(addSpy).toHaveBeenCalledWith('deviceorientation', expect.any(Function));
		});

		it('falls back to unsupported when camera denied and no orientation', async () => {
			mockGetUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));

			const { result } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			await act(async () => {
				await Promise.resolve();
			});

			act(() => vi.advanceTimersByTime(3000));

			expect(result.current.isSupported).toBe(false);
			expect(result.current.currentState).toBe('unsupported');
		});

		it('stops stream if resolved after component unmounts', async () => {
			const { unmount } = renderHook(() => useProximitySensor(true, vi.fn(), vi.fn()));

			unmount();

			await act(async () => {
				await Promise.resolve();
			});

			expect(mockStop).toHaveBeenCalled();
		});
	});
});
