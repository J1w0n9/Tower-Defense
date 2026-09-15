type Listener<T> = (payload: T) => void;

export class EventEmitter<EventMap extends Record<string, unknown>> {
  private listeners = new Map<keyof EventMap, Listener<unknown>[]>();

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    const arr = this.listeners.get(event) ?? [];
    arr.push(listener as Listener<unknown>);
    this.listeners.set(event, arr);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    this.listeners.set(
      event,
      arr.filter((l) => l !== (listener as Listener<unknown>))
    );
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    for (const listener of [...arr]) {
      (listener as Listener<EventMap[K]>)(payload);
    }
  }
}
