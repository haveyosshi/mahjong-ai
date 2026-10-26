# NEURO（ニューロ） — GitHub Pages

アレス・ハデス・ヘルメス・アテナ・アルファ・ベータの牌譜解析と、評価関数「ウチカワ」による他家別推定放銃率をブラウザ内で実行します。ウチカワは現在10,000半荘分の途中版です。

## 起動・ビルド

Node.js 24、Python 3を使用します。

```sh
python3 scripts/download-assets.py
npm install
npm run build
```

モデル・WASM・牌画像は、公開中のNEUROからビルド時に取得し、SHA256を照合して配布物に同梱します。GitHub Pagesで推論するときに元サイトへのアクセスは不要です。ダウンロード失敗やモデル更新によるハッシュ不一致はビルドを停止します。`assets.json` を意図した版に更新してください。

Settings → Pages → Source を **GitHub Actions** に設定してください。mainへの更新でデプロイされます。

GitHub Pagesのサブパス `/mahjong-ai/` に対応し、画面遷移にはハッシュルーティングを使います。静的ホスティングには天鳳取得のサーバーAPIがないため、URLの直接取得がCORSで失敗した場合は、保存したXML・JSON・JSONL・MJLOGGMを読み込んでください。解析結果の保存・再読み込み、複数AI比較、ウチカワの推論はブラウザで動作します。

公開元のライセンス表示はアプリ内「ライセンス」で確認できます。
