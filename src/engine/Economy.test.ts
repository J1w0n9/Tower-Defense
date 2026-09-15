import { describe, expect, it } from 'vitest';
import { Economy } from './Economy';

describe('Economy', () => {
  it('starts with the given gold and lives', () => {
    const economy = new Economy(150, 20);
    expect(economy.gold).toBe(150);
    expect(economy.lives).toBe(20);
  });

  it('spends gold only when affordable', () => {
    const economy = new Economy(100, 20);
    expect(economy.spend(60)).toBe(true);
    expect(economy.gold).toBe(40);
    expect(economy.spend(50)).toBe(false);
    expect(economy.gold).toBe(40);
  });

  it('adds gold', () => {
    const economy = new Economy(0, 20);
    economy.addGold(25);
    expect(economy.gold).toBe(25);
  });

  it('loses lives and never goes below zero', () => {
    const economy = new Economy(0, 2);
    economy.loseLife();
    expect(economy.lives).toBe(1);
    economy.loseLife(5);
    expect(economy.lives).toBe(0);
  });

  it('reports game over once lives reach zero', () => {
    const economy = new Economy(0, 1);
    expect(economy.isGameOver).toBe(false);
    economy.loseLife();
    expect(economy.isGameOver).toBe(true);
  });
});
