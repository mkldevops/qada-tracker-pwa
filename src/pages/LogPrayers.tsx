import { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { usePrayerStore } from '@/stores/prayerStore';
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
import type { PrayerName, BatchEntry } from '@/types';
import { PRAYER_NAMES } from '@/types';
import { PRAYER_CONFIG } from '@/constants/prayers';

const EMPTY = (): Record<PrayerName, number> =>
  PRAYER_NAMES.reduce((acc, p) => ({ ...acc, [p]: 0 }), {} as Record<PrayerName, number>);

export function LogPrayers() {
  const { logBatch, undoLastLog, recentLogs } = usePrayerStore();
  const [quantities, setQuantities] = useState<Record<PrayerName, number>>(EMPTY);

  const total = PRAYER_NAMES.reduce((sum, p) => sum + quantities[p], 0);

  const handleChange = (prayer: PrayerName, qty: number) => {
    setQuantities((prev) => ({ ...prev, [prayer]: Math.max(0, qty) }));
  };

  const handleLog = async () => {
    const entries: BatchEntry[] = PRAYER_NAMES.map((prayer) => ({ prayer, quantity: quantities[prayer] }));
    await logBatch(entries, `batch-${Date.now()}`);
    setQuantities(EMPTY());
  };

  return (
    <div className="space-y-5 px-7 pb-4 pt-1">
      <div className="flex flex-col gap-0.5">
        <h1 className="font-display text-3xl font-normal" style={{ color: '#F5F5F0' }}>Logger</h1>
        <p className="text-[13px]" style={{ color: '#6E6E70' }}>
          Sélectionne les prières à compter
        </p>
      </div>

      <div
        className="w-full overflow-hidden rounded-[20px]"
        style={{ background: '#242426', border: '1px solid #3A3A3C' }}
      >
        {PRAYER_NAMES.map((prayer, i) => {
          const cfg = PRAYER_CONFIG[prayer];
          const qty = quantities[prayer];
          const active = qty > 0;
          return (
            <div key={prayer}>
              {i > 0 && <div style={{ height: 1, background: '#2A2A2C' }} />}
              <div className="flex items-center gap-3 px-5" style={{ height: 70 }}>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="font-display text-lg font-medium" style={{ color: cfg.hex }}>
                    {cfg.labelFr}
                  </span>
                  <span className="text-[11px]" style={{ color: '#4A4A4C' }}>
                    {cfg.labelAr} · {cfg.rakat} rak'at
                  </span>
                </div>
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => handleChange(prayer, qty - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ background: '#2A2A2C' }}
                  >
                    <Minus size={14} style={{ color: '#6E6E70' }} />
                  </button>
                  <span
                    className="w-10 text-center font-display text-xl font-medium tabular-nums"
                    style={{ color: active ? cfg.hex : '#4A4A4C' }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => handleChange(prayer, qty + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                    style={active ? { background: cfg.hex } : { background: '#2A2A2C' }}
                  >
                    <Plus size={14} style={{ color: active ? '#1A1A1C' : '#6E6E70' }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between rounded-[20px] px-6"
        style={{ background: '#242426', border: '1px solid #3A3A3C', height: 72 }}
      >
        <span className="text-[13px] font-medium" style={{ color: '#6E6E70' }}>
          Total à logger
        </span>
        <span className="font-display text-2xl font-medium" style={{ color: '#C9A962' }}>
          {total > 0 ? `${total} prière${total > 1 ? 's' : ''}` : '—'}
        </span>
      </div>

      <button
        onClick={handleLog}
        disabled={total === 0}
        className="flex w-full items-center justify-center gap-2.5 rounded-[28px] py-4 transition-opacity disabled:opacity-30"
        style={{ background: 'linear-gradient(135deg, #C9A962, #8B7845)' }}
      >
        <Check size={18} style={{ color: '#1A1A1C' }} strokeWidth={2.5} />
        <span className="text-[13px] font-semibold tracking-[1.5px]" style={{ color: '#1A1A1C' }}>
          CONFIRMER LE LOG
        </span>
      </button>

      {recentLogs.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-[3px]" style={{ color: '#4A4A4C' }}>
              HISTORIQUE
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-[12px] font-medium" style={{ color: '#D45F5F' }}>
                  Annuler le dernier
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent style={{ background: '#242426', border: '1px solid #3A3A3C' }}>
                <AlertDialogHeader>
                  <AlertDialogTitle style={{ color: '#F5F5F0' }}>Annuler la dernière entrée ?</AlertDialogTitle>
                  <AlertDialogDescription style={{ color: '#6E6E70' }}>
                    Supprime la dernière session et remet les compteurs à jour.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel style={{ background: '#2A2A2C', color: '#F5F5F0', border: 'none' }}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={undoLastLog}
                    style={{ background: '#D45F5F', color: '#F5F5F0' }}
                  >
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div
            className="overflow-hidden rounded-[20px]"
            style={{ background: '#242426', border: '1px solid #3A3A3C' }}
          >
            {recentLogs.slice(0, 8).map((log, i) => (
              <div key={log.id}>
                {i > 0 && <div style={{ height: 1, background: '#2A2A2C' }} />}
                <div className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span
                      className="font-display text-[15px] font-medium capitalize"
                      style={{ color: PRAYER_CONFIG[log.prayer].hex }}
                    >
                      {log.prayer}
                    </span>
                    <span className="ml-2 text-xs" style={{ color: '#4A4A4C' }}>
                      {new Date(log.logged_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="font-display text-lg font-medium" style={{ color: '#C9A962' }}>
                    +{log.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
