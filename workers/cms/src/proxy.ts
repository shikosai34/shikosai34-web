import type { Env } from './env';
import { getInstallationToken } from './github-app';

const GITHUB_API = 'https://api.github.com';
const BOT_LOGIN = 'decap-cms[bot]';

/**
 * Decap CMS の GitHub backend からのリクエストを GitHub REST API へ中継する。
 *
 * 認証は installation token で行い、ブラウザから届く `Authorization: token ...`
 * （疑似トークン）は無視する。Decap が初期化時に叩く、bot トークンでは
 * 応答できないエンドポイントだけ Worker 側で合成する。
 */
export async function handleGithubProxy(
	request: Request,
	env: Env,
	editorEmail: string,
): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname.replace(/^\/github/, '') || '/';

	// Decap は現在ユーザーの取得に GET /user を使う。installation token では
	// 401 になるため、Access identity から擬似ユーザーを返す。
	if (path === '/user') {
		return json({
			login: BOT_LOGIN,
			id: 0,
			type: 'Bot',
			name: editorEmail,
			email: editorEmail,
			avatar_url: '',
		});
	}

	// 権限チェック（collaborators/:user/permission）も擬似応答する。
	if (/^\/repos\/[^/]+\/[^/]+\/collaborators\/[^/]+\/permission$/.test(path)) {
		return json({ permission: 'write', user: { login: BOT_LOGIN } });
	}

	const token = await getInstallationToken(env);

	const target = new URL(GITHUB_API + path);
	target.search = url.search;

	const headers = new Headers();
	headers.set('Authorization', `Bearer ${token}`);
	headers.set('User-Agent', 'shikosai34-cms-worker');
	headers.set('X-GitHub-Api-Version', '2022-11-28');
	headers.set('Accept', request.headers.get('Accept') ?? 'application/vnd.github+json');

	let body: string | undefined;
	const isWrite = request.method !== 'GET' && request.method !== 'HEAD';
	if (isWrite) {
		body = withEditorNote(path, await request.text(), editorEmail);
		headers.set('Content-Type', 'application/json');
	}

	const ghRes = await fetch(target, { method: request.method, headers, body });

	// リポジトリ情報には push 権限を明示しておく（Decap が push 可否を見るため）。
	if (path === `/repos/${env.GITHUB_REPO}` && ghRes.ok) {
		const repo = (await ghRes.json()) as { permissions?: Record<string, boolean> };
		repo.permissions = { admin: false, maintain: false, push: true, triage: true, pull: true };
		return json(repo, ghRes.status);
	}

	const resHeaders = new Headers(ghRes.headers);
	resHeaders.delete('content-encoding');
	resHeaders.delete('content-length');
	return new Response(ghRes.body, { status: ghRes.status, headers: resHeaders });
}

/**
 * コミットを伴うリクエストの commit message に編集者を記録する。
 * 公開記事本文にはメールアドレスを出さない（コミットメタデータのみ）。
 */
function withEditorNote(path: string, text: string, editorEmail: string): string {
	if (!text) return text;
	const touchesCommit = path.includes('/contents/') || path.endsWith('/git/commits');
	if (!touchesCommit) return text;
	try {
		const payload = JSON.parse(text) as Record<string, unknown>;
		if (typeof payload.message === 'string' && !payload.message.includes('Editor:')) {
			payload.message = `${payload.message}\n\nEditor: ${editorEmail}`;
		}
		return JSON.stringify(payload);
	} catch {
		return text;
	}
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
