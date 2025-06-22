
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  const fazerLogin = async () => {
    if (!email || !senha) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      const q = query(collection(db, "usuarios"), where("email", "==", email));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        alert("Usuário não encontrado");
        return;
      }

      const userData = snapshot.docs[0].data();
      if (userData.senha !== senha) {
        alert("Senha incorreta");
        return;
      }

      if (userData.banido) {
        alert("Usuário banido. Acesso negado.");
        return;
      }

      localStorage.setItem("usuario", userData.email);
      localStorage.setItem("tipo", userData.tipo || "pro");

      if (userData.tipo === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Erro ao fazer login", err);
      alert("Erro ao fazer login");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #7F00FF, #E100FF)",
    }}>
      <div style={{
        background: "white",
        padding: 30,
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        width: "100%",
        maxWidth: 320,
        textAlign: "center"
      }}>
        <h2 style={{ color: "#6a00c8", marginBottom: 20 }}>
          🚀 KMZERA FINANÇAS
        </h2>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button
          onClick={fazerLogin}
          style={{ width: "100%", padding: 10, borderRadius: 6, backgroundColor: "#6a00c8", color: "white", fontWeight: "bold", border: "none" }}
        >
          Entrar
        </button>
        <div style={{ marginTop: 10 }}>
          <a href="/recuperar" style={{ fontSize: 13, color: "#6a00c8", textDecoration: "underline" }}>
            Esqueci minha senha
          </a>
        </div>
      </div>
    </div>
  );
}
