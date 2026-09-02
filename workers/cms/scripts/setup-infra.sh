#!/usr/bin/env bash
# CMS Backend Worker のインフラ構築（Issue #17）。冪等。
#
# 確定済みの値（wrangler.jsonc / config.yml にも反映済み）:
#   サイト     : 34.shikosai.net（ゾーン shikosai.net）
#   画像配信   : assets.34.shikosai.net（R2 バケット shikosai34-cms-media）
#   Access     : /admin は設定済み。/cms も同じ Access アプリの destination に追加すること
#
# 前提: `wrangler` にログイン済み（`wrangler whoami` で Shikosai アカウントが見えること）
#
# 使い方:
#   cd workers/cms
#   CF_ZONE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ./scripts/setup-infra.sh
#
# CF_ZONE_ID = ダッシュボード → shikosai.net → Overview → API の "Zone ID"

set -euo pipefail

BUCKET="shikosai34-cms-media"
ASSETS_HOST="assets.34.shikosai.net"

: "${CF_ZONE_ID:?CF_ZONE_ID が必要（shikosai.net の Zone ID）}"

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> R2 バケット ${BUCKET}"
bunx wrangler r2 bucket create "$BUCKET" 2>&1 | grep -v "already exists" || true

echo "==> R2 カスタムドメイン ${ASSETS_HOST}"
bunx wrangler r2 bucket domain add "$BUCKET" \
	--domain "$ASSETS_HOST" --zone-id "$CF_ZONE_ID" -y 2>&1 | grep -v "already" || true

echo
echo "残り（手動）:"
echo "  1. Access: 既存の /admin アプリに 34.shikosai.net/cms を destination 追加"
echo "     （AUD が変わったら wrangler.jsonc の CF_ACCESS_AUD を更新）"
echo "  2. openssl pkcs8 -topk8 -nocrypt -in ../../decap-cms-*.private-key.pem -out cms.pkcs8.pem"
echo "  3. bunx wrangler secret put GITHUB_APP_PRIVATE_KEY   # cms.pkcs8.pem の中身"
echo "  4. bunx wrangler deploy"
