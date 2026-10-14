# Claude Code の advisor 構成

このディレクトリは、Sonnet が作業し、Haiku の Explore が調べ、Opus は advisor として必要なときだけ読む、という Claude Code の構成例です。ログイン済みの人が、このディレクトリをカレントにして `claude` を起動すると、下の設定を読みます。

## 結論

設定ファイルは置いた。この VM では案件を実行できなかった。

Claude Code CLI `2.1.296` を入れた。`claude auth status` は `loggedIn` が false、`authMethod` が `none` だった。その状態で下のプロンプトを実行すると、標準出力は次の 1 行で、終了コードは 1 だった。

```text
Not logged in · Please run /login
```

ログインが無いので、Explore の検索も advisor の呼び出しも、この環境では起きていない。料金の実測も無い。

## 元のポスト

[元のポスト](https://x.com/rvaniaaaa/status/2109959192891044030) の本文は読めた。x.com のページは 403 だった。X API の残高は $0.00 だったので、有料の投稿取得は使っていない。公開ミラー `api.fxtwitter.com` が同じ status ID の JSON を返し、その `text` を読んだ。

ポストの起動は `claude`、モデル `sonnet`、advisor `opus` である。役割は次のとおり。

- Sonnet がセッションを進めてコードを編集する。
- Haiku 5.5 の Explore がリポジトリとドキュメントを読む。読み取り専用。
- Opus は advisor として待ち、呼ばれたときセッション全体とツール呼び出しを読む。

ポストが示す 3 つの呼び出しは、計画を確定する前、同じエラーがもう一度出たとき、完了と言う前である。

ポストに含まれる設定用プロンプトは、次の 3 点をファイルにするよう求めている。

1. メインモデルを Sonnet、advisor を Opus にし、`advisorModel` を settings に保存する。
2. 読み取り専用のサブエージェントを、名前ちょうど `Explore`、モデル `claude-haiku-5-5` で 1 つ作り、組み込みの Explore を置き換える。
3. `CLAUDE.md` に 1 行書き、計画を確定する前、同じエラーが 2 回出たあと、作業完了の前に advisor を聞き、それより頻繁には聞かない。

同じ JSON には引用記事 [How to Stop Overpaying for Opus 5.5 in Claude Code](https://x.com/i/article/2109347233866944512) の本文も入っていた。`Explore.md` の frontmatter はその記事のコードブロックに合わせ、各フィールドが公式ドキュメントにあることを確認してから置いた。記事の残りの手順（effort の全体設定、フック、`cost.py`、Jev）はこの tryout に入れていない。

## 置いたファイル

`tryouts/claude-code-advisor/.claude/settings.json` は `model` を `sonnet`、`advisorModel` を `opus` にする。どちらも [All settings](https://code.claude.com/docs/en/settings-reference) のキーである。

`tryouts/claude-code-advisor/.claude/agents/Explore.md` の `name` は `Explore`、`tools` は `Read, Grep, Glob`、`model` は `claude-haiku-5-5`、`effort` は `low` である。`name`、`description`、`tools`、`model`、`effort` は [Create custom subagents](https://code.claude.com/docs/en/sub-agents) の frontmatter にある。

`tryouts/claude-code-advisor/CLAUDE.md` は 1 行である。プロジェクトの `CLAUDE.md` は [How Claude remembers your project](https://code.claude.com/docs/en/memory) が読むファイルである。

`sample/greet.py` は、ログイン後に Explore へ探させるための小さな関数だけを置く。この VM の実行はログインエラーで止まり、このファイルは読まれていない。

Opus 用のサブエージェントファイルは置いていない。ポストも [advisor のドキュメント](https://code.claude.com/docs/en/advisor) も、Opus を `advisorModel` と `--advisor` と `/advisor` で指定する。

## 使い方

1. このディレクトリをカレントにする。共有の `.claude/settings.json` は、セッションの primary working directory から読まれる。リポジトリのルートで起動すると、この tryout の settings は読まれない。
2. `claude` を起動する。1 回だけなら `claude --model sonnet --advisor opus` でも同じ指定になる。`--model` と `--advisor` はそのセッションだけで、保存した settings より先に効く。
3. 計画を確定する前、同じエラーが 2 回出たあと、完了の前に、advisor へ聞く。`CLAUDE.md` がその 3 つ以外では聞かないよう書いている。
4. 検索は Explore に任せる。名前が `Explore` のプロジェクトサブエージェントは、組み込みの Explore を置き換える。
5. 終わったら `/usage` を見る。この tryout では未ログインのため `/usage` は取れていない。

ログイン後に試すプロンプトの例は次である。この VM では同じ文がログインエラーで止まった。

```text
Find the function greet. Use the Explore subagent. Do not edit files.
```

## Opus を呼ぶ条件

`CLAUDE.md` の 1 行は、計画を確定する前、同じエラーが 2 回出たあと、作業完了の前に advisor を聞き、それ以上は聞かない、という指示である。

[advisor のドキュメント](https://code.claude.com/docs/en/advisor) は、呼び出すタイミングを Claude が決めると書いている。回数を固定する設定は無い。指示で増減する。トランスクリプトには `Advising` と出る。

## 料金について分かったこと

この VM ではセッションを走らせていない。下の金額は、2026-10-14 に取得した [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) の API 定価と、その定価の割り算である。この VM の請求額は無い。

100 万トークンあたりの定価は次のとおり。

| モデル | 入力 | 出力 | 5 分キャッシュ書き込み | キャッシュヒット |
| --- | --- | --- | --- | --- |
| Opus 5.5 | $4 | $20 | $5 | $0.20 |
| Sonnet 5.5 | $2 | $10 | $2.50 | $0.10 |
| Haiku 5.5（プロンプト 10 万トークンまで） | $0.10 | $0.50 | $0.125 | $0.01 |
| Haiku 5.5（プロンプト 10 万トークン超） | $0.50 | $2.50 | $0.625 | $0.05 |

定価の割り算では、Sonnet 5.5 は Opus 5.5 の半額である。入力、出力、5 分キャッシュ書き込み、キャッシュヒットの 4 つとも 2 分の 1 になる。プロンプトが 10 万トークン以下の Haiku 5.5 は、入力も出力も Opus 5.5 の 40 分の 1 である（$4 / $0.10 = 40、$20 / $0.50 = 40）。10 万トークンを超えると入力は $0.50 になり、Opus 5.5 の入力との比は 8 倍になる（$4 / $0.50 = 8）。

安くなりそうな理由は、公式ドキュメントの仕組みから来る。

- [Manage costs effectively](https://code.claude.com/docs/en/costs) は、普段のコーディングは Sonnet で足り、Opus は複雑な設計判断や複数段の推論に残す、と書いている。簡単なサブエージェントには `model: haiku` を指定する、とも書いている。
- 組み込みの Explore は、名前 `Explore` のサブエージェントが無いとメインモデルを継承する。メインが Sonnet や Opus のとき、検索までその単価になる。この構成は検索を `claude-haiku-5-5` に固定する。
- [advisor のドキュメント](https://code.claude.com/docs/en/advisor) は、advisor を毎ターンではなく判断の時点で呼ぶので、速いメインモデルと強い advisor の組は、強いモデルを通しで使うより通常は安い、と書いている。同じページは、各呼び出しが会話全体を advisor の単価で読み、その読みはキャッシュされない、とも書いている。呼び出しが多いと差は消える。

ポストは、20 万トークンのセッションで advisor の入力が約 $0.80、通常リクエストが $0.04、と書いている。定価に当てはめると、200,000 / 1,000,000 * $4 = $0.80 は Opus 5.5 の新規入力である。200,000 / 1,000,000 * $0.20 = $0.04 は Opus 5.5 のキャッシュヒットである。この対応は割り算である。この VM でそのリクエストは観測していない。

## 注意点

- advisor は実験的機能で、Anthropic API が要る。Amazon Bedrock、Claude Platform on AWS、Google Cloud の Agent Platform、Microsoft Foundry では使えない。
- `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1` は `advisorModel` を無視する。`DISABLE_TELEMETRY` があると、advisor が依存する feature flag を取得せず、advisor はオフのままになる。この VM では両方とも未設定だった。`claude auth status` の `analyticsDisabled` は false だった。
- advisor のオンとオフはメインモデルの prompt cache を壊さない。モデルの切り替えはキャッシュを作り直す。advisor 自身の読みは呼び出しのたびにキャッシュされない。
- サブエージェントの名前が `Explore` でないと、組み込みの Explore は置き換わらない。ファイル名は一致しなくてよい。効くのは frontmatter の `name` である。
- `haiku` という別名は、Anthropic API では Claude Code v2.1.293 以降に Haiku 5.5 を指す。それ以外では Haiku 4.5 である。このファイルは別名を避け、`claude-haiku-5-5` を書いている。`sonnet` は v2.1.284 以降の Anthropic API で Sonnet 5.5、`opus` は v2.1.280 以降で Opus 5.5 を指す。この VM の CLI は `2.1.296` だった。
- advisor はメインモデル以上の能力が要る。Sonnet 5.5 は Opus 5 以降を advisor にできる。Haiku 4.5 は advisor になれない。
- サブエージェントは設定された advisor を継承し、自分のモデルとの組を同じ基準で検査する。Haiku の Explore も Opus を呼ぶことがある。
- 組み込みの Explore は `CLAUDE.md` を読まない。名前 `Explore` のカスタムサブエージェントは、`omitClaudeMd: true` を書かない限り `CLAUDE.md` を読む。このファイルにはそのフィールドを書いていない。ポストの指定にも無い。
- `effort: low` は引用記事の `Explore.md` にある。ポストの短いプロンプトには無い。使えるレベルはモデルによる、と frontmatter の説明にある。
- settings の優先順位は、managed、コマンドラインの `--settings`、`.claude/settings.local.json`、共有の `.claude/settings.json`、`~/.claude/settings.json` の順で、上が勝つ。`/advisor` はユーザー settings に保存する。このディレクトリで起動すれば、共有ファイルの `advisorModel` がユーザー settings より先に効く。
- カスタム Explore は `Read`、`Grep`、`Glob` だけを持つ。編集ツールは一覧に無い。
- 鍵、トークン、パスワードはこのディレクトリに無い。

## この VM で確認したこと

- `claude plugin validate .claude/agents` は `Validation passed`、終了コード 0。確認できたのは frontmatter の解析までである。
- `model`、`advisorModel`、`name: Explore`、`model: claude-haiku-5-5`、ツール一覧に `Write`、`Edit`、`Bash` が無いこと、`CLAUDE.md` が 1 行であることを、ローカルの検査で確認した。
- `claude -p --model sonnet --advisor opus` に上の検索プロンプトを渡すと、終了コード 1、標準出力は `Not logged in · Please run /login` だった。

## 出典

- 元のポストは [https://x.com/rvaniaaaa/status/2109959192891044030](https://x.com/rvaniaaaa/status/2109959192891044030)。
- 引用記事は [https://x.com/i/article/2109347233866944512](https://x.com/i/article/2109347233866944512)。
- advisor は [https://code.claude.com/docs/en/advisor](https://code.claude.com/docs/en/advisor)。
- サブエージェントは [https://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)。
- モデルと別名は [https://code.claude.com/docs/en/model-config](https://code.claude.com/docs/en/model-config)。
- settings は [https://code.claude.com/docs/en/settings](https://code.claude.com/docs/en/settings) と [https://code.claude.com/docs/en/settings-reference](https://code.claude.com/docs/en/settings-reference)。
- `CLAUDE.md` は [https://code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory)。
- コストの考え方は [https://code.claude.com/docs/en/costs](https://code.claude.com/docs/en/costs)。
- 定価は [https://platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing)。
