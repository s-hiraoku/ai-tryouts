---
name: llm-wiki
description: この試行の共有ログブックを読む、追記する、点検する。LLM wiki、Karpathy wiki、ingest、query、lint、ログブックと言われたときに使う。
---

# 共有ログブック

このファイルから親ディレクトリを辿る。`wiki/index.md` と `AGENTS.md` が同じディレクトリにある場所を試行ルートにする。ログブックはそこにある `wiki/` だけである。出典はそこにある `raw/` だけである。`.claude`、`.cursor`、`.agents` の下に二つ目の `wiki/` を作らない。

手順の正本はこのファイルである。Claude Code、Codex、Cursor の入口は、このファイルへのリンクである。

## クエリ

ファイルを書かない。

1. `wiki/index.md` を読む。
2. `wiki/` を語句で検索する。索引と本文の両方が空なら、検索して空だったと答える。
3. 答えは `wiki/` の文を優先する。引用リンクは試行ルートからの相対パスにする。

## 取り込み

1. 出典を `raw/<topic>/YYYY-MM-DD-名前.md` に保存する。既存の `raw/` ファイルは変更しない。
2. 既に同じことだけなら、記事は足さない。`wiki/log.md` に `No material` と raw の相対パスを書く。
3. 新しいことは `wiki/<topic>/<概念>.md` に書く。数値、日付、引用は、書く前にリンク先の raw で見つける。raw に無い形では書かない。
4. 触った記事を `wiki/index.md` に足す。`wiki/log.md` に日付、Disposition、raw の相対パスを足す。

## 点検

試行ルートで `python3 check.py` を実行する。終了コードが 0 でなければ、表示された行を直してからもう一度実行する。
