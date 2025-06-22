import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Dashboard() {
  const [usuario, setUsuario] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [transacoes, setTransacoes] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [filtro, setFiltro] = useState("hoje");
  const [dataEspecifica, setDataEspecifica] = useState("");
  const [metaEconomia, setMetaEconomia] = useState(2000);
  const [cofrinho, setCofrinho] = useState(0);
  const [editarId, setEditarId] = useState(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("usuario");
    if (!email) return (window.location.href = "/");
    setUsuario(email);
    carregarUsuario(email);
    carregarTransacoes(email);
  }, []);

  const carregarUsuario = async (email) => {
    try {
      const res = await axios.get("http://localhost:4500/usuarios");
      const user = res.data.find((u) => u.email === email);
      if (!user) return;
      setTipoUsuario(user.tipo);

      if (user.tipo === "teste" && user.validadeTeste) {
        const validade = new Date(user.validadeTeste);
        const agora = new Date();
        const diff = Math.ceil((validade - agora) / (1000 * 60 * 60 * 24));

        if (diff <= 0) {
          alert("⛔ Sua conta de teste expirou. Entre em contato para ativar o plano PRO.");
          localStorage.removeItem("usuario");
          return (window.location.href = "/");
        } else if (diff <= 1) {
          setAviso("⚠️ Sua conta de teste vence em menos de 24h!");
        } else if (diff <= 2) {
          setAviso(`⏳ Sua conta de teste vence em ${diff} dias.`);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar tipo de usuário", err);
    }
  };

  const carregarTransacoes = async (email) => {
    try {
      const res = await axios.get(`http://localhost:4500/transacoes?usuario=${email}`);
      const ordenadas = res.data.sort((a, b) => new Date(b.data) - new Date(a.data));
      setTransacoes(ordenadas);

      const totalCofrinho = ordenadas
        .filter((t) => t.descricao.toLowerCase().includes("cofrinho"))
        .reduce((acc, t) => (t.tipo === "entrada" ? acc + t.valor : acc - t.valor), 0);
      setCofrinho(totalCofrinho);
    } catch (err) {
      console.error("Erro ao carregar transações", err);
    }
  };

  const adicionarTransacao = async () => {
    if (!descricao || !valor) return alert("Preencha todos os campos");
    try {
      const nova = {
        descricao,
        valor: parseFloat(valor),
        tipo,
        usuario,
        data: new Date().toISOString(),
      };

      if (editarId) {
        await axios.put(`http://localhost:4500/transacoes/${editarId}`, nova);
        setEditarId(null);
      } else {
        await axios.post("http://localhost:4500/transacoes", nova);
      }

      setDescricao("");
      setValor("");
      setTipo("entrada");
      carregarTransacoes(usuario);
    } catch (err) {
      alert("Erro ao salvar");
    }
  };

  const excluirTransacao = async (id) => {
    if (!window.confirm("Deseja mesmo excluir?")) return;
    try {
      await axios.delete(`http://localhost:4500/transacoes/${id}`);
      carregarTransacoes(usuario);
    } catch (err) {
      alert("Erro ao excluir");
    }
  };

  const editarTransacao = (t) => {
    setDescricao(t.descricao);
    setValor(t.valor);
    setTipo(t.tipo);
    setEditarId(t.id);
  };

  const limparCampos = () => {
    setDescricao("");
    setValor("");
    setTipo("entrada");
    setEditarId(null);
  };

  const filtrarTransacoes = () => {
    const agora = new Date();
    return transacoes.filter((t) => {
      const dataT = new Date(t.data);
      if (filtro === "hoje") return dataT.toDateString() === agora.toDateString();
      if (filtro === "semana") {
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay());
        return dataT >= inicioSemana;
      }
      if (filtro === "mes") {
        return dataT.getMonth() === agora.getMonth() && dataT.getFullYear() === agora.getFullYear();
      }
      if (filtro === "data" && dataEspecifica) {
        return dataT.toDateString() === new Date(dataEspecifica).toDateString();
      }
      return true;
    });
  };

  const transacoesFiltradas = filtrarTransacoes();
  const entradas = transacoesFiltradas.filter((t) => t.tipo === "entrada").reduce((acc, t) => acc + Number(t.valor), 0);
  const saidas = transacoesFiltradas.filter((t) => t.tipo === "saida").reduce((acc, t) => acc + Number(t.valor), 0);
  const total = entradas - saidas;
  const restanteEconomia = metaEconomia - total;

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("KMZERA FINANÇAS - Transações", 10, 10);
    const linhas = transacoesFiltradas.map((t) => [
      t.descricao,
      `R$ ${t.valor}`,
      t.tipo,
      new Date(t.data).toLocaleDateString(),
    ]);
    doc.autoTable({ head: [["Descrição", "Valor", "Tipo", "Data"]], body: linhas });
    doc.save("transacoes.pdf");
  };

  const exportarExcel = () => {
    const dados = transacoesFiltradas.map((t) => ({
      Descrição: t.descricao,
      Valor: t.valor,
      Tipo: t.tipo,
      Data: new Date(t.data).toLocaleDateString(),
    }));
    const planilha = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, planilha, "Transacoes");
    const arquivo = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([arquivo], { type: "application/octet-stream" }), "transacoes.xlsx");
  };

  return (
    <div className="styled-box">
      <h2>📊 <span style={{ color: "var(--accent-color)" }}>Bem-vindo ao <strong>KMZERA FINANÇAS</strong></span></h2>
      <p><strong>Usuário:</strong> {usuario}</p>
      <p><strong>Tipo de Conta:</strong> {tipoUsuario}</p>
      {aviso && <p style={{ color: "orange", fontWeight: "bold" }}>{aviso}</p>}
      <button onClick={() => { localStorage.removeItem("usuario"); window.location.href = "/"; }} className="btn">Sair</button>

      <h3>📈 Resumo</h3>
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div className="card">Entradas: <span style={{ color: "green" }}>R$ {entradas.toFixed(2)}</span></div>
        <div className="card">Saídas: <span style={{ color: "red" }}>R$ {saidas.toFixed(2)}</span></div>
        <div className="card">Total: <strong>R$ {total.toFixed(2)}</strong></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h4>🎯 Meta de Economia: R$ {metaEconomia}</h4>
        <p>Você ainda pode guardar: <strong style={{ color: restanteEconomia >= 0 ? "green" : "red" }}>R$ {restanteEconomia.toFixed(2)}</strong></p>
        <input type="number" placeholder="Nova meta" onChange={(e) => setMetaEconomia(Number(e.target.value))} style={{ padding: 6 }} />
        <p>💰 Cofrinho: <strong>R$ {cofrinho.toFixed(2)}</strong></p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="hoje">Hoje</option>
          <option value="semana">Esta Semana</option>
          <option value="mes">Este Mês</option>
          <option value="data">Data específica</option>
        </select>
        {filtro === "data" && (
          <input type="date" value={dataEspecifica} onChange={(e) => setDataEspecifica(e.target.value)} />
        )}
      </div>

      <h3>➕ Nova Transação</h3>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input type="text" placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <input type="number" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <button onClick={adicionarTransacao}>{editarId ? "Atualizar" : "Adicionar"}</button>
        <button onClick={limparCampos} style={{ background: "gray", color: "white" }}>Limpar</button>
      </div>

      <h3>📤 Exportar Dados</h3>
      <button onClick={exportarPDF}>Exportar PDF</button>
      <button onClick={exportarExcel}>Exportar Excel</button>

      <h3>📄 Histórico de Transações ({transacoesFiltradas.length})</h3>
      <ul style={{ padding: 0, listStyle: "none" }}>
        {transacoesFiltradas.map((t) => (
          <li key={t.id} style={{
            background: "var(--card-color)",
            padding: "10px 15px",
            borderRadius: 10,
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <span>
                {t.descricao} - R$ {t.valor} [{t.tipo}] - {new Date(t.data).toLocaleDateString()}
              </span>
              <span>
                <button onClick={() => editarTransacao(t)} style={{ marginRight: 8, border: "none", background: "transparent", cursor: "pointer" }}>✏️</button>
                <button onClick={() => excluirTransacao(t.id)} style={{ color: "red", border: "none", background: "transparent", cursor: "pointer" }}>🗑️</button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
