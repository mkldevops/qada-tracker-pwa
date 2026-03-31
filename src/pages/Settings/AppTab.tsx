import { ChevronRight, Download, MessageSquare, Share2, Trash2, Upload } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Changelog } from '@/components/Changelog';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { FeedbackModal } from '@/components/FeedbackModal';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { db } from '@/db/database';
import { exportBackup, importBackup } from '@/db/queries';
import { track } from '@/lib/analytics';
import { markOnboardingUndone } from '@/lib/onboarding';
import { usePrayerStore } from '@/stores/prayerStore';

export function AppTab({ onRestartOnboarding }: { onRestartOnboarding?: () => void }) {
	const { t, i18n } = useTranslation();
	const { resetAll, loadAll } = usePrayerStore();
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [dataFeedback, setDataFeedback] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);
	const [showChangelog, setShowChangelog] = useState(false);
	const [showFeedback, setShowFeedback] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!dataFeedback) return;
		const timeout = setTimeout(() => setDataFeedback(null), 5000);
		return () => clearTimeout(timeout);
	}, [dataFeedback]);

	const handleShare = async () => {
		const shareText = t('settings.shareText');
		if (!navigator.share) {
			try {
				await navigator.clipboard.writeText(shareText);
				toast.success(t('settings.shareCopied'));
				track({ name: 'share', data: { method: 'clipboard' } });
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
			track({ name: 'share', data: { method: 'native' } });
		} catch (err) {
			if (err instanceof Error && err.name !== 'AbortError') {
				toast.error(t('settings.shareFailed'));
			}
		}
	};

	const handleExport = async () => {
		try {
			await exportBackup(db);
			track({ name: 'export' });
			setDataFeedback({ type: 'success', message: t('settings.exportSuccess') });
		} catch {
			setDataFeedback({ type: 'error', message: t('settings.exportError') });
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setPendingFile(file);
		}
		e.target.value = '';
	};

	const handleImportConfirm = async () => {
		if (!pendingFile) return;
		try {
			await importBackup(db, pendingFile, loadAll);
			track({ name: 'import' });
			setDataFeedback({ type: 'success', message: t('settings.importSuccess') });
		} catch {
			setDataFeedback({ type: 'error', message: t('settings.importError') });
		} finally {
			setPendingFile(null);
		}
	};

	return (
		<>
			<AnimatePresence>
				{showChangelog && <Changelog onClose={() => setShowChangelog(false)} />}
				{showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
			</AnimatePresence>

			<CollapsibleSection label={t('settings.data')} defaultOpen={true}>
				<div className="flex flex-col gap-3 rounded-[20px] bg-surface border border-border p-5">
					{dataFeedback && (
						<p
							className={`text-[11px] font-medium ${dataFeedback.type === 'success' ? 'text-sage' : 'text-danger'}`}
						>
							{dataFeedback.message}
						</p>
					)}
					<button
						type="button"
						onClick={handleExport}
						className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4 bg-background border border-border"
					>
						<Download size={16} className="text-gold" />
						<span className="text-xs font-semibold tracking-[1px] text-gold">
							{t('settings.exportBackup')}
						</span>
					</button>

					<input
						ref={fileInputRef}
						type="file"
						accept=".json"
						className="hidden"
						onChange={handleFileSelect}
					/>

					<AlertDialog
						open={pendingFile !== null}
						onOpenChange={(open) => {
							if (!open) setPendingFile(null);
						}}
					>
						<AlertDialogTrigger asChild>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4 bg-background border border-border"
							>
								<Upload size={16} className="text-gold" />
								<span className="text-xs font-semibold tracking-[1px] text-gold">
									{t('settings.importBackup')}
								</span>
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent className="bg-surface border border-border">
							<AlertDialogHeader>
								<AlertDialogTitle className="text-foreground">
									{t('settings.importDialogTitle')}
								</AlertDialogTitle>
								<AlertDialogDescription>
									{t('settings.importDialogDesc', { filename: pendingFile?.name ?? '' })}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel className="bg-surface-raised text-foreground border-0">
									{t('settings.importDialogCancel')}
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleImportConfirm}
									className="bg-gold text-background"
								>
									{t('settings.importDialogConfirm')}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t('settings.configuration')} defaultOpen={true}>
				<div className="flex flex-col gap-3">
					<div className="flex gap-2 rounded-[20px] bg-surface border border-border p-3">
						{(['fr', 'en'] as const).map((lang) => (
							<button
								key={lang}
								type="button"
								onClick={() => i18n.changeLanguage(lang)}
								className={`flex-1 rounded-[16px] py-2.5 text-[13px] font-semibold transition-colors ${
									i18n.resolvedLanguage === lang
										? 'bg-gold text-background'
										: 'bg-background border border-border text-tertiary'
								}`}
							>
								{lang === 'fr' ? 'Français' : 'English'}
							</button>
						))}
					</div>
				</div>
			</CollapsibleSection>

			<button
				type="button"
				onClick={() => {
					setShowChangelog(true);
					track({ name: 'version_view' });
				}}
				className="flex w-full items-center justify-between rounded-[20px] bg-surface border border-border px-5 py-4"
			>
				<span className="text-sm font-medium text-foreground">{t('settings.version')}</span>
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted">{__APP_VERSION__}</span>
					<ChevronRight size={14} className="text-tertiary" />
				</div>
			</button>

			<CollapsibleSection label={t('settings.community')} defaultOpen={true}>
				<div className="flex flex-col gap-3">
					<button
						type="button"
						onClick={() => {
							setShowFeedback(true);
							track({ name: 'feedback_open' });
						}}
						className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4 bg-background border border-border"
					>
						<MessageSquare size={16} className="text-gold" />
						<span className="text-xs font-semibold tracking-[1px] text-gold">
							{t('settings.sendFeedback')}
						</span>
					</button>
					<button
						type="button"
						onClick={handleShare}
						className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4 bg-background border border-border"
					>
						<Share2 size={16} className="text-gold" />
						<span className="text-xs font-semibold tracking-[1px] text-gold">
							{t('settings.shareApp')}
						</span>
					</button>
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t('settings.dangerZone')} defaultOpen={true}>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4 bg-danger/10 border border-danger/20"
						>
							<Trash2 size={18} className="text-danger" />
							<span className="text-xs font-semibold tracking-[1px] text-danger">
								{t('settings.resetAll')}
							</span>
						</button>
					</AlertDialogTrigger>
					<AlertDialogContent className="bg-surface border border-border">
						<AlertDialogHeader>
							<AlertDialogTitle className="text-foreground">
								{t('settings.resetDialogTitle')}
							</AlertDialogTitle>
							<AlertDialogDescription>{t('settings.resetDialogDesc')}</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel className="bg-surface-raised text-foreground border-0">
								{t('settings.resetDialogCancel')}
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={async () => {
									try {
										await resetAll();
										track({ name: 'reset_all_data' });
										markOnboardingUndone();
										track({ name: 'restart_onboarding', data: { from: 'reset' } });
										onRestartOnboarding?.();
									} catch {
										setDataFeedback({
											type: 'error',
											message: t('settings.importError'),
										});
									}
								}}
								className="bg-danger text-foreground"
							>
								{t('settings.resetDialogConfirm')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CollapsibleSection>
		</>
	);
}
