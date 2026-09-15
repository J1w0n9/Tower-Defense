export class Economy {
  gold: number;
  lives: number;

  constructor(startingGold: number, startingLives: number) {
    this.gold = startingGold;
    this.lives = startingLives;
  }

  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  spend(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.gold -= cost;
    return true;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  loseLife(amount = 1): void {
    this.lives = Math.max(0, this.lives - amount);
  }

  get isGameOver(): boolean {
    return this.lives <= 0;
  }
}
