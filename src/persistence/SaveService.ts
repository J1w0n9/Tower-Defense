export interface SaveData {
  version: number;
  mapId: string;
  gold: number;
  lives: number;
  waveNumber: number;
}

export interface SaveService {
  save(data: SaveData): void;
  load(): SaveData | null;
  clear(): void;
}

const STORAGE_KEY = 'td-save-v1';
const CURRENT_VERSION = 1;

export class LocalStorageSaveService implements SaveService {
  save(data: SaveData): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 저장 공간이 없거나 접근 불가 — 저장은 best-effort이므로 무시한다
    }
  }

  load(): SaveData | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.version !== CURRENT_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
