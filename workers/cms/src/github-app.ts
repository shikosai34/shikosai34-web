import { b64ToBytes, bytesToB64url } from './base64';
import type { Env } from './env';

let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedKey: CryptoKey | null = null;

/**
 * GitHub App の installation access token を返す（有効期限 1 時間、期限前は使い回す）。
 */
export async function getInstallationToken(env: Env): Promise<string> {
	const now = Date.now();
	if (cachedToken && cachedToken.expiresAt - 60_000 > now) return cachedToken.value;

	const appJwt = await createAppJwt(env);
	const res = await fetch(
		`https://api.github.com/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${appJwt}`,
				Accept: 'application/vnd.github+json',
				'User-Agent': 'shikosai34-cms-worker',
				'X-GitHub-Api-Version': '2022-11-28',
			},
		},
	);
	if (!res.ok) {
		throw new Error(`installation token request failed: ${res.status} ${await res.text()}`);
	}

	const body = (await res.json()) as { token: string; expires_at: string };
	cachedToken = { value: body.token, expiresAt: Date.parse(body.expires_at) };
	return body.token;
}

async function createAppJwt(env: Env): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const header = { alg: 'RS256', typ: 'JWT' };
	// iat を 60 秒巻き戻すのは GitHub 側との時刻ずれ対策。exp は最大 10 分。
	const payload = { iss: env.GITHUB_APP_ID, iat: now - 60, exp: now + 9 * 60 };

	const encode = (value: unknown) =>
		bytesToB64url(new TextEncoder().encode(JSON.stringify(value)));
	const unsigned = `${encode(header)}.${encode(payload)}`;

	const key = await importPrivateKey(env.GITHUB_APP_PRIVATE_KEY);
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		key,
		new TextEncoder().encode(unsigned),
	);
	return `${unsigned}.${bytesToB64url(new Uint8Array(signature))}`;
}

/**
 * PKCS#8 PEM を CryptoKey へ取り込む。
 *
 * GitHub がダウンロードさせる .pem は PKCS#1（`BEGIN RSA PRIVATE KEY`）なので、
 * 事前に `openssl pkcs8 -topk8 -nocrypt` で PKCS#8 へ変換しておく（README 参照）。
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
	if (cachedKey) return cachedKey;
	const der = b64ToBytes(
		pem
			.replace(/-----BEGIN [A-Z ]+-----/, '')
			.replace(/-----END [A-Z ]+-----/, '')
			.replace(/\s+/g, ''),
	);
	cachedKey = await crypto.subtle.importKey(
		'pkcs8',
		der,
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['sign'],
	);
	return cachedKey;
}
