/**
 * 来場者アンケート（`/survey`）の Google フォーム。
 *
 * 埋め込み用 URL は、フォームの［送信］→［<> 埋め込み］で表示される iframe の src
 * （`https://docs.google.com/forms/d/e/<フォームID>/viewform?embedded=true`）を貼る。
 * 空文字のあいだは、ページに「準備中」を表示する。
 */
export const SURVEY_FORM_EMBED_URL = '';

/** 埋め込みを開けない環境向けに、新しいタブで開くためのリンク（`?embedded=true` を外した URL）。 */
export function getSurveyFormUrl(embedUrl: string = SURVEY_FORM_EMBED_URL): string {
	if (!embedUrl) return '';
	const url = new URL(embedUrl);
	url.searchParams.delete('embedded');
	return url.toString();
}
