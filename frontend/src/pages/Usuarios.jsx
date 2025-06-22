import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function Usuarios() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState("pro");
  const [banido, setBanido] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [usuarioAtual, setUsuarioAtual] = useState("");

  useEffect(() => {
    const userEmail = localStorage.getItem("usuario");
    if (!userEmail) window.location.href = "/";
    else {
      setUsuarioAtual(userEmail);
      carregarUsuarios();
    }
  }, []);

  const carregarUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsuarios(lista);
    } catch (err) {
      console.error("Erro ao carregar usuários", err);
    }
  };

  const adicionarOuEditarUsuario = async () => {
    if (!nome || !email || !senha || !telefone) {
      alert("Preencha todos os campos");
      return;
    }

    const telefoneLimpo = telefone.replace(/[^0-9]/g, "");
    if (telefoneLimpo.length < 11) {
      alert("Telefone inválido. Use o formato: 5511999999999");
      return;
    }

    try {
      const usuario = {
        nome,
        email,
        senha,
        telefone: telefoneLimpo,
        tipo,
        banido,
        dataCriacao: new Date().toISOString(),
      };

      if (editandoId) {
        await updateDoc(doc(db, "usuarios", editandoId), usuario);
        alert("Usuário atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "usuarios"), usuario);
        alert("Usuário cadastrado com sucesso!");
      }

      limparCampos();
      carregarUsuarios();
    } catch (err) {
      console.error("Erro ao salvar usuário", err);
      alert("Erro ao salvar usuário");
    }
  };

  const editarUsuario = (usuario) => {
    setNome(usuario.nome);
    setEmail(usuario.email);
    setSenha(usuario.senha || "");
    setTelefone(usuario.telefone || "");
    setTipo(usuario.tipo || "pro");
    setBanido(usuario.banido || false);
    setEditandoId(usuario.id);
  };

  const excluirUsuario = async (id, email) => {
    if (email === usuarioAtual) {
      alert("Você não pode excluir a si mesmo.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      await deleteDoc(doc(db, "usuarios", id));
      alert("Usuário excluído com sucesso!");
      carregarUsuarios();
    } catch (err) {
      console.error("Erro ao excluir usuário", err);
      alert("Erro ao excluir usuário");
    }
  };

  const limparCampos = () => {
    setNome("");
    setEmail("");
    setSenha("");
    setTelefone("");
    setTipo("pro");
    setBanido(false);
    setEditandoId(null);
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  const formatarData = (iso) => {
    const data = new Date(iso);
    return data.toLocaleDateString();
  };

  return (
    <div className="styled-box">
      <h2>👤 Cadastro de Usuários</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: 8, minWidth: 200 }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: 8, minWidth: 200 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: 8, minWidth: 200 }}
        />
        <input
          type="text"
          placeholder="Telefone (ex: 5511999999999)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: 8, minWidth: 200 }}
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ padding: "10px", borderRadius: 8, minWidth: 120 }}
        >
          <option value="admin">Admin</option>
          <option value="pro">Pro</option>
          <option value="teste">Teste</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <input
            type="checkbox"
            checked={banido}
            onChange={(e) => setBanido(e.target.checked)}
          />
          Banir usuário
        </label>
        <button
          onClick={adicionarOuEditarUsuario}
          style={{ padding: "10px 20px", borderRadius: 8 }}
        >
          {editandoId ? "Salvar" : "Adicionar"}
        </button>
        {editandoId && (
          <button
            onClick={limparCampos}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "gray",
              color: "white",
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      <h3>📋 Lista de Usuários ({usuariosFiltrados.length})</h3>
      <input
        type="text"
        placeholder="🔍 Buscar por nome ou email"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={{ marginBottom: 12, width: "100%", padding: "10px", borderRadius: 8 }}
      />

      <ul style={{ padding: 0, listStyle: "none" }}>
        {usuariosFiltrados.map((u) => (
          <li
            key={u.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              background: "var(--card-color)",
              padding: "10px 15px",
              borderRadius: 10,
            }}
          >
            <span>
              <strong>{u.nome}</strong> - {u.email} <br />
              📱 Telefone: {u.telefone || "não informado"} <br />
              🧩 Tipo: <strong>{u.tipo || "pro"}</strong>
              {u.banido && (
                <span style={{ color: "red", marginLeft: 8 }}>🚫 Banido</span>
              )}
              <br />
              📅 Criado: {u.dataCriacao ? formatarData(u.dataCriacao) : "Desconhecida"}
            </span>
            <span style={{ display: "flex", gap: "5px" }}>
              <button
                onClick={() => editarUsuario(u)}
                style={{
                  fontSize: 14,
                  padding: "4px 6px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => excluirUsuario(u.id, u.email)}
                style={{
                  fontSize: 14,
                  padding: "4px 6px",
                  borderRadius: 6,
                  color: "red",
                  cursor: "pointer",
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
