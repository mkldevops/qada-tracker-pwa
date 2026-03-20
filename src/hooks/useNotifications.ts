import { useCallback, useEffect, useState } from 'react';

interface ReminderConfig {
	enabled: boolean;
	time: string;
	lastShown: string | null;
}

const STORAGE_KEY = 'qada-reminder';
let notificationChecked = false;

function loadConfig(): ReminderConfig {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw) as ReminderConfig;
	} catch {
		// Ignore parse errors
	}
	return { enabled: false, time: '20:00', lastShown: null };
}

function saveConfig(config: ReminderConfig): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function useNotifications(notificationBody: string) {
	const [permission, setPermission] = useState<NotificationPermission>(
		typeof Notification !== 'undefined' ? Notification.permission : 'denied',
	);
	const [config, setConfig] = useState<ReminderConfig>(loadConfig);

	const checkAndNotify = useCallback(() => {
		if (!config.enabled || permission !== 'granted') return;

		const today = new Date().toISOString().slice(0, 10);
		if (config.lastShown === today) return;

		const [hh, mm] = config.time.split(':').map(Number);
		const now = new Date();

		if (now.getHours() < hh || (now.getHours() === hh && now.getMinutes() < mm)) return;

		new Notification('Qada Tracker', {
			body: notificationBody,
			icon: '/icon-192.png',
		});

		const updated: ReminderConfig = { ...config, lastShown: today };
		saveConfig(updated);
		setConfig(updated);
	}, [config, permission, notificationBody]);

	useEffect(() => {
		if (!notificationChecked) {
			notificationChecked = true;
			checkAndNotify();
		}
	}, [checkAndNotify]);

	const enable = useCallback(async (time: string) => {
		if (typeof Notification === 'undefined') return;

		const result = await Notification.requestPermission();
		setPermission(result);

		if (result === 'granted') {
			const updated: ReminderConfig = { enabled: true, time, lastShown: null };
			saveConfig(updated);
			setConfig(updated);
		}
	}, []);

	const disable = useCallback(() => {
		const updated: ReminderConfig = { ...config, enabled: false };
		saveConfig(updated);
		setConfig(updated);
	}, [config]);

	const updateTime = useCallback(
		(time: string) => {
			const updated: ReminderConfig = { ...config, time };
			saveConfig(updated);
			setConfig(updated);
		},
		[config],
	);

	return {
		permission,
		isEnabled: config.enabled,
		reminderTime: config.time,
		enable,
		disable,
		updateTime,
	};
}
