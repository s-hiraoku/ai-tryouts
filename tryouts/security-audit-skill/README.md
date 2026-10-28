# security-audit-skill を小さなライブラリで試した

Cloudflare の [security-audit-skill](https://github.com/cloudflare/security-audit-skill) を入れ、わざと欠陥を入れた Node ライブラリを `quick` プロファイルで監査した。読者は、この技能が自分のリポジトリで何を返し、何を返さないかを見たい人である。

## 結論

この環境で6段階は走った。確認済みは 0 件。反証のあと残った指摘は要確認が 2 件。却下は 0 件。

正解表の SQL 連結とパストラバーサルは要確認として残った。ソースに直書きした `DUMMY_NOT_A_REAL_KEY` は候補にならなかった。安全な 3 例も候補にならなかった。

対象コードは監査の中では実行していない。技能は、必要な隔離が揃わないときは確認済みにしない。この実行はその規則で止まった。取っかかりの点検には使える。確認済みのバグ一覧としては、この1回の結果を使えない。

## 出典と使った版

公開スキルの `main` を 2026-10-23 に `git ls-remote` と `git clone --depth 1` で取り、HEAD は `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` だった。コミットメッセージは `Clarify guidance and full audit modes`、日付は 2026-09-14 である。入れたファイル 20 個の SHA-256 は、そのクローンと一致した。

`skills-lock.json` の `computedHash` は `98b97aad2873b3b9a8e064007c25e7827b493ba27fda8bfbdb41dab586767973` である。ロックファイルに Git のコミット ID は無い。

ライセンスはリポジトリ直下の `LICENSE` が MIT である。著作権表示は `Copyright (c) 2025-2026 Cloudflare, Inc.` である。写しを `UPSTREAM-LICENSE` に置いた。

6段階は、そのコミットの README と `skills/security-audit/SKILL.md` の Full audit workflow が同じ順で書いている。

1. 下調べ。`architecture.md` と `coverage-ledger.json`。
2. 台帳に沿った弱点探し。
3. 候補を、見つけた役とは別の役が崩しにいく。
4. `findings.json` をスキーマで検査する。
5. 別の役が最終記録のソース記述を確かめる。
6. `REPORT.md`、`FINDINGS-DETAIL.md`、`NEEDS-VALIDATION.md` を記録から作る。

判定は `confirmed`、`needs_validation`、`rejected` の3つである。README は、確かめる役を見つけた役と同じにしない、と書いている。

[Cloudflare のブログ](https://blog.cloudflare.com/build-your-own-vulnerability-harness) は、出発点が約450行の技能で、当時は1セッションの7段階だった、と書いている。公開版は整理されて6段階である。ブログは、1回の実行で見つかるのは複数回の合計のだいたい半分だ、とも書いている。128 リポジトリへの展開はブログの記述であり、この試行では再現していない。

元のポストは [rinmon の投稿](https://x.com/rinmon/status/2113058641775649182) である。X API の `get_posts_by_id` は `credits depleted` で本文を返さなかった。公開ミラー `api.fxtwitter.com` が同じ status ID の JSON を返し、その `text` を読んだ。投稿は技能の公開を伝え、リンク先は [CHOTTO NEWS の記事](https://chotto.news/s/y4qbltu4/) である。記事の6段階は GitHub の README と一致する。記事のスター数や料金の話は、この試行では測っていない。

確認できなかったこと。

- X API からの投稿本文。
- `skills-lock.json` 単体からのコミット ID。中身の一致で版を特定した。
- ブログが言う初期450行そのもののファイル。公開版の `SKILL.md` は192行で、付属文書を含む。

## 入れ方

試行ディレクトリで次を実行した。リポジトリの一番上には書いていない。

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \
  --skill security-audit \
  --agent cursor \
  -y \
  --copy
```

Skills CLI は `1.7.4` だった。コピー先は `tryouts/security-audit-skill/.agents/skills/security-audit` である。Cursor 向けのプロジェクト配置は、CLI の定義ではカレントの `.agents/skills` である。

## サンプル

`sample/` が監査対象である。正解表は `answer-key.md` で、監査役には読ませていない。

監査の前に、親が `node` で関数を1回呼んだ。名前の連結は SQL 文字列に入った。`id` は第2引数の配列に残った。`../private/payroll.txt` は `readUserFile` からダミーの給与行を返した。`readPublicDoc` は同じ値を拒否した。`authorizationHeader` は `Bearer DUMMY_NOT_A_REAL_KEY` を返した。この呼び出しは監査の証拠ではない。正解表が本当にその挙動かを見るためのものである。

## 監査の結果

各段の内容と出力は `PHASES.md` に書いた。機械が検査した成果物は `audit/run-1/` にある。

残った指摘。

- `src/library.js:findUserByName:name-sql-concatenation`。要確認。SQL 文字列への連結。
- `src/library.js:readUserFile:path.join:request.query.file`。要確認。ディレクトリ検査の無いファイル読み取り。

落ちた指摘。反証で `rejected` になった候補は無い。

正解表との突き合わせ。

| 正解 | 監査 |
| --- | --- |
| P1 SQL 連結 | 要確認として残った。見逃しではない。確認済みでもない |
| P2 パストラバーサル | 要確認として残った。見逃しではない。確認済みでもない |
| P3 直書きのダミー資格情報 | 候補にならなかった。見逃し |
| S1 バインドした id 検索 | 候補にならなかった。誤検知ではない |
| S2 名前の完全一致で読む公開文書 | 候補にならなかった。誤検知ではない |
| S3 表示用の文字列連結 | 候補にならなかった。誤検知ではない |

P3 を候補にしなかった理由は、資格情報ハンターがソースを読んで、値がダミーであり、この関数が送信もログもしない、と判断したことである。定番項目のハンターも、そのリテラルを自分の候補にせず、資格情報の単位へ譲った。

## 注意

- 1回の `quick` は部分的な監査である。技能自身が、1回で全部は見つからない、と書いている。
- 隔離が技能の条件を満たさないあいだ、確認済みは出ない。この VM ではループマウントと cgroup の作成ができなかった。
- ハンターと検証役は別セッションだが、同じ `grok-4.7-xhigh` である。Claude Opus はアカウントの週次枠に無く、検証役に使えなかった。ブログが勧める「発見と検証でモデルを変える」は、この実行ではできていない。
- 保存したハンターと検証の JSON は、親が返却を書き写したものである。判定、fingerprint、トレースの行は変えていない。一部の説明文は短くした。
- 技能の既定の出力先はホームディレクトリである。この試行では、依頼どおり tryout の下に置いた。対象の `sample/` の外である。
- ダミー文字列を本物の鍵として扱わない。`DUMMY_NOT_A_REAL_KEY` はプレースホルダである。
- この技能はソースを読む点検である。動いているサイトを外から守るものではない。

判断の記録は `DECISIONS.md` にある。
