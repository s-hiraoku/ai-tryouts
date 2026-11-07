# サブエージェント進捗の費用主張

## 結論

確認日は 2026-11-07、日本時間 20:55 である。

調べた主張は4つある。Claude Code v2.1.316 以上で、サブエージェントの進捗表示が会話全体の再読から短いメモの生成に変わり、生成モデルは Haiku 5.5 で、更新1回あたり約 99% 安い、というものである。

4つとも、Anthropic の公式記事が作成を書いている X アカウント @ClaudeDevs の 2026-11-04 の投稿に、その文言がある。公式リリースノートと製品ドキュメントには、この4つをまとめた記述が無い。記述が無いことは、主張が誤りだという証明にはならない。

この VM では、進捗更新の費用を本体の作業から分けて測れなかった。99% は投稿の文言であり、このリポジトリの実測値ではない。

## 投稿を公式と見た根拠

アカウント名だけでは公式と扱っていない。Anthropic の 2026-04-23 の記事が、製品判断を説明するために @ClaudeDevs を作ったと書いている。

> We recently created @ClaudeDevs on X to give us the room to explain product decisions and the reasoning behind them in depth.

記事は [An update on recent Claude Code quality reports](https://www.anthropic.com/research/april-23-postmortem)。この記事は 2026-11 の投稿を引用していない。

投稿本文は公開ページで読んだ。1件目は fxtwitter の JSON と本文が一致した。2件目は jina の取得と nitter の取得で、同じ文だった。X の API は `client-not-enrolled` で読めなかった。投稿に付いた動画は文字に起こしていない。動画だけにある数字は、この文書の判定に入れていない。

## 投稿の文言

1件目の時刻は 2026-11-04 19:29 UTC で、日本時間では 2026-11-05 04:29 である。URL は [https://x.com/ClaudeDevs/status/2118063143167693011](https://x.com/ClaudeDevs/status/2118063143167693011)。

> A running subagent updates its status line every 30 seconds, and each update used to re-read its whole conversation. Now Haiku 5.5 writes it from short notes instead, so each update costs about 99% less.

2件目は同じスレッドの続きである。

> The subagent itself keeps its own model. Sessions with background subagents used about 5% less of the limit, so the same limit gets you about 6% more prompts. It's live for most Pro, Max and Ultra users and for everyone on Team and Enterprise. Update to v2.1.316+.

5% と 6% は、今回の4主張の外である。投稿は両方を1文で書いており、標本も計算式も書いていない。算出は未確認。

## 4主張の判定

判定の言葉は3つだけ使う。確認済みは、そのソースにその文言があったことを指す。未確認は、そのソースでは確かめられなかったことを指す。否定は、公式のソースがその主張と反対のことを書いていたことを指す。今回、否定にした主張は無い。

### 1. 対象の版は v2.1.316 以上

投稿の2件目が `Update to v2.1.316+` と書く。投稿の文言としては確認済み。

公式ドキュメントの changelog に 2.1.316 の節があり、日付は 2026-10-31 である。GitHub の `CHANGELOG.md` にも `## 2.1.316` がある。どちらの 2.1.316 の節にも、進捗表示の費用変更は無い。変更がその版に入ったことは、リリースノートでは未確認。

npm の `@anthropic-ai/claude-code@2.1.316` はバージョン `2.1.316` を返した。同じ日の latest は `2.1.319` だった。パッケージの存在は、費用変更の同梱を証明しない。

投稿は、Pro、Max、Ultra では most、Team と Enterprise では everyone と書く。版を上げるだけで全員に届くとは、投稿自身が書いていない。API キー、Bedrock、Vertex、Foundry については、この2件の投稿が書いていない。未確認。

### 2. 会話全体の再読から、短いメモの生成へ変わった

投稿の1件目が `re-read its whole conversation` と `short notes` と書く。投稿の文言としては確認済み。

リリースノートに、この対比は無い。未確認。

製品ドキュメントの status line は、サブエージェント行の `label` を次のように書く。

> Short progress summary of the task when Claude Code has one, otherwise the same text as `description`

短い要約がある、とは書いてある。会話全体を読んでいた過去と、短いメモへ変えたことは書いていない。生成方法は未確認。

### 3. 生成モデルは Haiku 5.5

投稿の1件目が `Haiku 5.5` と書く。投稿の文言としては確認済み。モデル ID は、その文には無い。

リリースノートの 2.1.293 は、Claude Haiku 5.5 を `claude-haiku-5-5` として追加したと書く。進捗表示の生成モデルだとは書いていない。未確認。

[Manage multiple agents with agent view](https://code.claude.com/docs/en/agent-view) は、行の要約を Haiku-class のモデルが書くと書く。同じページは、セッションが起動したサブエージェントは別の行に出ないと書く。作業中の行テキストは、最大でも 15 秒に1回、モデルへ送らずに直近の出力から更新する、とも書く。投稿の間隔は 30 秒である。99% は、そのページに無い。このページは主張3の根拠にしない。

### 4. 更新1回あたり約 99% 安い

投稿の1件目が `about 99% less` と書く。投稿の文言としては確認済み。

投稿は、比較の前後のトークン数、モデル、料金、標本を書いていない。文の上では、以前の会話全体の再読と比べている。それより細かい定義は未確認。

2026-11-07 20:55 JST に取得した GitHub の `CHANGELOG.md` 全体に、文字列 `99%` は無かった。リリースノートでは未確認。

この VM では測っていない。実測値ではない。

## 利用者設定

投稿は、有効にするための設定名を書いていない。書くのは版と、プランごとの提供範囲である。

`subagentStatusLine` は、サブエージェント行の表示を自分のコマンドへ差し替える設定である。出典は [Customize your status line](https://code.claude.com/docs/en/statusline)。費用変更のスイッチだとは書いていない。

`CLAUDE_CODE_SUBAGENT_MODEL` は、サブエージェント本体のモデルを選ぶ変数である。出典は [Create custom subagents](https://code.claude.com/docs/en/sub-agents)。投稿の2件目は、本体のモデルは維持すると書く。読んだ公式ページは、この変数を進捗表示の費用変更の条件だとは書いていない。

費用変更に設定が必要だという公式の文は見つからなかった。設定が不要だという証明にもならない。判定は未確認。

## 近くにある別の公式記述

次の項目は、今回の4主張ではない。同じ語が出るので、分けて読む。

- 2.1.128 は、サブエージェントの progress summary がプロンプトキャッシュに乗らない不具合を直し、`cache_creation` を約3倍減らしたと書く。99% ではない。
- 2.1.128 は、transcript が止まっているあいだ summary が繰り返されるのを抑え、待機中のトークン費用に上限を付けたと書く。
- 2.1.274 は、progress summary が複数段落の返答に置き換わる不具合を直したと書く。
- 2.1.318 は、Bedrock、Vertex、Foundry、または telemetry がオフのとき、冷えたプロンプトキャッシュでは progress summary がサブエージェントの応答を最大5分待てると書く。
- 2.1.318 は、バックグラウンドのサブエージェント実行中に "Now using usage credits" の通知が約30秒ごとに出る不具合を直したと書く。投稿の30秒は、status line の更新間隔として書いてある。

## この VM で測れたこと

測れたのは、公開レジストリ、公開リリースノート、ローカルに CLI と認証用の環境変数が無いかどうかである。

測れなかったのは、進捗更新1回の費用である。理由は次のとおり。

- `claude` が PATH に無い。
- 名前に `ANTHROPIC` または `CLAUDE` を含む環境変数は 0 件だった。値は出していない。
- ログインも、モデル API の呼び出しもしていない。新しい課金は作っていない。
- 99% を測るには、進捗更新の費用が本体の作業と分かれていることと、変更前と変更後を同じ条件で比べられることが要る。旧版、認証、その分離の観測が、この VM には無い。
- トークン数を仮定した計算は実測と呼ばない。このリポジトリには置いていない。

再確認の手順は [recheck.md](recheck.md)。

## 実行した確認

`check_sources.py --self-test` は `自己テスト: 通過` だった。

公開の changelog をファイルとして渡した実行は、次の出力だった。

```text
確認時刻: 2026-11-07 20:55 JST
changelog_source: /tmp/claude-changelog.md
heading_2.1.316: ある
phrase 99%: 無い
phrase short notes: 無い
phrase Haiku 5.5 writes: 無い
判定: リリースノート上は未確認。語句が無いことは否定ではない。
npm @anthropic-ai/claude-code@2.1.316: 2.1.316
npm @anthropic-ai/claude-code: 2.1.319
claude_cli: なし
環境変数名の一致 ANTHROPIC または CLAUDE: 0 件。値は出していない。
費用の実測: していない。モデル API は呼んでいない。
```

同じ時刻に、スクリプトへ URL を取らせた実行も、3つの語句を「無い」と判定した。その実行は npm とローカル確認を省いた。

## 出典

確認時刻は、特記の無いものも 2026-11-07 20:55 JST の前後である。

- 投稿は [https://x.com/ClaudeDevs/status/2118063143167693011](https://x.com/ClaudeDevs/status/2118063143167693011)。
- アカウントの作成を書く公式記事は [https://www.anthropic.com/research/april-23-postmortem](https://www.anthropic.com/research/april-23-postmortem)。
- リリースノートのドキュメントは [https://code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog)。2.1.316 の日付は 2026-10-31。
- GitHub の changelog は [https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)。取得に使った raw は [https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)。
- status line は [https://code.claude.com/docs/en/statusline](https://code.claude.com/docs/en/statusline)。
- サブエージェントは [https://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)。
- agent view は [https://code.claude.com/docs/en/agent-view](https://code.claude.com/docs/en/agent-view)。
