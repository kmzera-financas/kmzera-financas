// firebase.js (frontend)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔐 Configuração correta do Firebase (copiada do painel)
const firebaseConfig = {
  apiKey: "AIzaSyDaMBMkq7BEky3RrcaYj4nbmPitHFvG0SU", // <- Corrigido: faltava o E no final
  authDomain: "kmzera-financas1.firebaseapp.com",
  projectId: "kmzera-financas1",
  storageBucket: "kmzera-financas1.appspot.com", // <- Corrigido: era .app, o certo é .com
  messagingSenderId: "1092768036104",
  appId: "1:1092768036104:web:00cd29a5a29d2e10b968bd"
};

// 🔧 Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Exporta Firestore e Auth
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
