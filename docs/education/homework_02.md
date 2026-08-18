# 夏季休業 1年生むけ講習ロードマップ

## 1. 概要

前回開発したHTML/CSS/JavaScriptを用いたポートフォリオをベースに、Git/GitHubによる変更管理と共同開発の流れを学び、Astroを使ったサイトへ作り直す。
ロードマップは以下の通りである。

1. 作業内容をIssueで定める
2. 作業用ブランチを作成する
3. 小さな単位で変更・コミットする
4. GitHubへpushする
5. Pull Requestを作成し、レビューを受ける
6. mainブランチへマージする
7. Astroで再構築したサイトをビルド・公開する

## 2. 目的

- Gitでファイルの変更履歴を安全に管理できるようになる
- Git/GitHubの違い、およびローカルとリモートの関係を理解する
- ブランチ・Pull Request・コードレビューを用いた開発を経験する
- Astroへの移行を経験する
- ページ、コンポーネント、レイアウトに分割してサイトを整理できるようになる

## 3. 期限

この講習の締切は09月14日（月）とする。最終的な成果物として前回のポートフォリオをAstroへ移行したWebサイトを公開することを定める。

## 4. 事前準備

以下をあらかじめ用意する。GitとNode.jsは、インストール後に動作確認まで済ませておくこと。

| 項目 | 入手先 | 補足 |
|------|--------|------|
| 前回制作した自己ポートフォリオのファイル | - | HTML / CSS / JavaScript一式 |
| GitHubアカウント | [GitHub](https://github.com/) | - |
| Git | [Git公式：Downloads](https://git-scm.com/downloads) | - |
| Node.js | [Node.js公式：ダウンロード](https://nodejs.org/ja/download) | `v22.12.0`以上の偶数バージョン |
| Visual Studio Code | [VS Code公式](https://code.visualstudio.com/) | - |
| VS CodeのAstro公式拡張機能 | VS Codeの拡張機能タブで`Astro`を検索 | - |

Node.jsは`v23`のような奇数バージョンだとAstroのサポート対象外となるため、偶数バージョンを選ぶこと。

インストールが済んだら、ターミナルで以下を実行し、それぞれバージョンが表示されることを確認する。

```bash
git --version
node -v
npm -v
```

## 5. ToDo

### ターミナルの基本

- [ ] ターミナルを起動する（VS Codeの統合ターミナルでもよい）
- [ ] pwd、ls、cd、mkdirでディレクトリの確認・移動・作成を操作する
- [ ] 作業用ディレクトリを作り、そこへcdで移動する

### Gitの基本

- [ ] GitとGitHubの違いを確認する
- [ ] リポジトリ、作業ツリー、ステージング、コミットの関係を確認する
- [ ] 練習用ディレクトリでgit initする
- [ ] status、add、diff、commit、logを操作する
- [ ] 意味の異なるコミットを3つ作る
- [ ] restoreを使って練習用ファイルの変更を元に戻す
- [ ] .gitignoreの役割を確認する

### GitHub / 共同開発に関わる技術

- [ ] 個人のGitHubリポジトリを作成する
- [ ] ローカルリポジトリとリモートリポジトリを接続する
- [ ] clone、push、pullを操作する
- [ ] Issueを作成して、これから行う作業を記載する
- [ ] Issueに対応する作業ブランチを作成する
- [ ] 作業ブランチからPull Requestを作成する
- [ ] 他の受講者または先輩からレビューを受ける
- [ ] レビューを反映してmainブランチへマージする
- [ ] 練習用ファイルで基本的なコンフリクト解消を経験する

### Astroの導入

- [ ] Astro公式チュートリアルのユニット0〜1を進める
- [ ] Astroプロジェクトを作成する
- [ ] 開発サーバーを起動する
- [ ] Astroプロジェクトを個人のGitHubリポジトリへpushする
- [ ] 任意のサービスへ仮デプロイする

### ページとスタイル

前回のポートフォリオは、今回作成したAstroプロジェクトへ手作業でコピーして移植する。
前回のリポジトリにAstroを追加するのではなく、今回のリポジトリを新規に用意し、そこへ内容を移していく形とする。
HTMLは`.astro`ファイルへ、CSSはそのまま、もしくはコンポーネント単位に分けて持ち込む。

- [ ] Astro公式チュートリアルのユニット2を進める
- [ ] .astroファイルの基本構造を確認する
- [ ] ファイルベースルーティングを確認する
- [ ] 前回のHTMLとCSSをAstroへ移植する
- [ ] トップ、自己紹介、制作物など3ページ以上を作成する

### コンポーネント

- [ ] Astro公式チュートリアルのユニット3を進める
- [ ] ヘッダー、ナビゲーション、フッターなどをコンポーネントに分割する
- [ ] 再利用可能なコンポーネントを3個以上作成する
- [ ] Propsを使ってデータを渡す

### レイアウト / データ

- [ ] Astro公式チュートリアルのユニット4〜5を進める
- [ ] 共通レイアウトを1個以上作成する
- [ ] 制作物または記事をデータから一覧表示する
- [ ] 一覧ページや動的ルートの考え方を確認する

### `Astro`アイランド

- [ ] Astro公式チュートリアルのユニット6を進める
- [ ] 必要な部分だけにJavaScriptを追加する考え方を確認する
- [ ] 前回のJavaScript機能を1つ以上移植する
- [ ] レスポンシブ表示と基本的なアクセシビリティを確認する
- [ ] npm run buildを成功させる

### 確認事項

- [ ] 最終確認用のPull Requestを作成する
- [ ] 相互レビューを受け、必要な修正を行う
- [ ] mainブランチへマージする
- [ ] 任意のサービスへ最終版をデプロイする
- [ ] READMEを完成させる
- [ ] リポジトリ、Pull Request、公開URLを提出する
- [ ] 成果物とコードを自分の言葉で説明できるようにする

## 6. 制約

- [ ] AIの使用は可とする
- [ ] AIが生成したコードは、その役割を説明できる状態で使用する
- [ ] AIの回答を丸ごと貼る前に、差分を確認し、小さな単位で反映する
- [ ] AIを使用した箇所の記録はPull Requestの説明欄だけでよい
- [ ] 他人のポートフォリオやコードを無断でコピーしない
- [ ] パスワード、APIキー、秘密鍵、個人情報をGitHubへpushしない
- [ ] node_modules/、.envなどを.gitignoreで除外する
- [ ] mainブランチへの直接pushは禁止し、Pull Requestを経由する
- [ ] レビューでは人格ではなくコードと成果物を対象にコメントする

## 参考資料

- [【図解解説】これ1本でGitをマスターできるチュートリアル！【完全版】](https://qiita.com/Sicut_study/items/0318cc136c189b179b7f)
- [Astro公式：ブログ作成チュートリアル](https://docs.astro.build/ja/tutorial/0-introduction/)
- [Astro公式：インストールとセットアップ](https://docs.astro.build/ja/install-and-setup/)
- [Astro公式：GitHub Pagesへのデプロイ](https://docs.astro.build/ja/guides/deploy/github/)
- [GitHub Docs：GitHub flow](https://docs.github.com/ja/get-started/using-github/github-flow)
- [GitHub Docs：SSH鍵の生成とssh-agentへの追加](https://docs.github.com/ja/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
