import Phaser from 'phaser';
import { drawSpaceBackdrop, makeTextButton } from '../core/Backdrop';
import { Sound } from '../core/SoundManager';
import { FIGHTERS } from '../data/gameData';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create(): void {
    drawSpaceBackdrop(this, 0x040a1e, 0x1a2a5e);
    const cx = this.scale.width / 2;
    Sound.playBgm('ending');

    this.add
      .text(cx, 100, '🎉 エンディング 🎉', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffe060',
        stroke: '#7a4a00',
        strokeThickness: 8
      })
      .setOrigin(0.5);

    const story = [
      'ラスボス「ワイバーン」は たおれた!',
      'いにしえの地に へいわが もどり、',
      '宇宙に ふたたび ひかりが かがやく。',
      '',
      '4にんの ゆうしゃたちの ぼうけんは',
      'これで おしまい。 あそんでくれて ありがとう!'
    ];
    this.add
      .text(cx, 240, story.join('\n'), {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 10
      })
      .setOrigin(0.5);

    // 勇者たちのパレード
    FIGHTERS.forEach((f, i) => {
      const img = this.add.image(cx - 165 + i * 110, 400, f.textureKey).setScale(1.8);
      this.tweens.add({
        targets: img,
        y: 390,
        duration: 500 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    });

    makeTextButton(this, cx, 490, 'タイトルへもどる', () => {
      Sound.stopBgm();
      this.scene.start('Title');
    });
  }
}
