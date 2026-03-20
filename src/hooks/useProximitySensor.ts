import { useEffect, useRef, useState } from 'react';

type SensorState = 'idle' | 'waiting_first' | 'waiting_second' | 'unsupported';

interface UseProximitySensorResult {
	isSupported: boolean;
	isActive: boolean;
	currentState: SensorState;
}

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

		function handleProximityDetection(isNear: boolean) {
			if (!isNear) return;

			const now = Date.now();
			const timeSinceLastDetection = now - lastDetectionRef.current;

			if (timeSinceLastDetection < 800) return;

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

		function setupCleanup() {
			return () => {
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
			function handleDeviceOrientation(event: DeviceOrientationEvent) {
				if (event.beta === null) {
					// No real orientation sensor (desktop) — fall back to manual
					setIsSupported(false);
					setCurrentState('unsupported');
					window.removeEventListener('deviceorientation', handleDeviceOrientation);
					sensorRef.current = null;
					return;
				}

				if (betaBaselineRef.current === null) {
					betaBaselineRef.current = event.beta;
					return;
				}

				const delta = Math.abs(event.beta - betaBaselineRef.current);

				if (sujoodDownTimeRef.current === 0) {
					if (delta > 50) {
						sujoodDownTimeRef.current = Date.now();
					}
				} else {
					const elapsed = Date.now() - sujoodDownTimeRef.current;
					if (delta < 25 && elapsed >= 300) {
						sujoodDownTimeRef.current = 0;
						handleProximityDetection(true);
					}
				}
			}

			window.addEventListener('deviceorientation', handleDeviceOrientation);
			sensorRef.current = handleDeviceOrientation;
		}

		if (typeof (window as any).ondeviceproximity !== 'undefined') {
			setupDeviceProximityFallback();
		} else {
			setupDeviceOrientationFallback();
		}
		return setupCleanup();
	}, [active]);

	return {
		isSupported,
		isActive: active && isSupported && currentState !== 'idle',
		currentState: isSupported ? currentState : 'unsupported',
	};
}
