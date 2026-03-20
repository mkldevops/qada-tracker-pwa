import { useEffect, useRef, useState } from 'react';

type SensorState = 'idle' | 'waiting_first' | 'waiting_second' | 'unsupported';

interface UseProximitySensorResult {
	isSupported: boolean;
	isActive: boolean;
	currentState: SensorState;
}

const TILT_DOWN_THRESHOLD = 50;
const TILT_RETURN_THRESHOLD = 25;
const MIN_SUJOOD_DURATION_MS = 300;
const MAX_SUJOOD_DURATION_MS = 5000;
const DEBOUNCE_MS = 800;
const ORIENTATION_STARTUP_TIMEOUT_MS = 3000;

export function useProximitySensor(
	active: boolean,
	onFirstSujood: () => void,
	onSecondSujood: () => void,
): UseProximitySensorResult {
	const [isSupported, setIsSupported] = useState(false);
	const [currentState, setCurrentState] = useState<SensorState>('idle');
	const sensorRef = useRef<any>(null);
	const lastDetectionRef = useRef<number>(0);
	const sujoodCountRef = useRef<0 | 1>(0);
	const callbacksRef = useRef({ onFirstSujood, onSecondSujood });
	const betaBaselineRef = useRef<number | null>(null);
	const sujoodDownTimeRef = useRef<number>(0);

	useEffect(() => {
		callbacksRef.current = { onFirstSujood, onSecondSujood };
	}, [onFirstSujood, onSecondSujood]);

	useEffect(() => {
		const hasProximitySensor = typeof (window as any).ProximitySensor !== 'undefined';
		const hasDeviceProximity = typeof (window as any).ondeviceproximity !== 'undefined';
		const hasDeviceOrientation = typeof window.DeviceOrientationEvent !== 'undefined';
		const hasSupport = hasProximitySensor || hasDeviceProximity || hasDeviceOrientation;

		setIsSupported(hasSupport);

		if (!active || !hasSupport) {
			setCurrentState(active ? 'unsupported' : 'idle');
			if (sensorRef.current) {
				try {
					sensorRef.current.stop?.();
				} catch {}
				sensorRef.current = null;
			}
			return;
		}

		setCurrentState('waiting_first');
		lastDetectionRef.current = 0;
		sujoodCountRef.current = 0;
		betaBaselineRef.current = null;
		sujoodDownTimeRef.current = 0;
		let cancelled = false;

		function handleProximityDetection(isNear: boolean) {
			if (!isNear || cancelled) return;

			const now = Date.now();
			if (now - lastDetectionRef.current < DEBOUNCE_MS) return;
			lastDetectionRef.current = now;

			if (sujoodCountRef.current === 0) {
				sujoodCountRef.current = 1;
				setCurrentState('waiting_second');
				callbacksRef.current.onFirstSujood();
			} else if (sujoodCountRef.current === 1) {
				sujoodCountRef.current = 0;
				setCurrentState('waiting_first');
				callbacksRef.current.onSecondSujood();
			}
		}

		function setupCleanup(extraCleanup?: () => void) {
			return () => {
				cancelled = true;
				extraCleanup?.();
				if (sensorRef.current) {
					try {
						if (typeof sensorRef.current.stop === 'function') {
							sensorRef.current.stop();
						} else if (typeof sensorRef.current === 'function') {
							window.removeEventListener('deviceproximity', sensorRef.current);
							window.removeEventListener('deviceorientation', sensorRef.current);
						}
					} catch {}
					sensorRef.current = null;
				}
				betaBaselineRef.current = null;
				sujoodDownTimeRef.current = 0;
				setCurrentState('idle');
			};
		}

		// Try ProximitySensor API first (Chrome, some Android browsers)
		if (typeof (window as any).ProximitySensor !== 'undefined') {
			try {
				const sensor = new (window as any).ProximitySensor({
					frequency: 5,
				});
				sensor.addEventListener('reading', () => {
					handleProximityDetection(sensor.near);
				});
				sensor.addEventListener('error', () => {
					try {
						sensor.stop();
					} catch {}
					setupDeviceProximityFallback();
				});
				sensor.start();
				sensorRef.current = sensor;
				return setupCleanup();
			} catch {
				// Fall through to deviceproximity fallback
			}
		}

		// Fallback to deviceproximity event (Firefox, Android)
		function setupDeviceProximityFallback() {
			function handleDeviceProximity(event: any) {
				const isNear = (event.value as number) < 5;
				handleProximityDetection(isNear);
			}

			window.addEventListener('deviceproximity', handleDeviceProximity);
			sensorRef.current = handleDeviceProximity;
		}

		// Fallback to DeviceOrientationEvent (Chrome Android, iOS 13+)
		function setupDeviceOrientationFallback() {
			const startupTimer = setTimeout(() => {
				if (cancelled) return;
				setIsSupported(false);
				setCurrentState('unsupported');
				window.removeEventListener('deviceorientation', handleDeviceOrientation);
				sensorRef.current = null;
			}, ORIENTATION_STARTUP_TIMEOUT_MS);

			function handleDeviceOrientation(event: DeviceOrientationEvent) {
				if (cancelled) return;

				if (event.beta === null) {
					clearTimeout(startupTimer);
					setIsSupported(false);
					setCurrentState('unsupported');
					window.removeEventListener('deviceorientation', handleDeviceOrientation);
					sensorRef.current = null;
					return;
				}

				if (betaBaselineRef.current === null) {
					clearTimeout(startupTimer);
					betaBaselineRef.current = event.beta;
					return;
				}

				const delta = Math.abs(event.beta - betaBaselineRef.current);

				if (sujoodDownTimeRef.current === 0) {
					if (delta > TILT_DOWN_THRESHOLD) {
						sujoodDownTimeRef.current = Date.now();
					}
				} else {
					const elapsed = Date.now() - sujoodDownTimeRef.current;
					if (elapsed > MAX_SUJOOD_DURATION_MS) {
						sujoodDownTimeRef.current = 0;
					} else if (delta < TILT_RETURN_THRESHOLD && elapsed >= MIN_SUJOOD_DURATION_MS) {
						sujoodDownTimeRef.current = 0;
						handleProximityDetection(true);
					}
				}
			}

			window.addEventListener('deviceorientation', handleDeviceOrientation);
			sensorRef.current = handleDeviceOrientation;

			return () => clearTimeout(startupTimer);
		}

		if (typeof (window as any).ondeviceproximity !== 'undefined') {
			setupDeviceProximityFallback();
			return setupCleanup();
		}

		const timerCleanup = setupDeviceOrientationFallback();
		return setupCleanup(timerCleanup);
	}, [active]);

	return {
		isSupported,
		isActive: active && isSupported && currentState !== 'idle',
		currentState: isSupported ? currentState : 'unsupported',
	};
}
