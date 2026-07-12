# バトルファイターズ

宇宙を舞台にした横スクロールアクションゲーム(仕様書 Ver.5 準拠)。

- **ボリューム**: 3ワールド × 5ステージ = 全15ステージ
- **クリア条件**: ワールド3「いにしえの地」のボス「ワイバーン」を倒す
- **技術構成**: TypeScript + Phaser.js + Capacitor

## あそびかた

```bash
npm install
npm run dev
```

ブラウザで表示された URL を開くとゲームが始まります。

### 操作方法

| 操作 | キーボード | スマホ(画面ボタン) |
|---|---|---|
| 移動 | ←→キー | ◀ ▶ ボタン |
| こうげき(A) | Z キー | A ボタン |
| ジャンプ(B) | X キー / ↑キー | B ボタン |
| ひっさつわざ | A+B 同時(ゲージ満タン時) | A+B 同時 |

## ゲームの流れ

1. タイトル →「スタート」
2. キャラ選択(ゲット済みのなかまから選ぶ)
3. 敵を全部倒すとステージクリア。各ワールドの5ステージ目はボス戦
4. 3ステージクリアごとに新しいなかまが解放(ステージ3→ハンマーつかい、6→ゆみつかい、9→まほうつかい)
5. ワールド3-5 のワイバーンを倒すとエンディング

けいけんちは全キャラ共通。レベルアップで ATK+10 / HP+20(全回復)。
進行状況とけいけんちは自動セーブされます(ブラウザの localStorage)。

## ビルド・スマホアプリ化

```bash
npm run build        # 型チェック + dist/ 生成
npm run preview      # ビルド結果の確認

# Capacitor でネイティブアプリ化(初回のみ platform 追加)
npx cap add android  # or ios
npm run cap:sync
npx cap open android
```

## プロジェクト構成

```
src/
├── main.ts                 # Phaser 起動設定
├── data/gameData.ts        # キャラ・敵・ボス・ステージ・レベルの全データ
├── core/
│   ├── PixelArt.ts         # ドット絵をコードから生成(後で画像に差し替え可)
│   ├── SoundManager.ts     # WebAudio 製 BGM 4曲 + 効果音
│   ├── SaveData.ts         # セーブデータ(localStorage)
│   └── Backdrop.ts         # メニュー共通の宇宙背景
├── entities/Enemy.ts       # ザコ4種 + ボス3体のAI
├── ui/TouchControls.ts     # スマホ用オンスクリーンボタン
└── scenes/                 # タイトル / キャラ選択 / バトル / クリア / ゲームオーバー / エンディング
```

## カスタマイズのヒント

- キャラや敵の強さ・ひっさつわざの名前: `src/data/gameData.ts`
- ドット絵の差し替え: `src/core/PixelArt.ts`(文字 = 色 のテキストで編集できます)
- BGM のメロディ: `src/core/SoundManager.ts` の `SONGS`
