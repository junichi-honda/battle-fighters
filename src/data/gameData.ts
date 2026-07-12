// =============================================================
// バトルファイターズ ゲームデータ定義(仕様書 Ver.5 準拠)
// =============================================================

export type AttackType = 'melee' | 'bow' | 'magic';
export type SpecialType = 'ultraSword' | 'gigaHammer' | 'arrowStorm' | 'allStop';

export interface FighterDef {
  id: string;
  name: string;
  atk: number;
  hp: number;
  speed: number;
  jumpPower: number;
  attackType: AttackType;
  attackRange: number;
  attackCooldownMs: number;
  specialType: SpecialType;
  specialName: string;
  specialDesc: string;
  feature: string;
  unlockStage: number; // 0 = 最初から使える
  textureKey: string;
}

export const FIGHTERS: FighterDef[] = [
  {
    id: 'kenshi',
    name: 'けんし',
    atk: 50,
    hp: 100,
    speed: 220,
    jumpPower: 560,
    attackType: 'melee',
    attackRange: 80,
    attackCooldownMs: 380,
    specialType: 'ultraSword',
    specialName: 'ウルトラソード',
    specialDesc: '巨大なけんで前方に大ダメージ(ATK×3)',
    feature: 'バランス型。けんとたて',
    unlockStage: 0,
    textureKey: 'fighter-kenshi'
  },
  {
    id: 'hammer',
    name: 'ハンマーつかい',
    atk: 80,
    hp: 120,
    speed: 140,
    jumpPower: 520,
    attackType: 'melee',
    attackRange: 90,
    attackCooldownMs: 650,
    specialType: 'gigaHammer',
    specialName: 'ギガハンマー',
    specialDesc: '巨大ハンマーをたたきつけ、まわりの敵全体にATK×3',
    feature: '一撃が強いが動きがおそい',
    unlockStage: 3,
    textureKey: 'fighter-hammer'
  },
  {
    id: 'archer',
    name: 'ゆみつかい',
    atk: 35,
    hp: 80,
    speed: 280,
    jumpPower: 600,
    attackType: 'bow',
    attackRange: 520,
    attackCooldownMs: 320,
    specialType: 'arrowStorm',
    specialName: 'アローストーム',
    specialDesc: 'たくさんの矢を降らせて画面の敵全体をこうげき',
    feature: '遠くからこうげきできる・すばやい',
    unlockStage: 6,
    textureKey: 'fighter-archer'
  },
  {
    id: 'mage',
    name: 'まほうつかい',
    atk: 45,
    hp: 70,
    speed: 220,
    jumpPower: 560,
    attackType: 'magic',
    attackRange: 420,
    attackCooldownMs: 420,
    specialType: 'allStop',
    specialName: 'オールストップ',
    specialDesc: 'すべての敵を5秒止める',
    feature: 'A+Bどうじおしで、時を止められる(3秒間)',
    unlockStage: 9,
    textureKey: 'fighter-mage'
  }
];

export type EnemyBehavior = 'walker' | 'hopper' | 'swordsman' | 'flyer';

export interface EnemyDef {
  id: string;
  name: string;
  atk: number;
  hp: number;
  exp: number;
  speed: number;
  behavior: EnemyBehavior;
  textureKey: string;
}

export const ENEMIES: Record<string, EnemyDef> = {
  zombie: {
    id: 'zombie',
    name: 'ゾンビ',
    atk: 10,
    hp: 50,
    exp: 10,
    speed: 40,
    behavior: 'walker',
    textureKey: 'enemy-zombie'
  },
  slime: {
    id: 'slime',
    name: 'スライム',
    atk: 15,
    hp: 30,
    exp: 10,
    speed: 120,
    behavior: 'hopper',
    textureKey: 'enemy-slime'
  },
  traitor: {
    id: 'traitor',
    name: 'うらぎりけんし',
    atk: 30,
    hp: 100,
    exp: 30,
    speed: 95,
    behavior: 'swordsman',
    textureKey: 'enemy-traitor'
  },
  demon: {
    id: 'demon',
    name: 'あくま',
    atk: 40,
    hp: 80,
    exp: 40,
    speed: 110,
    behavior: 'flyer',
    textureKey: 'enemy-demon'
  }
};

export type BossPattern = 'giantZombie' | 'giantArmor' | 'wyvern';

export interface BossDef {
  id: string;
  name: string;
  atk: number;
  hp: number;
  exp: number; // ラスボスは仕様上「—」なので 0
  pattern: BossPattern;
  textureKey: string;
  scale: number;
  attacksDesc: string;
}

export const BOSSES: Record<string, BossDef> = {
  giantZombie: {
    id: 'giantZombie',
    name: 'きょだいゾンビ',
    atk: 30,
    hp: 500,
    exp: 100,
    pattern: 'giantZombie',
    textureKey: 'enemy-zombie',
    scale: 3,
    attacksDesc: 'ふみつけ・パンチ'
  },
  giantArmor: {
    id: 'giantArmor',
    name: 'きょだいよろいけんし',
    atk: 50,
    hp: 800,
    exp: 200,
    pattern: 'giantArmor',
    textureKey: 'boss-armor',
    scale: 3,
    attacksDesc: '大けんぶんまわし・つきさし'
  },
  wyvern: {
    id: 'wyvern',
    name: 'ワイバーン',
    atk: 60,
    hp: 1200,
    exp: 0,
    pattern: 'wyvern',
    textureKey: 'boss-wyvern',
    scale: 3,
    attacksDesc: '空からきゅうこうか・火をはく・しっぽこうげき'
  }
};

