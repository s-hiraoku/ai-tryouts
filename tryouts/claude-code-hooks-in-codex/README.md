# Claude Code の hook を Codex から呼ぶ

## 結論

文書の範囲では、シェルコマンドの文字列を見て止める `PreToolUse` のスクリプトを、同じファイルのまま両方の設定から呼べる。設定ファイルは共用できない。Codex の Hooks ページは、managed 以外の hook を `/hooks` で信頼するまで動かさない、と書いている。

結論が覆うのは、コマンド文字列に `rm -rf` が含まれたら止める `hooks/block_rm.py` だけである。ファイル編集、`ask`、`defer`、`continue: false` は [COMPAT.md](COMPAT.md) の別の行にある。

この VM の `PATH` に `claude` と `codex` は無かった。ホストがコマンドを止めるところは未確認。確認したのは、スクリプトにダミーの JSON を stdin で渡したときの終了コードと stdout だけ。

## スクリプトが両方で読める形

`hooks/block_rm.py` は標準入力の JSON から `tool_input.command` を読む。文字列で、かつ `rm -rf` を含むときだけ、次の1個を stdout に書いて終了コード 0 で終わる。

```json
{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "rm -rf を含むコマンドは止めた"}}
```

それ以外は何も書かず、終了コード 0 で終わる。未知のフィールドは見ない。Claude Code の例にある `prompt_id` も、Codex の例にある `model` と `turn_id` も、判定に使っていない。

吸収しているのは設定の2点だけ。

- 置き場所。Claude Code は `.claude/settings.json`。Codex は `.codex/hooks.json` か `config.toml` の `[hooks]`。
- `command` のパス。Claude Code の例は `${CLAUDE_PROJECT_DIR}`。Codex の例は `git rev-parse --show-toplevel`。Hooks ページは `CLAUDE_PROJECT_DIR` に触れていない。

`examples/claude.settings.json` と `examples/codex.hooks.json` の `hooks` 以下は、その `command` 以外同じ入れ子にしてある。

## 注意点

部分文字列で見ている。`echo note about rm -rf /tmp/dummy-build` も止まる。投稿の元記事も、関係ないコマンドに対象の語が入って止まった、と書いている。

`Write` のように `command` が無い入力は止めない。Codex のファイル編集は `tool_name` が `apply_patch` で、matcher に `Edit` や `Write` と書いても入力の `tool_name` は `apply_patch` のまま、と Hooks ページにある。`tool_name == "Edit"` を見るスクリプトは、Codex の編集には当たらない。

Codex の Hooks ページは、信頼前の hook を飛ばす、と書いている。その間にコマンドが警告なしで進むかは、ページには無い。元記事は、信頼する前は `echo BLOCKME` が警告なしに実行された、と書いている。記事の観察であり、ここの実行結果ではない。

Claude Code では、スクリプトが起動できないときの既定は非ブロッキングエラーで、ツール呼び出しは続く。失敗で止めるには `onFailure` を `block` にする。v2.1.295 以降、と Hooks reference にある。Codex の Hooks ページに `onFailure` は無い。ローカルの command hook が起動に失敗したとき Codex が止めるかは、そのページに書かれていない。未確認。ページがローカルの `PreToolUse` について書いている失敗は、未対応のフィールドを返したときである。そのとき hook は失敗になり、ツール呼び出しは続く。

同じレイヤーに `hooks.json` と `config.toml` の `[hooks]` を両方置くと、Codex はマージして警告する、とページにある。元記事は、自分の環境では `hooks.json` が信頼画面に出ず、`config.toml` へ移して動いた、と書いている。ページの記述と記事の観察は一致していない。どちらが今の版で起きるかは未確認。

## このディレクトリで確認したこと

2026-11-10 に、このディレクトリで次を実行した。

```text
python3 test_block_rm.py
```

出力は次のとおり。

