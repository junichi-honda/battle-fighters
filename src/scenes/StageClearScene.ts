import Phaser from 'phaser';
import { drawSpaceBackdrop, makeTextButton } from '../core/Backdrop';
import { Sound } from '../core/SoundManager';
import { loadSave } from '../core/SaveData';
import { FIGHTERS, TOTAL_STAGES, getStageDef, levelForExp, expToNext } from '../data/gameData';

export class StageClearScene extends Phaser.Scene {
  private stage = 1;
  private gainedExp = 0;

  constructor() {
    super('StageClear');
  }

  init(data: { stage?: number; gainedExp?: number; fighterId?: string }): void {
    this.stage = data.stage ?? 1;
    this.gainedExp = data.gainedExp ?? 0;
  }

  create(): void {
    drawSpaceBackdrop(this, 0x081018, 0x123a2a);
    const cx = this.scale.width / 2;
    const save = loadSave();
    const stageDef = getStageDef(this.stage);

    this.add
      .text(cx, 110, 'ステージクリア!', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#ffe060',
        stroke: '#7a4a00',
        strokeThickness: 10
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 175, stageDef.name, {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#9fc4ff'
      })
      .setOrigin(0.5);

    const lv = levelForExp(save.exp);
    const next = expToNext(save.exp);
    const lines = [
      `もらったけいけんち: ${this.gainedExp}`,
      `けいけんち ごうけい: ${save.exp}   Lv ${lv}`,
      next !== null ? `つぎのレベルまで あと ${next}` : 'レベル MAX!'
    ];
    this.add
      .text(cx, 265, lines.join('\n'), {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 12
      })
      .setOrigin(0.5);

    // なかま解放のお知らせ(いまクリアしたステージで解放されたか)
    const newFriend = FIGHTERS.find((f) => f.unlockStage === this.stage);
    if (newFriend) {
      this.add.image(cx, 360, newFriend.textureKey).setScale(2);
      this.add
        .text(cx, 415, `なかまが ふえた! 「${newFriend.name}」`, {
          fontFamily: 'sans-serif',
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#ff9fd0',
          stroke: '#000000',
          strokeThickness: 5
        })
        .setOrigin(0.5);
    }

    const nextStage = this.stage + 1;
    if (nextStage <= TOTAL_STAGES) {
      makeTextButton(this, cx, 480, `つぎのステージへ(${getStageDef(nextStage).name})`, () => {
        Sound.stopBgm();
        this.scene.start('CharSelect', { stage: nextStage });
      });
    }

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

    Sound.playBgm('title');
  }
}
