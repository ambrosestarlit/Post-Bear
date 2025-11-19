# Firebase設定手順書

このファイルでは、いいね・スタンプ機能を動かすためのFirebase設定方法を説明します。

## 📌 所要時間：約10分

## ステップ1：Firebaseアカウント作成

1. **Firebaseコンソールにアクセス**
   - https://console.firebase.google.com/ を開く
   - Googleアカウントでログイン（持っていない場合は作成）

## ステップ2：新しいプロジェクト作成

1. **「プロジェクトを追加」をクリック**

2. **プロジェクト名を入力**
   - 例：`ambrose-starlit-sns`
   - 好きな名前でOK
   - 「続行」をクリック

3. **Google アナリティクス**
   - 「このプロジェクトで Google アナリティクスを有効にする」のチェックを**外す**
   - （不要なので）
   - 「プロジェクトを作成」をクリック

4. **作成完了を待つ**
   - 30秒ほど待つ
   - 「新しいプロジェクトの準備ができました」と表示されたら「続行」

## ステップ3：Webアプリを追加

1. **Webアイコン（</>）をクリック**
   - プロジェクトの概要画面で、「ウェブ」と書かれた `</>` アイコンをクリック

2. **アプリのニックネームを入力**
   - 例：`Ambrose Starlit Web`
   - 「Firebase Hosting も設定します」は**チェックしない**
   - 「アプリを登録」をクリック

3. **Firebase SDK の追加**
   - 画面に表示されるコードの中から、以下の部分をコピー：

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

   - **このコードは後で使うので、メモ帳などに保存しておいてください**
   - 「コンソールに進む」をクリック

## ステップ4：Firestore データベースを有効化

1. **左メニューから「Firestore Database」をクリック**
   - 「構築」→「Firestore Database」を選択

2. **「データベースの作成」をクリック**

3. **セキュリティルールの選択**
   - 「本番環境モードで開始」を選択
   - 「次へ」をクリック

4. **ロケーションの選択**
   - 「asia-northeast1 (Tokyo)」を選択
   - 「有効にする」をクリック

5. **データベース作成を待つ**
   - 1-2分ほど待つ
   - 完了したら、空のデータベース画面が表示される

## ステップ5：セキュリティルールの設定

**重要：このステップをスキップすると動作しません！**

1. **「ルール」タブをクリック**
   - Firestore Databaseの画面上部にある「ルール」タブ

2. **以下のルールをコピー＆ペースト**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // reactions コレクションは誰でも読み書き可能
    match /reactions/{postId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

3. **「公開」ボタンをクリック**
   - 確認ダイアログが出たら「公開」

## ステップ6：Firebase設定をコードに追加

1. **`firebase-config.js` ファイルを開く**
   - プロジェクトのルートフォルダにあります

2. **ステップ3でコピーした `firebaseConfig` を貼り付け**

```javascript
// Firebase設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // ← ここを変更
  authDomain: "YOUR_AUTH_DOMAIN",      // ← ここを変更
  projectId: "YOUR_PROJECT_ID",        // ← ここを変更
  storageBucket: "YOUR_STORAGE_BUCKET",// ← ここを変更
  messagingSenderId: "YOUR_SENDER_ID", // ← ここを変更
  appId: "YOUR_APP_ID"                 // ← ここを変更
};
```

3. **ファイルを保存**

4. **GitHubにpush**
   - `firebase-config.js` をGitHubリポジトリにアップロード

## ✅ 完了！

これで設定完了です。GitHub Pagesを開いて、いいねボタンが動作するか確認してください。

---

## 🔒 セキュリティについて

現在の設定では、誰でもいいね・スタンプを押せますが、以下の制限があります：

- ✅ 同じブラウザから何度も押しても1回だけカウント（localStorage制限）
- ✅ スパム対策は簡易的に実装済み
- ⚠️ 完全なスパム防止ではない（必要なら後で強化可能）

---

## ❓ トラブルシューティング

### いいねボタンが表示されない
→ `firebase-config.js` の設定が正しいか確認

### いいねを押してもカウントされない
→ ブラウザのコンソールを開いてエラーを確認
→ Firestoreのセキュリティルールが正しいか確認

### エラー: "Missing or insufficient permissions"
→ セキュリティルールを再確認（ステップ5）

---

## 📊 データ確認方法

Firebaseコンソール → Firestore Database → データタブ

ここで、どの投稿に何個いいねがついているか確認できます。

---

## 💰 料金について

**無料枠で十分です：**
- 読み取り：50,000回/日
- 書き込み：20,000回/日
- ストレージ：1GB

普通に使う分には無料枠を超えることはありません。

---

**設定完了お疲れ様でした！🎉**
