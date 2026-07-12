// セーブデータ(localStorage)
// - clearedStages: クリア済みステージ数(なかま解放・進行に使う)
// - exp: けいけんち(仕様どおり全キャラ共通)

const KEY = 'battle-fighters-save-v1';

export interface SaveState {
  clearedStages: number;
  exp: number;
  lastFighterId: string;
  gameCompleted: boolean;
}

const DEFAULT_STATE: SaveState = {
  clearedStages: 0,
  exp: 0,
  lastFighterId: 'kenshi',
  gameCompleted: false
};

let state: SaveState | null = null;

export function loadSave(): SaveState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
      return state!;
    }
  } catch {
    // 壊れたデータは初期化
  }
  state = { ...DEFAULT_STATE };
  return state;
}

export function saveNow(): void {
  if (!state) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage が使えない環境ではセッション内のみ保持
  }
}

export function recordStageClear(stage: number, gainedExp: number): void {
  const s = loadSave();
  s.clearedStages = Math.max(s.clearedStages, stage);
  s.exp += gainedExp;
  saveNow();
}

export function addExp(amount: number): void {
  const s = loadSave();
  s.exp += amount;
  saveNow();
}

export function setLastFighter(id: string): void {
  const s = loadSave();
  s.lastFighterId = id;
  saveNow();
}

export function markGameCompleted(): void {
  const s = loadSave();
  s.gameCompleted = true;
  saveNow();
}

export function resetSave(): void {
  state = { ...DEFAULT_STATE };
  saveNow();
}
