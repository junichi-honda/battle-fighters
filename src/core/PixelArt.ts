// =============================================================
// ドット絵をコードから生成する(仕様 13: シンプルなドット絵風)
// 文字 = 色、'.' = 透明。あとで画像ファイルに差し替え可能。
// =============================================================

import Phaser from 'phaser';

type Palette = Record<string, number>;

export const PIXEL_SIZE = 4;

function makeTexture(
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  palette: Palette,
  pixelSize = PIXEL_SIZE
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === '.' || c === ' ') continue;
      const color = palette[c];
      if (color === undefined) continue;
      g.fillStyle(color, 1);
      g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  });
  const w = Math.max(...rows.map((r) => r.length)) * pixelSize;
  const h = rows.length * pixelSize;
  g.generateTexture(key, w, h);
  g.destroy();
}

// ---------- みかたキャラ ----------

const KENSHI_MAP = [
  '.....AAA.....',
  '....AAAAA..G.',
  '....FEFEF..G.',
  '....FFFFF..G.',
  '.....FFF...G.',
  '...BBBBB...G.',
  '..BBBBBBB.HG.',
  '..BBBBBBBBHH.',
  '.SSBBBBBB....',
  '.SSBBBBBB....',
  '...DD.DD.....',
  '...DD.DD.....',
  '..KK...KK....'
];
const KENSHI_PAL: Palette = {
  A: 0x4d7cf5,
  B: 0x3a63d6,
  F: 0xf2c9a0,
  E: 0x20242e,
  S: 0x2a418f,
  D: 0x26304a,
  K: 0x151a26,
  G: 0xd8e0ee,
  H: 0xf0c93f
};

const HAMMER_MAP = [
  '....AAAA..MMM',
  '....AAAA..MMM',
  '...FEFEF..MMM',
  '...FFFFF...G.',
  '....FFF....G.',
  '..BBBBBBB..G.',
  '.BBBBBBBBB.G.',
  '.BBBBBBBBHHG.',
  '.BBBBBBBBB...',
  '..BBBBBBB....',
  '...DD.DD.....',
  '...DD.DD.....',
  '..KK...KK....'
];
const HAMMER_PAL: Palette = {
  A: 0xe08a2e,
  B: 0xc26a1d,
  F: 0xf2c9a0,
  E: 0x20242e,
  D: 0x4a3226,
  K: 0x1c1410,
  M: 0x9aa3b5,
  G: 0x7a5230,
  H: 0xf0c93f
};

const ARCHER_MAP = [
  '....AAAA...G.',
  '...AAAAAA.G..',
  '...AFEFA..G..',
  '...AFFFA.G...',
  '....FFF..G...',
  '...BBBBB.G...',
  '..BBBBBBBGG..',
  '..BBBBBBB.G..',
  '..BBBBB...G..',
  '...DD.DD..G..',
  '...DD.DD...G.',
  '..KK..KK.....'
];
const ARCHER_PAL: Palette = {
  A: 0x3faf5e,
  B: 0x2e8a49,
  F: 0xf2c9a0,
  E: 0x20242e,
  D: 0x274a33,
  K: 0x14211a,
  G: 0xc9a15a
};

const MAGE_MAP = [
  '......P....O.',
  '.....PPP...O.',
  '....PPPPP..Y.',
  '...PPPPPPP.Y.',
  '....FEFEF..Y.',
  '....FFFFF..Y.',
  '...RRRRRR..Y.',
  '..RRRRRRRR.Y.',
  '..RRRRRRRRYY.',
  '..RRRRRRRR.Y.',
  '..RRRRRRRR.Y.',
  '...RR..RR....',
  '..KK...KK....'
];
const MAGE_PAL: Palette = {
  P: 0x8a4de0,
  R: 0x6a35b8,
  F: 0xf2c9a0,
  E: 0x20242e,
  Y: 0xb08040,
  O: 0x7ce8ff,
  K: 0x1c1426
};

