import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Usuarios from "./pages/Usuarios";
import ControleGastos from "./pages/ControleGastos";
import Login from "./pages/Login";
import EsqueciSenha from "./pages/EsqueciSenha";
import ProtectedRoute from "./components/ProtectedRoute";
import "./style.css";

export default function App() {
  const usuario = localStorage.getItem("usuario");

  useEffect(() => {
    const temaSalvo = localStorage.getItem("tema") || "light";
    document.documentElement.setAttribute("data-theme", temaSalvo);
  }, []);

  const alternarTema = () => {
    const temaAtual = document.documentElement.getAttribute("data-theme");
    const novoTema = temaAtual === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", novoTema);
    localStorage.setItem("tema", novoTema);
  };

  if (!usuario) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/recuperar" element={<EsqueciSenha />} />
          <Route
            path="*"
            element={
              <div className="login-wrapper">
                <div className="login-glass-box">
                  <h1 className="login-title">KMZERA FINANÇAS</h1>
                  <Login />
                  <a
                    href="/recuperar"
                    style={{
                      display: "block",
                      marginTop: 10,
                      color: "#999",
                      textDecoration: "underline",
                      fontSize: 14,
                    }}
                  >
                    Esqueci minha senha
                  </a>
                </div>
                <button className="theme-toggle" onClick={alternarTema}>
                  🌙 / ☀️
                </button>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <>
      <BrowserRouter>
        <div className="app-container">
          <Sidebar />
          <div className="app-content styled-box">
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/produtos"
                element={
                  <ProtectedRoute>
                    <Produtos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute>
                    <Usuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/controle-gastos"
                element={
                  <ProtectedRoute>
                    <ControleGastos />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>

      <button className="theme-toggle" onClick={alternarTema}>
        🌙 / ☀️
      </button>
    </>
  );
}
