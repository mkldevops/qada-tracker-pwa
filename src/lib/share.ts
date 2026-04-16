import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

export async function handleShare(t: TFunction, source: 'dashboard' | 'settings'): Promise<void> {
	const shareText = t('settings.shareText');
	if (!navigator.share) {
		if (!navigator.clipboard) {
			toast.error(t('settings.shareFailed'));
			return;
		}
		try {
			await navigator.clipboard.writeText(shareText);
			toast.success(t('settings.shareCopied'));
			track({ name: 'share', data: { method: 'clipboard', source } });
		} catch {
			toast.error(t('settings.shareFailed'));
		}
		return;
	}
	try {
		await navigator.share({
			title: 'Qada Tracker',
			text: shareText,
			url: 'https://qada.fahari.pro',
		});
		track({ name: 'share', data: { method: 'native', source } });
	} catch (err) {
		if (
			err instanceof DOMException &&
			(err.name === 'AbortError' || err.name === 'NotAllowedError')
		) {
			return;
		}
		toast.error(t('settings.shareFailed'));
	}
}
