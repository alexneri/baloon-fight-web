import { Container, Graphics } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { Scene } from '../../engine/SceneManager.js';
import type { SceneId } from '../../types/index.js';
import type { InputManager } from '../../engine/InputManager.js';
import type { AudioManager } from '../../engine/AudioManager.js';
import { Player } from '../entities/Player.js';
import { BalloonBirdA } from '../entities/BalloonBirdA.js';
import { BalloonBirdB } from '../entities/BalloonBirdB.js';
import { Sparky } from '../entities/Sparky.js';
import { Egg } from '../entities/Egg.js';
import { Fish } from '../entities/Fish.js';
import type { Enemy } from '../entities/Enemy.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { EnemyAISystem } from '../systems/EnemyAISystem.js';
import { ScoringSystem } from '../systems/ScoringSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { HUD } from '../ui/HUD.js';
import { TouchControls } from '../ui/TouchControls.js';
import { COLORS, PHYSICS, WATER_Y, WATER_H } from '../data/constants.js';
import type { PlatformDefinition, EnemyType } from '../../types/index.js';
import type { GameOverData } from './GameOverScene.js';

export class GameScene implements Scene {
  readonly id: SceneId = 'GAME';

  private root = new Container();
  private worldLayer = new Container();
  private uiLayer = new Container();

  private player!: Player;
  private enemies: Enemy[] = [];
  private eggs: Egg[] = [];
  private fish!: Fish;

  private physics!: PhysicsSystem;
  private collision!: CollisionSystem;
  private enemyAI!: EnemyAISystem;
  private scoring!: ScoringSystem;
  private progression!: ProgressionSystem;

  private hud!: HUD;
  private touchControls!: TouchControls;

  private platforms: PlatformDefinition[] = [];
  private paused = false;
  private waveFrame = 0;
  private perfectBonusTimer = 0;

  /** Pre-generated star positions — deterministic so they don't shift every frame */
  private readonly stars: Array<{ x: number; y: number; c: number }> = (() => {
    let s = 0x9E3779B9;
    const rng = (): number => {
      s ^= s << 13; s ^= s >> 17; s ^= s << 5;
      return (s >>> 0) / 0xFFFFFFFF;
    };
    const palette = [0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFF80, 0x80FF80, 0xC0C0FF];
    return Array.from({ length: 64 }, () => ({
      x: Math.floor(rng() * 256),
      y: Math.floor(rng() * 196),
      c: palette[Math.floor(rng() * palette.length)] ?? 0xFFFFFF,
    }));
  })();

  constructor(
    private readonly input: InputManager,
    private readonly audio: AudioManager,
    private readonly navigate: (to: SceneId, data?: unknown) => void,
  ) {}

  init(app: Application): void {
    app.stage.addChild(this.root);
    this.root.addChild(this.worldLayer);
    this.root.addChild(this.uiLayer);

    this.physics    = new PhysicsSystem();
    this.collision  = new CollisionSystem();
    this.enemyAI    = new EnemyAISystem();
    this.scoring    = new ScoringSystem();
    this.progression = new ProgressionSystem();

    this.hud = new HUD();
    this.uiLayer.addChild(this.hud);

    this.touchControls = new TouchControls(this.input);
    this.uiLayer.addChild(this.touchControls);

    // Show touch controls if touch device
    if (window.matchMedia('(pointer: coarse)').matches) {
      this.touchControls.show();
    }

    this.audio.startMusic();
    this.startPhase();
  }

  private startPhase(): void {
    const phase = this.progression.currentPhase;
    this.platforms = this.progression.platformLayout;

    // Clear enemies and eggs
    this.enemies = [];
    this.eggs = [];

    // Spawn enemies
    for (const def of phase.enemies) {
      const enemy = this.createEnemy(def.type, def.spawnX, def.spawnY);
      enemy.speedMult = this.progression.enemySpeedMultiplier;
      this.enemies.push(enemy);
    }

    // Place fish at water center
    this.fish = new Fish(128, WATER_Y);

    // Spawn player if not already alive
    if (!this.player) {
      this.player = new Player(128, 80);
      this.player.highScore = parseInt(localStorage.getItem('bfw_hi') ?? '0', 10);
    } else {
      // Respawn at center
      this.player.pos = { x: 128, y: 80 };
      this.player.vel = { x: 0, y: 0 };
      this.player.state = 'INVINCIBLE';
      this.player.invincibilityFrames = PHYSICS.INVINCIBILITY_FRAMES;
    }
  }

