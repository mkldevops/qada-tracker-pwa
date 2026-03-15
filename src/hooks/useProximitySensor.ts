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

	useEffect(() => {
		callbacksRef.current = { onFirstSujood, onSecondSujood };
	}, [onFirstSujood, onSecondSujood]);

	useEffect(() => {
		// Check for sensor support
		const hasProximitySensor = typeof (window as any).ProximitySensor !== 'undefined';
		const hasDeviceProximity = typeof (window as any).ondeviceproximity !== 'undefined';
		const hasSupport = hasProximitySensor || hasDeviceProximity;

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
						}
					} catch {}
					sensorRef.current = null;
				}
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

		setupDeviceProximityFallback();
		return setupCleanup();
	}, [active]);

	return {
		isSupported,
		isActive: active && isSupported && currentState !== 'idle',
		currentState: isSupported ? currentState : 'unsupported',
	};
}
