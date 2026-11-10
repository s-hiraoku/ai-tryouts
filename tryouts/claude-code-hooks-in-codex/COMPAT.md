# Claude Code と Codex の hook 比較

2026-11-10 に読んだ一次ソースの抜き書き。Claude Code は [Hooks reference](https://code.claude.com/docs/en/hooks)。Codex は [Hooks](https://learn.chatgpt.com/docs/hooks)。Codex の入出力フィールドの必須一覧は、GitHub の main にある生成スキーマ [pre-tool-use.command.input.schema.json](https://github.com/openai/codex/blob/c82708f85803d21fe9046af407107a1ee105b6e5/codex-rs/hooks/schema/generated/pre-tool-use.command.input.schema.json) と [pre-tool-use.command.output.schema.json](https://github.com/openai/codex/blob/c82708f85803d21fe9046af407107a1ee105b6e5/codex-rs/hooks/schema/generated/pre-tool-use.command.output.schema.json)、blob `c82708f85803d21fe9046af407107a1ee105b6e5`。Codex の Hooks ページは、main のスキーマには現行リリースに無いフィールドが入り得ると書き、挙動の基準はそのページだとしている。スキーマとページが食い違う行は、ページの挙動を上に書いた。

この VM では Claude Code と Codex を動かしていない。表の「記載」は文書の記述であり、製品上の実行結果ではない。

| 項目 | Claude Code の記載 | Codex の記載 | このサンプル |
| --- | --- | --- | --- |
| 設定ファイル | `~/.claude/settings.json`、`.claude/settings.json`、`.claude/settings.local.json`、管理ポリシー、プラグインの `hooks/hooks.json`、スキルとサブエージェントの frontmatter | 各レイヤーの `hooks.json`、または `config.toml` の `[hooks]`。実用上の例は `~/.codex/` とプロジェクトの `.codex/`。同じレイヤーに両方あるとマージして警告する | `examples/` に例を置いた。このリポジトリの実設定には入れていない |
| JSON の入れ子 | `hooks`、イベント名、matcher グループ、`hooks` 配列、`type` と `command` | 同じ入れ子。`description` は `hooks.json` の任意メタデータで、実行対象は変えない | 入れ子は同じ。`command` の文字列だけ変えた |
| 動かす前の信頼 | Hooks reference に、信頼するまで動かない、という手順は無い | managed 以外は `/hooks` でその定義のハッシュを信頼するまで動かない。定義が変わると信頼し直すまで飛ばす。起動時に見直しが要るときは `/hooks` を開く警告を出す。`--dangerously-bypass-hook-trust` はその起動に限り信頼の記録を飛ばす。プロジェクトの `.codex/` は、そのレイヤーが信頼済みのときだけ読む | 手順は README に書いた。実行は未確認 |
| 共通のイベント名 | `PreToolUse`、`PermissionRequest`、`PostToolUse`、`PreCompact`、`PostCompact`、`SessionStart`、`SessionEnd`、`UserPromptSubmit`、`SubagentStart`、`SubagentStop`、`Stop` | 同じ名前がある | サンプルは `PreToolUse` だけ |
| Codex 側にあり、Claude の終了コード表に無いイベント | 終了コード表に `PreModelRequest`、`PostModelRequest`、`Interrupt` は無い | この3つがある。`PreModelRequest` と `PostModelRequest` の出力は診断用で、要求を止められない | 使っていない |
| Claude 側にあり、Codex のイベント一覧に無い例 | 終了コード表に `PostToolUseFailure`、`PostToolBatch`、`PermissionDenied`、`Notification`、`FileChanged`、`CwdChanged`、`WorktreeCreate` などがある | Hooks ページのイベント一覧には無い | 使っていない。完全な差集合は未確認 |
| matcher | 英数字と `_`、`-`、空白、`,`、`|` だけなら完全一致。それ以外は正規表現。`^Bash$` も Bash の matcher だと書いている | matcher は正規表現。`Bash` は部分一致になり得る。例は `Bash` と `^Bash$` の両方 | 両方の例で `^Bash$` |
| `PreToolUse` の stdin | 共通フィールドに加え `tool_name`、`tool_input`、`tool_use_id`。Bash の `tool_input.command` がコマンド文字列。例には `prompt_id`、`permission_mode`、`description` もある。`permission_mode` の値に `auto` がある | 1個の JSON を stdin に渡す。Bash と `apply_patch` は `tool_input.command`。main の入力スキーマの必須は `cwd`、`hook_event_name`、`model`、`permission_mode`、`session_id`、`tool_input`、`tool_name`、`tool_use_id`、`transcript_path`、`turn_id`。`permission_mode` の列挙に `auto` は無い。`additionalProperties` は false | スクリプトは未知のフィールドを無視し、`tool_input.command` が文字列のときだけ見る |
| ファイル編集のツール名 | `Write` と `Edit`。入力は `file_path` など | 入力の `tool_name` は `apply_patch`。matcher は `apply_patch`、`Edit`、`Write` のどれでも当たる | Bash matcher ではこのスクリプトは呼ばれない。`Write` のダミー入力は `command` が無いので、スクリプトは何も出さず終了コード 0 |
| 止め方 | 終了コード 0 で `hookSpecificOutput.permissionDecision` が `deny`。理由は `permissionDecisionReason` | 同じ JSON を受け付ける、と書いている | サンプルはこの JSON だけを出す |
| 古い `decision` | `PreToolUse` では非推奨。`block` は `deny`、`approve` は `allow` に対応する、と書いている | `{"decision":"block","reason":"..."}` も受け付ける、と書いている | 使っていない。ホストでの対応は未確認 |
| 終了コード 2 | `PreToolUse` ではツール呼び出しを止める。理由は stderr | `PreToolUse` で終了コード 2 と stderr の理由でも止められる、と書いている | 使っていない。ホストでの対応は未確認 |
| 0 と 2 以外 | 多くのイベントでは非ブロッキングエラー。`onFailure` が `block` なら失敗で止める。`PreToolUse` でスキーマを通る JSON を出したときは、終了コードを無視して JSON が決める、という表がある | 終了コードの全表は Hooks ページに無い。0 と 2 以外の扱いは未確認 | スクリプトは常に 0。壊れた stdin も 0 で何も出さない |
| `ask` と `defer` | `permissionDecision` は `allow`、`deny`、`ask`、`defer` | 出力スキーマの列挙は `allow`、`deny`、`ask`。ページは `ask` を解析するが未対応で、hook を失敗にし、ツール呼び出しは続ける、と書く。`defer` の記述は無い | 使っていない |
| `continue: false` | イベント固有の判定より先に、処理全体を止める | `PreToolUse` では未対応。hook を失敗にし、ツール呼び出しは続ける | 出していない |
| プレーンテキストの stdout | 終了コード 0 なら成功で、判定は無い。`PreToolUse` は、プレーンテキストをモデルの文脈へ足すイベント一覧に入っていない | `PreToolUse` では無視する | 止めないときは stdout を空にする |
| 失敗したとき | 起動できないときの既定は非ブロッキングエラー。`command` と `http` は `onFailure` を `block` にすると失敗で止める。v2.1.295 以降 | `onFailure` の記述は無い。`[features] hooks = false` で hook 全体を切る。ローカルの `PreToolUse` が未対応フィールドを返すと、失敗にしてツール呼び出しは続ける。クラウドオーケストレーションの節は、エラー、タイムアウト、壊れた応答がツールを実行させ得る、と書く。ローカル command hook の起動失敗は未確認 | 例には `onFailure` を入れていない |
| `timeout` | 秒。`command` の多くのイベントは既定 600 秒。`SessionEnd` は共有 1.5 秒で、設定すると最大 60 秒まで伸びる | 秒。多くの hook は既定 600 秒。`SessionEnd` と `Interrupt` は既定 1 秒、最大 3 秒 | 両方の例で 10 秒 |
| 複数 hook | 一致した hook は並列に動く | 同じイベントの複数の command hook は同時に起動する。1本がもう1本の起動を止められない | 1本だけ |
| スクリプトのパス | `${CLAUDE_PROJECT_DIR}` を例に出している | `CLAUDE_PROJECT_DIR` の記述は Hooks ページに無い。プラグイン hook には `CLAUDE_PLUGIN_ROOT` と `CLAUDE_PLUGIN_DATA` を渡す。相対パス `.codex/hooks/...` は、サブディレクトリから起動すると壊れる、と書いている | Claude の例は `${CLAUDE_PROJECT_DIR}`。Codex の例は `git rev-parse --show-toplevel` |
| Web 検索 | `PreToolUse` は `WebSearch` と `WebFetch` にも当たる | `WebSearch` のような hosted tool は、ローカルのツール hook 経路を通らない | matcher が `^Bash$` なので、この差はサンプルの対象外 |
