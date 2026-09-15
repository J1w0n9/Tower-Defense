import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageSaveService } from './SaveService';

describe('LocalStorageSaveService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing has been saved to a slot', () => {
    const service = new LocalStorageSaveService();
    expect(service.load(1)).toBeNull();
  });

  it('saves and loads the same state back', () => {
    const service = new LocalStorageSaveService();
    const state = { gold: 250, lives: 15, wave: 4 };
    service.save(1, state);
    expect(service.load(1)).toEqual(state);
  });

  it('keeps separate slots independent', () => {
    const service = new LocalStorageSaveService();
    service.save(1, { gold: 100 });
    service.save(2, { gold: 200 });
    expect(service.load(1)).toEqual({ gold: 100 });
    expect(service.load(2)).toEqual({ gold: 200 });
  });

  it('removes a slot on delete', () => {
    const service = new LocalStorageSaveService();
    service.save(1, { gold: 100 });
    service.delete(1);
    expect(service.load(1)).toBeNull();
  });

  it('treats corrupted stored data as no save instead of throwing', () => {
    const service = new LocalStorageSaveService();
    localStorage.setItem('tower-defense:save:1', 'not valid json{');
    expect(service.load(1)).toBeNull();
  });
});