  private createEnemy(type: EnemyType, x: number, y: number): Enemy {
    switch (type) {
      case 'BALLOON_BIRD_A': return new BalloonBirdA(x, y);
      case 'BALLOON_BIRD_B': return new BalloonBirdB(x, y);
      case 'SPARKY':         return new Sparky(x, y);
    }
  }

  update(delta: number, elapsed: number): void {
    if (this.paused) return;

    this.input.pollGamepad();

    // Pause check
    if (this.input.wasPressed('PAUSE')) {
      this.navigate('GAME'); // placeholder — would push pause overlay
    }

    // Mute toggle
    if (this.input.wasPressed('MUTE')) {
      this.audio.setMuted(!this.audio.isMuted());
    }

    // Player input
    const left  = this.input.isDown('LEFT');
    const right = this.input.isDown('RIGHT');
    const flap  = this.input.wasPressed('FLAP');

    this.physics.movePlayer(this.player, left, right);
    if (flap && this.player.state !== 'DEAD') {
      this.player.flap();
      this.audio.play('flap');
    }

    // Physics update
    const allEntities = [this.player, ...this.enemies, ...this.eggs];
    this.physics.update(allEntities, delta);

    // Enemy AI
    this.enemyAI.update(this.enemies, this.player, delta);

    // Platform collision
    for (const e of allEntities) {
      this.collision.resolvePlatforms(e, this.platforms);
      this.collision.checkVerticalWrap(e);
    }

    // Fish update
    this.fish.updateTimer(delta);

    // Player-enemy collision
    if (this.player.state === 'ALIVE' || this.player.state === 'INVINCIBLE') {
      for (const enemy of this.enemies) {
        if (enemy.state === 'EGG' || enemy.state === 'DEAD') continue;
        if (this.collision.isOverlapping(this.player.bounds, enemy.bounds)) {
          if (this.player.pos.y < enemy.pos.y) {
            // Player stomps enemy
            this.hitEnemy(enemy, elapsed);
          } else if (!this.player.isInvincible) {
            // Enemy hits player
            this.playerHit();
          }
        }
      }
    }

    // Player-egg collision (collect)
    for (const egg of this.eggs) {
      if (egg.state === 'DEAD') continue;
      if (this.collision.isOverlapping(this.player.bounds, egg.bounds)) {
        egg.state = 'DEAD';
        const gotLife = this.scoring.recordEggCollect(this.player);
        this.audio.play('egg_hatch');
        if (gotLife) {
          this.player.lives = Math.min(this.player.lives + 1, PHYSICS.MAX_LIVES);
          this.audio.play('extra_life');
        }
      }
    }

    // Player-fish collision
    if (this.fish.isLunging && this.player.state !== 'DEAD') {
      if (this.collision.isOverlapping(this.player.bounds, this.fish.bounds)) {
        this.playerHit();
      }
    }

    // Egg hatch timers
    for (const egg of this.eggs) {
      if (egg.state !== 'EGG') continue;
      egg.hatchTimer -= delta;
      if (egg.hatchTimer <= 0) {
        // Hatch into enemy
        const newEnemy = this.createEnemy(egg.enemyType, egg.pos.x, egg.pos.y);
        newEnemy.speedMult = this.progression.enemySpeedMultiplier * 1.1; // hatched enemies are faster
        this.enemies.push(newEnemy);
        egg.state = 'DEAD';
        this.audio.play('egg_hatch');
      }
    }

    // Invincibility countdown
    if (this.player.state === 'INVINCIBLE') {
      this.player.invincibilityFrames -= delta / (1000 / 60);
      if (this.player.invincibilityFrames <= 0) {
        this.player.state = 'ALIVE';
        this.player.invincibilityFrames = 0;
      }
    }

    // Dead player respawn
    if (this.player.state === 'DEAD') {
      this.player.respawnTimer -= delta;
      if (this.player.respawnTimer <= 0) {
        if (this.player.lives <= 0) {
          this.gameOver();
          return;
        }
        this.player.state = 'INVINCIBLE';
        this.player.invincibilityFrames = PHYSICS.INVINCIBILITY_FRAMES;
        this.player.pos = { x: 128, y: 80 };
        this.player.vel = { x: 0, y: 0 };
      }
    }

    // Prune dead entities
    this.enemies = this.enemies.filter((e) => e.state !== 'DEAD');
    this.eggs    = this.eggs.filter((e) => e.state !== 'DEAD');

    // Phase clear check
    if (this.enemies.length === 0 && this.eggs.length === 0) {
      if (this.perfectBonusTimer === 0) {
        this.perfectBonusTimer = 120 * (1000 / 60);
      }
    }

    if (this.perfectBonusTimer > 0) {
      this.perfectBonusTimer -= delta;
      if (this.perfectBonusTimer <= 0) {
        this.nextPhase();
      }
    }

    // Perfect bonus timer
    if (this.perfectBonusTimer > 0) {
      this.perfectBonusTimer -= delta;
    }

    // Water check for player
    if (this.player.state === 'ALIVE' || this.player.state === 'INVINCIBLE') {
      if (this.collision.isInWater(this.player)) {
        this.playerHit();
      }
    }

    // Wave animation
    this.waveFrame++;

    this.input.clearFrame();

    // Update HUD
    this.hud.update(this.player.score, this.player.highScore, this.player.lives);

    // Render world
    this.drawWorld();
  }

