export interface Env {
	/** 例: shikosai.cloudflareaccess.com */
	CF_ACCESS_TEAM_DOMAIN: string;
	/** 保護対象 Access アプリの Application Audience (AUD) タグ */
	CF_ACCESS_AUD: string;

	/** GitHub App「decap-cms-shikosai34-web」の App ID */
	GITHUB_APP_ID: string;
	/** 対象リポジトリへのインストール ID */
	GITHUB_APP_INSTALLATION_ID: string;
	/** GitHub App の秘密鍵（PKCS#8 PEM）。`wrangler secret put` で登録する。 */
	GITHUB_APP_PRIVATE_KEY: string;

	/** "owner/repo" 形式 */
	GITHUB_REPO: string;
	/** コミット先ブランチ */
	GITHUB_BRANCH: string;

	/**
	 * 別オリジンの /admin から呼ぶ場合の CORS 許可オリジン。
	 * 同一ゾーンの /cms/* にマウントするなら未設定でよい。
	 */
	ALLOWED_ORIGIN?: string;
}
