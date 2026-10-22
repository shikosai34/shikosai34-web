# Design rules

実装時は、この文書と既存ページの共通コンポーネントに沿って見た目を揃える。詳細な背景・設計経緯は [`docs/design/03-design.md`](docs/design/03-design.md) を参照する。

## Typography

- サイト共通書体は **Kiwi Maru**。`src/layouts/Layout.astro` で読み込み、`src/styles/global.css` の `--font-primary` を通して全ページに適用する。ページ固有の書体指定を追加しない。
- Kiwi Maru は 400 と 500 を読み込んでいる。見出しや操作ラベルは近くの既存コンポーネントに合わせ、必要な箇所だけ `font-medium` にする。ページ固有の太字や文字間隔で強調しない。
- 文字サイズは `src/styles/global.css` の Tailwind トークンを使う。個別の任意サイズを増やす前に、既存の役割に当てはめる。

| 用途 | クラス | サイズ | 例 |
| --- | --- | ---: | --- |
| ページ・日付見出し | `text-xl` | 22px | `SectionHeading`、タイムテーブルの日付 |
| セクション見出し | `text-lg` | 19px | 詳細ページ内の見出し、企画グループ名 |
| 本文・カード名 | `text-base` | 16px | 説明文、カード内の企画名 |
| 補足・操作ラベル | `text-sm` | 15px | ナビゲーション、出演者、補助説明 |
| 注記 | `text-xs` | 13px | 時刻の補助情報、カテゴリタグ |

本文の基本サイズは 16px とする。情報の重要度が下がる箇所に限って 15px または 13px を使う。長文には `leading-relaxed` を付ける。

- 例外: `/staff` の部署カード冒頭（`DepartmentHeading`）の部署名と英語名は、バナー幅を基準にした大きさ（`cqw`）にする。光線（`bg-main`）にまたがるため、文字を 2 枚重ねて光線の外は `text-text`、中は `text-on-main` に出し分ける。詳細は [`docs/design/03-design.md`](docs/design/03-design.md) の 3.7.1 を参照。

## Color and contrast

- 色は `src/styles/global.css` の既存トークンを使う: `base` `#0B3041`、`text` `#E8E8E8`、`main` `#FF9933`、`accent` `#00FFCC`。
- 暗い面の本文は `text-text`、リンクや輪郭の強調は `text-accent` を使い、リンクには下線も付ける。
- `bg-main` の上は `text-on-main`、`bg-accent` の上は `text-on-accent` を組み合わせる。明るい色面に `text-text` を重ねない。
- 状態は色だけで伝えず、選択中のスタイルに加えて `aria-pressed` など意味のある状態も設定する。新しい色を加える場合は通常・hover・focus・選択中でコントラストを確認する。

## Layout and components

- モバイル幅から設計し、画面幅が広がっても情報の順序を変えない。余白は 4px 刻みの既存スケールを基本にする。
- ページ冒頭は `SectionHeading`、一覧は既存の Circle/Event カードやタグの見た目を再利用する。ページごとに別のタイポグラフィや操作部品を作らない。
- 絞り込んでいる情報をカード内で繰り返さない。例: 会場で切り替えたタイムテーブルでは、各演目に会場名を重ねて表示しない。
- 操作部品には hover とキーボード focus の見た目を付ける。タブ・切り替えには適切な HTML 要素とアクセシブルな名前を使う。

## Review before completion

- 375px 前後の幅とデスクトップ幅で確認する。
- 見出し、本文、補足の階層が他のページと揃い、文字が背景や画像に埋もれていないことを確認する。
- 選択中・hover・focus の各状態と、空の状態も確認する。
- 既存のトークンや共通部品で表現できない例外を追加した場合は、この文書と [`docs/design/03-design.md`](docs/design/03-design.md) を合わせて更新する。
