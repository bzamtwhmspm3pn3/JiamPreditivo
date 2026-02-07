import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Heart, Info, HelpCircle } from "lucide-react";
import translations from "../data/translations.json";

export default function FooterJIAM({ setAbaAtiva, lang = "pt" }) {
  const [showModal, setShowModal] = useState(false);
  const [avaliacao, setAvaliacao] = useState(0);
  const [comentario, setComentario] = useState("");
  const [nome, setNome] = useState("");
  const [testemunhos, setTestemunhos] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/avaliacoes";
  const t = translations[lang] || translations["pt"];

  // Carregar avaliações
  useEffect(() => {
    const fetchAvaliacoes = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTestemunhos(data);
      } catch (err) {
        console.warn("⚠️ Erro ao carregar avaliações:", err);
        setTestemunhos([]); // fallback vazio
      }
    };
    fetchAvaliacoes();
  }, [API_URL]);

  const handleEnviar = async () => {
    if (!avaliacao || !comentario.trim()) return;
    const nova = { nome: nome.trim() || "Visitante", texto: comentario, estrelas: avaliacao };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nova),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const novaAvaliacao = await res.json();
      setTestemunhos(prev => [novaAvaliacao, ...prev]);
      setAvaliacao(0); setComentario(""); setNome(""); setShowModal(false);
    } catch (err) {
      console.error("Erro no envio de avaliação:", err);
      alert("Falha ao enviar avaliação. Verifique o backend.");
    }
  };

  return (
    <motion.footer className="relative bg-gray-900 text-white py-12 mt-12 w-full flex flex-col items-center overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-300 bg-[length:200%_200%]"
      />

      <div className="relative z-10 max-w-6xl w-full px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Identidade Institucional */}
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-3xl font-bold text-white">JIAM Preditivo</h2>
          <span className="inline-block px-3 py-1 bg-cyan-400 text-[#0A1F44] font-mono rounded-full shadow-lg animate-pulse">
            {lang === "pt" ? "AnDio Tech Inovações" : "AnDio Tech Innovations"}
          </span>
          <p className="text-gray-300 text-sm mt-2 max-w-xs leading-relaxed">
            {lang === "pt"
              ? "Plataforma de análise preditiva avançada com séries temporais e Machine Learning, criada para decisões estratégicas de alto impacto."
              : "Advanced predictive platform with time series and Machine Learning, designed for high-impact strategic decisions."}
          </p>
        </div>

        {/* Navegação */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-300">{t.navegacao}</h3>
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setAbaAtiva("QuemSomos")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded shadow text-white font-medium">
            <Info className="w-5 h-5" /> {t.sobre}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setAbaAtiva("Ajuda")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded shadow text-white font-medium">
            <HelpCircle className="w-5 h-5" /> {t.ajuda}
          </motion.button>
        </div>

        {/* Avaliações */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-300">{t.testemunhos}</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-gray-800">
            {testemunhos.length ? testemunhos.map((tst, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800 p-3 rounded shadow text-sm">
                <p className="italic text-gray-200 mb-1">“{tst.texto}”</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>— {tst.nome}</span>
                  <span>{"⭐".repeat(tst.estrelas)}</span>
                </div>
              </motion.div>
            )) : (
              <p className="text-gray-500 italic text-sm">{t.semAvaliacoes}</p>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowModal(true)}
            className="bg-cyan-400 text-[#0A1F44] font-semibold py-2 px-4 rounded shadow flex items-center justify-center gap-2 hover:bg-cyan-300 transition">
            <Heart className="w-5 h-5" /> {t.avalie}
          </motion.button>
        </div>
      </div>

      {/* Rodapé */}
      <div className="relative z-10 text-center mt-10 border-t border-gray-700 pt-6">
        <p className="text-gray-400 text-sm">© 2025 JIAM Preditivo — {t.footerFinal}</p>
      </div>

      {/* Modal Avaliação */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl p-6 w-11/12 md:w-96 shadow-2xl text-center"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <div className="flex justify-end">
                <button onClick={() => setShowModal(false)}>
                  <X className="text-gray-700 hover:text-red-500" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t.avaliarTitulo}</h3>
              <input value={nome} onChange={e => setNome(e.target.value)} autoComplete="name"
                placeholder={t.nomePlaceholder}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3 
                  text-[#0A1F44] placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              />
              <div className="flex justify-center gap-1 mb-3">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} onClick={() => setAvaliacao(n)}
                    className={`cursor-pointer w-6 h-6 ${n <= avaliacao ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>
              <textarea value={comentario} onChange={e => setComentario(e.target.value)} autoComplete="off"
                placeholder={t.comentarPlaceholder}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm 
                  text-[#0A1F44] placeholder-gray-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none mb-4"
              />
              <motion.button whileHover={{ scale: 1.05 }} onClick={handleEnviar}
                className="bg-cyan-400 text-[#0A1F44] px-4 py-2 w-full rounded font-semibold hover:bg-cyan-300 transition">
                {t.enviar}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.footer>
  );
}
