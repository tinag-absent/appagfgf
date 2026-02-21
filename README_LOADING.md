# ローディングアニメーション - 実装ガイド

## 概要
海蝕機関のテーマに合わせたサイバーパンク風のローディングアニメーションシステムを実装しました。

## 特徴

### 🎨 デザイン要素

#### 六角形スピナー
```
三重構造の六角形が回転
├─ 外側: 時計回りに回転
├─ 中間: 反時計回りに回転
└─ 内側: パルスアニメーション
```

#### プログレスバー
```
グラデーション効果のあるプログレスバー
├─ リアルタイム進捗表示
├─ シマーエフェクト
└─ スムーズなアニメーション
```

#### ステージ表示
```
4段階の読み込みステージ
├─ システム初期化中...
├─ データ読み込み中...
├─ リソース準備中...
└─ 画面構築中...
```

#### 背景エフェクト
```
サイバー空間を表現
├─ 動くグリッド背景
├─ スキャンラインアニメーション
└─ グリッチエフェクト
```

### ✨ アニメーション効果

1. **六角形ローテーション**
   - 3層の六角形が異なる速度で回転
   - グラデーションとグローエフェクト

2. **プログレスバー**
   - 0%から100%へスムーズに進行
   - シマーエフェクトで動きを演出

3. **ドットアニメーション**
   - "LOADING" テキストの後に動くドット
   - "LOADING" → "LOADING." → "LOADING.." → "LOADING..."

4. **グリッチエフェクト**
   - ランダムなタイミングでテキストが揺れる
   - サイバー感を演出

5. **ステージトランジション**
   - 各ステージが順番にアクティブ化
   - 完了時にチェックマークが表示

## ファイル構成

```
Area-rjgarj-main/
├── css/
│   └── loading.css          ⭐ NEW - ローディングのスタイル
├── js/
│   └── loading.js           ⭐ NEW - ローディング制御
└── [各HTMLファイル]          🔄 UPDATED - loading.css/jsを読み込み
```

## 実装されているページ

✅ dashboard.html - ダッシュボード
✅ modules.html - モジュールカタログ
✅ entities.html - 実体カタログ
✅ index.html - トップページ
✅ missions.html - ミッション一覧
✅ map.html - マップ
✅ divisions.html - 部門情報
✅ phenomenon.html - 現象情報

## 技術仕様

### CSS (@keyframes アニメーション)
```css
rotate        - 六角形の回転 (3s)
pulse         - 内側六角形のパルス (1.5s)
dots          - テキストドット (1.5s)
shimmer       - プログレスバーのシマー (2s)
gridMove      - 背景グリッドの移動 (20s)
scan          - スキャンライン (8s)
glitchText    - テキストグリッチ (0.3s)
```

### JavaScript機能
```javascript
LoadingSystem.init()           - 初期化
LoadingSystem.show()           - 表示
LoadingSystem.hide()           - 非表示
LoadingSystem.updateProgress() - 進捗更新
LoadingSystem.updateStage()    - ステージ更新
```

### 読み込みフロー

```
1. システム初期化中... (0-10%)
   ↓
2. データ読み込み中... (10-50%)
   ├─ CatalogData.whenReady()を待機
   └─ JSONデータの読み込み完了を確認
   ↓
3. リソース準備中... (50-70%)
   ├─ 画像等のアセット読み込み
   └─ window.loadイベントを待機
   ↓
4. 画面構築中... (70-90%)
   ↓
5. ロード完了 (100%)
   ↓
6. フェードアウト (0.5s)
```

## カスタマイズ

### ローディング時間の調整

`js/loading.js`の`delay()`を変更:

```javascript
// Stage 1
await this.delay(300);  // 300ms → お好みの時間

// Stage 2
await this.delay(500);  // 500ms → お好みの時間
```

### ステージ名の変更

`js/loading.js`の`stages`配列を編集:

```javascript
stages: [
  { id: 'init', label: 'お好きなテキスト...' },
  { id: 'data', label: 'お好きなテキスト...' },
  { id: 'assets', label: 'お好きなテキスト...' },
  { id: 'render', label: 'お好きなテキスト...' }
]
```

### 色の変更

`css/loading.css`のCSS変数を利用:

```css
/* 既存のCSS変数が使用されています */
--primary: シアン色
--background: ダークブルー
--foreground: ライトグレー
```

### アニメーション速度の変更

```css
/* 六角形の回転速度 */
animation: rotate 3s linear infinite;  /* 3s → お好みの秒数 */

/* プログレスバーのシマー */
animation: shimmer 2s infinite;  /* 2s → お好みの秒数 */
```

## パフォーマンス

### ファイルサイズ
- loading.css: 約 8KB
- loading.js: 約 5KB

### 最適化
- CSS Animationを使用（GPU加速）
- JavaScriptは最小限
- 非同期処理でブロッキングなし

### ブラウザ対応
✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Opera 76+
✅ モバイルブラウザ

## 使用方法

### 自動ローディング
特に何もする必要はありません。ページ読み込み時に自動的に表示されます。

```javascript
// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
  LoadingSystem.init();
});
```

### 手動制御（必要な場合）

```javascript
// ローディングを表示
LoadingSystem.show();

// 進捗を更新
LoadingSystem.updateProgress(50, 'カスタムメッセージ');

// ステージを更新
LoadingSystem.updateStage('data', 'active');
LoadingSystem.updateStage('data', 'complete');

// ローディングを非表示
LoadingSystem.hide();
```

### データ読み込みとの連携

catalog-data.jsと自動的に連携します:

```javascript
// loading.jsが自動的に待機
if (window.CatalogData && window.CatalogData.whenReady) {
  await window.CatalogData.whenReady();
}
```

## トラブルシューティング

### ローディングが表示されない
1. `loading.css`が正しく読み込まれているか確認
2. `loading.js`が他のスクリプトより前に読み込まれているか確認
3. ブラウザのコンソールでエラーを確認

### ローディングが消えない
1. JavaScriptエラーが発生していないか確認
2. `window.load`イベントが正しく発火しているか確認
3. タイムアウトは2秒後に自動的に完了します

### アニメーションが滑らかでない
1. ブラウザのハードウェアアクセラレーションを有効にする
2. 他のリソース負荷の高い処理を確認
3. GPU性能を確認

## セキュリティ

- XSS対策: すべてのHTMLは静的に生成
- インジェクション対策: ユーザー入力は使用していない
- コンテンツセキュリティポリシー準拠

## アクセシビリティ

- ローディング中は操作不可（オーバーレイ）
- 明確な進捗表示
- 十分なコントラスト比
- スクリーンリーダー対応可能（aria属性追加可能）

## 開発のヒント

### デバッグモード

ローディング時間を長くしてテスト:

```javascript
// loading.jsのdelayを増やす
await this.delay(3000);  // 3秒に延長
```

### ローディングをスキップ

開発中にローディングを無効化:

```javascript
// loading.jsの先頭に追加
if (window.location.hostname === 'localhost') {
  return; // ローカル環境ではスキップ
}
```

### カスタムイベント

ローディング完了時の処理を追加:

```javascript
window.addEventListener('loadingComplete', () => {
  console.log('ローディング完了！');
  // カスタム処理
});
```

## まとめ

✅ サイバーパンク風のローディングアニメーション実装完了
✅ 全主要ページに適用済み
✅ JSONデータ読み込みと自動連携
✅ レスポンシブ対応
✅ 高パフォーマンス
✅ カスタマイズ可能

**すぐに使えます！特別な設定は不要です。**