```text
pass claude bash rm -rf exit=0 decision=deny
pass codex bash rm -rf exit=0 decision=deny
pass claude bash echo containing rm -rf exit=0 decision=deny
pass claude bash ls exit=0 decision=allow
pass codex bash ls exit=0 decision=allow
pass claude write has no command string exit=0 decision=allow
pass invalid json exit=0 decision=allow
pass json array exit=0 decision=allow
pass command is not a string exit=0 decision=allow
pass empty stdin exit=0 decision=allow
10 cases passed
```

`fixtures/claude-bash-rm.json` と `fixtures/codex-bash-rm.json` を直接渡した stdout は、どちらも上の deny JSON の1行で、終了コードは 0 だった。`fixtures/codex-bash-ls.json` は stdout が空で、終了コードは 0 だった。

これはスクリプトの入出力である。Claude Code や Codex がその JSON を読んでコマンドを止めた、という結果ではない。

## 手元でホストまで見ること

例の `command` は、このディレクトリが git のルートで、`hooks/block_rm.py` がそこにある前提である。このリポジトリのまま試すなら、パスを `tryouts/claude-code-hooks-in-codex/hooks/block_rm.py` に変える。

1. `examples/claude.settings.json` を、試すプロジェクトの `.claude/settings.json` に置く。既存の設定があるなら、`hooks` だけ足す。
2. Codex は `examples/codex.hooks.json` を `.codex/hooks.json` に置くか、`examples/codex.config.toml` の表を `config.toml` に足す。同じレイヤーでは片方にする。
3. Codex でプロジェクトの `.codex/` を信頼し、`/hooks` でこの hook を信頼する。定義を変えたら信頼し直す。
4. それぞれの製品に、`echo note about rm -rf /tmp/dummy-build` の実行を頼む。スクリプトが呼ばれていれば、この文字列も止まる。`ls /tmp` は止まらない。
5. 信頼する前に同じ `echo` を頼み、警告なしに実行されるかを見る。ここは Codex だけの手順である。

`rm -rf` 自体を実行させない。部分文字列の `echo` で、hook が呼ばれたかを見られる。

## 未確認

- Claude Code と Codex のプロセスが、このスクリプトを読んでツール呼び出しを止めること。
- 終了コード 2 と、古い `{"decision":"block"}` を、今の各製品が `PreToolUse` でどう扱うか。文書には書いてある。
- Codex が 0 と 2 以外の終了コードをどう扱うか。Hooks ページに全表は無い。
- Codex が `${CLAUDE_PROJECT_DIR}` を展開するか。
- `hooks.json` と `config.toml` の `[hooks]` が同じレイヤーにあるとき、記事のとおり片方が消えるか、ページのとおりマージされるか。
- main の生成スキーマと、インストール済み Codex のワイヤ形式が一致するか。Hooks ページは、main が現行リリースより先に進み得ると書いている。

## 出典

検証した主張は、[このポスト](https://x.com/kotteri_ai/status/2119581073202126867) と、それが紹介する [Cat's Hand の記事](https://cats-hand.pro/codex-hooks-same-gate/)。記事は 2026-11-09 公開で、Claude Code 用のスクリプトをコピーせず Codex の `config.toml` から呼び、`/hooks` で信頼したあと印ファイルの有無で止まった、と書いている。

一次ソースは次の3つ。

- [Claude Code Hooks reference](https://code.claude.com/docs/en/hooks)
- [Codex Hooks](https://learn.chatgpt.com/docs/hooks)
- [openai/codex の PreToolUse 入力スキーマ](https://github.com/openai/codex/blob/c82708f85803d21fe9046af407107a1ee105b6e5/codex-rs/hooks/schema/generated/pre-tool-use.command.input.schema.json) と [出力スキーマ](https://github.com/openai/codex/blob/c82708f85803d21fe9046af407107a1ee105b6e5/codex-rs/hooks/schema/generated/pre-tool-use.command.output.schema.json)