  render(_alpha: number): void {}

  private hitEnemy(enemy: Enemy, elapsed: number): void {
    enemy.pop();
    this.audio.play('balloon_pop');

    if (enemy.balloonState === 'NONE') {
      // Enemy fell — will become egg on landing or die
      enemy.state = 'FALLING';
    }

    const gotLife = this.scoring.recordKill(this.player, elapsed);
    if (gotLife) {
      this.player.lives = Math.min(this.player.lives + 1, PHYSICS.MAX_LIVES);
      this.audio.play('extra_life');
    }
  }

  private playerHit(): void {
    if (this.player.isInvincible || this.player.state === 'DEAD') return;
    this.player.state = 'DEAD';
    this.player.loseLife();
    this.player.respawnTimer = 2000;
    this.audio.play('enemy_fall');
  }

  private nextPhase(): void {
    this.perfectBonusTimer = 0;
    this.scoring.recordPerfectBonus(this.player);
    this.progression.advance();

    if (this.progression.isBonusPhase()) {
      this.navigate('BONUS');
      return;
    }

    this.startPhase();
  }

  private gameOver(): void {
    this.audio.play('game_over');
    this.audio.stopMusic();
    localStorage.setItem('bfw_hi', String(this.player.highScore));

    const data: GameOverData = {
      score: this.player.score,
      hiScore: this.player.highScore,
      phase: this.progression.currentPhaseNumber,
      isNewHi: this.player.score >= this.player.highScore && this.player.score > 0,
    };
    this.navigate('GAME_OVER', data);
  }

  private drawWorld(): void {
    this.worldLayer.removeChildren();

    // ── Black background ──────────────────────────────────────────────────────
    this.worldLayer.addChild(
      new Graphics().rect(0, 0, PHYSICS.GAME_WIDTH, PHYSICS.GAME_HEIGHT).fill(0x000000),
    );

    // ── Stars ─────────────────────────────────────────────────────────────────
    // Twinkle: every ~30 frames hide 25% of stars
    const twinkle = Math.floor(this.waveFrame / 8);
    for (let i = 0; i < this.stars.length; i++) {
      if ((i + twinkle) % 4 === 0) continue; // skip = "off"
      const st = this.stars[i]!;
      this.worldLayer.addChild(new Graphics().rect(st.x, st.y, 1, 1).fill(st.c));
    }

    // Water
    this.drawWater();

    // Ground blocks (drawn before floating platforms)
    this.drawPlatforms();

    // Enemies
    for (const e of this.enemies) this.drawEnemy(e);

    // Eggs
    for (const egg of this.eggs) this.drawEgg(egg);

    // Fish
    this.drawFish();

    // Player
    this.drawPlayer();

    // Perfect bonus flash text
    if (this.perfectBonusTimer > 0) {
      // Simple pixel text via small colored rect — real text handled by HUD layer
    }
  }

