
// ✅ BOT WHATSAPP + FIREBASE + COMANDOS INTELIGENTES
const express = require("express");
const { create } = require("@wppconnect-team/wppconnect");
const cors = require("cors");
const OpenAI = require("openai");
const moment = require("moment");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

const app = express();
app.use(cors());
app.use(express.json());

let qrCodeBase64 = "";

// ✅ Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ✅ Inicializa OpenAI
const openai = new OpenAI({
  apiKey: "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",
});

// ✅ Inicia sessão do WhatsApp
create({
  session: "kmzera",
  catchQR: (base64Qr) => {
    qrCodeBase64 = base64Qr;
    console.log("⚡ QR Code atualizado!");
  },
  headless: true,
  puppeteerOptions: { args: ["--no-sandbox"] },
}).then((client) => {
  console.log("✅ Cliente WhatsApp pronto!");

  client.onMessage(async (message) => {
    if (
      !message.body ||
      message.isGroupMsg ||
      message.isMedia ||
      message.from === "status@broadcast"
    ) return;

    const texto = message.body.toLowerCase();
    const telefone = message.from.split("@")[0];
    const agora = new Date();

    // ✅ RECONHECE COMANDOS
    const isComandoConsulta =
      texto.includes("quanto") || texto.includes("saldo") || texto.includes("venda");
    const isComandoApagar = texto.includes("apagar ultima");

    if (isComandoConsulta) {
      try {
        const snapshot = await db.collection("transacoes").where("telefone", "==", telefone).get();

        const hoje = moment().startOf("day");
        const semana = moment().startOf("isoWeek");
        const mes = moment().startOf("month");

        let entradasHoje = 0, saidasHoje = 0, custoHoje = 0;
        let entradasSemana = 0, saidasSemana = 0;
        let entradasMes = 0, saidasMes = 0;
        let totalVendas = 0;

        snapshot.forEach(doc => {
          const t = doc.data();
          const data = moment(t.data);
          const valor = Number(t.valor);

          if (data.isSameOrAfter(hoje)) {
            if (t.tipo === "entrada") entradasHoje += valor;
            if (t.tipo === "saida") saidasHoje += valor;
            if (t.descricao.toLowerCase().includes("custo")) custoHoje += valor;
          }

          if (data.isSameOrAfter(semana)) {
            if (t.tipo === "entrada") entradasSemana += valor;
            if (t.tipo === "saida") saidasSemana += valor;
          }

          if (data.isSameOrAfter(mes)) {
            if (t.tipo === "entrada") entradasMes += valor;
            if (t.tipo === "saida") saidasMes += valor;
          }

          if (t.descricao.toLowerCase().includes("venda")) totalVendas += valor;
        });

        let resposta = `📊 *RESUMO FINANCEIRO*
`;

        
          if (texto.includes("vendas") || texto.includes("lucro") || texto.includes("custo")) {
            const vendas = snapshot.docs
              .map(doc => doc.data())
              .filter(t => t.telefone === telefone && t.tipo === "entrada" && t.descricao.toLowerCase().includes("venda"));

            const custos = snapshot.docs
              .map(doc => doc.data())
              .filter(t => t.telefone === telefone && t.tipo === "saida" && t.descricao.toLowerCase().includes("custo"));

            const totalVendas = vendas.reduce((acc, t) => acc + Number(t.valor), 0);
            const totalCustos = custos.reduce((acc, t) => acc + Number(t.valor), 0);
            const lucro = totalVendas - totalCustos;

            let extra = "";
            if (texto.includes("vendas")) extra += `💰 *Total de Vendas:* R$ ${totalVendas.toFixed(2)}
`;
            if (texto.includes("custo")) extra += `📦 *Total de Custo:* R$ ${totalCustos.toFixed(2)}
`;
            if (texto.includes("lucro")) extra += `📈 *Lucro Líquido:* R$ ${lucro.toFixed(2)}
`;

            if (extra) {
              await client.sendText(message.from, `📊 *Resumo detalhado:*
${extra}`);
              return;
            }
          }


          if (texto.includes("hoje")) {
          resposta += `
📅 *Hoje*
💰 Entradas: R$ ${entradasHoje.toFixed(2)}
💸 Saídas: R$ ${saidasHoje.toFixed(2)}
🧮 Saldo: R$ ${(entradasHoje - saidasHoje).toFixed(2)}
📦 Custo gasto: R$ ${custoHoje.toFixed(2)}`;
        } else if (texto.includes("semana")) {
          resposta += `
📆 *Esta Semana*
💰 Entradas: R$ ${entradasSemana.toFixed(2)}
💸 Saídas: R$ ${saidasSemana.toFixed(2)}
🧮 Saldo: R$ ${(entradasSemana - saidasSemana).toFixed(2)}`;
        } else if (texto.includes("mês") || texto.includes("mes")) {
          resposta += `
🗓️ *Este Mês*
💰 Entradas: R$ ${entradasMes.toFixed(2)}
💸 Saídas: R$ ${saidasMes.toFixed(2)}
🧮 Saldo: R$ ${(entradasMes - saidasMes).toFixed(2)}`;
        } else if (texto.includes("venda")) {
          resposta += `
📈 *Total de Vendas:* R$ ${totalVendas.toFixed(2)}`;
        } else {
          resposta += `
❓ Especifique: "hoje", "semana", "mês" ou "vendas"`;
        }

        await client.sendText(message.from, resposta);
        return;
      } catch (e) {
        console.error("Erro consulta:", e);
        await client.sendText(message.from, "❌ Erro ao consultar os dados. Tente novamente.");
        return;
      }
    }

    if (isComandoApagar) {
      try {
        const snap = await db.collection("transacoes")
          .where("telefone", "==", telefone)
          .orderBy("data", "desc")
          .limit(1)
          .get();

        if (!snap.empty) {
          const doc = snap.docs[0];
          await doc.ref.delete();
          await client.sendText(message.from, "🗑️ Última transação apagada com sucesso!");
        } else {
          await client.sendText(message.from, "❌ Nenhuma transação encontrada para apagar.");
        }
      } catch (err) {
        console.error("Erro ao apagar:", err.message);
        await client.sendText(message.from, "❌ Erro ao apagar a transação.");
      }
      return;
    }

    
    // ✅ EDIÇÃO DA ÚLTIMA TRANSAÇÃO
    if (texto.startsWith("editar ultima:")) {
      try {
        const snap = await db.collection("transacoes")
          .where("telefone", "==", telefone)
          .orderBy("data", "desc")
          .limit(1)
          .get();

        if (snap.empty) {
          await client.sendText(message.from, "❌ Nenhuma transação encontrada para editar.");
          return;
        }

        const doc = snap.docs[0];
        const transacaoAntiga = doc.data();

        const novaMensagem = texto.replace("editar ultima:", "").trim();

        const promptEdicao = `Atualize os dados da transação com base nessa mensagem:
"${novaMensagem}"
Responda apenas em JSON com: descricao, valor, tipo (entrada ou saida).`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: promptEdicao }],
        });

        const json = JSON.parse(completion.choices[0].message.content);
        const valorCorrigido = Math.abs(Number(json.valor));
        if (isNaN(valorCorrigido) || valorCorrigido === 0) throw new Error("Valor inválido");

        let categoria = "Outros";
        const desc = json.descricao.toLowerCase();
        if (desc.includes("mercado") || desc.includes("comida") || desc.includes("lanch")) categoria = "Alimentação";
        else if (desc.includes("uber") || desc.includes("gasolina")) categoria = "Transporte";
        else if (desc.includes("aluguel") || desc.includes("luz") || desc.includes("água")) categoria = "Moradia";
        else if (desc.includes("pix") || desc.includes("transferência")) categoria = "Transferência";

        await doc.ref.update({
          descricao: json.descricao,
          valor: valorCorrigido,
          tipo: json.tipo,
          categoria,
        });

        await client.sendText(message.from, "✏️ Transação atualizada com sucesso!");
      } catch (err) {
        console.error("Erro ao editar:", err.message);
        await client.sendText(message.from, "❌ Erro ao editar a transação.");
      }
      return;
    }


    
    // ✅ APAGAR TODAS AS TRANSAÇÕES
    if (texto === "apagar tudo") {
      try {
        const snapshot = await db.collection("transacoes")
          .where("telefone", "==", telefone)
          .get();

        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        await client.sendText(message.from, "🧹 Todas as transações foram apagadas com sucesso!");
      } catch (err) {
        console.error("Erro apagar tudo:", err.message);
        await client.sendText(message.from, "❌ Erro ao apagar todas as transações.");
      }
      return;
    }

    // ✅ APAGAR POR DATA
    if (texto.startsWith("apagar dia:")) {
      try {
        const dataStr = texto.replace("apagar dia:", "").trim();
        const dia = moment(dataStr, "DD/MM/YYYY");
        if (!dia.isValid()) {
          await client.sendText(message.from, "❌ Data inválida. Use o formato: apagar dia: 21/06/2025");
          return;
        }

        const diaInicio = dia.startOf("day");
        const diaFim = dia.endOf("day");

        const snapshot = await db.collection("transacoes")
          .where("telefone", "==", telefone)
          .get();

        const batch = db.batch();
        snapshot.forEach(doc => {
          const t = doc.data();
          const data = moment(t.data);
          if (data.isBetween(diaInicio, diaFim, null, "[]")) {
            batch.delete(doc.ref);
          }
        });

        await batch.commit();
        await client.sendText(message.from, `🗑️ Transações do dia ${dia.format("DD/MM/YYYY")} apagadas com sucesso!`);
      } catch (err) {
        console.error("Erro apagar por dia:", err.message);
        await client.sendText(message.from, "❌ Erro ao apagar transações da data informada.");
      }
      return;
    }

    // ✅ CADASTRAR PRODUTO
    if (texto.startsWith("cadastrar produto:")) {
      try {
        const dados = texto.replace("cadastrar produto:", "").trim();
        const [nomeRaw, valorRaw] = dados.split(",");
        const nome = nomeRaw ? nomeRaw.trim() : null;
        const custo = valorRaw ? parseFloat(valorRaw.trim()) : null;

        if (!nome || isNaN(custo)) {
          await client.sendText(message.from, "❌ Erro no formato. Use: cadastrar produto: Nome, 3.50");
          return;
        }

        await db.collection("produtos").add({
          nome,
          custo,
          telefone,
          dataCadastro: new Date().toISOString(),
        });

        await client.sendText(message.from, `✅ Produto *${nome}* cadastrado com custo R$ ${custo.toFixed(2)}!`);
      } catch (err) {
        console.error("Erro cadastrar produto:", err.message);
        await client.sendText(message.from, "❌ Erro ao cadastrar o produto. Verifique o formato.");
      }
      return;
    }


    // ✅ REGISTRA TRANSACAO NORMAL COM IA
    try {
      const prompt = `Entenda e organize a seguinte transação financeira:
"${message.body}"
Responda apenas em JSON com: descricao, valor, tipo (entrada ou saida).`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });

      const resposta = completion.choices[0].message.content;
      const json = JSON.parse(resposta);

      // Corrige erros de valor (tipo 300 em vez de 30)
      const valorCorrigido = Math.abs(Number(json.valor));
      if (isNaN(valorCorrigido) || valorCorrigido === 0) throw new Error("Valor inválido");

      let categoria = "Outros";
      const desc = json.descricao.toLowerCase();
      if (desc.includes("mercado") || desc.includes("comida") || desc.includes("lanch")) categoria = "Alimentação";
      else if (desc.includes("uber") || desc.includes("gasolina")) categoria = "Transporte";
      else if (desc.includes("aluguel") || desc.includes("luz") || desc.includes("água")) categoria = "Moradia";
      else if (desc.includes("pix") || desc.includes("transferência")) categoria = "Transferência";

      const transacao = {
        descricao: json.descricao,
        valor: valorCorrigido,
        tipo: json.tipo,
        categoria,
        telefone,
        data: agora.toISOString(),
      };

      await db.collection("transacoes").add(transacao);

      const hora = moment(agora).format("DD/MM/YYYY [às] HH:mm");
      const emoji = json.tipo === "entrada" ? "💰" : "💸";

      await client.sendText(message.from, `
✨ *KMZERA FINANÇAS* ✨

✅ *Transação registrada com sucesso!*

📅 *Data:* ${hora}
🔹 *Tipo:* ${json.tipo.toUpperCase()} ${emoji}
🔸 *Descrição:* ${json.descricao}
📦 *Categoria:* ${categoria}
💵 *Valor:* R$ ${valorCorrigido}

Se precisar, envie:
✏️ *editar ultima: nova descrição*
🗑️ *apagar ultima*

Obrigado por usar o sistema KMZERA 🚀
      `);
    } catch (error) {
      console.error("Erro ao processar:", error.message);
      await client.sendText(message.from, "❌ Erro ao interpretar. Tente escrever de outra forma.");
    }
  });
});

// ✅ Rota para exibir QR Code
app.get("/qrcode", (req, res) => {
  if (!qrCodeBase64) return res.status(404).json({ error: "QR Code ainda não gerado" });
  res.json({ qr: `data:image/png;base64,${qrCodeBase64}` });
});

// ✅ Inicia servidor
app.listen(4000, () => console.log("🤖 BOT WhatsApp rodando em http://localhost:4000"));
