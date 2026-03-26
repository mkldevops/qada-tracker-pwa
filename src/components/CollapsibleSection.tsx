import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

export function CollapsibleSection({
	label,
	defaultOpen,
	children,
}: {
	label: string;
	defaultOpen: boolean;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="flex flex-col gap-2.5">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center justify-between"
			>
				<p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
					{label}
				</p>
				<motion.div
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ type: 'spring', stiffness: 400, damping: 30 }}
				>
					<ChevronDown size={14} style={{ color: '#4A4A4C' }} />
				</motion.div>
			</button>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 400, damping: 30 }}
						style={{ overflow: 'hidden' }}
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
