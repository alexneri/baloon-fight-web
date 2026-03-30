import levelData from '../data/levels.json' assert { type: 'json' };
import type { LevelData, PhaseDefinition, PlatformDefinition } from '../../types/index.js';
import { PHYSICS } from '../data/constants.js';

const data = levelData as LevelData;

export class ProgressionSystem {
  private phaseIdx = 0;
  private speedMult = 1.0;

  get currentPhaseNumber(): number {
    return this.phaseIdx + 1;
  }

  get currentPhase(): PhaseDefinition {
    const phases = data.phases;
    // Cycle phases with increasing difficulty after last defined phase
    const idx = Math.min(this.phaseIdx, phases.length - 1);
    return phases[idx]!;
  }

  get platformLayout(): PlatformDefinition[] {
    const layout = data.layouts.find(
      (l) => l.name === this.currentPhase.layoutName,
    );
    return layout?.platforms ?? data.layouts[0]!.platforms;
  }

  get enemySpeedMultiplier(): number {
    return this.speedMult;
  }

  advance(): void {
    this.phaseIdx++;
    // Apply difficulty ramp every N phases
    if (this.phaseIdx % PHYSICS.DIFFICULTY_RAMP_INTERVAL === 0) {
      this.speedMult *= PHYSICS.DIFFICULTY_SPEED_MULTIPLIER;
    }
  }

  isBonusPhase(): boolean {
    return this.phaseIdx > 0 && this.phaseIdx % PHYSICS.BONUS_STAGE_INTERVAL === 0;
  }

  reset(): void {
    this.phaseIdx = 0;
    this.speedMult = 1.0;
  }
}