  private drawWater(): void {
    const W2 = PHYSICS.GAME_WIDTH;
    // Full-width dark-blue base
    this.worldLayer.addChild(
      new Graphics().rect(0, WATER_Y, W2, WATER_H).fill(0x0000A8),
    );

    // Animated wave tiles — two rows of alternating crest/trough blocks
    const scroll = Math.floor(this.waveFrame / 3) % 16;
    for (let row = 0; row < 2; row++) {
      const wy = WATER_Y + row * 6;
      for (let bx = -16; bx < W2 + 16; bx += 16) {
        const ox = (bx + scroll + row * 8) % 16;
        const light = ox < 8;
        const col = light ? 0x4080F0 : 0x0040C8;
        this.worldLayer.addChild(new Graphics().rect(bx, wy, 8, 4).fill(col));
        this.worldLayer.addChild(new Graphics().rect(bx + 8, wy, 8, 4).fill(light ? 0x0040C8 : 0x4080F0));
      }
    }

    // White foam cap at top of water
    for (let bx = 0; bx < W2; bx += 8) {
      const fo = Math.sin(this.waveFrame * 0.12 + bx * 0.25) > 0.3 ? 1 : 0;
      if (fo) {
        this.worldLayer.addChild(new Graphics().rect(bx, WATER_Y - 1, 4, 2).fill(0xC0E8FF));
      }
    }

    // Fish lunge splash
    if (this.fish.phase !== 'idle') {
      this.worldLayer.addChild(
        new Graphics().rect(118, WATER_Y - 4, 20, 5).fill(0x80C8FF),
      );
    }
  }

  private drawPlatforms(): void {
    for (const p of this.platforms) {
      if (p.water) continue;
      const { x, y, width, height } = p.bounds;

      if (p.solid === 'SOLID') {
        // Ground blocks — NES brown dirt with green top
        this.worldLayer.addChild(new Graphics().rect(x, y, width, height).fill(0x6B3600));
        this.worldLayer.addChild(new Graphics().rect(x, y, width, 4).fill(0x00A800));
        // Brick-texture highlight lines
        for (let bx = x; bx < x + width; bx += 8) {
          this.worldLayer.addChild(new Graphics().rect(bx, y + 5, 7, 1).fill(0x8B5000));
          this.worldLayer.addChild(new Graphics().rect(bx, y + 10, 7, 1).fill(0x8B5000));
        }
      } else if (p.cloud) {
        // Cloud platform — grey puffs
        const cg = new Graphics();
        cg.rect(x + 6, y + 2, width - 12, height).fill(0x909090);
        // Puff bumps
        for (let cx = x + 4; cx < x + width - 4; cx += 14) {
          cg.ellipse(cx + 5, y + 1, 8, 6).fill(0xA8A8A8);
        }
        this.worldLayer.addChild(cg);
      } else {
        // Floating platforms — green grass on brown ledge
        this.worldLayer.addChild(new Graphics().rect(x, y + 2, width, height - 2).fill(0x6B3600));
        this.worldLayer.addChild(new Graphics().rect(x, y, width, 4).fill(0x00A800));
        // Grass blade detail
        for (let gx = x + 2; gx < x + width - 2; gx += 4) {
          this.worldLayer.addChild(new Graphics().rect(gx, y - 1, 2, 2).fill(0x00C800));
        }
      }
    }
  }

  private drawPlayer(): void {
    if (this.player.state === 'DEAD') return;
    if (this.player.state === 'INVINCIBLE' && Math.floor(this.waveFrame / 3) % 2 === 0) return;

    const { x, y } = this.player.pos;
    const fx = this.player.facing;
    const g = new Graphics();

    // ── Balloons (drawn behind character) ─────────────────────────────────────
    if (this.player.balloonState === 'TWO_BALLOONS') {
      // Left balloon (yellow)
      g.ellipse(x - 4, y - 22, 5, 6).fill(0xF8B800);
      g.rect(x - 4, y - 17, 1, 4).fill(0xC8C8C8);   // string
      // Right balloon (red)
      g.ellipse(x + 4, y - 23, 5, 6).fill(0xD82800);
      g.rect(x + 4, y - 17, 1, 4).fill(0xC8C8C8);
    } else if (this.player.balloonState === 'ONE_BALLOON') {
      g.ellipse(x, y - 22, 5, 6).fill(0xF8B800);
      g.rect(x, y - 17, 1, 4).fill(0xC8C8C8);
    }

    // ── Body ───────────────────────────────────────────────────────────────────
    g.rect(x - 4, y - 8, 8, 9).fill(0x0038C8);   // torso (blue)
    g.rect(x - 3, y - 4, 6, 3).fill(0xF8F8F8);   // white shirt detail
    g.rect(x - 1, y - 4, 2, 3).fill(0xD82800);   // red tie/button

    // ── Head ──────────────────────────────────────────────────────────────────
    g.rect(x - 3, y - 15, 7, 7).fill(0xF8C080);  // face
    g.rect(x - 3, y - 15, 7, 2).fill(0x1010A0);  // hair/hat brim

    // ── Legs ──────────────────────────────────────────────────────────────────
    g.rect(x - 4, y + 1, 3, 4).fill(0x0038C8);
    g.rect(x + 1, y + 1, 3, 4).fill(0x0038C8);
    g.rect(x - 5 * fx, y + 4, 3, 2).fill(0x602800); // leading foot (shoe)
    g.rect(x + 2 * fx, y + 4, 3, 2).fill(0x602800); // trailing foot

    this.worldLayer.addChild(g);
  }

