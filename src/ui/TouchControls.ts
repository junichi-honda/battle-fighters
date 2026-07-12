import Phaser from 'phaser';

/**
 * スマホ用オンスクリーンボタン(仕様 3: 十字キー / Aこうげき / Bジャンプ)
 * タッチ対応デバイスでのみ表示。Capacitor でアプリ化したときの操作系。
 */
export class TouchControls {
  left = false;
  right = false;
  aHeld = false;
  bHeld = false;

  private aJust = false;
  private bJust = false;

  constructor(scene: Phaser.Scene) {
    if (!scene.sys.game.device.input.touch) return;

    const h = scene.scale.height;

    this.makeButton(scene, 80, h - 70, '◀', () => (this.left = true), () => (this.left = false));
    this.makeButton(scene, 185, h - 70, '▶', () => (this.right = true), () => (this.right = false));
    this.makeButton(
      scene,
      scene.scale.width - 175,
      h - 70,
      'B',
      () => {
        this.bHeld = true;
        this.bJust = true;
      },
      () => (this.bHeld = false),
      0x2a7a3a
    );
    this.makeButton(
      scene,
      scene.scale.width - 70,
      h - 95,
      'A',
      () => {
        this.aHeld = true;
        this.aJust = true;
      },
      () => (this.aHeld = false),
      0x7a2a2a
    );
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onDown: () => void,
    onUp: () => void,
    color = 0x2a3a7a
  ): void {
    const c = scene.add.circle(x, y, 46, color, 0.45).setScrollFactor(0).setDepth(1000);
    c.setStrokeStyle(3, 0xffffff, 0.5);
    scene.add
      .text(x, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001)
      .setAlpha(0.8);
    c.setInteractive({ useHandCursor: false });
    c.on('pointerdown', onDown);
    c.on('pointerup', onUp);
    c.on('pointerout', onUp);
  }

  /** このフレームで押された瞬間か(読み取りでリセット) */
  consumeAJust(): boolean {
    const v = this.aJust;
    this.aJust = false;
    return v;
  }

  consumeBJust(): boolean {
    const v = this.bJust;
    this.bJust = false;
    return v;
  }
}
