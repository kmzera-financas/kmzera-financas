import { useEffect, useState } from "react";
import axios from "axios";

export default function Transacoes({ usuario }) {
  const [transacoes, setTransacoes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ descricao: "", valor: "", tipo: "entrada" });

  const carregarTransacoes = async () => {
    try {
      const res = await axios.get(`http://localhost:4500/transacoes?usuario=${usuario}`);
      setTransacoes(res.data);
    } catch (err) {
      alert("Erro ao buscar transações");
    }
  };

  useEffect(() => {
    if (usuario) carregarTransacoes();
  }, [usuario]);

  const deletar = async (id) => {
    await axios.delete(`http://localhost:4500/transacoes/${id}`);
    carregarTransacoes();
  };

  const editar = (transacao) => {
    setEditando(transacao.id);
    setForm({
      descricao: transacao.descricao,
      valor: transacao.valor,
      tipo: transacao.tipo,
    });
  };

  const salvarEdicao = async () => {
    await axios.put(`http://localhost:4500/transacoes/${editando}`, {
      ...form,
      usuario,
    });
    setEditando(null);
    setForm({ descricao: "", valor: "", tipo: "entrada" });
    carregarTransacoes();
  };

  return (
    <div>
      <h2>📄 Minhas Transações</h2>
      <ul>
        {transacoes.map((t) => (
          <li key={t.id}>
            <strong>{t.descricao}</strong> - R${t.valor} ({t.tipo})<br />
            <button onClick={() => editar(t)}>📝 Editar</button>
            <button onClick={() => deletar(t.id)}>🗑️ Apagar</button>
          </li>
        ))}
      </ul>

      {editando && (
        <div style={{ marginTop: "20px" }}>
          <h3>✏️ Editar Transação</h3>
          <input
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
          <input
            type="number"
            placeholder="Valor"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          <button onClick={salvarEdicao}>💾 Salvar</button>
          <button onClick={() => setEditando(null)}>❌ Cancelar</button>
        </div>
      )}
    </div>
  );
}