// レベルアップ: 必要けいけんち(累計)。レベルアップで ATK+10 / HP+20(全回復)
export const LEVEL_EXP = [0, 50, 120, 220, 350];
export const MAX_LEVEL = LEVEL_EXP.length;
export const LEVEL_ATK_BONUS = 10;
export const LEVEL_HP_BONUS = 20;

export function levelForExp(exp: number): number {
  let lv = 1;
  for (let i = 0; i < LEVEL_EXP.length; i++) {
    if (exp >= LEVEL_EXP[i]) lv = i + 1;
  }
  return Math.min(lv, MAX_LEVEL);
}

export function expToNext(exp: number): number | null {
  const lv = levelForExp(exp);
  if (lv >= MAX_LEVEL) return null;
  return LEVEL_EXP[lv] - exp;
}

// アイテム
export const HEART_HEAL = 50;
export const HEART_DROP_RATE = 0.2;
export const CRYSTAL_GAUGE = 50; // ひっさつゲージ +50%
export const GAUGE_MAX = 100;
export const GAUGE_PER_KILL = 25; // 敵を倒すとゲージがたまる

// ワールド定義
export interface WorldDef {
  id: number;
  name: string;
  theme: string;
  skyTop: number;
  skyBottom: number;
  groundColor: number;
  groundEdge: number;
  bossId: string;
}

export const WORLDS: WorldDef[] = [
  {
    id: 1,
    name: 'だいワールド',
    theme: '宇宙の入り口・小惑星ステージ',
    skyTop: 0x050a1e,
    skyBottom: 0x101c3f,
    groundColor: 0x5a5f73,
    groundEdge: 0x8f95ad,
    bossId: 'giantZombie'
  },
  {
    id: 2,
    name: 'みらいワールド',
    theme: '未来の宇宙都市',
    skyTop: 0x02131c,
    skyBottom: 0x0b3547,
    groundColor: 0x25566b,
    groundEdge: 0x4fd8e8,
    bossId: 'giantArmor'
  },
  {
    id: 3,
    name: 'いにしえの地',
    theme: 'ワイバーンのすむ古代の星',
    skyTop: 0x14040a,
    skyBottom: 0x3a0f14,
    groundColor: 0x59331f,
    groundEdge: 0x9c6b3a,
    bossId: 'wyvern'
  }
];

export const TOTAL_STAGES = 15;

export interface EnemySpawn {
  type: string;
  x: number;
}

export interface StageDef {
  stage: number; // 1..15
  world: WorldDef;
  sub: number; // 1..5
  name: string; // 「ワールド1-3」
  isBoss: boolean;
  bossId?: string;
  enemies: EnemySpawn[];
  crystalXs: number[];
  bigHeartX?: number;
  width: number;
}

// ワールドごとのザコ敵プール(仕様 6-1 / 10 準拠)
const WORLD_POOLS: Record<number, string[]> = {
  1: ['zombie', 'slime'],
  2: ['zombie', 'slime', 'traitor'],
  3: ['traitor', 'demon']
};

export function getStageDef(stage: number): StageDef {
  const worldIdx = Math.ceil(stage / 5); // 1..3
  const world = WORLDS[worldIdx - 1];
  const sub = ((stage - 1) % 5) + 1;
  const isBoss = sub === 5;
  const name = `ワールド${worldIdx}-${sub}`;
  const pool = WORLD_POOLS[worldIdx];

  if (isBoss) {
    // ボスステージ: 手前にザコが少し、奥にボス。ボス前の部屋にビッグハート。
    const width = 2400;
    const enemies: EnemySpawn[] = [];
    for (let i = 0; i < 3; i++) {
      enemies.push({ type: pool[i % pool.length], x: 550 + i * 220 });
    }
    return {
      stage,
      world,
      sub,
      name,
      isBoss: true,
      bossId: world.bossId,
      enemies,
      crystalXs: [900],
      bigHeartX: 1400,
      width
    };
  }

  // 通常ステージ: 敵を全部倒すとクリア
  const width = 3200;
  const count = 5 + sub + (worldIdx - 1) * 2;
  const enemies: EnemySpawn[] = [];
  const startX = 640;
  const endX = width - 260;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const x = startX + (endX - startX) * t + ((i * 137) % 90) - 45;
    enemies.push({ type: pool[i % pool.length], x });
  }
  const crystalXs = sub % 2 === 0 ? [Math.floor(width * 0.35), Math.floor(width * 0.75)] : [Math.floor(width * 0.55)];
  return {
    stage,
    world,
    sub,
    name,
    isBoss: false,
    enemies,
    crystalXs,
    width
  };
}

// なかまシステム: 3ステージクリアごとに解放
export function unlockedFighters(clearedStages: number): FighterDef[] {
  return FIGHTERS.filter((f) => f.unlockStage <= clearedStages);
}
