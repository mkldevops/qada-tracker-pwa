import Dexie, { type Table } from 'dexie';
import type { Objective, PrayerLog, PrayerName } from '../types';
import { PRAYER_NAMES } from '../types';

export type PrayerDebtRow = {
  id?: number;
  prayer: PrayerName;
  total_owed: number;
  total_completed: number;
  created_at: string;
  updated_at: string;
};

export class QadaDB extends Dexie {
  prayer_debts!: Table<PrayerDebtRow, number>;
  prayer_logs!: Table<PrayerLog, number>;
  objectives!: Table<Objective, number>;

  constructor() {
    super('qada-tracker');

    this.version(1).stores({
      prayer_debts: '++id, &prayer',
      prayer_logs: '++id, prayer, logged_at, session_id',
      objectives: '++id, is_active',
    });

    this.on('populate', () => {
      const now = new Date().toISOString();
      this.prayer_debts.bulkAdd(
        PRAYER_NAMES.map((prayer) => ({
          prayer,
          total_owed: 0,
          total_completed: 0,
          created_at: now,
          updated_at: now,
        })),
      );
    });
  }
}

export const db = new QadaDB();
