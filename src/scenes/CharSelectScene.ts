import Phaser from 'phaser';
import { drawSpaceBackdrop, makeTextButton } from '../core/Backdrop';
import { Sound } from '../core/SoundManager';
import { loadSave, setLastFighter } from '../core/SaveData';
import {
  FIGHTERS,
  getStageDef,
  levelForExp,
  LEVEL_ATK_BONUS,
  LEVEL_HP_BONUS
} from '../data/gameData';

export class CharSelectScene extends Phaser.Scene {
  private stage = 1;

  constructor() {
    super('CharSelect');
  }

  init(data: { stage?: number }): void {
    this.stage = data.stage ?? 1;
  }

  create(): void {
    drawSpaceBackdrop(this);
    Sound.playBgm('title');
    const cx = this.scale.width / 2;
    const save = loadSave();
    const stageDef = getStageDef(this.stage);
    const lv = levelForExp(save.exp);

    this.add
      .text(cx, 46, 'キャラをえらぼう', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 90, `つぎのステージ: ${stageDef.name}${stageDef.isBoss ? ' 【ボスステージ!】' : ''}`, {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: stageDef.isBoss ? '#ff8080' : '#9fc4ff'
      })
      .setOrigin(0.5);

    const cardW = 210;
    const cardH = 300;
    const gap = 20;
    const totalW = FIGHTERS.length * cardW + (FIGHTERS.length - 1) * gap;
    const startX = cx - totalW / 2 + cardW / 2;

    FIGHTERS.forEach((f, i) => {
      const x = startX + i * (cardW + gap);
      const y = 280;
      const unlocked = f.unlockStage <= save.clearedStages;

      const card = this.add.rectangle(x, y, cardW, cardH, unlocked ? 0x1b2447 : 0x14151d, 0.92);
      card.setStrokeStyle(3, unlocked ? 0x4f6fd8 : 0x333644);

      const img = this.add.image(x, y - 85, f.textureKey).setScale(2);
      if (!unlocked) img.setTint(0x222222);

      this.add
        .text(x, y - 20, f.name, {
          fontFamily: 'sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
          color: unlocked ? '#ffd94d' : '#666a78'
        })
        .setOrigin(0.5);

      if (unlocked) {
        const atk = f.atk + (lv - 1) * LEVEL_ATK_BONUS;
        const hp = f.hp + (lv - 1) * LEVEL_HP_BONUS;
        this.add
          .text(x, y + 30, `ATK ${atk}   HP ${hp}`, {
            fontFamily: 'sans-serif',
            fontSize: '19px',
            color: '#ffffff'
          })
          .setOrigin(0.5);
        this.add
          .text(x, y + 78, f.feature, {
            fontFamily: 'sans-serif',
            fontSize: '14px',
            color: '#9fc4ff',
            wordWrap: { width: cardW - 24 },
            align: 'center'
          })
          .setOrigin(0.5);
        this.add
          .text(x, y + 125, `ひっさつ: ${f.specialName}`, {
            fontFamily: 'sans-serif',
            fontSize: '14px',
            color: '#ff9fd0',
            wordWrap: { width: cardW - 24 },
            align: 'center'
          })
          .setOrigin(0.5);

        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => card.setStrokeStyle(3, 0xffd94d));
        card.on('pointerout', () => card.setStrokeStyle(3, 0x4f6fd8));
        card.on('pointerdown', () => this.pick(f.id));
      } else {
        this.add
          .text(x, y + 40, `ステージ${f.unlockStage}を\nクリアでゲット!`, {
            fontFamily: 'sans-serif',
            fontSize: '17px',
            color: '#888c9a',
            align: 'center'
          })
          .setOrigin(0.5);
      }
    });

    this.add
      .text(cx, 470, `Lv ${lv}   けいけんち ${save.exp}(全キャラ共通)`, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#c0ffc0'
      })
      .setOrigin(0.5);

    makeTextButton(
      this,
      90,
      500,
      '← タイトル',
      () => {
        this.scene.start('Title');
      },
      16
    );
  }

  private pick(fighterId: string): void {
    Sound.unlock();
    Sound.sfxItem();
    setLastFighter(fighterId);
    Sound.stopBgm();
    this.scene.start('Battle', { stage: this.stage, fighterId });
  }
}
