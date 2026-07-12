import Phaser from 'phaser';
import {
  BOSSES,
  CRYSTAL_GAUGE,
  ENEMIES,
  FIGHTERS,
  GAUGE_MAX,
  GAUGE_PER_KILL,
  HEART_DROP_RATE,
  HEART_HEAL,
  LEVEL_ATK_BONUS,
  LEVEL_HP_BONUS,
  TOTAL_STAGES,
  getStageDef,
  levelForExp,
  type FighterDef,
  type StageDef
} from '../data/gameData';
import { Enemy, type EnemyRuntimeDef } from '../entities/Enemy';
import { Sound } from '../core/SoundManager';
import { addExp, loadSave, markGameCompleted, recordStageClear } from '../core/SaveData';
import { TouchControls } from '../ui/TouchControls';

const GROUND_Y = 470;

export class BattleScene extends Phaser.Scene {
  private stageNo = 1;
  private fighterId = 'kenshi';
  private fighter!: FighterDef;
  private stageDef!: StageDef;

  private player!: Phaser.Physics.Arcade.Sprite;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private fireballs!: Phaser.Physics.Arcade.Group;
  private playerShots!: Phaser.Physics.Arcade.Group;
  private items!: Phaser.Physics.Arcade.Group;
  private grounds!: Phaser.Physics.Arcade.StaticGroup;

  // プレイヤー状態
  private atk = 50;
  private maxHp = 100;
  private hp = 100;
  private gauge = 0;
  private lv = 1;
  private gainedExp = 0;
  private facing = 1;
  private nextAttackAt = 0;
  private invulnUntil = 0;
  private timeStopUntil = 0;
  private wasFrozen = false;
  private dying = false;
  private cleared = false;
  private specialLockUntil = 0;
  private mageStopLockUntil = 0;

  private boss: Enemy | null = null;

  // 入力
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key; // Z = Aボタン(こうげき)
  private keyB!: Phaser.Input.Keyboard.Key; // X = Bボタン(ジャンプ)
  private touch!: TouchControls;

  // HUD
  private hpBar!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossName!: Phaser.GameObjects.Text;

  constructor() {
    super('Battle');
  }

  init(data: { stage?: number; fighterId?: string }): void {
    this.stageNo = data.stage ?? 1;
    this.fighterId = data.fighterId ?? loadSave().lastFighterId;
    this.gauge = 0;
    this.gainedExp = 0;
    this.timeStopUntil = 0;
    this.wasFrozen = false;
    this.dying = false;
    this.cleared = false;
    this.boss = null;
    this.nextAttackAt = 0;
    this.invulnUntil = 0;
    this.specialLockUntil = 0;
    this.mageStopLockUntil = 0;
    this.facing = 1;
  }