// ---------- てきキャラ ----------

const ZOMBIE_MAP = [
  '....GGGG....',
  '....GGGG....',
  '...GRGGRG...',
  '...GGGGGG...',
  '....GGG.....',
  '..CCCCCC....',
  '.CCCCCCCGGG.',
  '.CCCCCCC....',
  '..CCCCC.....',
  '...C..C.....',
  '...C..C.....',
  '..GG..GG....'
];
const ZOMBIE_PAL: Palette = {
  G: 0x7cba52,
  R: 0xd8302f,
  C: 0x3d4436
};

const SLIME_MAP = [
  '....SSSS....',
  '..SSSSSSSS..',
  '.SSWSSSSSSS.',
  '.SWSSSSSSSS.',
  'SSSKSSSSKSSS',
  'SSSKSSSSKSSS',
  'SSSSSSSSSSSS',
  '.SSSSSSSSSS.',
  '..SSSSSSSS..'
];
const SLIME_PAL: Palette = {
  S: 0x3fa8e8,
  W: 0xbfeaff,
  K: 0x123a52
};

const TRAITOR_MAP = [
  '.....AAA.....',
  '....AAAAA..G.',
  '....FRFRF..G.',
  '....FFFFF..G.',
  '.....FFF...G.',
  '...BBBBB...G.',
  '..BBBBBBB.HG.',
  '..BBBBBBBBHH.',
  '.SSBBBBBB....',
  '.SSBBBBBB....',
  '...DD.DD.....',
  '...DD.DD.....',
  '..KK...KK....'
];
const TRAITOR_PAL: Palette = {
  A: 0x5a5f6e,
  B: 0x3c4150,
  F: 0xd8b090,
  R: 0xd8302f,
  S: 0x2a2d38,
  D: 0x23262f,
  K: 0x101218,
  G: 0xb8c0d0,
  H: 0x8a2020
};

const DEMON_MAP = [
  '.W.........W.',
  'WW..H..H..WW.',
  'WWW.RRRR.WWW.',
  '.WWRRERER!W..',
  '.WWRRRRRRWW..',
  '..WRRRRRRW...',
  '...RRRRRR....',
  '...RRRRRR....',
  '....RRRR.....',
  '...RR..RR....',
  '..RR....RR...'
];
const DEMON_PAL: Palette = {
  W: 0x5a2440,
  H: 0xf0d040,
  R: 0xc4342e,
  E: 0xffe030,
  '!': 0xffe030
};

// ---------- ボス ----------

// きょだいよろいけんし(けんしの型を鋼鉄カラーに)
const BOSS_ARMOR_PAL: Palette = {
  A: 0x8a93a8,
  B: 0x5f687e,
  F: 0x30343e,
  R: 0xff4030,
  S: 0x474e60,
  D: 0x2c313e,
  K: 0x14161c,
  G: 0xe8eef8,
  H: 0xc22020
};

const WYVERN_MAP = [
  '.....BB......BB.....',
  '....BBBB....BBBB....',
  '...BBBBBB..BBBBBB...',
  '...VBBBBVV.VBBBBV...',
  'T..VVVVVVVVVVVVVV...',
  'TT.VVVVVVVVVVVVVHH..',
  '.TTVVVVVVVVVVVHHHH..',
  '..TTVVVVVVVVVHHEHH..',
  '...TVVVVVVVVVHHHHH..',
  '....VVVVVVVVV..HH...',
  '.....VV...VV........',
  '.....VV...VV........',
  '....CC...CC.........'
];
const WYVERN_PAL: Palette = {
  B: 0x7a3aa8,
  V: 0x3f8a4e,
  T: 0x2e6a3a,
  H: 0x5aa860,
  E: 0xffd020,
  C: 0xd8c060
};

// ---------- アイテム・弾など ----------

