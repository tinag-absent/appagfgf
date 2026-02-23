# 海蝕機関 — GitHub Pages デプロイガイド

## 🚀 デプロイ手順

### 方法① GitHub Actions（推奨）

1. このフォルダの内容を GitHub リポジトリの **ルート** に push
2. GitHub リポジトリの **Settings → Pages → Source** を `GitHub Actions` に設定
3. `main` ブランチに push するたびに自動デプロイされます

```
https://[username].github.io/[repository-name]/
```

### 方法② GitHub Pages（branch指定）

1. `main` ブランチにファイルを push
2. **Settings → Pages → Source → Deploy from a branch → main / (root)**

---

## 📁 フォルダ構成

```
/
├── index.html          ← エントリーポイント
├── login.html
├── dashboard.html
├── details/            ← 詳細ページ
├── divisions/          ← 部門ページ
├── data/               ← JSONデータファイル
├── js/                 ← JavaScriptファイル
│   ├── core/           ← 共通コア（router, sidebar, progress 等）
│   ├── data/           ← データローダー（data-bundle, catalog-data 等）
│   └── pages/          ← ページ固有スクリプト
├── css/                ← スタイルシート
│   ├── style.css       ← メイン（ローディングアニメーション含む）
│   ├── sidebar.css     ← サイドバー専用
│   ├── mobile.css      ← レスポンシブ
│   ├── catalog.css     ← カタログページ専用
│   ├── classified.css  ← 機密ページ専用
│   └── personnel-detail.css ← 人員詳細ページ専用
├── images/             ← 画像ファイル
├── admin/              ← 管理者ツール
├── .nojekyll           ← Jekyll処理を無効化
└── .github/workflows/  ← GitHub Actions設定
```

## 🔧 技術仕様

- **フレームワーク**: Vanilla JS（React/Vue不使用）
- **データ読み込み**: 非同期ロード方式（fetch API）
  - インラインデータが存在する場合は優先使用（file://対応）
  - GitHub Pages上では fetch() でJSONを非同期ロード
- **認証**: localStorage ベースのユーザー管理
- **開発者アカウント**: ID `K-000-DEV` / パスワード `dev_admin_2026`（LEVEL 5）

---

## ⚠️ ローカル開発

`file://` で直接開く場合、fetch()はCORSエラーになります。
ローカル開発には簡易サーバーを使用してください：

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# VS Code: Live Server 拡張機能
```

---

## 🎨 ローディングアニメーション

サイバーパンク風のローディングシステムを実装しています（`js/core/loading.js` / `css/style.css`）。

- 三重リング回転スピナー + 内側ドットパルス
- グラデーションプログレスライン（シマーエフェクト付き）
- 4段階ステージ表示：初期化 → データ確認 → リソース展開 → 認証完了

---

## 📊 JSONデータ連携

`data/` ディレクトリの JSON ファイルを編集するだけでコンテンツを更新できます。
各データローダー（`js/data/`）はインラインデータ優先 → fetch フォールバックの二段構えです。

| ファイル | 用途 |
|---|---|
| `data-bundle.js` | 全JSONを埋め込んだオフライン対応バンドル |
| `catalog-data.js` | モジュール・実体カタログ |
| `mission-data.js` | 収束案件データ |
| `personnel-database.js` | 人員データベース |
| `map-data.js` | マップインシデントデータ |

---

## 🚫 404ページ

`404.html` に海蝕機関テーマのカスタムエラーページを実装済みです。

### GitHub Pages
自動的に `404.html` が使用されます。

### Apache
`.htaccess` は含まれていないため、必要に応じて追加してください：
```apache
ErrorDocument 404 /404.html
```

### Nginx
```nginx
error_page 404 /404.html;
location = /404.html { internal; }
```

---

## 🔒 セキュリティ注意事項

- 管理者ページ（`admin/`）へのアクセスは本番環境では制限してください
- `localStorage` に保存されるユーザーデータは暗号化されていません
- 開発者アカウント情報は公開リポジトリに含めないよう注意してください
