# サブエージェント進捗の費用主張を、課金せずに再確認する

この手順は、[README.md](README.md) の判定を自分で取り直すためのものである。モデル API は呼ばない。ログインもしない。99% の前後比較は、この手順の中では測らない。

## リリースノートに語句があるかを見る

リポジトリのこのディレクトリで、次を実行する。

```bash
python3 check_sources.py --self-test
python3 check_sources.py
```

1つ目は、語句が無い文を未確認と読み、語句がある文を実測と呼ばないことを確認する。期待する最後の行は `自己テスト: 通過` である。

2つ目は、公開の `CHANGELOG.md` を取得し、`99%`、`short notes`、`Haiku 5.5 writes` を探す。2026-11-07 の実行では3つとも「無い」だった。`## 2.1.316` は「ある」だった。npm が `2.1.316` を返し、`claude` が PATH に無いと `claude_cli: なし` と出る。

すでに保存した changelog があるときは、次で同じ判定だけを取り直せる。

```bash
python3 check_sources.py --changelog-file /path/to/CHANGELOG.md --skip-npm --skip-local
```

スクリプトは、語句が無いときの判定文に「否定ではない」と出す。その文を、主張が誤りだという結論に読み替えない。

出力にトークン、鍵、アカウント ID が出たら、その実行を共有する前に消す。`claude auth status` からは `loggedIn` と `authMethod` だけを出す。それ以外の JSON は出さない。

## 投稿とドキュメントを読み比べる

1. [投稿](https://x.com/ClaudeDevs/status/2118063143167693011) の1件目と、同じスレッドの2件目を開く。README の引用と、同じ文があるかを見る。
2. [Anthropic の 2026-04-23 の記事](https://www.anthropic.com/research/april-23-postmortem) に、@ClaudeDevs を作ったと書いてあるかを見る。ハンドルの見た目だけでは公式と扱わない。
3. [changelog](https://code.claude.com/docs/en/changelog) の 2.1.316 の節を開き、進捗表示の費用、Haiku 5.5、短いメモの語が無いかを見る。
4. [status line](https://code.claude.com/docs/en/statusline) の `label` と、[agent view](https://code.claude.com/docs/en/agent-view) の行要約を読む。agent view は Haiku-class と 15 秒を書く。サブエージェントの行ではない、とも書く。こちらのページを、99% の根拠にしない。

## 費用を測れる条件

次の3つが揃うまで、99% は実測と呼ばない。

- 進捗更新のリクエストが、サブエージェント本体の作業と分かれて見えている。
- 変更前と変更後を、同じ作業、同じ長さの会話、同じ観測で比べられる。投稿が言う旧挙動は、会話全体の再読である。新しい挙動は、短いメモから Haiku 5.5 が書く、である。片方しか取れない比較は、99% の前後比較にならない。
- 数えたものが進捗更新だと分かる。製品ドキュメントは、そのリクエストの見分け方を書いていない。見えないリクエストを、進捗更新だと決めない。

この VM には CLI、認証、旧版、その分離の観測が無かった。だから費用は測っていない。

自分の契約で測るときは、利用明細か、すでに使っている観測で、上の3つを満たす行だけを数える。新しい API キーをこの手順のためには作らない。トークンを仮定して 99 を計算した表は、実測の欄に入れない。
