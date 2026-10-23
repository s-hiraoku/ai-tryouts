# 6段階の記録

版は `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` の `skills/security-audit/SKILL.md` と README である。プロファイルは `quick`。対象は `sample/`。出力は `audit/run-1/`。

## 1. 下調べ

技能は、製品、権限、入口、ローカル実行の4つの調査役にソースだけを読ませる。この実行もその4役を別セッションで走らせた。

出力は `audit/run-1/architecture.md` と、検証に通った `coverage-ledger.json` の初期台帳である。台帳は入口と境界と攻撃クラスの組み合わせで8単位。サブシステムは `profile/quick/all-in-scope-subsystems`。以前の台帳は無い。

調査がソースから言ったことは次のとおり。

- ホストの呼び出し元の `request.query` は信用しない、と `README.md` にある。
- `findUserByName` は名前を SQL 文字列へ連結する。`findUserById` は値を第2引数へ渡す。
- `readUserFile` はパスを連結して読む。`readPublicDoc` は `readme.txt` と `notes.txt` だけを読む。
- `authorizationHeader` はソース上の `DUMMY_NOT_A_REAL_KEY` を `Bearer` 文字列にして返す。このファイルはそれを送信しない。

## 2. 弱点探し

技能は台帳の単位を、探した役とは別の検証役へ渡す前に、担当を分けたハンターへ渡す。この実行は5役で8単位を1波だけ担当した。`quick` は hunter の波を1回にする。

| 役 | 単位 | 結果 |
| --- | --- | --- |
| hunter-injection | 名前の SQL、id の SQL、`describeLookup` | 名前の SQL だけ候補。残り2つは covered |
| hunter-files | `readUserFile`、`readPublicDoc` | `readUserFile` だけ候補。公開文書は covered |
| hunter-secrets | `authorizationHeader` | covered。候補なし |
| hunter-obvious | リポジトリ全体の定番項目 | covered。資格情報リテラルは secrets 担当へ譲った |
| hunter-wildcard | 割り当て外の振る舞い | covered。候補なし |

候補は2件。どちらも `proposed_verdict` は `needs_validation`。実行が承認されていないため、ハンターは `confirmed` を出していない。

資格情報ハンターは、リテラルが `DUMMY_NOT_A_REAL_KEY` であり、関数がログにもネットワークにも出さない、という理由で候補にしなかった。

## 3. 反証

`quick` では、候補ごとに新しい検証役が1人だけ付き、この段と第5段を兼ねる。検証役はハンターのセッションではない。

SQL 候補の検証役は `needs_validation` のまま返した。ソース上の連結は崩れなかった。観測されていないのは `db.query` の引数リストである。

ファイル候補の検証役も `needs_validation` のまま返した。ソース上の連結は崩れなかった。観測されていないのは `fs.readFileSync` の戻りである。

`rejected` は0件。

## 4. 構造化出力

親が2件を `findings.json` に書き、`validate-findings.cjs` は `PASS: 2 findings valid` だった。台帳の `validate-coverage-ledger.cjs` は `PASS: 8 coverage units valid` だった。上流のテストは findings が 34 件、台帳が失敗 0 で通った。

## 5. 再確認

別の第5段は起動していない。`SKILL.md` の `quick` が、第3段の検証役に最終記録の点検もさせる、と書いている。この実行はその規則に従った。実行できなかった、ではない。

検証役はどちらも記録を置き換えず、同じ fingerprint の `needs_validation` を返した。

## 6. 報告

`REPORT.md`、`FINDINGS-DETAIL.md`、`NEEDS-VALIDATION.md` を最終記録から書いた。確認済みは0件。`FINDINGS-DETAIL.md` に再現手順は無い。

カバレッジ批評は1回だけ走った。`missing_units` も `reassign_ids` も空で、`stop` は true だった。`quick` はここで追加のハンターを出さない。
