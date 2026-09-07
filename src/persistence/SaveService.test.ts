import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageSaveService, type SaveData } from './SaveService';

const SAMPLE: SaveData = { version: 1, mapId: 'meadow', gold: 200, lives: 15, waveNumber: 3 };

describe('LocalStorageSaveService', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns null when nothing has been saved', () => {
    const service = new LocalStorageSaveService();
    expect(service.load()).toBeNull();
  });

  it('saves and loads data back unchanged', () => {
    const service = new LocalStorageSaveService();
    service.save(SAMPLE);
    expect(service.load()).toEqual(SAMPLE);
  });

  it('returns null for corrupted JSON instead of throwing', () => {
    const service = new LocalStorageSaveService();
    window.localStorage.setItem('td-save-v1', '{not valid json');
    expect(() => service.load()).not.toThrow();
    expect(service.load()).toBeNull();
  });

  it('returns null when the saved version does not match the current version', () => {
    const service = new LocalStorageSaveService();
    window.localStorage.setItem('td-save-v1', JSON.stringify({ ...SAMPLE, version: 999 }));
    expect(service.load()).toBeNull();
  });

  it('clears saved data', () => {
    const service = new LocalStorageSaveService();
    service.save(SAMPLE);
    service.clear();
    expect(service.load()).toBeNull();
  });
});
