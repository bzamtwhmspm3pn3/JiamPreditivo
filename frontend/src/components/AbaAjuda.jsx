import { useState, useRef, useEffect } from "react";
import { X, Send, Database, Cpu, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import translations from "../data/translations.json";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export default function AbaAjuda({ lang = "pt" }) {
  const t = translations[lang] || translations["pt"];

  const [perguntaAtiva, setPerguntaAtiva] = useState(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  const perguntas = [
    { titulo: t.perguntaConta, resposta: t.respostaConta },
    { titulo: t.perguntaUpload, resposta: t.respostaUpload },
    { titulo: t.perguntaAnalises, resposta: t.respostaAnalises },
    { titulo: t.perguntaIA, resposta: t.respostaIA },
  ];

  // Inicializa sessionId persistente e histórico
  useEffect(() => {
    let sess = sessionStorage.getItem("jiam-session");
    if (!sess) {
      sess = uuidv4();
      sessionStorage.setItem("jiam-session", sess);
    }
    setSessionId(sess);

    const chatHistorico = localStorage.getItem(`chat-${sess}`);
    if (chatHistorico) setMensagens(JSON.parse(chatHistorico));
    else setMensagens([
      { remetente: "bot", texto: "👋 Olá! Sou a JIAM IA — pronta para te ajudar com dúvidas do JIAM Preditivo." },
    ]);
  }, []);

  // Scroll automático do chat e salva histórico
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    if (sessionId) localStorage.setItem(`chat-${sessionId}`, JSON.stringify(mensagens));
  }, [mensagens]);

  // Pesquisas externas
  const pesquisarWikipedia = async (query) => {
    try {
      const res = await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      return { title: res.data.title, extract: res.data.extract, url: res.data.content_urls?.desktop?.page };
    } catch { return null; }
  };

  const pesquisarGoogle = async (query) => {
    try {
      const res = await axios.get("http://localhost:5000/api/google-search", { params: { query } });
      return res.data.results || [];
    } catch (err) { console.error(err); return []; }
  };

  // Sugestão de FAQ baseado no input
  const sugerirFAQ = (pergunta) => {
    const query = pergunta.toLowerCase();
    return perguntas
      .filter(p => p.titulo.toLowerCase().includes(query) || p.resposta.toLowerCase().includes(query))
      .map(p => `❗ Sugestão FAQ: ${p.titulo}`);
  };

  const handleEnviar = async () => {
    if (!input.trim() || !sessionId) return;
    const pergunta = input.trim();
    setMensagens(msgs => [...msgs, { remetente: "user", texto: pergunta }]);
    setInput("");
    setLoading(true);

    try {
      const wiki = await pesquisarWikipedia(pergunta);
      const resultadosGoogle = await pesquisarGoogle(pergunta);

      let respostaTexto = "";

      if (wiki) respostaTexto += `📚 Wikipedia:\n${wiki.title}: ${wiki.extract}\nMais info: ${wiki.url}\n\n`;
      if (resultadosGoogle.length > 0) {
        respostaTexto += "🔎 Resultados Google:\n";
        resultadosGoogle.forEach((item, i) => {
          respostaTexto += `${i + 1}. ${item.title}\n${item.snippet}\n${item.link}\n\n`;
        });
      }

      const sugestoes = sugerirFAQ(pergunta);
      if (sugestoes.length > 0) respostaTexto += sugestoes.join("\n") + "\n\n";

      if (!wiki && resultadosGoogle.length === 0 && sugestoes.length === 0)
        respostaTexto = "Desculpa, não encontrei informações. Tenta reformular a pergunta.";

      setMensagens(msgs => [...msgs, { remetente: "bot", texto: respostaTexto }]);
    } catch (err) {
      console.error(err);
      setMensagens(msgs => [...msgs, { remetente: "bot", texto: "Erro ao pesquisar informações." }]);
    } finally {
      setLoading(false);
    }
  };

  const formatarTexto = (texto) => {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    return texto.split("\n").map((linha, i) => (
      <p key={i} className="mb-2 leading-relaxed">
        {linha.split(linkRegex).map((parte, j) =>
          linkRegex.test(parte)
            ? <a key={j} href={parte} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">{parte}</a>
            : parte
        )}
      </p>
    ));
  };

  const togglePergunta = (index) => setPerguntaAtiva(perguntaAtiva === index ? null : index);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 bg-white rounded-3xl shadow-2xl mt-8 relative">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-10 w-10 text-cyan-500" />
        <h2 className="text-3xl font-bold text-cyan-700">{t.ajudaTitulo}</h2>
      </div>

      <p className="text-cyan-800 mb-6 text-sm md:text-base leading-relaxed">{t.ajudaDescricao}</p>

      {/* FAQ */}
      <div className="space-y-4">
        {perguntas.map((p, index) => (
          <div key={index} className="border border-cyan-200 rounded-xl shadow-sm overflow-hidden">
            <button
              className="w-full flex justify-between items-center p-4 bg-cyan-50 hover:bg-cyan-100 transition"
              onClick={() => togglePergunta(index)}
            >
              <span className="font-semibold text-cyan-700">{p.titulo}</span>
              {perguntaAtiva === index ? <ChevronUp className="h-5 w-5 text-cyan-500" /> : <ChevronDown className="h-5 w-5 text-cyan-500" />}
            </button>
            {perguntaAtiva === index && (
              <div className="p-4 bg-white text-sm text-cyan-800 border-t border-cyan-100 animate-fadeIn">
                {p.resposta}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contato */}
      <div className="mt-10 bg-cyan-50 border border-cyan-200 rounded-xl p-5 flex items-start gap-3">
        <Cpu className="h-6 w-6 text-cyan-500 mt-1" />
        <p className="text-cyan-800 text-sm">{t.contatoTexto} <strong>+244 928 565 837</strong> / <strong>venanciomartinse@gmail.com</strong></p>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatAberto(!chatAberto)}
        className="fixed bottom-6 right-6 z-50 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition"
      >
        {chatAberto ? <X className="h-6 w-6" /> : <Cpu className="h-6 w-6" />}
      </button>

      {/* Chatbot Window */}
      {chatAberto && (
        <div className="fixed bottom-20 right-6 z-50 bg-white w-80 md:w-96 rounded-3xl shadow-2xl border border-cyan-300 flex flex-col overflow-hidden">
          <div className="bg-cyan-500 text-white px-4 py-3 font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5" /> JIAM IA — Assistente Virtual 🤖
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-cyan-50">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[80%] ${m.remetente === "user" ? "bg-cyan-500 text-white self-end ml-auto" : "bg-white text-cyan-800 border border-cyan-200"}`}
              >
                {formatarTexto(m.texto)}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 p-2 text-cyan-700">
                <Loader2 className="animate-spin h-4 w-4" /> JIAM IA está a pesquisar...
              </div>
            )}
          </div>

          <div className="flex p-2 border-t border-cyan-200 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.chatPlaceholder}
              className="flex-1 border border-cyan-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleEnviar}
              className="ml-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg p-2 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

