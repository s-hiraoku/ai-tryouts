# agnostic-ai の試行

## 結論

agnostic-ai 0.87.0 は、このディレクトリで同期まで動いた。`agnostic-ai sync` は 11 ファイルを作り、`agnostic-ai sync --check` の終了コードは 0 だった。

Cursor、Claude Code、Codex の生成ファイルは、今回読んだ各公式ドキュメントの置き場所と欄に合っている。Claude Code、Codex、Cursor の本体はこの環境に無く、ファイルを読み込ませる実行はしていない。

X の投稿本文は確認できなかった。

## 手順

作業ディレクトリは `tryouts/agnostic-ai` である。リポジトリのルートには設定を置いていない。同期の前後で `git status` が示した未追跡は、このディレクトリだけだった。

Node.js は v22.23.4。インストールは次である。

```sh
npm install -g agnostic-ai@0.87.0 --prefix "$HOME/.local"
```

`agnostic-ai --version` は `agnostic-ai version 0.87.0` だった。同じ日の `npm view agnostic-ai@0.87.0 version` は `0.87.0` で、dist-tag `latest` も同じだった。

初期化と spec の作成は次である。

```sh
printf 'claude,codex,cursor\n' | agnostic-ai init --gitignore=off
agnostic-ai new rule tryout-marker
agnostic-ai new skill tryout-checklist
agnostic-ai new agent tryout-reader
```

`new` が書いた TODO を、下の本文に置き換えた。`agnostic-ai.yaml` からは `builtins: [handoff]` を消した。

```sh
agnostic-ai lint
agnostic-ai sync
agnostic-ai sync --check
```

`lint` は 3 件の spec が問題ないことを表示し、終了コードは 0 だった。`sync` は 3 target に 11 ファイルを作ったことを表示し、終了コードは 0 だった。`sync --check` は出力が無く、終了コードは 0 だった。

`init` の直後、`agnostic-ai list` は project の 3 件に加えて builtin の skill `handoff` を出した。消す前の `sync --plan --json` は、その skill を次の 3 パスへ書く計画だった。いずれも 9567 バイトだった。

- `.claude/skills/handoff/SKILL.md`
- `.agents/skills/handoff/SKILL.md`
- `.cursor/skills/handoff/SKILL.md`

今回の元設定は agent、skill、rule を 1 つずつにするため、その行を消してから同期した。消したあとの `list` は 3 件だけだった。

確認は、このディレクトリで次を実行する。

```sh
python3 check.py
```

2026-10-22 の実行は `10 files matched` で、終了コードは 0 だった。`check.py` は印と必須の欄を見る。各ツールがファイルを読むことは見ない。

## 元の設定

`agnostic-ai.yaml` の targets は `claude`、`codex`、`cursor` である。`on-unsupported` は init が書いた `warn` のままである。

`new rule` は `.agnostic-ai/rules/tryout-marker.md` を作った。`globs` は `"**/*"`、`alwaysApply` は `true` である。本文は次の 2 つである。

```text
このディレクトリの記録には、次の1行を残す。
TRYOUT_RULE_MARKER
```

`new skill` はフォルダではなく `.agnostic-ai/skills/tryout-checklist.md` を作った。本文は 3 手順で、印は `TRYOUT_SKILL_MARKER` である。

`new agent` は `.agnostic-ai/agents/tryout-reader.md` を作った。その雛形にある `can: [read, Grep, shell]` は残した。本文の最後は `TRYOUT_AGENT_MARKER` である。

`sync` は `.agnostic-ai/AGNOSTIC_AI.md` も作った。中身は、生成ファイルを直接編集しない旨と、置き換え用の HTML コメントである。この試行では、そのコメントを指示文に置き換えていない。

## 生成されたファイル

`sync` が作った 11 ファイルは次である。

- `CLAUDE.md`
- `AGENTS.md`
- `.agnostic-ai/AGNOSTIC_AI.md`
- `.claude/agents/tryout-reader.md`
- `.claude/rules/tryout-marker.md`
- `.claude/skills/tryout-checklist/SKILL.md`
- `.codex/agents/tryout-reader.toml`
- `.agents/skills/tryout-checklist/SKILL.md`
- `.cursor/agents/tryout-reader.md`
- `.cursor/rules/tryout-marker.mdc`
- `.cursor/skills/tryout-checklist/SKILL.md`

3 つの `SKILL.md` は `cmp` で同一だった。

