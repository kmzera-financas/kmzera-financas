import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ControleGastos() {
  const [usuario, setUsuario] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [limite, setLimite] = useState("");
  const [gastosPorCategoria, setGastosPorCategoria] = useState({});
  const [editarId, setEditarId] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem("usuario");
    if (!email) {
      window.location.href = "/";
    } else {
      setUsuario(email);
      carregarCategorias(email);
      calcularGastos(email);
    }
  }, []);

  const carregarCategorias = async (email) => {
    const q = query(collection(db, "categorias"), where("usuario", "==", email));
    const snapshot = await getDocs(q);
    const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCategorias(dados);
  };

  const calcularGastos = async (email) => {
    const q = query(collection(db, "transacoes"), where("usuario", "==", email), where("tipo", "==", "saida"));
    const snapshot = await getDocs(q);
    const gastos = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const cat = data.descricao.split(" ")[0].toLowerCase();
      gastos[cat] = (gastos[cat] || 0) + parseFloat(data.valor);
    });
    setGastosPorCategoria(gastos);
  };

  const salvarCategoria = async () => {
    if (!nomeCategoria || !limite) return alert("Preencha todos os campos");
    const categoria = {
      nome: nomeCategoria.toLowerCase(),
      limite: parseFloat(limite),
      usuario,
    };
    try {
      if (editarId) {
        const ref = doc(db, "categorias", editarId);
        await updateDoc(ref, categoria);
        setEditarId(null);
      } else {
        await addDoc(collection(db, "categorias"), categoria);
      }
      setNomeCategoria("");
      setLimite("");
      carregarCategorias(usuario);
    } catch (err) {
      alert("Erro ao salvar categoria");
    }
  };

  const excluirCategoria = async (id) => {
    if (!window.confirm("Excluir categoria?")) return;
    try {
      await deleteDoc(doc(db, "categorias", id));
      carregarCategorias(usuario);
    } catch (err) {
      alert("Erro ao excluir");
    }
  };

  const editarCategoria = (c) => {
    setNomeCategoria(c.nome);
    setLimite(c.limite);
    setEditarId(c.id);
  };

  const dadosGrafico = {
    labels: categorias.map((c) => c.nome),
    datasets: [
      {
        data: categorias.map((c) => gastosPorCategoria[c.nome] || 0),
        backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0", "#9966ff"],
      },
    ],
  };

  return (
    <div className="styled-box">
      <h2>📊 Controle de Gastos por Categoria</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome da categoria (ex: mercado)"
          value={nomeCategoria}
          onChange={(e) => setNomeCategoria(e.target.value)}
        />
        <input
          type="number"
          placeholder="Limite mensal"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
        />
        <button onClick={salvarCategoria}>
          {editarId ? "Atualizar" : "Adicionar"}
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {categorias.map((c) => {
          const gasto = gastosPorCategoria[c.nome] || 0;
          const restante = c.limite - gasto;
          return (
            <li
              key={c.id}
              style={{
                background: "var(--card-color)",
                padding: 10,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <strong>{c.nome}</strong>: R$ {gasto.toFixed(2)} / R$ {c.limite.toFixed(2)}
              <br />
              {restante < 0 ? (
                <span style={{ color: "red" }}>
                  ⚠️ Você excedeu em R$ {Math.abs(restante).toFixed(2)}
                </span>
              ) : restante < c.limite * 0.2 ? (
                <span style={{ color: "orange" }}>⚠️ Quase atingindo o limite!</span>
              ) : (
                <span style={{ color: "green" }}>✅ Dentro do limite</span>
              )}
              <div style={{ marginTop: 5 }}>
                <button onClick={() => editarCategoria(c)} style={{ marginRight: 10 }}>✏️</button>
                <button onClick={() => excluirCategoria(c.id)}>🗑️</button>
              </div>
            </li>
          );
        })}
      </ul>

      <h3>📊 Gráfico de Gastos</h3>
      <Pie data={dadosGrafico} />
    </div>
  );
}
