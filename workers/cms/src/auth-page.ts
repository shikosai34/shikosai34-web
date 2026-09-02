/**
 * Decap CMS の GitHub backend が開く OAuth ポップアップに返す HTML。
 *
 * 実際の GitHub OAuth はせず、`window.opener` へ疑似トークンを postMessage して
 * 即座にログイン成立とする。認証は前段の Cloudflare Access が担う。
 * Decap 側はこのトークンを `api_root` への `Authorization: token ...` に載せるが、
 * プロキシ（proxy.ts）はそれを無視して installation token を使う。
 */
export function authPage(token: string): string {
	const payload = JSON.stringify({ token, provider: 'github' });
	return `<!doctype html>
<html>
	<head><meta charset="utf-8" /><title>認証</title></head>
	<body>
		<script>
			(function () {
				var message = 'authorization:github:success:' + ${JSON.stringify(payload)};
				function send(event) {
					if (!window.opener) return;
					window.opener.postMessage(message, event && event.origin ? event.origin : '*');
				}
				window.addEventListener('message', send, false);
				if (window.opener) window.opener.postMessage('authorizing:github', '*');
			})();
		</script>
		<p>認証しました。このウィンドウは閉じてかまいません。</p>
	</body>
</html>`;
}