`sync` の要約は次のとおりである。

- Claude Code は `CLAUDE.md`、`.claude/rules/` の `tryout-marker`、`.claude/skills/` の `tryout-checklist`、`.claude/agents/` の `tryout-reader` を読む。
- Codex は `AGENTS.md`、rule `tryout-marker`、`.agents/skills/` の `tryout-checklist`、`.codex/agents/` の `tryout-reader` を読む。
- Cursor は rule、skill、agent を 1 つずつ読む。要約はパスを省略していた。実ファイルは上の `.cursor/` にある。

`sync` は note を 2 つ出した。

- Codex では agent の `can` は効果がない。Codex の tools は Claude 式の許可リストではない。
- Cursor では agent の `can` は効果がない。Cursor の subagent に tools 欄は無い。

`x-codex.tools` はこの試行では書いていない。note が名前を出したが、書き方は確認していない。

## 形式の照合

照合は、生成ファイルと下の出典を並べた結果である。各ツールのプロセスは起動していない。

Cursor の rule。公式は `.cursor/rules` の `.mdc` で、frontmatter に `description`、`globs`、`alwaysApply` を置く。生成ファイルは `.cursor/rules/tryout-marker.mdc` で、この 3 つがある。`alwaysApply` は `true`、`globs` は `'**/*'` である。公式は、`alwaysApply` が true のとき globs と description を無視すると書いている。ファイルは Always Apply の形である。

Cursor の agent。公式は `.cursor/agents/` の Markdown で、frontmatter に `name` と `description` がある。任意の欄は `model`、`readonly`、`is_background` である。生成ファイルは `name` と `description` を持ち、`tools` は無い。

Cursor の skill。公式は `.cursor/skills/<name>/SKILL.md` で、`name` は親フォルダ名と一致し、`description` が要る。生成ファイルは両方を満たす。フォルダ名は `tryout-checklist` である。

Claude Code の agent。公式は `.claude/agents/` の Markdown で、必須は `name` と `description` である。`tools` はカンマ区切りの文字列か YAML の配列である。生成ファイルは `name`、`description`、配列の `Read`、`Grep`、`Bash` を持つ。元の `can` がこの 3 つになった。公式の組み込みツール名にこの 3 つはある。`claude plugin validate` は、Claude Code が PATH に無いので実行できなかった。

Claude Code の rule。公式は `.claude/rules/` の Markdown である。読む frontmatter は `paths` だけで、他の欄はエラーにせず無視する。`paths` が無い rule は起動時に無条件で読む。生成ファイルは `paths` に `**/*` を持ち、加えて `name` と `description` がある。公式によれば、後者は無視される。

Claude Code の skill。公式は `.claude/skills/<name>/SKILL.md` である。`description` があり、コマンド名はディレクトリ名か frontmatter の `name` である。生成ファイルはディレクトリ名と `name` がどちらも `tryout-checklist` で、`description` がある。

Codex の指示。公式の `AGENTS.md` は、frontmatter を要求しない Markdown である。生成した `AGENTS.md` は Markdown で、`## Rules` の下に `tryout-marker` の本文と `TRYOUT_RULE_MARKER` がある。

Codex の agent。公式は `.codex/agents/` の TOML で、必須は `name`、`description`、`developer_instructions` である。生成ファイルはこの 3 つを持つ。`can` は入っていない。

Codex の skill。公式は、リポジトリでは `.agents/skills` に `SKILL.md` を置く。生成ファイルは `name` と `description` を持ち、フォルダ名と `name` が一致する。

`CLAUDE.md` にはルール本文が無い。getting started は、Claude と Codex を両方選んだ例で `CLAUDE.md` が `@AGENTS.md` を含むと書いている。今回の `CLAUDE.md` にその行は無い。ルール本文は `.claude/rules/tryout-marker.md` にある。ポインタが無い理由は、この実行からは分からない。

## 注意点

