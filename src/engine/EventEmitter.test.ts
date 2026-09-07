import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from './EventEmitter';

interface TestEvents {
  ping: number;
  [key: string]: unknown;
}

describe('EventEmitter', () => {
  it('calls a subscribed listener with the emitted payload', () => {
    const emitter = new EventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.on('ping', listener);

    emitter.emit('ping', 42);

    expect(listener).toHaveBeenCalledWith(42);
  });

  it('stops calling a listener after off() is used', () => {
    const emitter = new EventEmitter<TestEvents>();
    const listener = vi.fn();
    emitter.on('ping', listener);
    emitter.off('ping', listener);

    emitter.emit('ping', 1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling a listener after the unsubscribe function is invoked', () => {
    const emitter = new EventEmitter<TestEvents>();
    const listener = vi.fn();
    const unsubscribe = emitter.on('ping', listener);
    unsubscribe();

    emitter.emit('ping', 1);

    expect(listener).not.toHaveBeenCalled();
  });
});
