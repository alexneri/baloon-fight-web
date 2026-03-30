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

    // Sky background
    const sky = new Graphics()
      .rect(0, 0, PHYSICS.GAME_WIDTH, PHYSICS.GAME_HEIGHT)
      .fill(COLORS.SKY);
    this.worldLayer.addChild(sky);

    // Water
    this.drawWater();

    // Platforms
    this.drawPlatforms();

    // Enemies
    for (const e of this.enemies) {
      this.drawEnemy(e);
    }

    // Eggs
    for (const egg of this.eggs) {
      this.drawEgg(egg);
    }

    // Fish
    this.drawFish();

    // Player
    this.drawPlayer();
  }

  private drawWater(): void {
    const waterBg = new Graphics()
      .rect(64, WATER_Y, 128, WATER_H)
      .fill(COLORS.WATER_DEEP);
    this.worldLayer.addChild(waterBg);

    const surface = new Graphics()
      .rect(64, WATER_Y, 128, 6)
      .fill(COLORS.WATER);
    this.worldLayer.addChild(surface);

    // Wave crests
    for (let x = 64; x < 192; x += 16) {
      const wo = Math.sin(this.waveFrame * 0.1 + x * 0.2) * 2;
      const crest = new Graphics()
        .rect(x, WATER_Y + wo, 8, 3)
        .fill(0x5CCCFC);
      this.worldLayer.addChild(crest);
    }
  }

  private drawPlatforms(): void {
    for (const p of this.platforms) {
      if (p.water) continue;
      const { x, y, width, height } = p.bounds;
      if (p.cloud) {
        const cloud = new Graphics().rect(x, y, width, height).fill(COLORS.CLOUD);
        this.worldLayer.addChild(cloud);
        for (let cx = x + 4; cx < x + width - 4; cx += 12) {
          const puff = new Graphics().rect(cx, y - 3, 10, 5).fill(COLORS.CLOUD);
          this.worldLayer.addChild(puff);
        }
      } else {
        const grass = new Graphics().rect(x, y, width, 3).fill(COLORS.GREEN);
        const body  = new Graphics().rect(x, y + 3, width, height - 3).fill(COLORS.BROWN);
        this.worldLayer.addChild(body);
        this.worldLayer.addChild(grass);
      }
    }
  }

  private drawPlayer(): void {
    if (this.player.state === 'DEAD') return;
    // Blink during invincibility
    if (this.player.state === 'INVINCIBLE' && Math.floor(this.waveFrame / 4) % 2 === 0) return;

    const { x, y } = this.player.pos;
    const p = new Graphics();
    // Body
    p.rect(x - 5, y - 6, 10, 12).fill(0x2050C8);
    // Head
    p.rect(x - 4, y - 14, 8, 8).fill(0xF8C090);
    // Hat
    p.rect(x - 5, y - 17, 10, 4).fill(0x1020A0);
    // Balloons
    if (this.player.balloonState !== 'NONE') {
      p.rect(x - 4, y - 26, 8, 10).fill(COLORS.ACCENT);
    }
    if (this.player.balloonState === 'TWO_BALLOONS') {
      p.rect(x + 2, y - 28, 8, 10).fill(COLORS.RED);
    }
    this.worldLayer.addChild(p);
  }

  private drawEnemy(e: Enemy): void {
    if (e.state === 'DEAD') return;
    const { x, y } = e.pos;
    const g = new Graphics();

    if (e.type === 'SPARKY') {
      g.rect(x - 6, y - 6, 12, 12).fill(0xF8F800);
      g.rect(x - 4, y - 4, 8, 8).fill(0xF86000);
    } else {
      const bodyColor = e.type === 'BALLOON_BIRD_B' ? 0x80C020 : 0x60A0F8;
      g.rect(x - 5, y - 5, 10, 10).fill(bodyColor);
      if (e.balloonState !== 'NONE') {
        g.rect(x - 4, y - 14, 8, 9).fill(COLORS.RED);
      }
      if (e.balloonState === 'TWO_BALLOONS') {
        g.rect(x + 1, y - 16, 8, 9).fill(0xF8A000);
      }
    }
    this.worldLayer.addChild(g);
  }

  private drawEgg(egg: Egg): void {
    const { x, y } = egg.pos;
    const g = new Graphics()
      .ellipse(x, y, 5, 6)
      .fill(0xF0E0C0);
    this.worldLayer.addChild(g);
  }

  private drawFish(): void {
    if (this.fish.phase === 'idle') return;
    const { x, y } = this.fish.pos;
    const g = new Graphics()
      .rect(x - 8, y - 5, 16, 10)
      .fill(0x60A8D0);
    this.worldLayer.addChild(g);
  }

  destroy(): void {
    this.touchControls.hide();
    this.audio.stopMusic();
    this.root.destroy({ children: true });
  }
}
