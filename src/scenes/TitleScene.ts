import Phaser from 'phaser';
import { drawSpaceBackdrop, makeTextButton } from '../core/Backdrop';
import { Sound } from '../core/SoundManager';
import { loadSave, resetSave } from '../core/SaveData';
import { TOTAL_STAGES } from '../data/gameData';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    drawSpaceBackdrop(this);
    const cx = this.scale.width / 2;

    // ロゴ
    this.add
      .text(cx, 120, 'バトルファイターズ', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffd94d',
        stroke: '#8a2020',
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#000000', 8, true, true);

    this.add
      .text(cx, 185, '- 宇宙をかけるバトルアクション -', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#9fc4ff'
      })
      .setOrigin(0.5);

    // デモ用にキャラを並べる
    const keys = ['fighter-kenshi', 'fighter-hammer', 'fighter-archer', 'fighter-mage'];
    keys.forEach((k, i) => {
      const img = this.add.image(cx - 150 + i * 100, 280, k).setScale(1.4);
      this.tweens.add({
        targets: img,
        y: 272,
        duration: 600 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    });

    const save = loadSave();
    const nextStage = Math.min(save.clearedStages + 1, TOTAL_STAGES);
    const label = save.clearedStages > 0 ? `スタート(ワールド${Math.ceil(nextStage / 5)}-${((nextStage - 1) % 5) + 1} から)` : 'スタート';

    makeTextButton(this, cx, 380, label, () => {
      Sound.unlock();
      Sound.stopBgm();
      this.scene.start('CharSelect', { stage: nextStage });
    });

    if (save.clearedStages > 0 || save.exp > 0) {
      makeTextButton(
        this,
        cx,
        455,
        'はじめから(データけす)',
        () => {
          resetSave();
          this.scene.restart();
        },
        18
      );
    }

    if (save.gameCompleted) {
      this.add
        .text(cx, 505, '★ ぜんクリアおめでとう! ★', {
          fontFamily: 'sans-serif',
          fontSize: '20px',
          color: '#ffd94d'
        })
        .setOrigin(0.5);
    }

    // ブラウザの自動再生制限があるため、最初の操作で BGM 開始
    this.input.once('pointerdown', () => {
      Sound.unlock();
      Sound.playBgm('title');
    });
    this.input.keyboard?.once('keydown', () => {
      Sound.unlock();
      Sound.playBgm('title');
    });
  }
}
