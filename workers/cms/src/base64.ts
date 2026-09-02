/** base64url 文字列をバイト列へデコードする。 */
export function b64urlToBytes(input: string): Uint8Array {
	const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
	const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
	return out;
}

/** バイト列を（パディングなしの）base64url 文字列へエンコードする。 */
export function bytesToB64url(bytes: Uint8Array): string {
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 標準 base64 文字列をバイト列へデコードする。 */
export function b64ToBytes(input: string): Uint8Array {
	const bin = atob(input.replace(/\s+/g, ''));
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
	return out;
}
