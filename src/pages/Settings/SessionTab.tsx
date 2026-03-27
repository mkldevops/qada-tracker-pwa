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
	const { setSessionOrder, sessionOrder, sujoodTrackingEnabled, setSujoodTrackingEnabled } =
		usePrayerStore();

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
							className="relative flex shrink-0 items-center p-2"
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
							className="relative flex shrink-0 items-center p-2"
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
