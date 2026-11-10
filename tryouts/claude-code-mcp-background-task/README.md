# Claude Code 2.1.319 の MCP task

ポストは、Claude Code 2.1.319 が重い MCP 呼び出しを裏に回し、終わったら結果を知らせる、と紹介している。一次ソースが書いている対象は、それより狭い。サーバが MCP tasks 拡張で task として受けた呼び出しを、端末セッションがすぐ裏に回す、という機能である。ただ遅い `tools/call` が数十秒で裏に回る、とは書いていない。

このディレクトリのサーバは、その task の形を話す。この VM ではそのプロトコルを `node check.mjs` で測った。Claude Code 自体は入っておらず、裏回しと完了通知は未実測である。

## 結論

文書のうえでは、条件を満たす端末セッションなら使える。条件は下の「呼び出しが task になる条件」にある。この VM では Claude Code を起動していないので、動くことを実測してはいない。

数十秒だけ寝る普通の MCP ツールでは、2.1.319 の「すぐ裏に回す」側には乗らない。そのツールが裏に回るのは、2.1.212 の別機能で、既定では 2 分である。

## ポストの主張

対象は [このポスト](https://x.com/nondemo_LowT/status/2119795236650283434) である。X の API はこの環境では `client-not-enrolled` で読めなかった。公開ページの本文は次のとおりだった。ページ上の時刻は 2026-11-09 14:12 UTC である。

> Claude Code 2.1.319、 11月6日の更新で、MCPの重い呼び出しを裏に回して、終わったら結果を教えてくれるようになった 待たされてた時間がそのまま作業に使えるかも 許可待ちで止まらない設定も一緒。放置して回す人には助かる

| 主張 | 状態 | 根拠 |
| --- | --- | --- |
| 2.1.319 は 11 月 6 日の更新である | 文書にある | [公式 changelog](https://code.claude.com/docs/en/changelog) の 2.1.319 は November 6, 2026。[GitHub release v2.1.319](https://github.com/anthropics/claude-code/releases/tag/v2.1.319) の Published は 2026-11-06T17:04:01Z |
| 重い MCP 呼び出しを裏に回す | 文書では条件付き。未実測 | 2.1.319 の文は「MCP server が tool call を task として走らせたとき、すぐ裏に回す」。遅い呼び出し全般ではない |
| 終わったら結果を知らせる | 文書にある。未実測 | MCP ガイドは、transcript に `MCP task <id> (<server>/<tool>) completed.` と出て、結果は Claude に渡り、transcript には入らない、と書く。Claude が待ち状態なら、頼まなくても Claude が結果を扱い始める、とも書く |
| 待っていた時間を別の作業に使える | 文書からの推論。未実測 | ガイドは、task を受けた時点で tool call が返り、待たせない限り Claude は作業を続ける、と書く。ポストの「かも」は、その推論と同じ範囲 |
| 許可待ちで止まらない設定も一緒に入った | 文書にある。別機能。未実測 | 同じ 2.1.319 の `permissions.denyInsteadOfPrompting`。MCP を裏に回すスイッチではない |
| 放置して回す人に役立つ | 判断。未実測 | 許可を拒否してターンを続ける設定は、無人の端末セッション向けにガイドが説明している。ワークスペースの信頼ダイアログと、プロジェクト MCP の承認は残る、とも書く |

## 一次ソースが分けている二つの動き

### すぐ裏に回す MCP task

[公式 changelog の 2.1.319](https://code.claude.com/docs/en/changelog) と、タグ `v2.1.319` の [CHANGELOG.md](https://github.com/anthropics/claude-code/blob/v2.1.319/CHANGELOG.md) は同じ二文を載せている。

- MCP server が tool call を task として走らせると、Claude Code はすぐ裏に回し、終わったら Claude に結果を渡す。
- `CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND` を置くと、tool call の中でその task を待つ。
- 同じ版の Changed に、端末では feature flag の取得なしでも MCP task が動く、とある。対象として Bedrock、Vertex、Foundry、LLM gateway、`DISABLE_TELEMETRY` を挙げ、`CLAUDE_CODE_DISABLE_MCP_TASKS=1` で切る、と書く。

手順と制約の長い説明は [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp) の「MCP tasks that run on the server」にある。ガイドは、公開ベータで、Claude Code v2.1.304 以降の CLI が要る、と書く。

呼び出しが task になる条件は、ガイドがすべて満たすこと、と書いている。

- サーバが task をサポートする。
- HTTP、stdio、または claude.ai connector で、プロトコル revision `2026-07-28` でつながっている。`MCP_SDK_GENERATION=v1` か `MCP_PROTOCOL_NEGOTIATION=legacy` だと対象外。
- ガイドの同じ箇条書きは、セッションが feature flag を取得していること、とも書く。Bedrock や、telemetry か flag 取得を切ったセッションは対象外、という文が残っている。
- ガイドは、v2.1.304 以降では端末 CLI、Agent SDK、GitHub Actions が対象で、VS Code 拡張とデスクトップアプリには MCP task が無い、と書く。
- 呼び出しはメインの会話からで、サブエージェントからではない。
- 対話セッションである。対話でない場合は、Agent SDK か `--input-format stream-json` の `claude -p` で、`CLAUDE_AUTO_BACKGROUND_TASKS=1`、`CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND` は `1` ではない、`CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS` は `0` ではない。
- ワンショットの `claude -p ""` は MCP task を受けない。入力を閉じたあとも待たない。

待たせる方法は [環境変数](https://code.claude.com/docs/en/env-vars) にもある。

- `CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND=1` で、対話セッションは task の結果を待つ。自動で裏に回す機能がオンなら、既定の 2 分で普通のバックグラウンド呼び出しに移る。移ったあとは、セッションを出ても生き残る MCP task ではなくなる。環境変数の表は、この変数に v2.1.304 以降、と書く。
- `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS=0` で、自動の裏回しを切り、対話セッションでは MCP task も待つ。
- `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` だけでは MCP task を待たせない、とガイドは書く。

サーバ作者向けに、ガイドは `tools/call` の `result` を次の形にすると書いている。`resultType` は `"task"`。`taskId`、`status`、`createdAt`、`lastUpdatedAt`、`ttlMs` を載せる。その後クライアントは `tasks/get` を繰り返す。完了時の `tasks/get` は `resultType: "complete"` と、通常の tool 結果を `result` に入れる。このサンプルはその形に合わせてある。拡張そのものの仕様は [Tasks extension, revision 2026-07-28](https://tasks.extensions.modelcontextprotocol.io/specification/2026-07-28/tasks) である。

### 2 分で裏に回す普通の tool call

[v2.1.212 の CHANGELOG](https://github.com/anthropics/claude-code/blob/v2.1.212/CHANGELOG.md) は、2 分を超えてまだ走っている MCP tool call を自動で裏に回す、と書く。閾値は `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS` で、環境変数の表は既定 120000 ミリ秒、`0` で切る、v2.1.212 以降、と書く。

ガイドの「Automatic backgrounding of long tool calls」は、メインの会話で 2 分を超えた呼び出しが裏に移り、Claude は task id をすぐ受け取り、完了時に task notification で結果が届く、と書く。サブエージェント、IDE サーバ、対話でない実行は移さない。対話でない実行で移すには `CLAUDE_AUTO_BACKGROUND_TASKS=1` が要る。

数十秒の sleep は、この閾値に届かない。

### 許可待ちで止まらない設定

[設定リファレンス](https://code.claude.com/docs/en/settings-reference) は `permissions.denyInsteadOfPrompting` を、プロンプトを待つ tool call を拒否してターンを続ける、と書く。v2.1.319 以降。置けるのはユーザ設定、managed、または `--settings` で、リポジトリの設定では効かない、とも書く。

同じページは、ワークスペースの信頼ダイアログと、プロジェクト MCP サーバの承認は残る、と書く。許可の拒否は MCP task の裏回しとは別である。

## 文書同士で食い違う点

ここは未確認のまま残す。実行でどちらが勝つかは見ていない。

- 2.1.319 の changelog は、端末では feature flag を取らなくても MCP task が動く、と書く。同じ日に取得した MCP ガイドは、task になる条件に「セッションが feature flag を取得している」を残している。
- changelog は `CLAUDE_CODE_DISABLE_MCP_TASKS=1` で MCP task を切る、と書く。同じ日に取得した環境変数のページには、この変数の行が無かった。
- changelog の 2.1.319 は、端末の MCP task と `CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND` を Added に置いている。タグ `v2.1.319` の CHANGELOG を `MCP task` で探すと、2.1.319 の節以外には無い。MCP ガイドと環境変数の表は、MCP task とこの変数を v2.1.304 以降、と書く。2.1.304 の時点で端末に既にあったのか、2.1.319 が初出なのかは、この二つの文書だけでは決まらない。ポストが指している挙動を試すなら、changelog がその文を載せている 2.1.319 以降を使う。

## この VM で測ったこと

2026-11-10 に、このディレクトリで `node check.mjs` を実行した。Node は v22.23.4。終了コードは 0。`PASS` の前に、task を受けた `tools/call` は 1 ミリ秒で返り、待たせる plain の `tools/call` は 301 ミリ秒、`SLOW_MCP_PLAIN=1` は 302 ミリ秒だった。見ているのは、このサーバが MCP の JSON-RPC で task を話し、capability が無いときは待ち終わるまで結果を返さない、という点だけである。

`command -v claude` は空で、`/home/ubuntu` 以下に `claude` というファイルは見つからなかった。ログインも、裏回しも、transcript の完了行も、この VM では見ていない。

## 手元で確かめる

Claude Code の端末 CLI が要る。`claude --version` が 2.1.319 以降であることを見る。VS Code 拡張とデスクトップアプリは、ガイドが MCP task の対象外と書いている。

1. このディレクトリで `node check.mjs` を実行する。`PASS` と終了コード 0 を見る。サーバ単体の確認であり、Claude Code の確認ではない。
2. 同じディレクトリで、対話セッションをこの設定だけにして起動する。

```bash
claude --strict-mcp-config --mcp-config .mcp.json
```

`.mcp.json` の `args` は `server.mjs` である。カレントディレクトリがこのディレクトリでないと、Node はそのファイルを見つけない。プロジェクトの MCP 承認やワークスペースの信頼を聞かれたら、先に答える。`denyInsteadOfPrompting` を付けても、ガイドによればこの二つは残る。

3. メインの会話で、`slow_echo` に `text` が `hello`、`seconds` が `20` の呼び出しを頼む。サブエージェント経由にしない。
4. 20 秒を待たずにプロンプトが戻り、フッタが `1 MCP task` のような件数を示すかを見る。ガイドが書く完了行は `MCP task <server task id> (slow-mcp/slow_echo) completed.` である。結果の本文は transcript に出ない、とガイドは書く。Claude に結果を聞く。`hello` が返るかを見る。
5. 20 秒のあいだプロンプトが占有されたままなら、その呼び出しは task になっていない。ガイドの条件か、上の文書の食い違いを見る。数十秒では、2 分の自動裏回しにも届かない。
6. task を待たせる側は、同じ起動の前に `CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND=1` を付ける。20 秒の呼び出しが tool call の中で待つかを見る。ガイドは、自動裏回しがオンなら 2 分で普通のバックグラウンド呼び出しに移る、と書く。20 秒では移らない、という読みになる。2 分側はこのサンプルの既定では試さない。
7. capability があっても普通の `tools/call` にしたいときは、サーバの環境に `SLOW_MCP_PLAIN=1` を付ける。サーバは task を返さず、`seconds` のあいだ `tools/call` を閉じない。2 分の自動裏回しを見るなら、`seconds` を 150 にする。文書のうえでは、既定の 120000 ミリ秒で裏に移る。閾値を短くするなら、Claude Code 側の `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS` をその待ちより小さくする。この組み合わせは、この VM では未実測である。
8. 許可待ちの設定を同時に見るなら、ユーザの `~/.claude/settings.json` を書き換えずに、次で起動する。

```bash
claude --strict-mcp-config --mcp-config .mcp.json --settings deny-instead.example.json
```

`deny-instead.example.json` は `permissions.denyInsteadOfPrompting` を `true` にするだけである。プロンプトになる呼び出しを拒否する。MCP を裏に回す設定ではない。

`/tasks` で task を止められる、とガイドは書く。`Esc` では止まらない、とも書く。stdio のプロセスは Claude Code を終了すると止まる。ガイドは、表示が「セッションを出てもサーバ上で生き残る」でも、そのサーバの文書が生き残ると言うのでなければ、先に終わらせるか `/tasks` で止める、と書く。このサンプルは終了とともにプロセスが終わる。
