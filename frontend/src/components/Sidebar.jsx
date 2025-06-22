import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const linkStyle = {
    display: "block",
    padding: "10px 15px",
    marginBottom: "8px",
    borderRadius: "8px",
    color: "#333",
    textDecoration: "none",
    fontWeight: "bold",
    transition: "background 0.2s",
  };

  const linkHover = {
    background: "#ddd"
  };

  return (
    <div style={{
      width: 220,
      background: "#f9f9f9",
      height: "100vh",
      padding: 20,
      boxShadow: "2px 0 5px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ marginBottom: 30, color: "#6c63ff" }}>KMZERA</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li><Link to="/dashboard" style={linkStyle}>📊 Dashboard</Link></li>
        <li><Link to="/produtos" style={linkStyle}>📦 Produtos</Link></li>
        <li><Link to="/usuarios" style={linkStyle}>👥 Usuários</Link></li>
        <li><Link to="/controle-gastos" style={linkStyle}>💸 Controle de Gastos</Link></li>
      </ul>
    </div>
  );
}
