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
├── details/            ← 詳細ページ（details/フォルダ内）
├── divisions/          ← 部門ページ
├── data/               ← JSONデータファイル
├── js/                 ← JavaScriptファイル
├── css/                ← スタイルシート
├── images/             ← 画像ファイル
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
