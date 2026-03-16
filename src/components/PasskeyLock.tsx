import { Fingerprint } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authenticateWithPasskey } from '@/lib/passkey';

interface PasskeyLockProps {
	onUnlock: () => void;
}

export function PasskeyLock({ onUnlock }: PasskeyLockProps) {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleUnlock = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const success = await authenticateWithPasskey();
			if (success) {
				onUnlock();
			} else {
				setError(t('passkey.error'));
			}
		} catch {
			setError(t('passkey.error'));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<motion.div
			className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
			style={{ background: '#1A1A1C' }}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<span className="font-display text-4xl font-light" style={{ color: '#C9A962' }}>
				قضاء
			</span>

			<div className="flex flex-col items-center gap-3">
				<Fingerprint size={64} style={{ color: '#C9A962' }} />
				<p className="text-sm" style={{ color: '#6E6E70' }}>
					{t('passkey.subtitle')}
				</p>
			</div>

			<div className="flex flex-col items-center gap-3">
				<button
					type="button"
					onClick={handleUnlock}
					disabled={isLoading}
					className="rounded-[28px] px-10 py-4 text-sm font-semibold tracking-[1.5px] transition-opacity disabled:opacity-50"
					style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)', color: '#1A1A1C' }}
				>
					{isLoading ? t('passkey.unlocking') : t('passkey.unlock')}
				</button>

				{error && (
					<p className="text-xs" style={{ color: '#D45F5F' }}>
						{error}
					</p>
				)}
			</div>
		</motion.div>
	);
}
