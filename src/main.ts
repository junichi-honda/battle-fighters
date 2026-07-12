import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { CharSelectScene } from './scenes/CharSelectScene';
import { BattleScene } from './scenes/BattleScene';
import { StageClearScene } from './scenes/StageClearScene';
import { GameOverScene } from './scenes/GameOverScene';
import { EndingScene } from './scenes/EndingScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// スマホでアドレスバーの表示/非表示により innerHeight が変化しても
// ゲーム画面が正しい高さいっぱいに収まるよう、実際のビューポート高さを CSS 変数に反映する
function applyViewportHeight(): void {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${height}px`);
}
applyViewportHeight();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#05060f',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 4
  },
  scene: [
    BootScene,
    TitleScene,
    CharSelectScene,
    BattleScene,
    StageClearScene,
    GameOverScene,
    EndingScene
  ]
});

// 画面回転やアドレスバーの表示切替時に実サイズへ合わせて再フィットする
function handleViewportChange(): void {
  applyViewportHeight();
  game.scale.refresh();
}
window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', handleViewportChange);
window.visualViewport?.addEventListener('resize', handleViewportChange);