const HEART_MAP = [
  '.RR..RR.',
  'RRRRRRRR',
  'RWRRRRRR',
  'RRRRRRRR',
  '.RRRRRR.',
  '..RRRR..',
  '...RR...'
];
const HEART_PAL: Palette = { R: 0xf04060, W: 0xffc0d0 };
const BIG_HEART_PAL: Palette = { R: 0xffb020, W: 0xfff0c0 };

const CRYSTAL_MAP = [
  '...CC...',
  '..CCCC..',
  '.CCWWCC.',
  'CCWWWWCC',
  'CCWWWWCC',
  '.CCWWCC.',
  '..CCCC..',
  '...CC...'
];
const CRYSTAL_PAL: Palette = { C: 0x30d8c8, W: 0xc8fff8 };

const ARROW_MAP = ['..GGGGGGGW', 'YGGGGGGGWW', '..GGGGGGGW'];
const ARROW_PAL: Palette = { G: 0xc9a15a, W: 0xe8f0ff, Y: 0xf0d040 };

const FIREBALL_MAP = [
  '..OOO..',
  '.OYYYO.',
  'OYYWYYO',
  'OYWWWYO',
  'OYYWYYO',
  '.OYYYO.',
  '..OOO..'
];
const FIREBALL_PAL: Palette = { O: 0xe04010, Y: 0xf09020, W: 0xffe860 };

const MAGIC_MAP = [
  '...MM...',
  '..MWWM..',
  '.MWWWWM.',
  'MWWWWWWM',
  'MWWWWWWM',
  '.MWWWWM.',
  '..MWWM..',
  '...MM...'
];
const MAGIC_PAL: Palette = { M: 0x9a5af0, W: 0xe0c8ff };

const SLASH_MAP = [
  '........WW',
  '......WWWW',
  '....WWWW..',
  '..WWWW....',
  '.WWWW.....',
  '.WWW......',
  '.WWWW.....',
  '..WWWW....',
  '....WWWW..',
  '......WWWW',
  '........WW'
];
const SLASH_PAL: Palette = { W: 0xffffff };

export function createAllTextures(scene: Phaser.Scene): void {
  makeTexture(scene, 'fighter-kenshi', KENSHI_MAP, KENSHI_PAL);
  makeTexture(scene, 'fighter-hammer', HAMMER_MAP, HAMMER_PAL);
  makeTexture(scene, 'fighter-archer', ARCHER_MAP, ARCHER_PAL);
  makeTexture(scene, 'fighter-mage', MAGE_MAP, MAGE_PAL);

  makeTexture(scene, 'enemy-zombie', ZOMBIE_MAP, ZOMBIE_PAL);
  makeTexture(scene, 'enemy-slime', SLIME_MAP, SLIME_PAL);
  makeTexture(scene, 'enemy-traitor', TRAITOR_MAP, TRAITOR_PAL);
  makeTexture(scene, 'enemy-demon', DEMON_MAP, DEMON_PAL);

  makeTexture(scene, 'boss-armor', TRAITOR_MAP, BOSS_ARMOR_PAL);
  makeTexture(scene, 'boss-wyvern', WYVERN_MAP, WYVERN_PAL);

  makeTexture(scene, 'item-heart', HEART_MAP, HEART_PAL);
  makeTexture(scene, 'item-bigheart', HEART_MAP, BIG_HEART_PAL, PIXEL_SIZE + 2);
  makeTexture(scene, 'item-crystal', CRYSTAL_MAP, CRYSTAL_PAL);

  makeTexture(scene, 'proj-arrow', ARROW_MAP, ARROW_PAL);
  makeTexture(scene, 'proj-fireball', FIREBALL_MAP, FIREBALL_PAL);
  makeTexture(scene, 'proj-magic', MAGIC_MAP, MAGIC_PAL);
  makeTexture(scene, 'fx-slash', SLASH_MAP, SLASH_PAL);
}