  create(): void {
    this.stageDef = getStageDef(this.stageNo);
    this.fighter = FIGHTERS.find((f) => f.id === this.fighterId) ?? FIGHTERS[0];

    const save = loadSave();
    this.lv = levelForExp(save.exp);
    this.atk = this.fighter.atk + (this.lv - 1) * LEVEL_ATK_BONUS;
    this.maxHp = this.fighter.hp + (this.lv - 1) * LEVEL_HP_BONUS;
    this.hp = this.maxHp;

    this.physics.world.setBounds(0, 0, this.stageDef.width, this.scale.height);
    this.cameras.main.setBounds(0, 0, this.stageDef.width, this.scale.height);

    this.drawBackground();
    this.createGround();
    this.createPlayer();
    this.createGroups();
    this.spawnEnemies();
    this.placeItems();
    this.createHud();
    this.setupInput();
    this.setupCollisions();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    Sound.playBgm(this.stageDef.isBoss ? 'boss' : 'stage');

    // ステージ名表示
    const banner = this.add
      .text(this.scale.width / 2, 200, this.stageDef.name, {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(950);
    this.tweens.add({ targets: banner, alpha: 0, delay: 1200, duration: 500, onComplete: () => banner.destroy() });

    if (this.stageDef.isBoss && this.boss) {
      const bossDef = BOSSES[this.stageDef.bossId!];
      const intro = this.add
        .text(this.scale.width / 2, 270, `${bossDef.name} があらわれた!!`, {
          fontFamily: 'sans-serif',
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#ff8080',
          stroke: '#000000',
          strokeThickness: 6
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(950);
      this.tweens.add({ targets: intro, alpha: 0, delay: 1800, duration: 500, onComplete: () => intro.destroy() });
    }
  }

  // ---------------- 生成まわり ----------------

  private drawBackground(): void {
    const w = this.stageDef.world;

    // 空(固定)
    const g = this.add.graphics().setScrollFactor(0).setDepth(-100);
    const top = Phaser.Display.Color.ValueToColor(w.skyTop);
    const bottom = Phaser.Display.Color.ValueToColor(w.skyBottom);
    const bands = 20;
    for (let i = 0; i < bands; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, bands - 1, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (this.scale.height / bands) * i, this.scale.width, this.scale.height / bands + 1);
    }

    // 星(ゆっくりパララックス)
    const stars = this.add.graphics().setScrollFactor(0.15).setDepth(-90);
    const rnd = new Phaser.Math.RandomDataGenerator([`stars-${this.stageNo}`]);
    for (let i = 0; i < 110; i++) {
      stars.fillStyle(0xffffff, rnd.realInRange(0.25, 1));
      const size = rnd.pick([1, 1, 2, 2, 3]);
      stars.fillRect(rnd.between(0, this.stageDef.width * 0.3), rnd.between(0, GROUND_Y - 40), size, size);
    }

    // ワールドごとの遠景
    const deco = this.add.graphics().setScrollFactor(0.45).setDepth(-80);
    const drnd = new Phaser.Math.RandomDataGenerator([`deco-${this.stageNo}`]);
    const decoWidth = this.stageDef.width * 0.6;
    if (w.id === 1) {
      // 小惑星
      for (let i = 0; i < 14; i++) {
        const x = drnd.between(50, decoWidth);
        const y = drnd.between(60, 320);
        const r = drnd.between(10, 42);
        deco.fillStyle(0x39415c, 0.9);
        deco.fillCircle(x, y, r);
        deco.fillStyle(0x2b3247, 0.9);
        deco.fillCircle(x - r * 0.3, y + r * 0.2, r * 0.35);
      }
    } else if (w.id === 2) {
      // 未来都市のシルエット
      for (let i = 0; i < 22; i++) {
        const x = i * (decoWidth / 22) + drnd.between(-14, 14);
        const bh = drnd.between(90, 260);
        const bw = drnd.between(34, 66);
        deco.fillStyle(0x0e2733, 1);
        deco.fillRect(x, GROUND_Y - bh, bw, bh);
        deco.fillStyle(0x4fd8e8, 0.8);
        for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 12; wy += 22) {
          for (let wx = x + 6; wx < x + bw - 8; wx += 16) {
            if (drnd.frac() < 0.55) deco.fillRect(wx, wy, 5, 7);
          }
        }
      }
    } else {
      // 古代遺跡の柱
      for (let i = 0; i < 16; i++) {
        const x = i * (decoWidth / 16) + drnd.between(-20, 20);
        const ph = drnd.between(100, 230);
        deco.fillStyle(0x4a2c1a, 1);
        deco.fillRect(x, GROUND_Y - ph, 30, ph);
        deco.fillStyle(0x5f3a22, 1);
        deco.fillRect(x - 8, GROUND_Y - ph - 14, 46, 14);
      }
    }
  }

  private createGround(): void {
    const w = this.stageDef.world;
    this.grounds = this.physics.add.staticGroup();

    // 地面(見た目)
    const gfx = this.add.graphics().setDepth(-10);
    gfx.fillStyle(w.groundColor, 1);
    gfx.fillRect(0, GROUND_Y, this.stageDef.width, this.scale.height - GROUND_Y);
    gfx.fillStyle(w.groundEdge, 1);
    gfx.fillRect(0, GROUND_Y, this.stageDef.width, 6);

    // 地面(当たり判定)
    const ground = this.add.rectangle(this.stageDef.width / 2, GROUND_Y + 35, this.stageDef.width, 70);
    this.physics.add.existing(ground, true);
    this.grounds.add(ground);

    // 浮遊足場
    if (!this.stageDef.isBoss) {
      const rnd = new Phaser.Math.RandomDataGenerator([`plat-${this.stageNo}`]);
      const count = 3 + (this.stageDef.sub % 3);
      for (let i = 0; i < count; i++) {
        const px = 500 + ((this.stageDef.width - 1000) / count) * i + rnd.between(-80, 80);
        const py = GROUND_Y - rnd.between(60, 90);
        const pw = rnd.between(130, 190);
        const rect = this.add.rectangle(px, py, pw, 16, w.groundEdge).setDepth(-5);
        this.physics.add.existing(rect, true);
        this.grounds.add(rect);
      }
    }
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(140, GROUND_Y - 80, this.fighter.textureKey);
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.player.width * 0.6, this.player.height * 0.92);
    this.player.setDepth(10);
  }

  private createGroups(): void {
    this.enemyGroup = this.physics.add.group({ runChildUpdate: false });
    this.fireballs = this.physics.add.group({ allowGravity: false });
    this.playerShots = this.physics.add.group({ allowGravity: false });
    this.items = this.physics.add.group();
  }

  private spawnEnemies(): void {
    for (const spawn of this.stageDef.enemies) {
      const def = ENEMIES[spawn.type];
      const runtime: EnemyRuntimeDef = {
        name: def.name,
        atk: def.atk,
        hp: def.hp,
        exp: def.exp,
        speed: def.speed,
        behavior: def.behavior,
        textureKey: def.textureKey,
        scale: 1,
        isBoss: false
      };
      const y = def.behavior === 'flyer' ? GROUND_Y - 130 : GROUND_Y - 60;
      const enemy = new Enemy(this, spawn.x, y, runtime);
      this.enemyGroup.add(enemy, false);
      enemy.setDepth(8);
    }

    if (this.stageDef.isBoss && this.stageDef.bossId) {
      const b = BOSSES[this.stageDef.bossId];
      const runtime: EnemyRuntimeDef = {
        name: b.name,
        atk: b.atk,
        hp: b.hp,
        exp: b.exp,
        speed: b.pattern === 'giantZombie' ? 35 : b.pattern === 'giantArmor' ? 60 : 90,
        behavior: b.pattern,
        textureKey: b.textureKey,
        scale: b.scale,
        isBoss: true
      };
      const y = b.pattern === 'wyvern' ? GROUND_Y - 280 : GROUND_Y - 130;
      this.boss = new Enemy(this, this.stageDef.width - 320, y, runtime);
      this.enemyGroup.add(this.boss, false);
      this.boss.setDepth(9);
    }
  }

  private placeItems(): void {
    // わざクリスタル
    for (const x of this.stageDef.crystalXs) {
      const c = this.items.create(x, GROUND_Y - 110, 'item-crystal') as Phaser.Physics.Arcade.Image;
      (c.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      c.setData('kind', 'crystal');
      this.tweens.add({ targets: c, y: c.y - 14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // ビッグハート(ボス前の部屋)
    if (this.stageDef.bigHeartX !== undefined) {
      const bh = this.items.create(this.stageDef.bigHeartX, GROUND_Y - 100, 'item-bigheart') as Phaser.Physics.Arcade.Image;
      (bh.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      bh.setData('kind', 'bigheart');
      this.tweens.add({ targets: bh, y: bh.y - 12, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  private createHud(): void {
    this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(900);
    this.hudText = this.add
      .text(16, 64, '', { fontFamily: 'sans-serif', fontSize: '17px', color: '#ffffff' })
      .setScrollFactor(0)
      .setDepth(900);
    this.stageText = this.add
      .text(this.scale.width - 16, 14, '', {
        fontFamily: 'sans-serif',
        fontSize: '19px',
        color: '#ffffff',
        align: 'right'
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(900);
    this.bossBar = this.add.graphics().setScrollFactor(0).setDepth(900);
    this.bossName = this.add
      .text(this.scale.width / 2, this.scale.height - 46, '', {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#ffb0b0'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(900);
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyB = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.touch = new TouchControls(this);
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.grounds);
    this.physics.add.collider(this.enemyGroup, this.grounds);
    this.physics.add.collider(this.items, this.grounds);

    // 敵との接触ダメージ
    this.physics.add.overlap(this.player, this.enemyGroup, (_p, e) => {
      const enemy = e as unknown as Enemy;
      if (!enemy.active || enemy.isFrozenVisual) return;
      this.damagePlayer(enemy.def.atk, enemy.x);
    });

    // 敵の火の玉
    this.physics.add.overlap(this.player, this.fireballs, (_p, fb) => {
      const ball = fb as Phaser.Physics.Arcade.Image;
      if (!ball.active) return;
      const dmg = (ball.getData('atk') as number) ?? 10;
      ball.destroy();
      this.damagePlayer(dmg, ball.x);
    });

    // プレイヤーの飛び道具
    this.physics.add.overlap(this.playerShots, this.enemyGroup, (shot, e) => {
      const s = shot as unknown as Phaser.Physics.Arcade.Image;
      const enemy = e as unknown as Enemy;
      if (!s.active || !enemy.active) return;
      const dmg = (s.getData('dmg') as number) ?? this.atk;
      s.destroy();
      this.damageEnemy(enemy, dmg);
    });

    // 火の玉は地面で消える
    this.physics.add.overlap(this.fireballs, this.grounds, (fb) => {
      (fb as Phaser.Physics.Arcade.Image).destroy();
    });

    // アイテム取得
    this.physics.add.overlap(this.player, this.items, (_p, it) => {
      const item = it as Phaser.Physics.Arcade.Image;
      if (!item.active) return;
      this.collectItem(item);
    });
  }

  // ---------------- 更新 ----------------

  update(time: number): void {
    if (this.dying || this.cleared) return;

    this.updatePlayer(time);
    this.updateEnemies(time);
    this.updateHud();
    this.cleanupProjectiles();
  }

  private updatePlayer(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    const left = this.cursors.left.isDown || this.touch.left;
    const right = this.cursors.right.isDown || this.touch.right;
    const aJust = Phaser.Input.Keyboard.JustDown(this.keyA) || this.touch.consumeAJust();
    const bJust =
      Phaser.Input.Keyboard.JustDown(this.keyB) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      this.touch.consumeBJust();
    const aHeld = this.keyA.isDown || this.touch.aHeld;
    const bHeld = this.keyB.isDown || this.cursors.up.isDown || this.touch.bHeld;

    // 移動
    if (left) {
      body.setVelocityX(-this.fighter.speed);
      this.facing = -1;
      this.player.setFlipX(true);
    } else if (right) {
      body.setVelocityX(this.fighter.speed);
      this.facing = 1;
      this.player.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // ひっさつわざ(A+B同時・ゲージ満タン)
    const wantSpecial = (aJust && bHeld) || (bJust && aHeld) || (aHeld && bHeld);
    if (wantSpecial && this.gauge >= GAUGE_MAX && time > this.specialLockUntil) {
      this.specialLockUntil = time + 800;
      this.gauge = 0;
      this.doSpecial();
      return;
    }

    // まほうつかい: A+Bどうじおしで時を止める(3秒、ゲージ不要)
    if (wantSpecial && this.fighter.attackType === 'magic' && time > this.mageStopLockUntil) {
      this.mageStopLockUntil = time + 3800;
      this.startTimeStop(3000);
      return;
    }

    // ジャンプ(Bボタン)
    if (bJust && body.blocked.down) {
      body.setVelocityY(-this.fighter.jumpPower);
      Sound.sfxJump();
    }

    // こうげき(Aボタン)
    if (aJust && time > this.nextAttackAt) {
      this.nextAttackAt = time + this.fighter.attackCooldownMs;
      this.doAttack(time);
    }

    // 落下死防止(念のため)
    if (this.player.y > this.scale.height + 60) {
      this.player.setPosition(140, GROUND_Y - 80);
    }
  }

  private updateEnemies(time: number): void {
    const frozen = time < this.timeStopUntil;
    const ctx = {
      player: this.player,
      groundY: GROUND_Y,
      frozen,
      shootFireball: (x: number, y: number, vx: number, vy: number, atk: number) => {
        if (time < this.timeStopUntil) return;
        const fb = this.fireballs.create(x, y, 'proj-fireball') as Phaser.Physics.Arcade.Image;
        fb.setVelocity(vx, vy);
        fb.setDepth(7);
        // 撃った敵の ATK をそのまま持たせる
        fb.setData('atk', atk);
      },
      onStomp: (enemy: Enemy) => this.bossStomp(enemy)
    };

    // 火の玉も時止め中は停止(解除後は元の速度に戻す。戻さないと球が空中に残存し続けるバグになる)
    if (frozen) {
      this.fireballs.getChildren().forEach((fb) => {
        const img = fb as Phaser.Physics.Arcade.Image;
        const b = img.body as Phaser.Physics.Arcade.Body;
        if (!img.getData('frozen')) {
          img.setData('frozen', true);
          img.setData('frozenVX', b.velocity.x);
          img.setData('frozenVY', b.velocity.y);
        }
        b.setVelocity(0, 0);
      });
    } else if (this.wasFrozen) {
      this.fireballs.getChildren().forEach((fb) => {
        const img = fb as Phaser.Physics.Arcade.Image;
        if (!img.getData('frozen')) return;
        const b = img.body as Phaser.Physics.Arcade.Body;
        b.setVelocity(img.getData('frozenVX') as number, img.getData('frozenVY') as number);
        img.setData('frozen', false);
      });
    }
    this.wasFrozen = frozen;

    this.enemyGroup.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active) return;
      // 遠すぎる敵は待機(近づいてきたら動き出す)
      if (!enemy.def.isBoss && Math.abs(enemy.x - this.player.x) > 850) {
        const b = enemy.body as Phaser.Physics.Arcade.Body;
        if (b.blocked.down) b.setVelocityX(0);
        return;
      }
      enemy.updateAI(time, ctx);
    });
  }

  private cleanupProjectiles(): void {
    const destroyIfOut = (obj: Phaser.GameObjects.GameObject) => {
      const img = obj as Phaser.Physics.Arcade.Image;
      if (img.x < -60 || img.x > this.stageDef.width + 60 || img.y < -80 || img.y > this.scale.height + 80) {
        img.destroy();
      }
    };
    this.playerShots.getChildren().slice().forEach(destroyIfOut);
    this.fireballs.getChildren().slice().forEach(destroyIfOut);
  }

  // ---------------- こうげき ----------------

  private doAttack(time: number): void {
    Sound.sfxAttack();

    if (this.fighter.attackType === 'melee') {
      this.meleeHit(this.atk, this.fighter.attackRange, false);
    } else if (this.fighter.attackType === 'bow') {
      const arrow = this.playerShots.create(
        this.player.x + this.facing * 30,
        this.player.y - 6,
        'proj-arrow'
      ) as Phaser.Physics.Arcade.Image;
      arrow.setVelocityX(this.facing * 760);
      arrow.setFlipX(this.facing < 0);
      arrow.setData('dmg', this.atk);
      arrow.setDepth(7);
    } else {
      const bolt = this.playerShots.create(
        this.player.x + this.facing * 30,
        this.player.y - 8,
        'proj-magic'
      ) as Phaser.Physics.Arcade.Image;
      bolt.setVelocityX(this.facing * 540);
      bolt.setData('dmg', this.atk);
      bolt.setDepth(7);
    }
  }

  /** 前方近接判定。sweep=true で範囲拡大(ひっさつ用) */
  private meleeHit(dmg: number, range: number, isSpecial: boolean): void {
    // 斬撃エフェクト
    const fx = this.add
      .image(this.player.x + this.facing * (range * 0.55 + 16), this.player.y - 4, 'fx-slash')
      .setFlipX(this.facing < 0)
      .setDepth(11)
      .setAlpha(0.9);
    if (isSpecial) fx.setScale(2.6).setTint(0xffe060);
    this.tweens.add({ targets: fx, alpha: 0, scale: fx.scale * 1.25, duration: 140, onComplete: () => fx.destroy() });

    const hitCx = this.player.x + this.facing * (range * 0.5 + 20);
    const halfW = range * 0.5 + 26;
    const halfH = isSpecial ? 130 : 80;
    this.enemyGroup.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active) return;
      if (Math.abs(enemy.x - hitCx) < halfW + enemy.displayWidth / 2 && Math.abs(enemy.y - this.player.y) < halfH + enemy.displayHeight / 2) {
        this.damageEnemy(enemy, dmg);
      }
    });
  }

  // ---------------- ひっさつわざ ----------------

  private doSpecial(): void {
    Sound.sfxSpecial();
    this.cameras.main.flash(200, 255, 255, 200);
    const name = this.fighter.specialName;

    const banner = this.add
      .text(this.scale.width / 2, 160, name + '!!', {
        fontFamily: 'sans-serif',
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#ffe060',
        stroke: '#7a2a00',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(960);
    this.tweens.add({ targets: banner, alpha: 0, delay: 800, duration: 400, onComplete: () => banner.destroy() });

    switch (this.fighter.specialType) {
      case 'ultraSword':
        // 巨大なけんで前方に ATK×3
        this.meleeHit(this.atk * 3, 300, true);
        this.cameras.main.shake(180, 0.008);
        break;

      case 'gigaHammer': {
        // まわりの敵全体に ATK×3
        this.cameras.main.shake(300, 0.015);
        const ring = this.add.circle(this.player.x, this.player.y, 40, 0xffc040, 0.5).setDepth(11);
        this.tweens.add({ targets: ring, radius: 320, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
        this.enemyGroup.getChildren().forEach((child) => {
          const enemy = child as Enemy;
          if (!enemy.active) return;
          if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 340) {
            this.damageEnemy(enemy, this.atk * 3);
          }
        });
        break;
      }

      case 'arrowStorm': {
        // 画面の敵全体に矢の雨
        const cam = this.cameras.main;
        for (let i = 0; i < 16; i++) {
          const ax = cam.scrollX + (i + 0.5) * (this.scale.width / 16);
          const arrow = this.add.image(ax, cam.scrollY - 20 - Math.random() * 80, 'proj-arrow').setAngle(90).setDepth(12);
          this.tweens.add({
            targets: arrow,
            y: GROUND_Y - 10,
            duration: 420 + Math.random() * 200,
            ease: 'Quad.in',
            onComplete: () => arrow.destroy()
          });
        }
        this.time.delayedCall(320, () => {
          const camRect = new Phaser.Geom.Rectangle(cam.scrollX - 40, 0, this.scale.width + 80, this.scale.height);
          this.enemyGroup.getChildren().forEach((child) => {
            const enemy = child as Enemy;
            if (!enemy.active) return;
            if (camRect.contains(enemy.x, enemy.y)) {
              this.damageEnemy(enemy, this.atk * 2);
            }
          });
        });
        break;
      }

      case 'allStop':
        // すべての敵を5秒止める
        this.startTimeStop(5000);
        break;
    }
  }

  private startTimeStop(ms: number): void {
    this.timeStopUntil = this.time.now + ms;
    Sound.sfxTimeStop();
    this.cameras.main.flash(300, 150, 220, 255);
    const label = this.add
      .text(this.scale.width / 2, 220, '⏱ ときが とまった!', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#9fdcff',
        stroke: '#003050',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(960);
    this.tweens.add({ targets: label, alpha: 0, delay: ms - 400, duration: 400, onComplete: () => label.destroy() });
  }

  // ---------------- ダメージ処理 ----------------

  private damageEnemy(enemy: Enemy, dmg: number): void {
    if (!enemy.active || this.cleared) return;
    enemy.hp -= dmg;

    // ダメージ数字
    const txt = this.add
      .text(enemy.x, enemy.y - enemy.displayHeight / 2 - 10, `${dmg}`, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffe060',
        stroke: '#000000',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({ targets: txt, y: txt.y - 36, alpha: 0, duration: 550, onComplete: () => txt.destroy() });

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
      return;
    }
    // 点滅
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(80, () => {
      if (enemy.active && !enemy.isFrozenVisual) enemy.clearTint();
    });
  }

  private killEnemy(enemy: Enemy): void {
    Sound.sfxEnemyDown();
    const { x, y } = enemy;
    const exp = enemy.def.exp;
    const wasBoss = enemy.def.isBoss;

    // けいけんち・ゲージ
    if (exp > 0) this.gainExp(exp, x, y);
    this.gauge = Math.min(GAUGE_MAX, this.gauge + GAUGE_PER_KILL);

    // ハートを落とす(20%)
    if (!wasBoss && Math.random() < HEART_DROP_RATE) {
      const heart = this.items.create(x, y - 10, 'item-heart') as Phaser.Physics.Arcade.Image;
      heart.setData('kind', 'heart');
      heart.setVelocityY(-220);
      heart.setBounce(0.4);
    }

    // 消滅演出
    enemy.disableBody(true, false);
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      scale: enemy.scale * 1.3,
      angle: 20,
      duration: 220,
      onComplete: () => enemy.destroy()
    });

    if (wasBoss) {
      this.boss = null;
      this.cameras.main.shake(400, 0.012);
    }

    this.time.delayedCall(260, () => this.checkClear());
  }

  private gainExp(amount: number, x: number, y: number): void {
    const before = levelForExp(loadSave().exp);
    addExp(amount);
    this.gainedExp += amount;
    const after = levelForExp(loadSave().exp);

    const txt = this.add
      .text(x, y - 40, `+${amount} EXP`, {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#c0ffc0',
        stroke: '#000000',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({ targets: txt, y: txt.y - 26, alpha: 0, duration: 700, onComplete: () => txt.destroy() });

    if (after > before) {
      this.levelUp(after);
    }
  }

  private levelUp(newLv: number): void {
    this.lv = newLv;
    this.atk = this.fighter.atk + (newLv - 1) * LEVEL_ATK_BONUS;
    this.maxHp = this.fighter.hp + (newLv - 1) * LEVEL_HP_BONUS;
    this.hp = this.maxHp; // 全回復
    Sound.sfxLevelUp();
    const banner = this.add
      .text(this.scale.width / 2, 130, `LEVEL UP!  Lv${newLv}  (ATK+10 / HP+20)`, {
        fontFamily: 'sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#c0ffc0',
        stroke: '#004a10',
        strokeThickness: 7
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(960);
    this.tweens.add({ targets: banner, alpha: 0, delay: 1400, duration: 500, onComplete: () => banner.destroy() });
  }

  private damagePlayer(dmg: number, fromX: number): void {
    const now = this.time.now;
    if (now < this.invulnUntil || this.dying || this.cleared) return;
    this.invulnUntil = now + 1000;
    this.hp -= dmg;
    Sound.sfxDamage();
    this.cameras.main.shake(120, 0.006);

    // ノックバック + 点滅
    const dir = this.player.x < fromX ? -1 : 1;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(dir * 260, -240);
    this.tweens.add({ targets: this.player, alpha: 0.25, duration: 100, yoyo: true, repeat: 4, onComplete: () => this.player.setAlpha(1) });

    if (this.hp <= 0) {
      this.hp = 0;
      this.gameOver();
    }
  }

  private bossStomp(enemy: Enemy): void {
    this.cameras.main.shake(250, 0.014);
    const ring = this.add.circle(enemy.x, GROUND_Y, 30, 0xffffff, 0.4).setDepth(11);
    this.tweens.add({ targets: ring, radius: 260, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
    // 地上にいて近いとダメージ
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down && Math.abs(this.player.x - enemy.x) < 260) {
      this.damagePlayer(enemy.def.atk, enemy.x);
    }
  }

  // ---------------- アイテム ----------------

  private collectItem(item: Phaser.Physics.Arcade.Image): void {
    const kind = item.getData('kind') as string;
    item.destroy();
    Sound.sfxItem();
    if (kind === 'heart') {
      this.hp = Math.min(this.maxHp, this.hp + HEART_HEAL);
      this.floatingLabel(`HP +${HEART_HEAL}`, '#ff9fb0');
    } else if (kind === 'bigheart') {
      this.hp = this.maxHp;
      this.floatingLabel('HP ぜんかいふく!', '#ffd060');
    } else if (kind === 'crystal') {
      this.gauge = Math.min(GAUGE_MAX, this.gauge + CRYSTAL_GAUGE);
      this.floatingLabel('わざゲージ +50%', '#7ce8ff');
    }
  }

  private floatingLabel(text: string, color: string): void {
    const t = this.add
      .text(this.player.x, this.player.y - 60, text, {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color,
        stroke: '#000000',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({ targets: t, y: t.y - 34, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  // ---------------- HUD ----------------

  private updateHud(): void {
    const g = this.hpBar;
    g.clear();

    // HPバー
    const barW = 260;
    g.fillStyle(0x000000, 0.55);
    g.fillRect(14, 14, barW + 4, 22);
    g.fillStyle(0x33202a, 1);
    g.fillRect(16, 16, barW, 18);
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    g.fillStyle(ratio > 0.35 ? 0x3fd85a : 0xe03a3a, 1);
    g.fillRect(16, 16, barW * ratio, 18);

    // わざゲージ
    g.fillStyle(0x000000, 0.55);
    g.fillRect(14, 40, barW + 4, 16);
    g.fillStyle(0x2a2a10, 1);
    g.fillRect(16, 42, barW, 12);
    const gr = this.gauge / GAUGE_MAX;
    g.fillStyle(gr >= 1 ? 0xffe060 : 0xb89020, 1);
    g.fillRect(16, 42, barW * gr, 12);

    const save = loadSave();
    const gaugeLabel = this.gauge >= GAUGE_MAX ? '  【A+B でひっさつわざ!】' : '';
    this.hudText.setText(
      `${this.fighter.name}  HP ${this.hp}/${this.maxHp}   Lv${this.lv}  EXP ${save.exp}${gaugeLabel}`
    );

    const remaining = this.enemyGroup.countActive(true);
    this.stageText.setText(`${this.stageDef.name}  のこりのてき: ${remaining}`);

    // ボスHPバー
    this.bossBar.clear();
    if (this.boss && this.boss.active) {
      const bw = 480;
      const bx = this.scale.width / 2 - bw / 2;
      const by = this.scale.height - 34;
      this.bossBar.fillStyle(0x000000, 0.6);
      this.bossBar.fillRect(bx - 2, by - 2, bw + 4, 18);
      this.bossBar.fillStyle(0x401515, 1);
      this.bossBar.fillRect(bx, by, bw, 14);
      this.bossBar.fillStyle(0xe03a3a, 1);
      this.bossBar.fillRect(bx, by, bw * Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1), 14);
      this.bossName.setText(this.boss.def.name);
    } else {
      this.bossName.setText('');
    }
  }

  // ---------------- 勝敗 ----------------

  private checkClear(): void {
    if (this.cleared || this.dying) return;
    if (this.enemyGroup.countActive(true) > 0) return;
    this.cleared = true;
    Sound.stopBgm();
    Sound.sfxClear();
    recordStageClear(this.stageNo, 0); // EXPは撃破時に加算済み

    const isFinal = this.stageNo >= TOTAL_STAGES;
    if (isFinal) {
      markGameCompleted();
    }

    const banner = this.add
      .text(this.scale.width / 2, 220, isFinal ? 'ワイバーンをたおした!!' : 'ステージクリア!', {
        fontFamily: 'sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffe060',
        stroke: '#7a2a00',
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(960);
    this.tweens.add({ targets: banner, scale: { from: 0.5, to: 1 }, duration: 300, ease: 'Back.out' });

    this.time.delayedCall(1800, () => {
      if (isFinal) {
        this.scene.start('Ending');
      } else {
        this.scene.start('StageClear', {
          stage: this.stageNo,
          gainedExp: this.gainedExp,
          fighterId: this.fighterId
        });
      }
    });
  }

  private gameOver(): void {
    this.dying = true;
    Sound.stopBgm();
    Sound.sfxDamage();
    this.player.setTint(0x808080);
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, -320);
    this.tweens.add({ targets: this.player, angle: 90, duration: 500 });
    this.time.delayedCall(1200, () => {
      this.scene.start('GameOver', { stage: this.stageNo, fighterId: this.fighterId });
    });
  }
}
