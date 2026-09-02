/**
 * Decap CMS カスタムウィジェット `image-r2`。
 *
 * 画像を CMS Backend Worker（/cms/media）へ送り、Worker 側でリサイズ + WebP 変換して
 * R2 に保存する。フィールドには返ってきた公開 URL の文字列だけを保存する。
 * 標準の Media Library（リポジトリへのコミット）は経由しない（Issue #17）。
 *
 * ビルド不要。Decap がグローバルに公開する h / createClass を使う。
 */
(function () {
	var h = window.h;
	var createClass = window.createClass;
	if (!window.CMS || !h || !createClass) return;

	var UPLOAD_URL = '/cms/media';

	var Control = createClass({
		getInitialState: function () {
			return { uploading: false, error: null };
		},

		upload: function (fileList) {
			var self = this;
			var file = fileList && fileList[0];
			if (!file) return;

			self.setState({ uploading: true, error: null });
			var body = new FormData();
			body.append('file', file);

			fetch(UPLOAD_URL, { method: 'POST', body: body, credentials: 'include' })
				.then(function (res) {
					return res.json().then(function (data) {
						if (!res.ok) {
							throw new Error(data && data.error ? data.error : 'アップロードに失敗しました');
						}
						return data;
					});
				})
				.then(function (data) {
					self.props.onChange(data.url);
					self.setState({ uploading: false, error: null });
				})
				.catch(function (err) {
					self.setState({ uploading: false, error: err.message });
				});
		},

		onInputChange: function (e) {
			this.upload(e.target.files);
		},
		onDrop: function (e) {
			e.preventDefault();
			this.upload(e.dataTransfer.files);
		},
		onDragOver: function (e) {
			e.preventDefault();
		},
		clear: function () {
			this.props.onChange('');
			this.setState({ error: null });
		},

		render: function () {
			var value = this.props.value;
			var state = this.state;

			var zoneStyle = {
				border: '2px dashed #c4c4c4',
				borderRadius: '8px',
				padding: '16px',
				textAlign: 'center',
			};

			var content;
			if (value) {
				content = h('div', {}, [
					h('img', {
						key: 'img',
						src: value,
						style: { maxWidth: '100%', maxHeight: '220px', borderRadius: '4px' },
					}),
					h(
						'div',
						{
							key: 'url',
							style: {
								marginTop: '8px',
								fontSize: '12px',
								color: '#555',
								wordBreak: 'break-all',
							},
						},
						value,
					),
					h(
						'button',
						{ key: 'btn', type: 'button', onClick: this.clear, style: { marginTop: '8px' } },
						'画像を外す',
					),
				]);
			} else {
				content = h('div', {}, [
					h(
						'p',
						{ key: 'label', style: { margin: '4px 0', color: '#555' } },
						'ここに画像をドラッグ、またはファイルを選択',
					),
					h('input', {
						key: 'input',
						type: 'file',
						accept: 'image/*',
						disabled: state.uploading,
						onChange: this.onInputChange,
					}),
				]);
			}

			return h('div', { style: zoneStyle, onDrop: this.onDrop, onDragOver: this.onDragOver }, [
				h('div', { key: 'content' }, content),
				state.uploading
					? h(
							'p',
							{ key: 'status', style: { color: '#555' } },
							'アップロード中…（自動でリサイズ・WebP 変換されます）',
						)
					: null,
				state.error ? h('p', { key: 'err', style: { color: '#d33' } }, state.error) : null,
			]);
		},
	});

	var Preview = createClass({
		render: function () {
			var value = this.props.value;
			return value ? h('img', { src: value, style: { maxWidth: '100%' } }) : null;
		},
	});

	window.CMS.registerWidget('image-r2', Control, Preview);
})();
