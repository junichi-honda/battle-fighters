import Phaser from 'phaser';
import type { BossPattern, EnemyBehavior } from '../data/gameData';

export interface EnemyRuntimeDef {
  name: string;
  atk: number;
  hp: number;
  exp: number;
  speed: number;
  behavior: EnemyBehavior | BossPattern;
  textureKey: string;
  scale: number;
  isBoss: boolean;
}

export interface EnemyContext {
  player: Phaser.Physics.Arcade.Sprite;
  groundY: number;
  frozen: boolean;
  shootFireball: (x: number, y: number, vx: number, vy: number, atk: number) => void;
  onStomp: (enemy: Enemy) => void;
}

type BossState = 'idle' | 'punch' | 'stomp' | 'spin' | 'thrust' | 'hover' | 'dive' | 'return' | 'breath' | 'tail';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  def: EnemyRuntimeDef;
  hp: number;
  maxHp: number;

  private nextActionAt = 0;
  private actionUntil = 0;
  private aiState: BossState = 'idle';
  private hopAt = 0;
  private fireAt = 0;
  private wasAirborne = false;
  private diveTarget = new Phaser.Math.Vector2();
  private homeX = 0;
  private swayT = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyRuntimeDef) {
    super(scene, x, y, def.textureKey);
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.homeX = x;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(def.scale);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    if (this.isFlying()) {
      body.setAllowGravity(false);
    }
  }

  private isFlying(): boolean {
    return this.def.behavior === 'flyer' || this.def.behavior === 'wyvern';
  }

  isFrozenVisual = false;

  updateAI(time: number, ctx: EnemyContext): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!this.active) return;

    if (ctx.frozen) {
      // 時止め中: 完全停止
      body.setVelocity(0, 0);
      if (this.isFlying()) body.setAllowGravity(false);
      if (!this.isFrozenVisual) {
        this.isFrozenVisual = true;
        this.setTintFill(0x9fdcff);
        this.setAlpha(0.85);
      }
      return;
    }
    if (this.isFrozenVisual) {
      this.isFrozenVisual = false;
      this.clearTint();
      this.setAlpha(1);
    }

    const player = ctx.player;
    const dx = player.x - this.x;
    const dir = Math.sign(dx) || 1;
    this.setFlipX(dir < 0); // ドット絵は右向き基準

    switch (this.def.behavior) {
      case 'walker':
        body.setVelocityX(dir * this.def.speed);
        break;

      case 'hopper':
        if (body.blocked.down) {
          body.setVelocityX(0);
          if (time > this.hopAt) {
            this.hopAt = time + 900 + Math.random() * 500;
            body.setVelocity(dir * this.def.speed, -480);
          }
        }
        break;

      case 'swordsman':
        if (time < this.actionUntil) {
          // 斬りかかり中(速度維持)
        } else if (Math.abs(dx) < 150 && time > this.nextActionAt) {
          this.nextActionAt = time + 1800;
          this.actionUntil = time + 350;
          body.setVelocityX(dir * this.def.speed * 3.2);
        } else {
          body.setVelocityX(dir * this.def.speed);
        }
        break;

      case 'flyer': {
        // 空をとんで火の玉をうつ
        this.swayT += 0.03;
        const targetY = ctx.groundY - 130 + Math.sin(this.swayT) * 35;
        body.setVelocityY(Phaser.Math.Clamp((targetY - this.y) * 3, -140, 140));
        body.setVelocityX(Phaser.Math.Clamp(dx, -1, 1) * this.def.speed * (Math.abs(dx) > 80 ? 1 : 0.2));
        if (time > this.fireAt && Math.abs(dx) < 620) {
          this.fireAt = time + 2400;
          const angle = Math.atan2(player.y - this.y, player.x - this.x);
          ctx.shootFireball(this.x, this.y + 10, Math.cos(angle) * 320, Math.sin(angle) * 320, this.def.atk);
        }
        break;
      }

      case 'giantZombie':
        this.giantZombieAI(time, ctx, dx, dir, body);
        break;

      case 'giantArmor':
        this.giantArmorAI(time, dx, dir, body);
        break;

      case 'wyvern':
        this.wyvernAI(time, ctx, dx, dir, body);
        break;
    }
  }

  // ---- ボス: きょだいゾンビ(ふみつけ・パンチ) ----
  private giantZombieAI(
    time: number,
    ctx: EnemyContext,
    dx: number,
    dir: number,
    body: Phaser.Physics.Arcade.Body
  ): void {
    // 着地検知 → ふみつけ衝撃
    if (this.wasAirborne && body.blocked.down) {
      this.wasAirborne = false;
      ctx.onStomp(this);
    }
    if (!body.blocked.down) this.wasAirborne = true;

    if (time < this.actionUntil) return;

    if (time > this.nextActionAt && body.blocked.down) {
      this.nextActionAt = time + 3200;
      if (Math.abs(dx) < 260) {
        // パンチ: 前方に突進
        this.aiState = 'punch';
        this.actionUntil = time + 450;
        body.setVelocityX(dir * 300);
      } else {
        // ふみつけ: 大ジャンプして着地
        this.aiState = 'stomp';
        body.setVelocity(Phaser.Math.Clamp(dx, -280, 280), -640);
        this.actionUntil = time + 300;
      }
      return;
    }
    body.setVelocityX(dir * this.def.speed);
  }

  // ---- ボス: きょだいよろいけんし(大けんぶんまわし・つきさし) ----
  private giantArmorAI(
    time: number,
    dx: number,
    dir: number,
    body: Phaser.Physics.Arcade.Body
  ): void {
    if (time < this.actionUntil) {
      if (this.aiState === 'spin') {
        this.setAngle(this.angle + 14); // ぶんまわし演出
      }
      return;
    }
    if (this.aiState === 'spin' || this.aiState === 'thrust') {
      this.setAngle(0);
      this.aiState = 'idle';
    }
    if (time > this.nextActionAt) {
      this.nextActionAt = time + 2800;
      if (Math.random() < 0.5) {
        this.aiState = 'spin';
        this.actionUntil = time + 1300;
        body.setVelocityX(dir * 230);
      } else {
        this.aiState = 'thrust';
        this.actionUntil = time + 380;
        body.setVelocityX(dir * 460);
      }
      return;
    }
    body.setVelocityX(dir * this.def.speed);
  }

  // ---- ラスボス: ワイバーン(きゅうこうか・火をはく・しっぽ) ----
  private wyvernAI(
    time: number,
    ctx: EnemyContext,
    dx: number,
    dir: number,
    body: Phaser.Physics.Arcade.Body
  ): void {
    const player = ctx.player;
    const hoverY = ctx.groundY - 270;

    switch (this.aiState) {
      case 'dive': {
        // きゅうこうか中
        const d = Phaser.Math.Distance.Between(this.x, this.y, this.diveTarget.x, this.diveTarget.y);
        if (d < 40 || this.y > ctx.groundY - 60) {
          this.aiState = 'return';
        }
        break;
      }
      case 'return': {
        body.setVelocity(
          Phaser.Math.Clamp(this.homeX - this.x, -180, 180),
          Phaser.Math.Clamp(hoverY - this.y, -260, -80)
        );
        if (Math.abs(this.y - hoverY) < 30) {
          this.aiState = 'hover';
          this.nextActionAt = time + 1400;
        }
        break;
      }
      case 'tail': {
        if (time > this.actionUntil) this.aiState = 'hover';
        break;
      }
      default: {
        // ホバリング
        this.aiState = 'hover';
        this.swayT += 0.02;
        body.setVelocityY(Phaser.Math.Clamp(hoverY + Math.sin(this.swayT) * 30 - this.y, -120, 120));
        body.setVelocityX(Phaser.Math.Clamp(dx * 0.6, -140, 140));

        if (time > this.nextActionAt) {
          this.nextActionAt = time + 2600;
          if (Math.abs(dx) < 170 && Math.abs(player.y - this.y) < 200) {
            // しっぽこうげき: 素早い水平なぎはらい
            this.aiState = 'tail';
            this.actionUntil = time + 320;
            body.setVelocity(dir * 420, 60);
          } else if (Math.random() < 0.5) {
            // 空からきゅうこうか
            this.aiState = 'dive';
            this.diveTarget.set(player.x, player.y);
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            body.setVelocity(Math.cos(angle) * 430, Math.sin(angle) * 430);
          } else {
            // 火をはく(3方向)
            this.aiState = 'breath';
            this.actionUntil = time + 500;
            body.setVelocity(0, 0);
            const base = Math.atan2(player.y - this.y, player.x - this.x);
            for (const off of [-0.25, 0, 0.25]) {
              ctx.shootFireball(
                this.x + dir * 40,
                this.y + 20,
                Math.cos(base + off) * 340,
                Math.sin(base + off) * 340,
                this.def.atk
              );
            }
            this.scene.time.delayedCall(500, () => {
              if (this.active && this.aiState === 'breath') this.aiState = 'hover';
            });
          }
        }
      }
    }
  }
}
