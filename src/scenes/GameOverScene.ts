import Phaser from 'phaser';
import { drawSpaceBackdrop, makeTextButton } from '../core/Backdrop';
import { Sound } from '../core/SoundManager';

export class GameOverScene extends Phaser.Scene {
  private stage = 1;
  private fighterId = 'kenshi';

  constructor() {
    super('GameOver');
  }

  init(data: { stage?: number; fighterId?: string }): void {
    this.stage = data.stage ?? 1;
    this.fighterId = data.fighterId ?? 'kenshi';
  }

  create(): void {
    drawSpaceBackdrop(this, 0x100408, 0x2a0a12);
    const cx = this.scale.width / 2;

    this.add
      .text(cx, 160, 'ゲームオーバー', {
        fontFamily: 'sans-serif',
        fontSize: '60px',
        fontStyle: 'bold',
        color: '#ff6060',
        stroke: '#400000',
        strokeThickness: 10
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 235, 'たおれてしまった… でも けいけんちは のこっているぞ!', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffc0c0'
      })
      .setOrigin(0.5);

    // 「もういちど」でリトライ(仕様 2)
    makeTextButton(this, cx, 330, 'もういちど', () => {
      Sound.stopBgm();
      this.scene.start('Battle', { stage: this.stage, fighterId: this.fighterId });
    });

    makeTextButton(
      this,
      cx,
      410,
      'キャラをかえる',
      () => {
        this.scene.start('CharSelect', { stage: this.stage });
      },
      20
    );

    makeTextButton(
      this,
      90,
      505,
      '← タイトル',
      () => {
        this.scene.start('Title');
      },
      16
    );
  }
}
