# 📧 メール通知機能セットアップガイド

投稿が公開されたときに自動でメール通知を受け取れる機能のセットアップ手順です。

## 📋 概要

GitHub Actionsを使って、`posts.json`が更新されたときに自動でメール通知を送信します。

### 通知内容
- 🌟 投稿のテキスト（最初の100文字）
- 🕐 投稿日時
- 🆔 投稿ID
- 🏷️ ハッシュタグ
- 📱 投稿ページへのリンク

### 所要時間
約10分

---

## 🚀 セットアップ手順

### ステップ1：Gmailアプリパスワードの取得

Gmailからメール送信するための専用パスワードを生成します。

⚠️ **重要**: アプリパスワードの設定画面は、Googleアカウントの通常のメニューからは見つかりません。以下の直接リンクからアクセスしてください。

1. **2段階認証を有効化**（まだの場合）
   - https://myaccount.google.com/security にアクセス
   - ログイン
   - 「Googleへのログイン」セクションの「2段階認証プロセス」をクリック
   - 「使ってみる」をクリック
   - 画面の指示に従って電話番号を設定し、2段階認証を有効化

2. **アプリパスワード生成ページに直接アクセス**
   - **https://myaccount.google.com/apppasswords** にアクセス
   - （再度ログインを求められる場合があります）

3. **アプリパスワードを生成**
   - 「アプリ名」の入力欄に「GitHub Actions」と入力
   - 「作成」をクリック
   - **16桁のパスワードが表示されます** → これをコピー（スペースは無視してOK）

   ⚠️ このパスワードは一度しか表示されないため、必ずコピーしてください！

💡 **Tip**: アプリパスワードのメニューが見つからない場合は、上記の直接リンク（https://myaccount.google.com/apppasswords）を使用してください。Googleはセキュリティ上の理由でこの機能をあまり目立たせていません。

---

### ステップ2：GitHub Secretsの設定

GitHubリポジトリに安全にメール情報を保存します。

1. **GitHubリポジトリにアクセス**
   - あなたのGitHubリポジトリページを開く
   - 例: `https://github.com/your-username/your-repo`

2. **Settingsタブを開く**
   - 画面上部の「Settings」タブをクリック

3. **Secrets and variablesページに移動**
   - 左メニュー「Security」セクションの「Secrets and variables」をクリック
   - 「Actions」をクリック

4. **新しいSecretを追加（1つ目）**
   - 「New repository secret」ボタンをクリック
   - **Name:** `MAIL_USERNAME`
   - **Secret:** あなたのGmailアドレス（例: `your-email@gmail.com`）
   - 「Add secret」をクリック

5. **新しいSecretを追加（2つ目）**
   - 再び「New repository secret」ボタンをクリック
   - **Name:** `MAIL_PASSWORD`
   - **Secret:** ステップ1で取得した16桁のアプリパスワード（スペースは削除してもOK）
   - 「Add secret」をクリック

✅ これで2つのSecretsが登録されました！

---

### ステップ3：通知先メールアドレスの設定

デフォルトでは `ambrose.starlit@gmail.com` に通知が届きます。  
変更したい場合は以下の手順を実行してください。

1. **ワークフローファイルを編集**
   - GitHubリポジトリで `.github/workflows/post-notification.yml` を開く
   - 「Edit this file」（鉛筆アイコン）をクリック

2. **通知先アドレスを変更**
   - 以下の行を探す：
     ```yaml
     to: ambrose.starlit@gmail.com
     ```
   - あなたのメールアドレスに変更：
     ```yaml
     to: your-email@example.com
     ```

3. **変更をコミット**
   - 「Commit changes...」をクリック
   - コミットメッセージを入力（例: "Update notification email"）
   - 「Commit changes」をクリック

---

### ステップ4：動作確認

設定が完了したら、実際に投稿してメール通知が届くか確認しましょう。

1. **管理画面から投稿**
   - `admin/index.html` にアクセス
   - テスト投稿を作成
   - 「投稿」ボタンをクリック

2. **GitHub Actionsの実行確認**
   - GitHubリポジトリの「Actions」タブをクリック
   - 最新のワークフロー実行をクリック
   - 「notify」ジョブが成功しているか確認

3. **メール受信確認**
   - 数分以内にメールが届くはず
   - 届かない場合はスパムフォルダも確認

---

## 🎨 メール通知のカスタマイズ

### 件名を変更する

`.github/workflows/post-notification.yml` の以下の部分を編集：

```yaml
subject: '🌟 Ambrose*Starlit SNS - 新しい投稿が公開されました'
```

### 本文テンプレートを変更する

同ファイルの `html_body:` セクションにHTMLテンプレートがあります。
色やレイアウトを自由にカスタマイズできます。

---

## 🛠️ トラブルシューティング

### メールが届かない

**確認1：GitHub Secretsが正しく設定されているか**
- リポジトリ → Settings → Secrets and variables → Actions
- `MAIL_USERNAME` と `MAIL_PASSWORD` が存在するか確認

**確認2：Gmailアプリパスワードが有効か**
- Googleアカウント → セキュリティ → アプリパスワード
- パスワードがまだ有効か確認（削除されていないか）

**確認3：ワークフローが実行されているか**
- リポジトリ → Actions タブ
- 最新のワークフロー実行結果を確認
- エラーメッセージがあれば内容を確認

**確認4：スパムフォルダを確認**
- メールがスパムに振り分けられている可能性があります

**確認5：Gmailの設定**
- 「安全性の低いアプリのアクセス」がブロックされていないか確認
- ただし、アプリパスワードを使用している場合はこれは不要

### ワークフローがエラーになる

**エラー例：`Authentication failed`**
→ アプリパスワードが間違っている可能性
→ GitHub Secretsの `MAIL_PASSWORD` を再設定

**エラー例：`Permission denied`**
→ GitHub Actionsの権限不足
→ リポジトリ → Settings → Actions → General
→ 「Workflow permissions」で「Read and write permissions」を選択

### メール送信が遅い

GitHub Actionsの実行には数分かかることがあります。
通常、投稿後2〜5分以内にメールが届きます。

---

## 💡 高度な設定

### 複数の宛先に送信する

`.github/workflows/post-notification.yml` の `to:` フィールドをカンマ区切りで複数指定：

```yaml
to: email1@example.com,email2@example.com,email3@example.com
```

### 特定のハッシュタグのみ通知する

ワークフローファイルに条件分岐を追加できます。
詳しくは GitHub Actions のドキュメントを参照してください。

### 他のメールサービスを使う

Gmail以外（Outlook、Yahoo!など）を使う場合は、各サービスのSMTP設定を調べて
ワークフローファイルの以下の部分を変更してください：

```yaml
server_address: smtp.gmail.com  # 変更
server_port: 587                # 必要に応じて変更
```

---

## 📚 参考リンク

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [Gmail アプリパスワード](https://support.google.com/accounts/answer/185833)
- [action-send-mail GitHub](https://github.com/dawidd6/action-send-mail)

---

## 💬 サポート

うまく動かない場合は、GitHubのIssuesでお気軽にお問い合わせください！
