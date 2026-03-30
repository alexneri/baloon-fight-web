import { SCORE } from '../data/constants.js';
import type { Player } from '../entities/Player.js';

export class ScoringSystem {
  private killChain = 0;
  private lastKillTime = 0;
  private chainWindow = 3000; // ms

  /** Returns extra-life granted flag */
  recordKill(player: Player, elapsed: number): boolean {
    if (elapsed - this.lastKillTime > this.chainWindow) {
      this.killChain = 0;
    }
    this.killChain++;
    this.lastKillTime = elapsed;

    const chainBonus = this.killChain > 1
      ? SCORE.KILL_CHAIN_BONUS * (this.killChain - 1)
      : 0;
    const pts = SCORE.KILL_BASE + chainBonus;
    return player.addScore(pts);
  }

  recordEggCollect(player: Player): boolean {
    return player.addScore(SCORE.EGG_COLLECT);
  }

  recordPerfectBonus(player: Player): boolean {
    return player.addScore(SCORE.PERFECT_BONUS);
  }

  recordBonusCatch(player: Player): boolean {
    return player.addScore(SCORE.BONUS_CATCH);
  }

  resetChain(): void {
    this.killChain = 0;
  }

  get chain(): number {
    return this.killChain;
  }
}
