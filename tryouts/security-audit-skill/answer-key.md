# 正解表

監査対象は `sample/` だけ。このファイルは監査エージェントに渡さない。

秘密の文字列はすべてダミーである。`DUMMY_NOT_A_REAL_KEY` は本物の鍵ではない。

| ID | 場所 | 判定 | 内容 |
| --- | --- | --- | --- |
| P1 | `src/library.js` 10–13 行 `findUserByName`。入口は 19–24 行 `handleLookup` | 欠陥 | 11 行で `request.query.name` を SQL 文字列へ連結する。`handleLookup` が `id` を持たないときこの関数へ入る。 |
| P2 | `src/library.js` 30–34 行 `readUserFile` | 欠陥 | 31–33 行で `request.query.file` を `data/user-files` に `path.join` して読む。`../private/payroll.txt` はディレクトリの外を読めた。 |
| P3 | `src/library.js` 44 行 `API_TOKEN`、46–48 行 `authorizationHeader` | 欠陥 | 資格情報をソースに直書きし、`Bearer` ヘッダ文字列にして返す。値は `DUMMY_NOT_A_REAL_KEY`。 |
| S1 | `src/library.js` 15–17 行 `findUserById` | 安全 | 16 行で `db.query` の第2引数へ値を渡す。SQL 文字列には入らない。`handleLookup` が `id` を持つときこちらへ入る。誤検知されやすい。 |
| S2 | `src/library.js` 36–42 行 `readPublicDoc` | 安全 | 38 行で名前が `readme.txt` か `notes.txt` のときだけ `data/public` を読む。集合の完全一致なので区切り文字は通らない。誤検知されやすい。 |
| S3 | `src/library.js` 26–28 行 `describeLookup` | 安全 | 27 行で入力を表示用の文字列へ連結して返す。SQL、ファイル、コマンド、ヘッダには渡さない。誤検知されやすい。 |

P1、P2、P3 が見つからなければ見逃し。S1、S2、S3 が欠陥として残れば誤検知。
