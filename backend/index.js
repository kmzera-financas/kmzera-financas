const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Firebase Admin SDK
const serviceAccount = require("./kmzera-financas-firebase-adminsdk-fbsvc-fa9847b3c9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
let qrCodes = {};

// 🔐 Salvar QR Code
app.post("/qrcode", (req, res) => {
  const { usuario, code } = req.body;
  if (usuario && code) {
    qrCodes[usuario] = code;
    console.log("🔐 QR salvo para:", usuario);
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: "Dados inválidos" });
  }
});

// 🔍 Buscar QR Code
app.get("/qrcode", (req, res) => {
  const usuario = req.query.usuario;
  const base64 = qrCodes[usuario];
  if (!base64) return res.status(404).json({ error: "QR Code ainda não gerado" });
  res.json({ qr: `data:image/png;base64,${base64}` });
});

// 💸 Criar transação
app.post("/transacoes", async (req, res) => {
  const { descricao, valor, tipo, usuario } = req.body;
  if (!descricao || !valor || !tipo || !usuario) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  const nova = {
    id: uuidv4(),
    descricao,
    valor,
    tipo,
    usuario,
    data: new Date().toISOString(),
  };

  await db.collection("transacoes").doc(nova.id).set(nova);
  console.log("💰 Nova transação:", nova);
  res.json(nova);
});

// 📋 Listar transações por usuário
app.get("/transacoes", async (req, res) => {
  const { usuario } = req.query;
  if (!usuario) return res.status(400).json({ error: "Usuário não informado" });

  const snapshot = await db.collection("transacoes").where("usuario", "==", usuario).get();
  const dados = snapshot.docs.map((doc) => doc.data());
  res.json(dados);
});

// ✏️ Editar transação
app.put("/transacoes/:id", async (req, res) => {
  const { id } = req.params;
  const ref = db.collection("transacoes").doc(id);
  const doc = await ref.get();

  if (!doc.exists) return res.status(404).json({ error: "Transação não encontrada" });

  await ref.update(req.body);
  res.json({ id, ...req.body });
});

// 🗑️ Deletar transação
app.delete("/transacoes/:id", async (req, res) => {
  const { id } = req.params;
  await db.collection("transacoes").doc(id).delete();
  res.json({ ok: true });
});

// ➕ Adicionar produto
app.post("/produtos", async (req, res) => {
  const { nome, custo } = req.body;
  if (!nome || !custo) return res.status(400).json({ error: "Dados inválidos" });

  const novo = {
    id: uuidv4(),
    nome,
    custo,
    criadoEm: new Date().toISOString(),
  };

  await db.collection("produtos").doc(novo.id).set(novo);
  console.log("📦 Novo produto:", novo);
  res.json(novo);
});

// 📦 Listar produtos
app.get("/produtos", async (req, res) => {
  const snapshot = await db.collection("produtos").get();
  const dados = snapshot.docs.map((doc) => doc.data());
  res.json(dados);
});

// 👤 Criar usuário com tipo (admin, teste, pro)
app.post("/usuarios", async (req, res) => {
  const { email, nome, senha, tipo = "pro" } = req.body;
  if (!email || !nome || !senha) return res.status(400).json({ error: "Campos obrigatórios" });

  const snap = await db.collection("usuarios").where("email", "==", email).get();
  if (!snap.empty) return res.status(409).json({ error: "Usuário já cadastrado" });

  const id = uuidv4();
  const criadoEm = new Date().toISOString();

  const novo = {
    id,
    email,
    nome,
    senha,
    tipo,
    criadoEm,
  };

  if (tipo === "teste") {
    const validade = new Date();
    validade.setDate(validade.getDate() + 3);
    novo.validadeTeste = validade.toISOString();
  }

  await db.collection("usuarios").doc(id).set(novo);
  console.log("👤 Novo usuário:", novo);
  res.json(novo);
});

// 🧠 Login com verificação de validade
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuariosRef = db.collection("usuarios");
    const snapshot = await usuariosRef.where("email", "==", email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    let usuario = null;
    snapshot.forEach(doc => {
      usuario = { id: doc.id, ...doc.data() };
    });

    if (usuario.senha !== senha) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    if (usuario.tipo === "teste") {
      const agora = new Date();
      const validade = new Date(usuario.validadeTeste);

      if (agora > validade) {
        return res.status(403).json({ error: "Conta de teste expirada" });
      }
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao realizar login" });
  }
});

// ✏️ Editar usuário
app.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const dados = req.body;

  if (!id || !dados) return res.status(400).json({ error: "Dados inválidos" });

  const ref = db.collection("usuarios").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: "Usuário não encontrado" });

  await ref.update(dados);
  console.log("✏️ Usuário atualizado:", id);
  res.json({ id, ...dados });
});

// 🗑️ Deletar usuário
app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;

  const ref = db.collection("usuarios").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: "Usuário não encontrado" });

  await ref.delete();
  console.log("🗑️ Usuário deletado:", id);
  res.json({ ok: true });
});

// 📋 Listar usuários (mostrando se está bloqueado por validade)
app.get("/usuarios", async (req, res) => {
  const snapshot = await db.collection("usuarios").get();
  const agora = new Date();

  const dados = snapshot.docs.map((doc) => {
    const usuario = doc.data();
    if (usuario.tipo === "teste" && usuario.validadeTeste) {
      const validade = new Date(usuario.validadeTeste);
      usuario.bloqueado = agora > validade;
    }
    return usuario;
  });

  res.json(dados);
});

// ▶️ Iniciar servidor
app.listen(4500, () => console.log("✅ Backend com Firebase rodando na porta 4500"));
