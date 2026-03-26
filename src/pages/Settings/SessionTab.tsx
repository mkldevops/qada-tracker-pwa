import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { useNotifications } from '@/hooks/useNotifications';
import { type SessionOrder, usePrayerStore } from '@/stores/prayerStore';

const inputStyle = {
	background: '#1A1A1C',
	border: '1px solid #3A3A3C',
	borderRadius: 12,
	color: '#F5F5F0',
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
	const { setSessionOrder, sessionOrder } = usePrayerStore();

	const SESSION_ORDERS: { value: SessionOrder; label: string }[] = [
		{ value: 'chronological', label: t('settings.chronological') },
		{ value: 'highest-debt', label: t('settings.highestDebt') },
	];

	return (
		<>
			<CollapsibleSection label={t('settings.session')} defaultOpen={true}>
				<div
					className="flex flex-col gap-4 rounded-[20px] p-5"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					<div className="flex flex-col gap-1">
						<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
							{t('settings.prayerOrder')}
						</span>
						<span className="text-[11px]" style={{ color: '#6E6E70' }}>
							{t('settings.prayerOrderDesc')}
						</span>
					</div>
					<div className="flex gap-2">
						{SESSION_ORDERS.map(({ value, label }) => (
							<button
								type="button"
								key={value}
								onClick={() => setSessionOrder(value)}
								className="flex-1 rounded-[20px] py-2.5 text-[13px] font-medium transition-colors"
								style={
									sessionOrder === value
										? { background: '#C9A962', color: '#1A1A1C', fontWeight: 600 }
										: {
												background: '#1A1A1C',
												border: '1px solid #3A3A3C',
												color: '#4A4A4C',
											}
								}
							>
								{label}
							</button>
						))}
					</div>
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t('settings.notifications')} defaultOpen={true}>
				<div
					className="flex flex-col gap-4 rounded-[20px] p-5"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
								{t('settings.notificationsDesc')}
							</span>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={isEnabled}
							aria-label={t('settings.notifications')}
							onClick={() => (isEnabled ? disable() : enable(reminderTime))}
							className="relative h-7 w-12 rounded-full transition-colors"
							style={{ background: isEnabled ? '#C9A962' : '#3A3A3C' }}
						>
							<span
								className="absolute top-1 h-5 w-5 rounded-full transition-all"
								style={{
									background: '#F5F5F0',
									left: isEnabled ? '50%' : '4px',
								}}
							/>
						</button>
					</div>

					{isEnabled && permission === 'granted' && (
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="input-reminder-time"
								className="text-xs font-medium"
								style={{ color: '#6E6E70' }}
							>
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
						<p className="text-[11px]" style={{ color: '#D45F5F' }}>
							{t('settings.notificationsPermissionDenied')}
						</p>
					)}
				</div>
			</CollapsibleSection>
		</>
	);
}
