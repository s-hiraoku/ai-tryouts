# document-skills でスライドを作る試行

公式の `document-skills` を入れ、資料を置いたフォルダから編集できる pptx を作る手順を再現した。

## 結論

プラグインの導入と、pptx Skill の生成手順で 10 枚のデッキを作るところまでは、この VM で確認できた。ログインした Claude Code が資料を読んでデッキを書くところは、確認できなかった。

Claude Code CLI `2.1.312` にマーケットプレイス `anthropic-agent-skills` を追加し、`document-skills` を user スコープで入れた。中身は Skill が 4 つで、`docx`、`pdf`、`pptx`、`xlsx` だった。`claude auth status` は `loggedIn` が false、`authMethod` が `none` だった。その状態で元ポストのプロンプトを `claude -p` に渡すと、標準出力は次の 1 行で、終了コードは 1 だった。

```text
Not logged in · Please run /login
```

デッキ `output/aoba-bird-walk.pptx` は、その失敗のあと、同じコミットの pptx Skill が書く手順で作った。Claude Code の出力ではない。

## 元のポスト

[元のポスト](https://x.com/biscuitweb/status/2114771370869494130) は 2026-10-26 の @biscuitweb。x.com のページは 403 だった。X の投稿取得は請求エラーで止まった。公開ミラー `api.fxtwitter.com` が同じ status ID の JSON を返し、その `text` を読んだ。

ポストの手順は次のとおり。

1. Claude Code を入れる。
2. Claude Code の中で `/plugin marketplace add anthropics/skills` を実行する。
3. `/plugin install document-skills@anthropic-agent-skills` を実行する。
4. brief、ロゴ、画像、データを 1 つのフォルダに置く。
5. そのフォルダで Claude Code を開く。
6. 下のプロンプトで 10 枚の pptx を頼む。
7. 直しはスライド番号で頼む。例は `slide 4: replace the paragraph with a chart and keep the source underneath`。

ポストが指すリポジトリは [anthropics/skills](https://github.com/anthropics/skills)。

## 入れ方

読んだ公式の説明は、コミット `ca45fc496a3436251f191354091d557da31c15b5` の README と `.claude-plugin/marketplace.json`。このコミットは 2026-10-28 12:20:38 -0700 で、件名は `Update mcp-builder skill: teach v2 of the MCP TypeScript SDK (#2087)`。Claude Code が user スコープに展開したコピーも同じ SHA で、`skills/pptx/SKILL.md` はバイト列が一致した。

README にある入れ方は 2 通り。

対話セッションでは、次を順に実行する。

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

もう 1 つは画面から選ぶ手順。`Browse and install plugins`、マーケットプレイス `anthropic-agent-skills`、`document-skills`、`Install now`。この画面は開いていない。確認できなかった。

この VM ではシェルから入れた。表示は次のとおり。

```text
Successfully added marketplace: anthropic-agent-skills (declared in user settings)
Successfully installed plugin: document-skills@anthropic-agent-skills (scope: user)
```

`claude plugin details document-skills@anthropic-agent-skills` は Skills 4、Agents 0、Hooks 0、MCP servers 0。常時コストの見積もりは約 759 トークン。`pptx` を使うとそのとき約 5,000 トークン、という見積もりだった。見積もりであり、実測の請求ではない。

`marketplace.json` のプラグイン名は `document-skills`。マーケットプレイス名は `anthropic-agent-skills`。スキルは `./skills/xlsx`、`./skills/docx`、`./skills/pptx`、`./skills/pdf`。ポストの `@` の後ろがリポジトリ名ではなくマーケットプレイス名であることは、この JSON と一致する。

## 使ったプロンプト

Claude Code に渡した文は、ポストの本文と同じ。

```text
use the pptx skill. turn these files into a 10-slide presentation. show me the outline first, keep one idea per slide, cite every number, match the colors from my logo and export an editable pptx
```

実行したコマンドは、`materials/` をカレントにして `claude -p` にこの文と `--max-turns 2` を付けたもの。結果はログインエラーだけ。アウトラインも pptx も返っていない。

直しの例 `slide 4: replace the paragraph with a chart and keep the source underneath` は、2 回目の依頼として実行していない。確認できなかった。

ログインが無いので、デッキは pptx Skill の手順で作った。新規デッキは `pptxgenjs` のスクリプトを書き、`writeFile` のあと `scripts/office/validate.py` にかける。テキストは `markitdown`。画像は `scripts/office/soffice.py --headless --convert-to pdf` のあと `pdftoppm -jpeg -r 150`。この 4 つは、上のコミットの `skills/pptx/SKILL.md` に書いてある。

`require("pptxgenjs")` は最初に失敗した。Skill はそのときだけ `npm install pptxgenjs` すると書く。入れた版は `4.0.1`。`markitdown`、LibreOffice、`pdftoppm` もこの VM には無かったので入れた。Skill は、それらが既にある前提でコマンドを書いている。

スクリプト `build-deck.cjs` は、書く前にアウトラインを標準出力へ出す。これは Claude の対話ではなく、ポストの "show me the outline first" をスクリプト側で置いたもの。標準出力は次のとおり。

```text
1. 表紙。2026-11-07 7:30 青葉中央公園の北口
2. 目的。初めて参加する人が、自分の双眼鏡でピントを合わせ、池の鳥を指させる。
3. 日時と場所。90分
4. 90分の内訳。
5. 順路。1.2km 2か所
6. 定員 12人、参加費 0円、貸出 6台
7. 対象と雨天。
8. 当日の係。
9. 数字の出典。
10. 当日の入口。7:30 青葉中央公園の北口
```

## 出来上がり

資料は `materials/brief.md` と `materials/route.md`。架空の朝の野鳥観察会で、青葉中央公園も青葉野鳥の会も実在しない。ロゴ画像は置いていない。色は `brief.md` の `森` `2C5F2D`、`苔` `97BC62`、`紙` `FFFFFF`。ポストが言うロゴ画像からの色合わせは、確認できなかった。

デッキは `output/aoba-bird-walk.pptx`。レイアウトは `LAYOUT_WIDE` で、横 13.33 インチ、縦 7.5 インチ。フォント名は `Noto Serif CJK JP` と `Noto Sans CJK JP`。この VM にそのフォントがあるので、JPEG の字幅はファイルに書いたフォント名と一致する。

10 枚の役割は次のとおり。

1. 表紙。日付、時刻、場所。
2. 目的。数字は無い。
3. 日時と場所。
4. 分数の縦棒グラフ。15、40、30、5。合計 90 分。
5. 順路。距離 1.2km、観察地点 2 か所。見る鳥の例に羽数は無い。
6. 定員 12 人、参加費 0 円、貸出双眼鏡 6 台。
7. 対象と雨天中止。
8. 案内、記録、貸出係。各 1 人。
9. 数字と色の出典一覧。左が `brief.md`、右が `route.md`。
10. 当日の入口。北口、7:30、定員と参加費。

スライド上の数字は、スクリプトが Markdown から読んだ値だけ。表の合計が `所要: 90分` と違うと、スクリプトは pptx を書く前に終了する。`validate.py` は `All validations PASSED!`。`markitdown` は 10 枚で、プレースホルダ検索は 0 件。各枚の JPEG は `output/slide-01.jpg` から `output/slide-10.jpg`。PDF は `output/aoba-bird-walk.pdf`。

グラフの値は `route.md` の表と一致する。15、40、30、5 の合計は 90 で、`brief.md` の所要と同じ。

## 制約

- Claude Code は未ログイン。デッキの作者は Claude Code ではない。
- 対話のプラグイン選択画面は開いていない。
- ロゴ、写真、表計算ファイルは置いていない。資料は Markdown 2 本。
- 直しプロンプトの 2 ターン目は実行していない。4 枚目は最初からグラフである。
- pptx Skill の LICENSE は再配布を制限する。Skill のソースはこのリポジトリに置いていない。使ったのは手順と、インストール先の `validate.py` と `soffice.py`。
- 画面確認は LibreOffice 24.2.7.2 の PDF と JPEG。PowerPoint で開いた確認はしていない。
- フォント名は Noto CJK。Noto の無い PowerPoint は別のフォントに置き換える。そのときの字幅は、この JPEG と違うことがある。
- 計画の数字は架空。実在の観察記録ではない。

## 出典

- 元のポストは [https://x.com/biscuitweb/status/2114771370869494130](https://x.com/biscuitweb/status/2114771370869494130)。
- リポジトリは [anthropics/skills](https://github.com/anthropics/skills/tree/ca45fc496a3436251f191354091d557da31c15b5)、コミット `ca45fc496a3436251f191354091d557da31c15b5`。
- 入れ方は [README の Claude Code](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/README.md)。
- プラグイン名は [marketplace.json](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/.claude-plugin/marketplace.json)。
- デッキの手順は [skills/pptx/SKILL.md](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/pptx/SKILL.md)。
