export interface SerializedGameState {
  [key: string]: unknown;
}

export interface SaveService {
  save(slot: number, state: SerializedGameState): void;
  load(slot: number): SerializedGameState | null;
  delete(slot: number): void;
}

export class LocalStorageSaveService implements SaveService {
  private keyFor(slot: number): string {
    return `tower-defense:save:${slot}`;
  }

  save(slot: number, state: SerializedGameState): void {
    localStorage.setItem(this.keyFor(slot), JSON.stringify(state));
  }

  load(slot: number): SerializedGameState | null {
    const raw = localStorage.getItem(this.keyFor(slot));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SerializedGameState;
    } catch {
      return null;
    }
  }

  delete(slot: number): void {
    localStorage.removeItem(this.keyFor(slot));
  }
}
