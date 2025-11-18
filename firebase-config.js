// Firebase設定ファイル
// FIREBASE_SETUP.md の手順に従って、以下の値を設定してください

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase初期化（このコードは変更しないでください）
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
