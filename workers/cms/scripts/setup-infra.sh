#!/usr/bin/env bash
# CMS Backend Worker のインフラを構築する（Issue #17）。冪等。
#
# 前提:
#   - `wrangler` にログイン済み（`wrangler whoami` で Shikosai アカウントが見えること）
#   - Access アプリ作成には Zero Trust スコープ付きの API トークンが必要
#     （wrangler の OAuth トークンには含まれないため CF_API_TOKEN を別途渡す）
#
# 使い方:
#   cd workers/cms
#   SITE_HOST=34.shikosai.net \
#   ZONE_NAME=shikosai.net \
#   CF_ZONE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
#   ASSETS_HOST=assets.shikosai.net \
#   ALLOWED_EMAIL_DOMAIN=shikosai.net \
#   CF_API_TOKEN=xxxx \
#   ./scripts/setup-infra.sh
#
# ZONE_ID は Cloudflare ダッシュボード → 対象ゾーン → Overview → API の "Zone ID"。
# API トークンは My Profile → API Tokens → Create Token、
#   権限: Account → Access: Apps and Policies → Edit / Account → Access: Organizations, Identity Providers → Read

set -euo pipefail

ACCOUNT_ID="617bef5ab8279861ced319f362981d45"
ACCESS_TEAM="shikosai" # shikosai.cloudflareaccess.com
BUCKET="shikosai34-cms-media"

: "${SITE_HOST:?SITE_HOST が必要（例: 34.shikosai.net）}"
: "${ZONE_NAME:?ZONE_NAME が必要（例: shikosai.net）}"
: "${CF_ZONE_ID:?CF_ZONE_ID が必要}"
: "${ASSETS_HOST:?ASSETS_HOST が必要（例: assets.shikosai.net）}"
: "${ALLOWED_EMAIL_DOMAIN:?ALLOWED_EMAIL_DOMAIN が必要（例: shikosai.net）}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$here"

echo "==> R2 バケット ${BUCKET}"
bunx wrangler r2 bucket create "$BUCKET" 2>&1 | grep -v "already exists" || true

echo "==> R2 カスタムドメイン ${ASSETS_HOST}"
bunx wrangler r2 bucket domain add "$BUCKET" \
	--domain "$ASSETS_HOST" --zone-id "$CF_ZONE_ID" -y 2>&1 |
	grep -v "already" || true

echo "==> wrangler.jsonc の route と ASSETS_BASE_URL を更新"
sed -i \
	-e "s#// \"routes\": \[{ \"pattern\": \"PLACEHOLDER_SITE_HOST/cms/\\*\", \"zone_name\": \"PLACEHOLDER_ZONE_NAME\" }\],#\"routes\": [{ \"pattern\": \"${SITE_HOST}/cms/*\", \"zone_name\": \"${ZONE_NAME}\" }],#" \
	-e "s#\"ASSETS_BASE_URL\": \"https://[^\"]*\"#\"ASSETS_BASE_URL\": \"https://${ASSETS_HOST}\"#" \
	wrangler.jsonc

echo "==> public/admin/config.yml のホスト名を更新"
sed -i \
	-e "s#base_url: https://[^ ]*#base_url: https://${SITE_HOST}#" \
	-e "s#api_root: https://[^ ]*#api_root: https://${SITE_HOST}/cms/github#" \
	../../public/admin/config.yml

if [ -n "${CF_API_TOKEN:-}" ]; then
	echo "==> Zero Trust Access アプリ（${SITE_HOST}/admin, ${SITE_HOST}/cms）"
	api="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}"
	app_payload=$(cat <<JSON
{
  "name": "茨香祭 お知らせ CMS",
  "type": "self_hosted",
  "session_duration": "24h",
  "app_launcher_visible": false,
  "destinations": [
    { "type": "public", "uri": "${SITE_HOST}/admin" },
    { "type": "public", "uri": "${SITE_HOST}/cms" }
  ]
}
JSON
	)
	app_res=$(curl -sS -X POST "${api}/access/apps" \
		-H "Authorization: Bearer ${CF_API_TOKEN}" \
		-H "Content-Type: application/json" \
		--data "$app_payload")
	app_id=$(printf '%s' "$app_res" | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['id'])")
	aud=$(printf '%s' "$app_res" | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['aud'])")

	policy_payload=$(cat <<JSON
{
  "name": "許可された編集者",
  "decision": "allow",
  "include": [{ "email_domain": { "domain": "${ALLOWED_EMAIL_DOMAIN}" } }]
}
JSON
	)
	curl -sS -X POST "${api}/access/apps/${app_id}/policies" \
		-H "Authorization: Bearer ${CF_API_TOKEN}" \
		-H "Content-Type: application/json" \
		--data "$policy_payload" >/dev/null

	echo "==> Access AUD: ${aud}"
	sed -i "s#\"CF_ACCESS_AUD\": \"[^\"]*\"#\"CF_ACCESS_AUD\": \"${aud}\"#" wrangler.jsonc
else
	echo "!! CF_API_TOKEN 未指定。Access アプリ作成はスキップ（ダッシュボードで作成し、AUD を wrangler.jsonc に反映）"
fi

echo
echo "次: bunx wrangler secret put GITHUB_APP_PRIVATE_KEY  &&  bunx wrangler deploy"
