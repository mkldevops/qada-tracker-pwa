declare global {
	interface Window {
		umami?: {
			track: (name: string, data?: Record<string, unknown>) => void;
		};
	}
}

type TrackEvent =
	| { name: 'session_start'; data: { target: number; order: string } }
	| { name: 'session_complete'; data: { total: number; duration_s: number; order: string } }
	| { name: 'session_quit'; data: { completed: number; target: number; duration_s: number } }
	| { name: 'prayers_logged'; data: { total: number } }
	| { name: 'entry_deleted'; data: { prayer: string } }
	| { name: 'export' }
	| { name: 'import' }
	| { name: 'version_view' }
	| { name: 'reset_all_data' }
	| { name: 'restart_onboarding'; data: { from: 'settings' | 'dashboard' | 'reset' } }
	| { name: 'feedback_open' }
	| { name: 'share'; data: { method: 'native' | 'clipboard' } };

export function track(event: TrackEvent): void {
	const data = 'data' in event ? event.data : undefined;
	window.umami?.track(event.name, data);
}
