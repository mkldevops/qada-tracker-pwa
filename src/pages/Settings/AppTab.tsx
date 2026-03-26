import { ChevronRight, Download, Trash2, Upload } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Changelog } from '@/components/Changelog';
import { CollapsibleSection } from '@/components/CollapsibleSection';
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
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!dataFeedback) return;
		const timeout = setTimeout(() => setDataFeedback(null), 5000);
		return () => clearTimeout(timeout);
	}, [dataFeedback]);

	const handleExport = async () => {
		try {
			await exportBackup(db);
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
			</AnimatePresence>

			<CollapsibleSection label={t('settings.data')} defaultOpen={true}>
				<div
					className="flex flex-col gap-3 rounded-[20px] p-5"
					style={{ background: '#242426', border: '1px solid #3A3A3C' }}
				>
					{dataFeedback && (
						<p
							className="text-[11px] font-medium"
							style={{
								color: dataFeedback.type === 'success' ? '#6E9E6E' : '#D45F5F',
							}}
						>
							{dataFeedback.message}
						</p>
					)}
					<button
						type="button"
						onClick={handleExport}
						className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
						style={{ background: '#1A1A1C', border: '1px solid #3A3A3C' }}
					>
						<Download size={16} style={{ color: '#C9A962' }} />
						<span
							className="text-xs font-semibold tracking-[1px]"
							style={{ color: '#C9A962' }}
						>
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
								className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
								style={{ background: '#1A1A1C', border: '1px solid #3A3A3C' }}
							>
								<Upload size={16} style={{ color: '#C9A962' }} />
								<span
									className="text-xs font-semibold tracking-[1px]"
									style={{ color: '#C9A962' }}
								>
									{t('settings.importBackup')}
								</span>
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent
							style={{ background: '#242426', border: '1px solid #3A3A3C' }}
						>
							<AlertDialogHeader>
								<AlertDialogTitle style={{ color: '#F5F5F0' }}>
									{t('settings.importDialogTitle')}
								</AlertDialogTitle>
								<AlertDialogDescription style={{ color: '#6E6E70' }}>
									{t('settings.importDialogDesc', { filename: pendingFile?.name ?? '' })}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel
									style={{ background: '#2A2A2C', color: '#F5F5F0', border: 'none' }}
								>
									{t('settings.importDialogCancel')}
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleImportConfirm}
									style={{ background: '#C9A962', color: '#1A1A1C' }}
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
					<div
						className="flex gap-2 rounded-[20px] p-3"
						style={{ background: '#242426', border: '1px solid #3A3A3C' }}
					>
						{(['fr', 'en'] as const).map((lang) => (
							<button
								key={lang}
								type="button"
								onClick={() => i18n.changeLanguage(lang)}
								className="flex-1 rounded-[16px] py-2.5 text-[13px] font-semibold transition-colors"
								style={
									i18n.resolvedLanguage === lang
										? { background: '#C9A962', color: '#1A1A1C' }
										: {
												background: '#1A1A1C',
												border: '1px solid #3A3A3C',
												color: '#4A4A4C',
											}
								}
							>
								{lang === 'fr' ? 'Français' : 'English'}
							</button>
						))}
					</div>
				</div>
			</CollapsibleSection>

			<button
				type="button"
				onClick={() => setShowChangelog(true)}
				className="flex w-full items-center justify-between rounded-[20px] px-5 py-4"
				style={{ background: '#242426', border: '1px solid #3A3A3C' }}
			>
				<span className="text-sm font-medium" style={{ color: '#F5F5F0' }}>
					{t('settings.version')}
				</span>
				<div className="flex items-center gap-2">
					<span className="text-sm" style={{ color: '#6E6E70' }}>
						{__APP_VERSION__}
					</span>
					<ChevronRight size={14} style={{ color: '#4A4A4C' }} />
				</div>
			</button>

			<CollapsibleSection label={t('settings.dangerZone')} defaultOpen={true}>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4"
							style={{ background: '#2A1515', border: '1px solid #D45F5F33' }}
						>
							<Trash2 size={18} style={{ color: '#D45F5F' }} />
							<span
								className="text-xs font-semibold tracking-[1px]"
								style={{ color: '#D45F5F' }}
							>
								{t('settings.resetAll')}
							</span>
						</button>
					</AlertDialogTrigger>
					<AlertDialogContent
						style={{ background: '#242426', border: '1px solid #3A3A3C' }}
					>
						<AlertDialogHeader>
							<AlertDialogTitle style={{ color: '#F5F5F0' }}>
								{t('settings.resetDialogTitle')}
							</AlertDialogTitle>
							<AlertDialogDescription style={{ color: '#6E6E70' }}>
								{t('settings.resetDialogDesc')}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel
								style={{ background: '#2A2A2C', color: '#F5F5F0', border: 'none' }}
							>
								{t('settings.resetDialogCancel')}
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={async () => {
									try {
										await resetAll();
										markOnboardingUndone();
										onRestartOnboarding?.();
									} catch {
										setDataFeedback({
											type: 'error',
											message: t('settings.importError'),
										});
									}
								}}
								style={{ background: '#D45F5F', color: '#F5F5F0' }}
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
