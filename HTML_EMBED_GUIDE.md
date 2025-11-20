# HTMLタグ埋め込み機能ガイド

## 概要
投稿テキスト内に特定のHTMLタグを直接記述することで、画像リンクや動画埋め込みを表示できます。

## 対応しているHTMLタグ

### 1. 画像リンク (`<a>` + `<img>`)
販売サイトへのリンク付き画像を表示できます。

**例: DLsite商品リンク**
```html
<a rel="noopener sponsored" href="https://dlaf.jp/girls/dlaf/=/t/i/link/work/aid/huhennsyounenn/id/RJ01504535.html" target="_blank"><img itemprop="image" src="//img.dlsite.jp/modpub/images2/work/doujin/RJ01505000/RJ01504535_img_main.jpg" alt="" border="0" class="target_type" /></a>
```

**特徴:**
- 画像をクリックすると販売サイトにジャンプ
- 自動的にレスポンシブ対応
- ホバー時にアニメーション効果
- `rel="noopener"` で安全にリンクを開く
- `rel="sponsored"` でアフィリエイトリンクを明示

### 2. 動画埋め込み (`<iframe>`)
外部動画サービスの動画を投稿に埋め込めます。

**例: Chobit.cc動画埋め込み**
```html
<iframe width="560" height="347" frameborder="0" allowfullscreen="" src="https://chobit.cc/embed/5r8uv/2uurw7u6?aid=huhennsyounenn"></iframe>
```

**特徴:**
- 自動的にレスポンシブ対応 (16:10のアスペクト比)
- モバイルでも最適なサイズで表示
- フルスクリーン再生対応

## 使い方

### 管理画面での投稿方法

1. 管理画面の投稿フォームを開く
2. 投稿テキスト欄に通常のテキストと一緒にHTMLタグを貼り付ける
3. 他のハッシュタグや本文と組み合わせて使用可能
4. 「投稿」ボタンをクリック

**例:**
```
新作をリリースしました!🎉
詳細はこちらからどうぞ👇

<a rel="noopener sponsored" href="https://dlaf.jp/girls/dlaf/=/t/i/link/work/aid/huhennsyounenn/id/RJ01504535.html" target="_blank"><img itemprop="image" src="//img.dlsite.jp/modpub/images2/work/doujin/RJ01505000/RJ01504535_img_main.jpg" alt="" border="0" class="target_type" /></a>

#おしらせ #不変少年+
```

### 複数のHTMLタグを含む投稿

一つの投稿に複数のHTMLタグを含めることもできます。

**例:**
```
作品紹介動画も公開中です!

<iframe width="560" height="347" frameborder="0" allowfullscreen="" src="https://chobit.cc/embed/5r8uv/2uurw7u6?aid=huhennsyounenn"></iframe>

購入はこちらから↓

<a rel="noopener sponsored" href="https://dlaf.jp/girls/dlaf/=/t/i/link/work/aid/huhennsyounenn/id/RJ01504535.html" target="_blank"><img itemprop="image" src="//img.dlsite.jp/modpub/images2/work/doujin/RJ01505000/RJ01504535_img_main.jpg" alt="" border="0" class="target_type" /></a>

#おしらせ #不変少年+
```

## 注意事項

### セキュリティ
- `rel="noopener"` は必ず含めてください (リンク先からの参照を防ぐため)
- 信頼できるサイトのHTMLタグのみ使用してください

### スタイリング
- HTMLタグは自動的にサイトのデザインに合わせてスタイリングされます
- 画像とiframeは自動的にレスポンシブ対応されます
- カスタムスタイルを追加する必要はありません

### 対応タグ
現在、以下のHTMLタグのみ対応しています:
- `<a>` タグ (リンク)
- `<img>` タグ (画像)
- `<iframe>` タグ (埋め込みコンテンツ)

その他のHTMLタグは自動的にエスケープされ、テキストとして表示されます。

## トラブルシューティング

### HTMLタグが表示されない
- タグの記述に誤りがないか確認してください
- 閉じタグが正しく記述されているか確認してください
- `<a>` タグの場合、`</a>` で閉じる必要があります
- `<iframe>` タグの場合、`</iframe>` で閉じる必要があります

### 画像が表示されない
- 画像URLが正しいか確認してください
- 外部サイトの画像URLが有効か確認してください
- HTTPSプロトコルを使用しているか確認してください

### iframeが表示されない
- iframe のsrc属性が正しいか確認してください
- 埋め込み先のサイトが iframe での埋め込みを許可しているか確認してください

## その他の機能との併用

HTMLタグは以下の機能と併用できます:
- ハッシュタグ (#おしらせ など)
- 通常のURL (自動リンク化)
- カスタム絵文字
- 【リアクション】ボタン

すべて一つの投稿に含めることができます。

## サンプル投稿

### DLsite商品紹介
```
【新作】不変少年+の新作をリリースしました!

<a rel="noopener sponsored" href="https://dlaf.jp/girls/dlaf/=/t/i/link/work/aid/huhennsyounenn/id/RJ01504535.html" target="_blank"><img itemprop="image" src="//img.dlsite.jp/modpub/images2/work/doujin/RJ01505000/RJ01504535_img_main.jpg" alt="" border="0" class="target_type" /></a>

ご感想お待ちしています!【リアクション】

#おしらせ #不変少年+
```

### 動画埋め込み
```
制作過程の動画をアップしました🎬

<iframe width="560" height="347" frameborder="0" allowfullscreen="" src="https://chobit.cc/embed/5r8uv/2uurw7u6?aid=huhennsyounenn"></iframe>

#日常 #制作進捗
```
