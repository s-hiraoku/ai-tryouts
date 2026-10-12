# 宣言型部分更新

このディレクトリは、宣言型部分更新（Declarative Partial Updates）のうち、今の文書で試せる範囲のサンプルです。処理命令の印と `template for` で、枠の中だけを差し替えます。`streamAppendHTMLUnsafe` があるときだけ、同じ印へ段落を追記します。

## 動かし方

リポジトリのルートでローカルサーバーを起動します。

```bash
python3 -m http.server 8765
```

ブラウザで `http://127.0.0.1:8765/tryouts/declarative-partial-updates/` を開きます。

文書内のパッチは、Chrome のドキュメントでは Chrome 150 以降でフラグなしです。追記を試すときは、アドレスバーに `chrome://flags/#enable-experimental-web-platform-features` を貼り付け、Enabled にして再起動します。

対応していないブラウザでは、プレースホルダの文が残ります。追記の節には未対応と、フラグの手順を出します。

## 対応状況

確認日は 2026-10-12 です。

構文は HTML 標準と WICG の patching explainer に合わせています。範囲の差し替えは次です。

```html
<?start name="notice">
プレースホルダ
<?end>
<template for="notice">差し替え後</template>
```

挿入点だけを置くときは `<?marker name="stream-item">` です。追記は `element.streamAppendHTMLUnsafe().getWriter()` で、同じ名前の `template` を `write` します。最後に `close` します。

この環境の Chrome 154.0.8037.92 では、フラグなしで `template for` の差し替えが動きました。プレースホルダは消え、template の段落が枠の中に入りました。`streamAppendHTMLUnsafe` はフラグなしではありませんでした。`--enable-experimental-web-platform-features` を付けるとメソッドがあり、`write` した段落が枠に入りました。

[Out of order streaming](https://chromestatus.com/feature/5111042975465472) の Status は `accurate_as_of` が 2026-06-22 です。desktop の公開マイルストーンは 150、`flag` は false、Finch 名は `DocumentPatching` です。状態の文字は Proposed のままで、`is_released` は false でした。Chrome のドキュメント（2026-09-08 更新）は Chrome 150 で使えると書いています。この環境の 154 ではフラグなしで動きました。

[Renewed HTML insertion and streaming methods](https://chromestatus.com/feature/5054329641893888) は 2026-09-29 に更新されていました。desktop の公開マイルストーンは 157、dev trial は 148、`flag` フィールドは false、Finch 名は `NewHTMLSettingMethods` です。Chrome のドキュメントは、148 から実験フラグで試せて、155 で公開予定と書いています。Status の 157 とドキュメントの 155 は食い違っています。157 の安定版は、この確認日にはまだ出ていません。サンプルはメソッドがあるときだけ追記します。

## 制限

`template` は同じ木の中の印だけを更新します。Chrome のドキュメントでは、`innerHTML` で `template` を挿しても既存の文書の印は更新されません。追記はこのページでは `streamAppendHTMLUnsafe` だけを使います。

## 確認できなかったこと

次はサンプルに入れていません。

- ルートマッチング。Chromium の `route_matching` の README は、`navigator.routes` の名前は未定と書いています。テスト専用フラグの記述もあります。通常のフラグで使う確定した構文は、この確認では取れませんでした。
- `patchsrc`。Chromium のコミットと WPT はあります。Chrome のドキュメントは、検討中の追加として実験フラグに触れています。通常のページでどの属性が有効かは、この確認では切り分けていません。
- `contentrevision`。explainer にある案です。実装状況は確認していません。
- `streamAppendHTMLUnsafe` 以外の挿入メソッド。同じ系統ですが、このサンプルは追記の 1 つだけにしています。`setHTML` は Sanitizer API として別に存在するため、宣言型部分更新があるかどうかの判定には使っていません。

## 出典

- [WICG/declarative-partial-updates](https://github.com/WICG/declarative-partial-updates)
- [patching explainer](https://github.com/WICG/declarative-partial-updates/blob/main/patching-explainer.md)（2026-10-12 に取得）
- [HTML 標準の template 要素](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element)（2026-10-12 に取得。`for` と処理命令の手順がある）
- [whatwg/html#11818](https://github.com/whatwg/html/pull/11818)
- [Declarative partial updates](https://developer.chrome.com/docs/web-platform/declarative-partial-updates)（ページの更新日は 2026-09-08）
- [WebKit standards position 628](https://github.com/WebKit/standards-positions/issues/628)
- [Chrome Platform Status の Out of order streaming](https://chromestatus.com/feature/5111042975465472)
- [Chrome Platform Status の Renewed HTML insertion and streaming methods](https://chromestatus.com/feature/5054329641893888)
