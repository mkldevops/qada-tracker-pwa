import { useState } from 'react';
import { usePrayerStore } from '@/stores/prayerStore';
import { PrayerRow } from '@/components/PrayerCounter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const EMPTY = (): Record<PrayerName, number> =>
  PRAYER_NAMES.reduce((acc, p) => ({ ...acc, [p]: 0 }), {} as Record<PrayerName, number>);

export function LogPrayers() {
  const { logBatch, undoLastLog, recentLogs } = usePrayerStore();
  const [quantities, setQuantities] = useState<Record<PrayerName, number>>(EMPTY);

  const total = PRAYER_NAMES.reduce((sum, p) => sum + quantities[p], 0);

  const handleChange = (prayer: PrayerName, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [prayer]: quantity }));
  };

  const handleLog = async () => {
    const entries: BatchEntry[] = PRAYER_NAMES.map((prayer) => ({
      prayer,
      quantity: quantities[prayer],
    }));
    const sessionId = `batch-${Date.now()}`;
    await logBatch(entries, sessionId);
    setQuantities(EMPTY());
  };

  const recent = recentLogs.slice(0, 10);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Logger en lot</h1>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="divide-y divide-border">
            {PRAYER_NAMES.map((prayer) => (
              <PrayerRow
                key={prayer}
                prayer={prayer}
                quantity={quantities[prayer]}
                onChange={handleChange}
              />
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            disabled={total === 0}
            onClick={handleLog}
          >
            Logger {total > 0 ? `${total} prière${total > 1 ? 's' : ''}` : ''}
          </Button>
        </CardContent>
      </Card>

      {recentLogs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Historique récent
            </h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  Annuler la dernière
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler la dernière entrée ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera la dernière session de log et remettra les compteurs à jour.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={undoLastLog} className="bg-destructive hover:bg-destructive/90">
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Card className="border-border bg-card">
            <CardContent className="divide-y divide-border p-0">
              {recent.map((log) => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="text-sm font-medium capitalize">{log.prayer}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(log.logged_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">+{log.quantity}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
