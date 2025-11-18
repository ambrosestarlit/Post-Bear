// Firebase設定ファイル

const firebaseConfig = {
  apiKey: "AIzaSyCwWj6GwBNH6gd0bmc7GxI_-__ifxBHiT0",
  authDomain: "ambrose-starlit.firebaseapp.com",
  projectId: "ambrose-starlit",
  storageBucket: "ambrose-starlit.firebasestorage.app",
  messagingSenderId: "311659926548",
  appId: "1:311659926548:web:3b4b67a4030ac981298301",
  measurementId: "G-MGBJEH7Y4H"
};

// Firebase初期化（このコードは変更しないでください）
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
