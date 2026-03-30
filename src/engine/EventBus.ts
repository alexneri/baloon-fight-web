type Listener<T> = (payload: T) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventMap = Record<string, any>;

export class EventBus<T extends EventMap = EventMap> {
  private listeners = new Map<keyof T, Set<Listener<unknown>>>();

  on<K extends keyof T>(event: K, listener: Listener<T[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return () => this.off(event, listener);
  }

  off<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.listeners.get(event)?.forEach((l) => l(payload));
  }

  once<K extends keyof T>(event: K, listener: Listener<T[K]>): void {
    const unsub = this.on(event, (payload) => {
      listener(payload);
      unsub();
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}
