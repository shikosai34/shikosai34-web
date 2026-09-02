# CMS Backend Worker (`shikosai34-cms`)

`/admin` の Decap CMS が GitHub へ書き込むための中継 Worker。Issue #17。

## 役割

- **疑似 OAuth**（`/cms/auth`）: 実際の GitHub OAuth はせず、`window.opener` へ
  ダミートークンを返して即ログイン成立とする。認証は前段の Cloudflare Access。
- **GitHub REST API プロキシ**（`/cms/github/*`）: Cloudflare Access JWT を検証し、
  GitHub App の installation token を付けて `api.github.com` へ中継する。
  `GET /user` と権限チェックだけは bot トークンで応答できないため Worker が合成する。
- コミットの `message` に `Editor: <メールアドレス>` を追記する（本文には出さない）。

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

## デプロイ

1. `wrangler.jsonc` の `routes` を有効化し、本番ホスト名（`34.shikosai.net` 等）を確定。
2. `bun run deploy`。
3. Cloudflare Access で `<host>/admin*` と `<host>/cms/*` を保護対象に追加し、
   許可する編集者のメール／ドメインを設定。
4. `public/admin/config.yml` の `base_url` / `api_root` / `auth_endpoint` を本番ホストに合わせる。

## 未完了・注意（WIP）

- 実ホストが未確定のため未デプロイ・未検証。`base_url` 等は仮の `34.shikosai.net`。
- 画像は当面 `public/uploads` へコミットされる。R2 + Images Binding への差し替えは後続。
- Decap の GitHub backend が初期化時に呼ぶエンドポイントは実接続で要確認
  （`/user`・`/repos/:repo`・権限チェックは対応済み）。
- editorial workflow（下書きの PR 化）は未対応。`config.yml` は simple mode。
- ローカルで Access JWT を用意できないため、`bun run dev` 単体でのプロキシ検証は限定的。
  当面は `local_backend`（`npx decap-server`）でコンテンツ編集を確認する。
