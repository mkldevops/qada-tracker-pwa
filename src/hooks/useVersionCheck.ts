import { useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function useVersionCheck(): void {
	const currentVersionRef = useRef<string | null>(null);
	const pendingReloadRef = useRef(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		async function checkVersion() {
			try {
				const res = await fetch('/version.json', { cache: 'no-store' });
				if (!res.ok) return;
				const data: { version?: string } = await res.json();
				if (!data.version) return;

				if (currentVersionRef.current === null) {
					currentVersionRef.current = data.version;
					return;
				}

				if (data.version !== currentVersionRef.current) {
					if (document.hidden) {
						window.location.reload();
					} else {
						pendingReloadRef.current = true;
					}
				}
			} catch {
				// Ignore network errors
			}
		}

		function stopPolling() {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}

		function startPolling() {
			stopPolling();
			checkVersion();
			intervalRef.current = setInterval(checkVersion, POLL_INTERVAL_MS);
		}

		function handleVisibilityChange() {
			if (document.hidden) {
				if (pendingReloadRef.current) {
					window.location.reload();
					return;
				}
				stopPolling();
			} else {
				startPolling();
			}
		}

		startPolling();
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			stopPolling();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);
}
