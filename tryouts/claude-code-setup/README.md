# claude-code-setup の試行

## 結論

この VM では、プラグインを入れるところまでできた。案件を読ませた提案は出ていない。

Claude Code CLI `2.1.296` を入れ、公式マーケットプレイス `claude-plugins-official` から `claude-code-setup` `1.0.0` を user スコープで有効にした。`claude auth status` は `loggedIn` が false、`authMethod` が `none` だった。その状態で `claude -p "recommend automations for this project" --max-turns 2` を実行すると、標準出力は次の 1 行で、終了コードは 1 だった。

```text
Not logged in · Please run /login
```

ログインが無いので、hook、MCP、Skill の提案をこの環境では再現できなかった。

## 注意点

- ポストの `/plugin install` は対話セッション用。公式ドキュメントは、非対話では `claude plugin install` を使うと書いている。この VM ではシェル形式で入れた。
- 対話セッションを一度も開いていないマシンでは、公式マーケットプレイスが未登録だった。先に `claude plugin marketplace add anthropics/claude-plugins-official` が必要だった。
- 入ったプラグインの中身は Skill `claude-automation-recommender` が 1 つ。`claude plugin details` は Agents 0、Hooks 0、MCP servers 0。hook や MCP を配るプラグインではない。
- Skill の文面は、分析して推薦し、ファイルは作らないと書く。許可ツールは Read、Glob、Grep、Bash。ファイルを変えない制約は、ツール権限ではなく手順の指示。
- 参照ファイルの表は定番パターン。Skill は、その表に加えて Web 検索で案件固有の候補も足すよう書いている。表を、このリポジトリを読んだ実行結果として扱わない。
- ログインはしていない。鍵、トークン、アカウント情報はこのレポートに無い。

## 再現手順

1. Node.js 22 で `@anthropic-ai/claude-code@latest` をユーザー配下に入れた。`claude --version` は `2.1.296 (Claude Code)`。
2. `claude plugin marketplace add anthropics/claude-plugins-official`。表示は `Successfully added marketplace: claude-plugins-official`。
3. `claude plugin install claude-code-setup@claude-plugins-official`。表示は `Successfully installed plugin: claude-code-setup@claude-plugins-official (scope: user)`。
4. `claude plugin list` は version `1.0.0`、status enabled。
5. `claude plugin details claude-code-setup@claude-plugins-official` は Skills 1、Agents 0、Hooks 0、MCP servers 0。常時コストの見積もりは約 101 トークン。
6. `claude auth status` は未ログイン。
7. プロンプト実行は上記のログインエラーで止まった。

サンプルリポジトリは clone していない。ログインの前にコードの分析が始まらない。

## 実際に出た提案

0 件。

## 提案の仕組み

読んだ定義は、インストール先の `skills/claude-automation-recommender/SKILL.md` と、同じ Skill の `references/`。GitHub 上の raw と SHA-256 が一致した。

```text
441c57e26f0931b64dd085deaad9213c4e3efea27d916dd7443cd33c7e338227
```

Skill の流れは 3 段。

1. マニフェストとディレクトリを見る。対象は `package.json`、`pyproject.toml`、`Cargo.toml`、`go.mod`、既存の `.claude/` と `CLAUDE.md`、`src/` や `tests/` など。
2. 検出した信号を 5 種類へ割り当てる。MCP サーバー、Skills、Hooks、サブエージェント、プラグイン。通常は種類ごとに 1 件か 2 件。特定の種類を聞かれたら 3 件から 5 件。
3. 理由と置き場所をレポート形式で書く。実装は別依頼。

信号と候補の対応は参照ファイルの表にある。次は表の読み取りであり、実行結果ではない。

- Prettier、ESLint、Ruff、`tsconfig.json`、テストディレクトリ、`.env`、ロックファイルがあると、編集後の整形や検査、編集前のブロックを Hooks として勧める。
- 有名ライブラリがあると context7。フロントの UI 試験があると Playwright MCP。GitHub、Linear、データベース、Slack なども表にある。
- Skills は、公式プラグインの `commit` や `frontend-design` と、自作の `api-doc` や `gen-test` などを信号に応じて勧める。
- 認証や決済のコードがあると `security-reviewer`。ファイル数が多いと `code-reviewer`。
- プラグインは `code-review`、`feature-dev`、`frontend-design`、`commit-commands` など。

プラグインの README と [Claude Code Setup のページ](https://claude.com/plugins/claude-code-setup) は、スラッシュコマンドもカテゴリに数える。Skill 本体の表は、スラッシュコマンドを独立の段にしていない。`/skill-name` での呼び出しと、`commit-commands` の `/commit` として触れている。

## 得られた知見

ポストの導入先 `claude-code-setup@claude-plugins-official` は実在し、この CLI 版でもインストールできた。未ログインの非対話実行では、推薦は 1 回も返らない。

プラグインは推薦係である。入れると毎回のセッションに Skill の説明が約 100 トークン載る。hook や MCP がその場で有効になるわけではない。

## 出典

- 元のポストは [https://x.com/sumika45379/status/2108758168440569911](https://x.com/sumika45379/status/2108758168440569911)。2026-10-10 の本文は、公式プラグインが案件を分析して hook、Skill、MCP、サブエージェントを勧めると書き、導入を `/plugin install claude-code-setup@claude-plugins-official` の 1 行としている。
- プラグインページは [https://claude.com/plugins/claude-code-setup](https://claude.com/plugins/claude-code-setup)。取得時点の説明は、読み取り専用で 5 種類を勧める、というもの。
- ソースは [https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-code-setup](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-code-setup)。
- マーケットプレイスの追加は [Discover plugins](https://code.claude.com/docs/en/discover-plugins)。
- 非対話のインストールは [Install and manage plugins](https://code.claude.com/docs/en/plugins/install)。
