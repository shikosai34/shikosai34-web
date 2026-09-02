import { b64urlToBytes } from './base64';
import type { Env } from './env';

export class AccessError extends Error {}

export interface AccessIdentity {
	email: string;
	sub: string;
}

interface AccessJwk {
	kid: string;
	kty: string;
	n: string;
	e: string;
}

interface JwtHeader {
	alg: string;
	kid: string;
}

interface AccessClaims {
	aud: string | string[];
	iss: string;
	exp: number;
	nbf?: number;
	iat?: number;
	email?: string;
	sub: string;
}

const JWKS_TTL_MS = 60 * 60 * 1000;
let jwksCache: { fetchedAt: number; keys: Map<string, CryptoKey> } | null = null;

async function loadSigningKeys(teamDomain: string): Promise<Map<string, CryptoKey>> {
	const now = Date.now();
	if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;

	const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
	if (!res.ok) throw new AccessError(`failed to fetch Access JWKS: ${res.status}`);

	const body = (await res.json()) as { keys: AccessJwk[] };
	const keys = new Map<string, CryptoKey>();
	for (const jwk of body.keys) {
		const key = await crypto.subtle.importKey(
			'jwk',
			{ kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
			{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
			false,
			['verify'],
		);
		keys.set(jwk.kid, key);
	}

	jwksCache = { fetchedAt: now, keys };
	return keys;
}

function decodeJson<T>(segment: string): T {
	return JSON.parse(new TextDecoder().decode(b64urlToBytes(segment))) as T;
}

function readCookie(request: Request, name: string): string | null {
	const header = request.headers.get('Cookie');
	if (!header) return null;
	for (const part of header.split(';')) {
		const [key, ...rest] = part.trim().split('=');
		if (key === name) return rest.join('=');
	}
	return null;
}

/**
 * Cloudflare Access が付与する JWT を検証し、編集者の identity を返す。
 *
 * Worker の前段に Access アプリを置くため、正規のリクエストには必ず
 * `Cf-Access-Jwt-Assertion` ヘッダー（または `CF_Authorization` cookie）が付く。
 * ここでの検証はプロキシを直接叩かれた場合の防御でもある。
 */
export async function verifyAccessJwt(request: Request, env: Env): Promise<AccessIdentity> {
	const token =
		request.headers.get('Cf-Access-Jwt-Assertion') ?? readCookie(request, 'CF_Authorization');
	if (!token) throw new AccessError('missing Cloudflare Access token');

	const [rawHeader, rawPayload, rawSignature] = token.split('.');
	if (!rawHeader || !rawPayload || !rawSignature) throw new AccessError('malformed Access token');

	const header = decodeJson<JwtHeader>(rawHeader);
	if (header.alg !== 'RS256') throw new AccessError(`unexpected token alg: ${header.alg}`);

	const keys = await loadSigningKeys(env.CF_ACCESS_TEAM_DOMAIN);
	const key = keys.get(header.kid);
	if (!key) throw new AccessError('unknown Access signing key');

	const signed = new TextEncoder().encode(`${rawHeader}.${rawPayload}`);
	const valid = await crypto.subtle.verify(
		'RSASSA-PKCS1-v1_5',
		key,
		b64urlToBytes(rawSignature),
		signed,
	);
	if (!valid) throw new AccessError('bad Access token signature');

	const claims = decodeJson<AccessClaims>(rawPayload);
	const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
	if (!audiences.includes(env.CF_ACCESS_AUD)) throw new AccessError('Access token audience mismatch');
	if (claims.iss !== `https://${env.CF_ACCESS_TEAM_DOMAIN}`) {
		throw new AccessError('Access token issuer mismatch');
	}

	const now = Math.floor(Date.now() / 1000);
	if (claims.exp <= now) throw new AccessError('Access token expired');
	if (claims.nbf && claims.nbf > now + 60) throw new AccessError('Access token not yet valid');
	if (!claims.email) throw new AccessError('Access token has no email claim');

	return { email: claims.email, sub: claims.sub };
}
