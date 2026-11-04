# LLM wiki を3つのツールで共有する

読者は、Karpathy 式の LLM wiki を Agent Skill として置き、Claude Code、Codex、Cursor が同じログブックを読む構成を自分のリポジトリで試す人である。

## 結論

スキルのインストールは、この VM で `npx skills` 1.7.6 が完了した。既定では正本が `.agents/skills/karpathy-llm-wiki` に入り、Claude Code 向けはそこへのシンボリックリンクになる。Codex と Cursor は、その CLI の表示では同じ `.agents/skills` を使う。インストールだけでは `wiki/` はできない。

3つの製品の実行ファイルはこの VM に無かった。製品がファイルを読んで答えるところまでは見ていない。

この試行ディレクトリでは、手順を1ファイルにし、ログブックを `wiki/` に1つ置いた。`.claude/skills/llm-wiki` と `.cursor/skills/llm-wiki` はそのファイルへのリンクである。`python3 check.py` は終了コード 0 で、3つの入口の inode は同じだった。記事の数値を raw に無い値へ変えると、同じコマンドは終了コード 1 になった。

ファイルを揃える用途には使える。エージェントが取り込みと質問を自分で行うことは、ここでは未確認である。

## 元のリポジトリ

2026-11-04 に `gh api repos/Astro-Han/karpathy-llm-wiki` で読んだ。

- 公開リポジトリ。default branch は `main`。
- ライセンスは MIT。`LICENSE` の著作権表示は `Copyright (c) 2026 Yuhan Lei`。
- stars は 2676。forks は 316。
- `created_at` は 2026-04-05T06:17:20Z。
- `pushed_at` は 2026-07-23T16:57:44Z。直近コミットは `eafcc77`、メッセージは `fix: align log inventory and examples`、日時は 2026-07-23T16:57:31Z。
- `updated_at` は 2026-11-04T00:03:01Z。この値は star などで動く。内容の更新時刻は `pushed_at` の方である。
- 説明文は "Agent Skills-compatible LLM wiki for Claude Code, Cursor, and Codex. Build a Karpathy-style knowledge base from raw sources, citations, and linting."

同じ API の tree にあるファイルは次である。

- `.gitignore`
- `LICENSE`
- `README.md`
- `SKILL.md`（233行）
- `assets/karpathy-tweet.png`
- `examples/` に README、索引、ログ見本、記事2つ
- `references/` に raw、記事、索引、archive のテンプレート
- `scripts/check_evidence.py`
- `tests/test_check_evidence.py`

`SKILL.md` の操作は3つである。取り込みは出典を `raw/` に保存し、記事、`wiki/index.md`、`wiki/log.md` を更新する。質問は `wiki/` を読んで引用し、ファイルは書かない。点検は索引、リンク、raw の参照、出典との一致を見る。`raw/` は変更しない。数値、日付、引用は、記事に書く前に raw の中で見つける。

README のインストールコマンドは `npx add-skill Astro-Han/karpathy-llm-wiki` である。2026-11-04 に `npx add-skill --help` を実行すると、パッケージは `skills` に改名済みで、`add-skill@2.0.0` は deprecated だった。動いたコマンドは `npx skills add` である。

このリポジトリには上流の `SKILL.md`、テンプレート、`check_evidence.py` をコピーしていない。

## 元の投稿

