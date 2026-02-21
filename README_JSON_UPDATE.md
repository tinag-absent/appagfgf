# JSONデータ連携対応版 - 変更内容

## 概要
expanded-catalog-data.jsonファイルから動的にデータを読み込むように更新しました。

## 変更点

### 1. ディレクトリ構造
- `data/catalog-data.json` - JSONデータファイル（expanded-catalog-data.jsonから作成）
- `js/catalog-data.js` - JSON読み込み処理（書き換え）
- `js/catalog-modules.js` - モジュール表示処理（非同期対応）
- `js/catalog-entities.js` - 実体表示処理（非同期対応）

### 2. 主な変更内容

#### catalog-data.js
- ハードコードされたデータを削除
- `fetch()` APIを使用してJSONファイルを非同期で読み込む
- `window.CatalogData.whenReady()` メソッドを追加（他のスクリプトがデータ読み込みを待てるように）
- データ読み込み完了時に`catalogDataLoaded`イベントをディスパッチ

#### catalog-modules.js & catalog-entities.js
- 関数を非同期(async)に変更
- `await window.CatalogData.whenReady()` でデータ読み込みを待機
- その他のロジックは変更なし

### 3. データ構造
JSONファイルには以下のデータが含まれています：
- `modules`: モジュールデータの配列
- `entities`: 実体データの配列
- `locations`: ロケーションデータの配列（新規追加）

### 4. 使用方法
1. プロジェクトディレクトリ全体をWebサーバーにアップロード
2. `data/catalog-data.json`ファイルが正しく配置されていることを確認
3. ブラウザで`modules.html`または`entities.html`にアクセス

### 5. データの更新方法
`data/catalog-data.json`ファイルを編集することで、表示されるデータを更新できます。
ブラウザをリロードするだけで、変更が反映されます。

### 6. バックアップファイル
元のファイルは`.backup`拡張子を付けて保存されています：
- `js/catalog-data.js.backup`
- `js/catalog-modules.js.backup`
- `js/catalog-entities.js.backup`

必要に応じて復元できます。

### 7. 注意事項
- ローカルでテストする場合は、Webサーバー（Live Serverなど）を使用してください
- `file://`プロトコルではfetch()が機能しない場合があります
- JSONファイルのパスは`./data/catalog-data.json`として固定されています

### 8. トラブルシューティング
データが表示されない場合：
1. ブラウザのコンソール（F12）でエラーを確認
2. `data/catalog-data.json`ファイルが存在するか確認
3. JSONファイルの形式が正しいか確認（JSONバリデータを使用）
4. Webサーバーが正しく起動しているか確認

## ライセンス
元のプロジェクトのライセンスに従います。
