import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function Produtos() {
  const [nome, setNome] = useState("");
  const [custo, setCusto] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [usuario, setUsuario] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("usuario");
    if (!email) window.location.href = "/";
    else {
      setUsuario(email);
      carregarProdutos(email);
    }
  }, []);

  const carregarProdutos = async (email) => {
    try {
      const q = query(collection(db, "produtos"), where("usuario", "==", email));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProdutos(lista);
    } catch (err) {
      console.error("Erro ao carregar produtos", err);
    }
  };

  const adicionarOuEditarProduto = async () => {
    if (!nome || !custo) return alert("Preencha todos os campos");

    const produto = {
      nome,
      custo: parseFloat(custo),
      usuario,
      criadoEm: new Date().toISOString(),
    };

    try {
      if (editandoId) {
        const ref = doc(db, "produtos", editandoId);
        await updateDoc(ref, produto);
        setEditandoId(null);
      } else {
        await addDoc(collection(db, "produtos"), produto);
      }

      setNome("");
      setCusto("");
      carregarProdutos(usuario);
    } catch (err) {
      console.error("Erro ao salvar produto", err);
    }
  };

  const editarProduto = (produto) => {
    setNome(produto.nome);
    setCusto(produto.custo);
    setEditandoId(produto.id);
  };

  const excluirProduto = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;
    try {
      await deleteDoc(doc(db, "produtos", id));
      carregarProdutos(usuario);
    } catch (err) {
      console.error("Erro ao excluir produto", err);
    }
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto",
        padding: 20,
        background: "#fefefe",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginBottom: 20, textAlign: "center", color: "#333" }}>
        📦 Cadastro de Produtos
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 20,
          background: "#fafafa",
          padding: 15,
          borderRadius: 10,
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <input
          type="text"
          placeholder="Nome do produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
        <input
          type="number"
          placeholder="Custo"
          value={custo}
          onChange={(e) => setCusto(e.target.value)}
          style={{
            flex: 1,
            minWidth: 100,
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
        <button
          onClick={adicionarOuEditarProduto}
          style={{
            padding: "10px 15px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: "bold",
            transition: "0.3s",
          }}
        >
          {editandoId ? "💾 Salvar Alterações" : "➕ Adicionar Produto"}
        </button>
      </div>

      <h3 style={{ marginBottom: 10, color: "#333" }}>📋 Lista de Produtos</h3>
      <ul style={{ padding: 0, listStyle: "none" }}>
        {produtos.map((p) => (
          <li
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              background: "#ffffff",
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #eee",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <span style={{ fontWeight: 500, color: "#444" }}>
              {p.nome} — <strong style={{ color: "#000" }}>R$ {Number(p.custo).toFixed(2)}</strong>
            </span>
            <span>
              <button
                onClick={() => editarProduto(p)}
                style={{
                  marginLeft: 5,
                  fontSize: 14,
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: "none",
                  background: "#e0e0e0",
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => excluirProduto(p.id)}
                style={{
                  marginLeft: 5,
                  fontSize: 14,
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: "none",
                  background: "#ffdddd",
                  color: "red",
                }}
              >
                🗑️
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
