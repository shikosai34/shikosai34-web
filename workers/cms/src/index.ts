import { AccessError, verifyAccessJwt } from './access';
import { authPage } from './auth-page';
import type { Env } from './env';
import { handleMediaUpload } from './media';
import { handleGithubProxy } from './proxy';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		// サイトと同一ゾーンの /cms/* にマウントする想定。プレフィックスを剥がす。
		const path = url.pathname.replace(/^\/cms(?=\/|$)/, '') || '/';

		if (request.method === 'OPTIONS') return withCors(env, new Response(null, { status: 204 }));
		if (path === '/healthz') return new Response('ok');

		let identity;
		try {
			identity = await verifyAccessJwt(request, env);
		} catch (err) {
			const message = err instanceof AccessError ? err.message : 'authentication failed';
			return withCors(env, new Response(message, { status: 401 }));
		}

		if (path === '/auth' || path === '/oauth') {
			return new Response(authPage(crypto.randomUUID()), {
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		}

		if (path === '/media') {
			try {
				return withCors(env, await handleMediaUpload(request, env));
			} catch (err) {
				return withCors(
					env,
					new Response(`media error: ${(err as Error).message}`, { status: 502 }),
				);
			}
		}

		if (path === '/github' || path.startsWith('/github/')) {
			try {
				const proxied = await handleGithubProxy(
					new Request(new URL(path + url.search, url), request),
					env,
					identity.email,
				);
				return withCors(env, proxied);
			} catch (err) {
				return withCors(
					env,
					new Response(`proxy error: ${(err as Error).message}`, { status: 502 }),
				);
			}
		}

		return withCors(env, new Response('not found', { status: 404 }));
	},
} satisfies ExportedHandler<Env>;

function withCors(env: Env, res: Response): Response {
	if (!env.ALLOWED_ORIGIN) return res;
	res.headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN);
	res.headers.set('Access-Control-Allow-Credentials', 'true');
	res.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
	res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
	res.headers.append('Vary', 'Origin');
	return res;
}
