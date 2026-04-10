import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { useNotifications } from '@/hooks/useNotifications';
import { type SessionOrder, usePrayerStore } from '@/stores/prayerStore';

const inputStyle = {
	background: 'var(--background)',
	border: '1px solid var(--border)',
	borderRadius: 12,
	color: 'var(--text-primary)',
	padding: '0 14px',
	height: 44,
	fontSize: 15,
	fontWeight: 500,
	width: '100%',
	outline: 'none',
} as const;

export function SessionTab() {
	const { t } = useTranslation();
	const { permission, isEnabled, reminderTime, enable, disable, updateTime } = useNotifications(
		t('settings.notificationsBody'),
	);
	const {
		setSessionOrder,
		sessionOrder,
		sujoodTrackingEnabled,
		setSujoodTrackingEnabled,
		tashahdDurationMs,
		setTashahdDurationMs,
		activeObjective,
		sessionsPerDay,
		setSessionsPerDay,
	} = usePrayerStore();

	const SESSION_ORDERS: { value: SessionOrder; label: string }[] = [
		{ value: 'chronological', label: t('settings.chronological') },
		{ value: 'highest-debt', label: t('settings.highestDebt') },
	];

	return (
		<>
			<CollapsibleSection label={t('settings.session')} defaultOpen={true}>
				<div className="flex flex-col gap-4 rounded-[20px] bg-surface border border-border p-5">
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium text-foreground">{t('settings.prayerOrder')}</span>
						<span className="text-[11px] text-muted">{t('settings.prayerOrderDesc')}</span>
					</div>
					<div className="flex gap-2">
						{SESSION_ORDERS.map(({ value, label }) => (
							<button
								type="button"
								key={value}
								onClick={() => setSessionOrder(value)}
								className={`flex-1 rounded-[20px] py-2.5 text-[13px] transition-colors ${
									sessionOrder === value
										? 'bg-gold text-background font-semibold'
										: 'bg-background border border-border text-tertiary font-medium'
								}`}
							>
								{label}
							</button>
						))}
					</div>
					<div className="flex items-center justify-between pt-1">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-medium text-foreground">
								{t('settings.sujoodTracking')}
							</span>
							<span className="text-[11px] text-muted">{t('settings.sujoodTrackingDesc')}</span>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={sujoodTrackingEnabled}
							aria-label={t('settings.sujoodTracking')}
							onClick={() => setSujoodTrackingEnabled(!sujoodTrackingEnabled)}
							className="relative flex shrink-0 items-center rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
						>
							<span
								className={`relative h-7 w-12 rounded-full transition-colors ${sujoodTrackingEnabled ? 'bg-gold' : 'bg-border'}`}
							>
								<span
									className="absolute top-1 h-5 w-5 rounded-full bg-foreground transition-all"
									style={{ left: sujoodTrackingEnabled ? '50%' : '4px' }}
								/>
							</span>
						</button>
					</div>
					{sujoodTrackingEnabled && (
						<>
							<div className="h-px bg-border" />
							<div className="flex items-center justify-between">
								<div className="flex flex-col gap-0.5">
									<span className="text-sm font-medium text-foreground">
										{t('settings.tashahdDuration')}
									</span>
									<span className="text-[11px] text-muted">
										{t('settings.tashahdDurationDesc')}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setTashahdDurationMs(tashahdDurationMs - 5000)}
										disabled={tashahdDurationMs <= 5000}
										className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium text-foreground bg-background border border-border disabled:opacity-30"
									>
										−
									</button>
									<span className="min-w-[48px] text-center text-sm font-semibold tabular-nums text-foreground">
										{Math.round(tashahdDurationMs / 1000)}
										<span className="text-muted font-normal text-xs ms-0.5">s</span>
									</span>
									<button
										type="button"
										onClick={() => setTashahdDurationMs(tashahdDurationMs + 5000)}
										disabled={tashahdDurationMs >= 300000}
										className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-medium text-foreground bg-background border border-border disabled:opacity-30"
									>
										+
									</button>
								</div>
							</div>
						</>
					)}
					{activeObjective && (
						<>
							<div className="h-px bg-border" />
							<div className="flex flex-col gap-1">
								<span className="text-sm font-medium text-foreground">
									{t('settings.sessionsPerDay')}
								</span>
								<span className="text-[11px] text-muted">{t('settings.sessionsPerDayDesc')}</span>
							</div>
							<div className="flex gap-2">
								{[1, 2, 3, 4, 5].map((n) => (
									<button
										type="button"
										key={n}
										onClick={() => setSessionsPerDay(n)}
										className={`flex-1 rounded-[20px] py-2.5 text-[13px] transition-colors ${
											sessionsPerDay === n
												? 'bg-gold text-background font-semibold'
												: 'bg-background border border-border text-tertiary font-medium'
										}`}
									>
										{n}
									</button>
								))}
							</div>
						</>
					)}
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t('settings.notifications')} defaultOpen={true}>
				<div className="flex flex-col gap-4 rounded-[20px] bg-surface border border-border p-5">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-medium text-foreground">
								{t('settings.notificationsDesc')}
							</span>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={isEnabled}
							aria-label={t('settings.notifications')}
							onClick={() => (isEnabled ? disable() : enable(reminderTime))}
							className="relative flex shrink-0 items-center rounded-lg p-2 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
						>
							<span
								className={`relative h-7 w-12 rounded-full transition-colors ${isEnabled ? 'bg-gold' : 'bg-border'}`}
							>
								<span
									className="absolute top-1 h-5 w-5 rounded-full bg-foreground transition-all"
									style={{ left: isEnabled ? '50%' : '4px' }}
								/>
							</span>
						</button>
					</div>

					{isEnabled && permission === 'granted' && (
						<div className="flex flex-col gap-1.5">
							<label htmlFor="input-reminder-time" className="text-xs font-medium text-muted">
								{t('settings.notificationsTime')}
							</label>
							<input
								id="input-reminder-time"
								type="time"
								value={reminderTime}
								onChange={(e) => updateTime(e.target.value)}
								style={inputStyle}
							/>
						</div>
					)}

					{permission === 'denied' && (
						<p className="text-[11px] text-danger">{t('settings.notificationsPermissionDenied')}</p>
					)}
				</div>
			</CollapsibleSection>
		</>
	);
}