投稿は [https://x.com/rvaniaaaa/status/2116512611776799017](https://x.com/rvaniaaaa/status/2116512611776799017)。`x.com` の取得は 403 だった。同じ status ID を `https://api.fxtwitter.com/rvaniaaaa/status/2116512611776799017` で読み、`tweet.text` を使った。作成時刻は Sat Oct 31 12:48:24 +0000 2026。取得時点の likes は 219、reposts は 29、replies は 31、views は 13477。

本文は、Karpathy のアイデアに対して8つのリポジトリが既にある、と並べている。順は ScrapingArt/Karpathy-LLM-Wiki-Stack、ddenzu/karpathy-llm-wiki-second-brain、kfchou/wiki-skills、KaelLim/llm-wiki、odere-pro/llm-wiki-stack、micuintus/llm-wiki、lucasastorian/llmwiki、eugeniughelbur/obsidian-second-brain である。Claude、Codex、Cursor が1つのログブックを共有する、と本文が当てているのは8番の [eugeniughelbur/obsidian-second-brain](https://github.com/eugeniughelbur/obsidian-second-brain) である。依頼の例 Astro-Han/karpathy-llm-wiki は、この一覧とは別にスキルの入れ方として指定された。

8番のリポジトリは、同じ日の API で MIT、stars 5137、forks 637、`pushed_at` 2026-11-01T15:29:14Z だった。adapter は Claude Code 向けに `SKILL.md` をコピーし、Codex 向けに `AGENTS.md` と `.agents/skills/` を出す。ビルドとインストールはこの VM では実行していない。

## 入れ方

上流スキルをこのリポジトリには入れていない。入れ方の確認は、空の Git リポジトリ `/tmp/skill-install-test` と `/tmp/skill-install-link` で行った。`HOME` は `/tmp/empty-home-llmwiki` にした。

コピーでのインストール。

```sh
npx skills add Astro-Han/karpathy-llm-wiki \
  --skill karpathy-llm-wiki \
  --agent claude-code codex cursor \
  -y \
  --copy
```

終了コードは 0 だった。できたファイルは `.claude/skills/karpathy-llm-wiki` と `.agents/skills/karpathy-llm-wiki` である。2つの `SKILL.md` は `cmp` で同一だった。`.cursor/` はできなかった。CLI の要約は Claude Code、Codex、Cursor への copy と表示した。`skills-lock.json` の `computedHash` は `e5160084a6095f7d9a276a462df9a5d2d2c1b9386388c0f087e8c23c968c9472` で、`installMode` は `copy` だった。このハッシュは再計算していない。

`--copy` を外した2回目は、正本が `.agents/skills/karpathy-llm-wiki` になり、`.claude/skills/karpathy-llm-wiki` は `../../.agents/skills/karpathy-llm-wiki` へのリンクだった。CLI は Codex と Cursor を universal、Claude Code を symlinked と表示した。どちらの実行も `wiki/` と `raw/` は作らなかった。

CLI は Gen を Safe、Socket を 0 alerts、Snyk を High Risk と表示し、詳細 URL を `https://skills.sh/Astro-Han/karpathy-llm-wiki` と出した。取得したページはスキル名と install コマンドの表示で、アラートの説明は含まれていなかった。

この試行の共有構成は、そのリンクの置き方に合わせ、ログブックの場所だけをスキルの外に固定した。正本は `tryouts/llm-wiki/.agents/skills/llm-wiki/SKILL.md` である。

## 構成

```text
tryouts/llm-wiki/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── check.py
├── .agents/skills/llm-wiki/SKILL.md
├── .claude/skills/llm-wiki -> ../../.agents/skills/llm-wiki
├── .cursor/skills/llm-wiki -> ../../.agents/skills/llm-wiki
├── .cursor/rules/llm-wiki.mdc
├── raw/paper-plane/
│   ├── 2026-11-04-distance-note.md
│   └── 2026-11-04-monday-note.md
└── wiki/
    ├── index.md
    ├── log.md
    └── paper-plane/
        ├── distance.md
        └── meeting.md
```

`AGENTS.md`、`CLAUDE.md`、`.cursor/rules/llm-wiki.mdc` は同じ2行を持つ。

```text
LOGBOOK: wiki/
PROCEDURE: .agents/skills/llm-wiki/SKILL.md
```

`CLAUDE.md` の先頭は `@AGENTS.md` である。この行を Claude Code が展開するかは、製品が無いので未確認である。印はファイル本体にも書いてある。

Cursor の [Agent Skills](https://cursor.com/docs/skills) は、プロジェクトのスキルを `.agents/skills/`、`.cursor/skills/`、互換として `.claude/skills/` と `.codex/skills/` から読む、と書いている。サブディレクトリの `.cursor/skills/` と `.agents/skills/` も拾い、そのディレクトリ配下のファイルにスコープする、とも書いている。`name` は親フォルダ名と一致する。ここでのフォルダ名と `name` はどちらも `llm-wiki` である。

Cursor の [Rules](https://cursor.com/docs/rules) は、プロジェクトルールを `.cursor/rules` の `.mdc` とする。`alwaysApply: true` のとき、そのルールは常に含まれる。同じページがサブディレクトリについて書いているのは `AGENTS.md` で、そのディレクトリと子を扱うときに読む、とある。

Codex の [AGENTS.md](https://developers.openai.com/codex/guides/agents-md) は、Git ルートからカレントディレクトリまで降りて `AGENTS.md` を連結する。リポジトリのルートで Codex を始めると、このファイルは経路に入らない。`tryouts/llm-wiki` をカレントにすると経路に入る。Codex の起動はこの VM ではしていない。

## 使い方

作業ディレクトリは `tryouts/llm-wiki` にする。

質問はファイルを増やさない。`wiki/index.md` を開き、当たった記事を読む。機械的に当たる記事を見るときは次を実行する。

```sh
python3 check.py query 参加費
```

出典を足すときは `.agents/skills/llm-wiki/SKILL.md` の取り込みに従う。`raw/` の既存ファイルは変更しない。数値、日付、引用は raw にある形のまま記事に書く。その後に次を実行する。

```sh
python3 check.py
```

終了コード 0 と先頭の `OK` が出るまで直す。

別のツールから読むときの手順は次である。

1. そのツールの作業ディレクトリを `tryouts/llm-wiki` にする。
2. `wiki/index.md` を読む。
3. 索引のリンク先、たとえば `wiki/paper-plane/meeting.md` を読む。
4. 手順を確認するときは `.agents/skills/llm-wiki/SKILL.md` を読む。Claude Code のパスと Cursor のパスは、同じファイルへのリンクである。

## 動作例

題材は架空の青葉紙ヒコーキ会である。出典は2枚で、記事は2ページである。

`raw/paper-plane/2026-11-04-monday-note.md` には、集会が毎週月曜 19:00、会場が青葉公民館の 2 階和室、参加費が 200 円、と書いてある。`wiki/paper-plane/meeting.md` はその3つを記事にし、raw へのリンクと、飛行距離の記事へのリンクを持つ。

`raw/paper-plane/2026-11-04-distance-note.md` には、2026-11-02 の最長飛行が 11.4 メートル、飛ばした人が森アオ、機体が A4 の紙 1 枚、と書いてある。`wiki/paper-plane/distance.md` はその3つを記事にする。

`wiki/index.md` は2ページへのリンクを持つ。`wiki/log.md` は2件の ingest を持つ。

2026-11-04 の実行。

```text
$ python3 check.py
OK
skill: /agent/repos/ai-tryouts/tryouts/llm-wiki/.agents/skills/llm-wiki/SKILL.md
same_file_entries: 3
articles: 2
query 200 円: wiki/paper-plane/meeting.md
query 11.4: wiki/paper-plane/distance.md

$ python3 check.py query 参加費
query: 参加費
hit: wiki/paper-plane/meeting.md
```

終了コードはどちらも 0 だった。`stat` の inode は、正本と2つのリンク先がどれも `7603512` だった。

記事の `200 円` を `201 円` に変えて `python3 check.py` を実行すると、終了コードは 1 で、次を出した。

```text
FAIL
wiki/paper-plane/meeting.md has 201 outside raw
query '200 円' -> [], want ['wiki/paper-plane/meeting.md']
```

実行後に記事は元へ戻し、再度の `python3 check.py` は `OK` だった。

## この VM で動いたこと

- GitHub API で Astro-Han/karpathy-llm-wiki のライセンス、star 数、日時、tree、直近コミットを読んだ。
- fxtwitter の JSON で投稿本文を読んだ。
- `npx skills` 1.7.6 で上流スキルの一覧と、copy と symlink の両方のインストールが終了コード 0 で終わった。インストール先に `wiki/` は無かった。
- `python3 check.py` が、3入口の同一ファイル、索引、raw に無い数値、用意した検索3件を検査し、正常系は 0、壊した数値は 1 になった。
- リンク経由で `SKILL.md` を開き、`name: llm-wiki` があることを読んだ。集会の記事から `200 円` の行を読んだ。

## 動かせなかったこと

- `claude`、`codex`、`cursor` は `command -v` で見つからなかった。3製品がスキルや `AGENTS.md` を読み、質問に答える実行はしていない。
- 上流スキルの取り込みを、エージェントにやらせる実行はしていない。`/tmp` のインストールはファイルを置いたところで止まっている。
- `x.com` のページは 403 で、投稿本文は fxtwitter の JSON から取った。
- Snyk の High Risk の内容は、CLI の行以外は取れていない。
- obsidian-second-brain のビルドは実行していない。
- `@AGENTS.md` の展開、サブディレクトリの `.cursor/rules` の読込、Git ルートから始めた Codex の探索は、製品が無いので未確認である。

## 再現手順

1. `gh api repos/Astro-Han/karpathy-llm-wiki` でライセンス、stars、`pushed_at` を見る。tree は `gh api repos/Astro-Han/karpathy-llm-wiki/git/trees/HEAD?recursive=1` で見る。
2. 空のディレクトリで `git init` し、`npx skills add Astro-Han/karpathy-llm-wiki --skill karpathy-llm-wiki --agent claude-code codex cursor -y` を実行する。`.agents/skills/karpathy-llm-wiki` と、そこを指す `.claude/skills/karpathy-llm-wiki` ができる。`wiki/` はできない。
3. この試行で共有を見るときは、`tryouts/llm-wiki` で `python3 check.py` を実行する。`OK` と終了コード 0 を確認する。
4. 別経路の読みを見るときは、同じディレクトリで `python3 check.py query 参加費` を実行し、`wiki/paper-plane/meeting.md` を開く。

## 注意

秘密、トークン、鍵、パスワードはこのディレクトリに無い。上流パッケージは `/tmp` にだけ置き、この公開リポジトリにはコピーしていない。
