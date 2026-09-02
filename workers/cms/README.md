# CMS Backend Worker (`shikosai34-cms`)

`/admin` の Decap CMS が GitHub へ書き込むための中継 Worker。Issue #17。

## 役割

- **疑似 OAuth**（`/cms/auth`）: 実際の GitHub OAuth はせず、`window.opener` へ
  ダミートークンを返して即ログイン成立とする。認証は前段の Cloudflare Access。
- **GitHub REST API プロキシ**（`/cms/github/*`）: Cloudflare Access JWT を検証し、
  GitHub App の installation token を付けて `api.github.com` へ中継する。
  `GET /user` と権限チェックだけは bot トークンで応答できないため Worker が合成する。
- コミットの `message` に `Editor: <メールアドレス>` を追記する（本文には出さない）。
- **画像アップロード**（`/cms/media`）: multipart で受けた画像を MIME / サイズ検証し、
  Images バインディングで長辺 1920px へ縮小（拡大はしない）+ WebP 変換、R2 へ保存し、
  `ASSETS_BASE_URL` 配下の公開 URL を返す。`/admin` 側は `image-r2` カスタムウィジェット
  （`public/admin/r2-image-widget.js`）がこれを呼ぶ。

```
編集者 → Cloudflare Access → /admin (Decap)
                           → /cms/auth      （疑似ログイン）
                           → /cms/github/*  → Access JWT 検証 → installation token → api.github.com
```

## 前提

- GitHub App `decap-cms-shikosai34-web`（App ID `4801354`）が
  `shikosai34/shikosai34-web` にインストール済み（Installation ID `158405949`）。
  権限は Repository → Contents: Read and write。
- Cloudflare Zero Trust の team `shikosai.cloudflareaccess.com`。
- `/admin` と `/cms/*` を対象にした Access アプリ（AUD は wrangler.jsonc の `CF_ACCESS_AUD`）。

## セットアップ

```sh
cd workers/cms
bun install

# 秘密鍵を PKCS#8 へ変換（GitHub の .pem は PKCS#1 のため）
openssl pkcs8 -topk8 -nocrypt \
  -in ../../decap-cms-shikosai34-web.2026-09-01.private-key.pem \
  -out cms-private-key.pkcs8.pem

# ローカル
cp .dev.vars.example .dev.vars      # GITHUB_APP_PRIVATE_KEY に上のファイル内容を貼る
bun run dev

# 本番シークレット
bunx wrangler secret put GITHUB_APP_PRIVATE_KEY   # PKCS#8 PEM を貼り付け
```

## インフラ構築（`scripts/setup-infra.sh`）

確定済みの構成:

| 項目 | 値 |
| --- | --- |
| サイト | `34.shikosai.net`（ゾーン `shikosai.net`）、`/cms/*` に Worker route |
| 画像配信 | `assets.34.shikosai.net`（R2 `shikosai34-cms-media`） |
| Access | `/admin` は設定済み。`/cms` を同じ Access アプリの destination に追加する |

R2 バケットとカスタムドメインを冪等に作る（`wrangler` ログイン済みが前提）:

```sh
cd workers/cms
CF_ZONE_ID=<shikosai.net の Zone ID> ./scripts/setup-infra.sh
```

- `CF_ZONE_ID`: ダッシュボード → `shikosai.net` → Overview → API の "Zone ID"。
- Images バインディング（`IMAGES`）は追加設定不要。
- Zero Trust Access は wrangler の OAuth スコープ外。`/cms` の追加はダッシュボードで行う。

## デプロイ

1. `wrangler.jsonc` の `routes` を有効化し、本番ホスト名（`34.shikosai.net` 等）を確定。
2. `bun run deploy`。
3. Cloudflare Access で `<host>/admin*` と `<host>/cms/*` を保護対象に追加し、
   許可する編集者のメール／ドメインを設定。
4. `public/admin/config.yml` の `base_url` / `api_root` / `auth_endpoint` を本番ホストに合わせる。

## 未完了・注意（WIP）

- 実ホストが未確定のため未デプロイ・未検証。`base_url` / `ASSETS_BASE_URL` 等は仮値。
- Images バインディングの `transform().output()` の戻り値の扱いは実接続で要確認。
- Markdown 本文中に挿入する画像は従来どおり `public/uploads` へコミットされる
  （見出し画像フィールドのみ R2）。
- Decap の GitHub backend が初期化時に呼ぶエンドポイントは実接続で要確認
  （`/user`・`/repos/:repo`・権限チェックは対応済み）。
- `image-r2` ウィジェットは `local_backend`（`npx decap-server`）では `/cms/media` が無いため
  アップロードできない。実機確認はデプロイ後。
- editorial workflow（下書きの PR 化）は未対応。`config.yml` は simple mode。
