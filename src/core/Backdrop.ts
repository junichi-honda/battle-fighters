import Phaser from 'phaser';

/** メニュー系シーン共通の宇宙背景(グラデーション + 星) */
export function drawSpaceBackdrop(
  scene: Phaser.Scene,
  topColor = 0x05060f,
  bottomColor = 0x141a38
): void {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const g = scene.add.graphics();
  const top = Phaser.Display.Color.ValueToColor(topColor);
  const bottom = Phaser.Display.Color.ValueToColor(bottomColor);
  const bands = 24;
  for (let i = 0; i < bands; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, bands - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, (h / bands) * i, w, h / bands + 1);
  }
  const rnd = new Phaser.Math.RandomDataGenerator(['stars']);
  for (let i = 0; i < 90; i++) {
    const x = rnd.between(0, w);
    const y = rnd.between(0, h);
    const size = rnd.pick([1, 1, 1, 2, 2, 3]);
    const alpha = rnd.realInRange(0.3, 1);
    g.fillStyle(0xffffff, alpha);
    g.fillRect(x, y, size, size);
  }
}

/** 押せるテキストボタン */
export function makeTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  fontSize = 30
): Phaser.GameObjects.Text {
  const btn = scene.add
    .text(x, y, label, {
      fontFamily: 'sans-serif',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      backgroundColor: '#2a3a7a',
      padding: { x: 26, y: 12 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#3f57b8' }));
  btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#2a3a7a' }));
  btn.on('pointerdown', onClick);
  return btn;
}