  private drawEnemy(e: Enemy): void {
    if (e.state === 'DEAD') return;
    const { x, y } = e.pos;
    const g = new Graphics();

    if (e.type === 'SPARKY') {
      // Electric sparky — yellow/orange crackle ball
      g.ellipse(x, y, 7, 7).fill(0xF8F000);
      g.ellipse(x, y, 4, 4).fill(0xF86000);
      // Spark rays
      for (let a = 0; a < 4; a++) {
        const rx = Math.cos((a * Math.PI) / 2 + this.waveFrame * 0.15) * 8;
        const ry = Math.sin((a * Math.PI) / 2 + this.waveFrame * 0.15) * 8;
        g.rect(x + rx - 1, y + ry - 1, 2, 2).fill(0xFFFF80);
      }
    } else {
      const isB = e.type === 'BALLOON_BIRD_B';
      const bodyCol  = isB ? 0x00A800 : 0x0060F0;
      const wingCol  = isB ? 0x80E040 : 0x60A8F8;
      const bal1Col  = isB ? 0xF8F000 : 0xF82000;
      const bal2Col  = isB ? 0xF84000 : 0xF88000;

      // Balloons (behind)
      if (e.balloonState === 'TWO_BALLOONS') {
        g.ellipse(x - 3, y - 18, 4, 5).fill(bal1Col);
        g.rect(x - 3, y - 13, 1, 4).fill(0xC0C0C0);
        g.ellipse(x + 4, y - 19, 4, 5).fill(bal2Col);
        g.rect(x + 4, y - 13, 1, 4).fill(0xC0C0C0);
      } else if (e.balloonState === 'ONE_BALLOON') {
        g.ellipse(x, y - 18, 4, 5).fill(bal1Col);
        g.rect(x, y - 13, 1, 4).fill(0xC0C0C0);
      }

      // Body
      g.rect(x - 4, y - 7, 8, 8).fill(bodyCol);
      // Wing
      g.ellipse(x + 6, y - 3, 5, 3).fill(wingCol);
      // Head
      g.rect(x - 3, y - 13, 6, 6).fill(0xF8C080);
      g.rect(x - 3, y - 13, 6, 2).fill(bodyCol);    // beak/hat
      // Eye
      g.rect(x + (e.facing === 1 ? 1 : -2), y - 12, 2, 2).fill(0x000000);
      // Feet
      g.rect(x - 3, y + 1, 2, 3).fill(0xF8A000);
      g.rect(x + 1, y + 1, 2, 3).fill(0xF8A000);
    }

    this.worldLayer.addChild(g);
  }

  private drawEgg(egg: Egg): void {
    const { x, y } = egg.pos;
    const g = new Graphics();
    g.ellipse(x, y, 5, 6).fill(0xE8D8A8);
    g.ellipse(x, y - 1, 3, 3).fill(0xF8ECC8);  // highlight
    this.worldLayer.addChild(g);
  }

  private drawFish(): void {
    if (this.fish.phase === 'idle') return;
    const { x, y } = this.fish.pos;
    const g = new Graphics();
    // Body
    g.rect(x - 7, y - 4, 14, 8).fill(0x0070C0);
    // Fin
    g.rect(x - 4, y - 8, 4, 5).fill(0x0050A0);
    // Tail
    g.rect(x + 7, y - 3, 5, 3).fill(0x0050A0);
    g.rect(x + 7, y,     5, 3).fill(0x0050A0);
    // Eye
    g.rect(x + 3, y - 2, 2, 2).fill(0xFFFFFF);
    g.rect(x + 4, y - 2, 1, 1).fill(0x000000);
    this.worldLayer.addChild(g);
  }

  destroy(): void {
    this.touchControls.hide();
    this.audio.stopMusic();
    this.root.destroy({ children: true });
  }
}
