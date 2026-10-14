# HTML-in-Canvas

このディレクトリは、HTML の要素を Canvas に描く API の試作用です。デモ A は日本語の組版を `drawElementImage()` で描き、`toBlob()` の PNG を `clipboard.write()` に渡します。デモ B は同じスナップショットを WebGL のテクスチャにして、渦のシェーダーでゆがめます。

## 動かし方

リポジトリのルートでローカルサーバーを起動します。`file://` では `clipboard.write()` が動きません。

```bash
python3 -m http.server 8765
```

ブラウザで `http://127.0.0.1:8765/tryouts/html-in-canvas/` を開きます。

フラグで試すときは、アドレスバーに次の URL を貼り付け、Enabled にして Chrome を再起動します。ページ内のリンクからは `chrome://` を開けません。

- `chrome://flags/#canvas-draw-element`
- `chrome://flags/#enable-experimental-web-platform-features`

Origin Trial で試すときは、[Origin trials](https://developer.chrome.com/origintrials/) で `html-in-canvas` のトークンを取ります。`index.html` の head にある meta のコメントを外し、`content` にそのトークンを入れます。トークンはコミットしません。空の meta をコメントのまま残してあるのが、入れる場所です。

## 対応状況

確認日は 2026-10-12 です。

WICG の explainer にある名前を使っています。canvas の `content` は `drawable` です。描く要素には `drawable` を付けます。2D は `drawElementImage(element, dx, dy)` です。WebGL は `texElementSubImage2D(target, level, xoffset, yoffset, element)` です。描画のタイミングは canvas の `paint` と `requestPaint()` です。

[Chrome Platform Status](https://chromestatus.com/feature/5172548013916160) のエントリは 2026-09-30 に更新されていました。状態は In development です。フラグは `chrome://flags/#canvas-draw-element` です。Finch 名は `CanvasDrawElement` です。Origin Trial 名は `html-in-canvas` です。最初の Origin Trial は desktop 148 から 150 です。延長の `desktop_last` は 154 と 160 です。公開マイルストーンの `desktop_first` は 157 です。157 の安定版は、この確認日にはまだ出ていません。

この環境の Chrome 154.0.8037.92 で確認しました。フラグがないと `drawElementImage` も `paint` もありません。`--enable-blink-features=CanvasDrawElement` を付けると、`paint`、`drawElementImage`、`texElementSubImage2D` がありました。`drawElementImage` の戻り値は `undefined` でした。`content` は `HTMLCanvasElement.prototype` にありません。`layoutsubtree` を付けた canvas ではピクセルが取れました。`content="drawable"` だけの canvas では `paint` が来ませんでした。

Chrome の記事（ページの更新日は 2026-09-29）は、Chrome 155 で `layoutsubtree` を `content="drawable"` に改名し、`texElementImage2D` を `texElementSubImage2D` に改名し、`drawElementImage` の戻り値を void にしたと書いています。このサンプルは、`content` が prototype にあるときは `content="drawable"` も付けます。無いときは HTML に書いた `layoutsubtree` のままです。WebGL は `texElementSubImage2D` だけを呼びます。

## 制限

クロスオリジンの画像や、explainer が機密とする描画はスナップショットに入りません。デモ B は外部の画像を使っていません。

デモ B の渦はピクセルの変形です。ヒットテストは要素の矩形のままです。`updateElementGeometry()` には単位行列を渡しています。

ビットマップの大きさは CSS ピクセルに合わせています。`devicePixelRatio` が 1 より大きい画面ではぼやけることがあります。この環境では 1 でした。

`clipboard.write()` には安全なコンテキストと、画像を書く許可が要ります。この環境のヘッドレス Chrome では、許可がないと `Write permission denied` になりました。許可を付けると PNG を書き込めました。失敗したときも、ページは `toBlob()` の PNG をプレビューに出します。

テクスチャの上下は、Chrome 154 で赤を上、青を下にした要素を読んで合わせました。別の版では逆になる可能性があります。

Firefox と Safari にはこの API がありません。そのときはキャンバスを出さず、未対応と有効にする手順を表示します。

## 出典

- [HTML-in-Canvas explainer](https://wicg.github.io/html-in-canvas/)（2026-10-12 に取得）
- [WICG/html-in-canvas](https://github.com/WICG/html-in-canvas)
- [whatwg/html#11588](https://github.com/whatwg/html/pull/11588)
- [Chrome Platform Status の HTML-in-canvas](https://chromestatus.com/feature/5172548013916160)
- [Intent to Experiment: HTML-in-canvas](https://groups.google.com/a/chromium.org/g/blink-dev/c/t_nGEmJ_v4s)
- [Introducing the HTML-in-Canvas API origin trial](https://developer.chrome.com/blog/html-in-canvas-origin-trial)
- [HTML-in-Canvas updates](https://developer.chrome.com/blog/html-in-canvas-ot-changes)（ページの更新日は 2026-09-29）
- [Get started with origin trials](https://developer.chrome.com/docs/web-platform/origin-trials)
