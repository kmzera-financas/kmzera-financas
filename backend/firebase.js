// firebase.js (uso no frontend React)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔐 Copie essas informações do seu Firebase Console (Configuração do app web)
const firebaseConfig = {
  apiKey: "AIzaSyDaMBMkq7BEky3RrcaYj4nbmPitHFvG0SU",
  authDomain: "kmzera-financas1.firebaseapp.com",
  projectId: "kmzera-financas1",
  storageBucket: "kmzera-financas1.appspot.com",
  messagingSenderId: "1092768036104",
  appId: "1:1092768036104:web:00cd29a5a29d2e10b968bd"
};

// 🔧 Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// 📦 Exporta o Firestore e Auth para usar nos componentes
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
