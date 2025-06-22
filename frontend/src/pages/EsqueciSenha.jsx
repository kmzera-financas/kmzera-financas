import React, { useState } from "react";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");

  const enviarParaWhatsApp = () => {
    if (!email) return alert("Digite seu e-mail para receber ajuda");
    const mensagem = encodeURIComponent(`Olá! Esqueci minha senha. Meu e-mail é: ${email}`);
    window.open(`https://wa.me/SEUNUMEROAQUI?text=${mensagem}`, "_blank");
  };

  return (
    <div className="login-wrapper">
      <div className="login-glass-box">
        <h2 className="login-title">🔐 Recuperar Acesso</h2>
        <p style={{ marginBottom: 15, color: "#999" }}>
          Digite seu e-mail cadastrado e entraremos em contato via WhatsApp.
        </p>
        <input
          type="email"
          placeholder="seuemail@kmzera.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={enviarParaWhatsApp}>📩 Solicitar ajuda</button>
        <a
          href="/"
          style={{
            display: "block",
            marginTop: 15,
            textAlign: "center",
            color: "#999",
            textDecoration: "underline",
            fontSize: 14,
          }}
        >
          ← Voltar ao login
        </a>
      </div>
    </div>
  );
}