投稿 [https://x.com/Chemaclass/status/2113016056482869377](https://x.com/Chemaclass/status/2113016056482869377) の本文は取れていない。X の API は 402 で、本文は `credits depleted` だった。ページ取得は 403 だった。投稿がこのツールを指すことは、投稿本文では確認できていない。リポジトリとドキュメントは、依頼にあった名前で公開サイトを検索して読んだ。

hook と MCP の spec は作っていない。同期結果にもそのファイルは無い。ドキュメントには両方の出力先がある。この試行では実行していない。

[Targets](https://agnostic-ai.org/docs/targets/) の表には 26 個の名前があった。Claude Code、Codex、Gemini CLI、Cursor、GitHub Copilot、Aider、Cline、Windsurf / Devin、Continue、Amp、Zed、Warp、OpenCode、Google Antigravity、Junie、Kiro、Crush、Trae、Qoder、OpenHands、Factory、Kilo Code、Jules、Goose、Augment、Ellipsis である。同期したのは `claude`、`codex`、`cursor` の 3 つである。他のツールのファイルは作っていない。

この `AGENTS.md` は Git リポジトリのルートには無い。Codex の公式は、Git のルートから作業ディレクトリまで降り、各ディレクトリの `AGENTS.md` を読む。リポジトリのルートで Codex を始めると、このファイルは経路に入らない。`tryouts/agnostic-ai` で始めると入る。読み込み自体は、Codex を起動していないので未確認である。

Cursor の公式は、プロジェクトのルートとサブディレクトリの `AGENTS.md` を読むと書いている。このリポジトリをルートで開いたときにこのファイルが読まれるかは、Cursor を起動していないので未確認である。

Cursor のドキュメントは、サードパーティの読み込みが既定で有効なとき、`.claude/agents/` と `.agents/skills/` も読むと書いている。同じ内容が複数のパスにある。名前が衝突したとき `.cursor/` が勝つ、と Cursor の subagent のページは書いている。

`can` は Claude の `tools` にだけ出た。Codex と Cursor では、sync が効果なしと書いた。権限が実際に狭まるかは、各ツールを起動していないので未確認である。

`--gitignore=off` でも、init は管理された `.gitignore` を書いた。無視するのは `.agnostic-ai/.command-lock`、`.agnostic-ai/.sync-state`、`.agnostic-ai/local/`、`.agnostic-ai/packs/`、`agnostic-ai.local.yaml` である。`AGENTS.md` や `.cursor/` は無視されない。`git check-ignore` は lock と sync-state に一致した。この 2 つはコミットしていない。

パターン先頭の `/` は、この `.gitignore` があるディレクトリに対する起点である。同じファイルを Git のリポジトリルートに置くと、別のパスを無視する。

生成ファイルの HTML コメントはツールの出力である。手で消すと `sync --check` がずれを出す。

秘密、トークン、鍵は spec にもこの記録にも無い。

## 出典

- 元の投稿は [https://x.com/Chemaclass/status/2113016056482869377](https://x.com/Chemaclass/status/2113016056482869377)。本文は確認できなかった。
- リポジトリは [Chemaclass/agnostic-ai](https://github.com/chemaclass/agnostic-ai)。
- リリース v0.87.0 は [GitHub Releases](https://github.com/Chemaclass/agnostic-ai/releases)。取得したページでは 2026-10-22 13:09、表示上のコミットは `b354214` だった。
- インストールは [Installation](https://agnostic-ai.org/docs/installation/)。
- 初期化と最初の rule は [Set up your project](https://agnostic-ai.org/docs/getting-started/)。
- 設定ファイルの位置は [Configuration](https://agnostic-ai.org/docs/configuration/)。
- `init` と `new` は [Start a project](https://agnostic-ai.org/docs/cli-reference/start/)。
- `sync` は [Generate output](https://agnostic-ai.org/docs/cli-reference/sync/)。
- 対象の一覧は [Targets](https://agnostic-ai.org/docs/targets/)。
- Cursor への出力は [Cursor](https://agnostic-ai.org/docs/targets/cursor/)。
- Claude Code への出力は [Claude Code](https://agnostic-ai.org/docs/targets/claude/)。
- Codex への出力は [Codex](https://agnostic-ai.org/docs/targets/codex/)。
- Cursor の rule は [Rules](https://cursor.com/docs/rules)。
- Cursor の subagent は [Subagents](https://cursor.com/docs/subagents)。
- Cursor の skill は [Agent Skills](https://cursor.com/docs/skills)。
- Claude Code の agent は [Create custom subagents](https://code.claude.com/docs/en/sub-agents)。
- Claude Code の rule は [Memory](https://code.claude.com/docs/en/memory)。
- Claude Code の skill は [Skills](https://code.claude.com/docs/en/skills)。
- Codex の `AGENTS.md` は [Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)。
- Codex の agent は [Subagents](https://developers.openai.com/codex/subagents)。
- Codex の skill は [Customization](https://developers.openai.com/codex/concepts/customization)。
