const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const router = express.Router();

// 🔹 Memória por sessão
let memoriaConversas = {};

function obterContexto(sessionId) {
  const conversa = memoriaConversas[sessionId] || [];
  return conversa
    .filter((m) => m.remetente === "user")
    .slice(-4)
    .map((m) => m.texto)
    .join(" | ");
}

// 🔹 Pesquisa Google REAL (grátis até 100/dia)
async function pesquisarGoogle(query) {
  try {
    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_CX,
        q: query,
      },
    });

    return (
      response.data.items?.slice(0, 3).map((item) => ({
        titulo: item.title,
        link: item.link,
        descricao: item.snippet,
      })) || []
    );
  } catch (err) {
    console.error("Erro Google Search:", err.message);
    return [];
  }
}

// 🔹 Pesquisa Wikipedia (grátis)
async function pesquisarWikipedia(query) {
  try {
    const res = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );

    return {
      title: res.data.title,
      extract: res.data.extract,
      url: res.data.content_urls?.desktop?.page,
    };
  } catch (e) {
    return null;
  }
}

// 🔥 Rota principal
router.post("/", async (req, res) => {
  try {
    const { mensagem, sessionId } = req.body;

    if (!mensagem)
      return res.json({ resposta: "Não recebi nenhuma mensagem." });

    const id = sessionId || "default";
    if (!memoriaConversas[id]) memoriaConversas[id] = [];

    memoriaConversas[id].push({ remetente: "user", texto: mensagem });

    const contexto = obterContexto(id);

    // 1) Pesquisa Google
    const resultadosGoogle = await pesquisarGoogle(mensagem);

    // 2) Wikipedia
    const wiki = await pesquisarWikipedia(mensagem);

    // 3) Monta resposta simples usando apenas dados disponíveis
    let respostaFinal = `Resumo da pesquisa sobre "${mensagem}":\n\n`;

    if (resultadosGoogle.length > 0) {
      respostaFinal += "🔹 Resultados Google:\n";
      resultadosGoogle.forEach((r, i) => {
        respostaFinal += `${i + 1}. ${r.titulo} - ${r.link}\n   ${r.descricao}\n`;
      });
    }

    if (wiki) {
      respostaFinal += `\n🔹 Wikipedia:\n${wiki.title} - ${wiki.url}\n${wiki.extract}`;
    }

    if (!resultadosGoogle.length && !wiki) {
      respostaFinal += "Nenhuma informação disponível para esta pesquisa.";
    }

    memoriaConversas[id].push({ remetente: "bot", texto: respostaFinal });

    res.json({ resposta: respostaFinal });

  } catch (err) {
    console.error("Erro IA:", err);
    res.status(500).json({ resposta: "Erro interno da JIAM IA." });
  }
});

module.exports = router;

