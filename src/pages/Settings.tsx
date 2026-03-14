import { useState } from 'react';
import { usePrayerStore, useDebts } from '@/stores/prayerStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Separator } from '@/components/ui/separator';
import type { PrayerName, Period } from '@/types';
import { PRAYER_NAMES } from '@/types';
import { PRAYER_CONFIG } from '@/constants/prayers';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'daily', label: 'Par jour' },
  { value: 'weekly', label: 'Par semaine' },
  { value: 'monthly', label: 'Par mois' },
];

export function Settings() {
  const { setDebtManual, setDebtFromYears, setObjective, resetAll, activeObjective } =
    usePrayerStore();
  const debts = useDebts();

  const [years, setYears] = useState('');
  const [excludedDays, setExcludedDays] = useState('0');
  const [manualAmounts, setManualAmounts] = useState<Partial<Record<PrayerName, string>>>({});
  const [objPeriod, setObjPeriod] = useState<Period>('daily');
  const [objTarget, setObjTarget] = useState('');

  const handleSetDebtFromYears = async () => {
    const y = parseFloat(years);
    const exc = parseInt(excludedDays, 10) || 0;
    if (!isNaN(y) && y > 0) {
      await setDebtFromYears(y, exc);
      setYears('');
      setExcludedDays('0');
    }
  };

  const handleManualDebt = async (prayer: PrayerName) => {
    const val = parseInt(manualAmounts[prayer] ?? '', 10);
    if (!isNaN(val) && val >= 0) {
      await setDebtManual(prayer, val);
      setManualAmounts((prev) => ({ ...prev, [prayer]: '' }));
    }
  };

  const handleSetObjective = async () => {
    const target = parseInt(objTarget, 10);
    if (!isNaN(target) && target > 0) {
      await setObjective(objPeriod, target);
      setObjTarget('');
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Réglages</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Calculer la dette depuis les années
        </h2>
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Années manquées</label>
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  placeholder="ex: 5.5"
                  min="0"
                  step="0.5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Jours exclus</label>
                <Input
                  type="number"
                  value={excludedDays}
                  onChange={(e) => setExcludedDays(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleSetDebtFromYears}
              disabled={!years || parseFloat(years) <= 0}
            >
              Appliquer
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ajuster manuellement
        </h2>
        <Card className="border-border bg-card">
          <CardContent className="divide-y divide-border p-0">
            {PRAYER_NAMES.map((prayer) => {
              const config = PRAYER_CONFIG[prayer];
              return (
                <div key={prayer} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-20 text-sm font-medium" style={{ color: config.color }}>
                    {config.labelFr}
                  </span>
                  <span className="w-12 text-right text-sm text-muted-foreground">
                    {debts[prayer]?.remaining ?? 0}
                  </span>
                  <Input
                    type="number"
                    className="flex-1"
                    value={manualAmounts[prayer] ?? ''}
                    onChange={(e) =>
                      setManualAmounts((prev) => ({ ...prev, [prayer]: e.target.value }))
                    }
                    placeholder="Nouveau total"
                    min="0"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManualDebt(prayer)}
                    disabled={!manualAmounts[prayer]}
                  >
                    OK
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Objectif
        </h2>
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-4">
            {activeObjective && (
              <p className="text-xs text-muted-foreground">
                Actuel : {activeObjective.target} prières {activeObjective.period === 'daily' ? 'par jour' : activeObjective.period === 'weekly' ? 'par semaine' : 'par mois'}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {PERIODS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={objPeriod === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setObjPeriod(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={objTarget}
                onChange={(e) => setObjTarget(e.target.value)}
                placeholder="Nombre cible"
                min="1"
              />
              <Button onClick={handleSetObjective} disabled={!objTarget}>
                Définir
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              Réinitialiser toutes les données
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tout réinitialiser ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action effacera tous les logs et remettra les compteurs à zéro. Cette action
                est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={resetAll}
                className="bg-destructive hover:bg-destructive/90"
              >
                Réinitialiser
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
