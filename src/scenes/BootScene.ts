import Phaser from 'phaser';
import { createAllTextures } from '../core/PixelArt';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    createAllTextures(this);
    this.scene.start('Title');
  }
}
