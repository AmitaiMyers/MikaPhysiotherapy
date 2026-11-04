import type { Settings } from './types';
import { getRecord, saveRecord, useRecords } from './vault';

export const DEFAULT_SETTINGS: Settings = { id: 'settings', dayStart: '08:00', dayEnd: '20:00', defaultDurationMin: 60 };

export function useSettings(): Settings {
  return useRecords('settings')[0] ?? DEFAULT_SETTINGS;
}

export function saveSettings(patch: Partial<Omit<Settings, 'id'>>): void {
  saveRecord('settings', { ...(getRecord('settings', 'settings') ?? DEFAULT_SETTINGS), ...patch });
}
