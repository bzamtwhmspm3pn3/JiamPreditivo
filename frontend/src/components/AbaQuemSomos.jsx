import React from "react";
import { motion } from "framer-motion";
import { Users, BarChart2, TrendingUp, Cpu, FileText, Database, Monitor, Star } from "lucide-react";
import { useTranslation, COLORS, PanelHeader } from "../contexts/AppContext";

// AbaQuemSomos completa
export default function AbaQuemSomos() {
  const { t } = useTranslation();

  // Proteção contra undefined
  const cards = [
    {
      title: t?.cards?.previsoes?.title || "Previsões Estatísticas",
      emoji: "📈",
      icon: BarChart2,
      content:
        t?.cards?.previsoes?.desc ||
        "Regressão Linear (Simples e Múltipla), Logística e Simulação de Cenários.",
      color: "#00CFFF",
    },
    {
      title: t?.cards?.ml?.title || "Modelos de Machine Learning",
      emoji: "🌳",
      icon: Cpu,
      content:
        t?.cards?.ml?.desc ||
        "Random Forest e XGBoost para previsão e análise avançada de dados.",
      color: "#0A84FF",
    },
    {
      title: t?.cards?.series?.title || "Séries Temporais",
      emoji: "📊",
      icon: TrendingUp,
      content:
        t?.cards?.series?.desc ||
        "ARIMA, SARIMA, ETS e Prophet para análise temporal robusta.",
      color: "#00FFC1",
    },
    {
      title: t?.cards?.graficos?.title || "Gráficos Interativos",
      emoji: "📉",
      icon: Monitor,
      content:
        t?.cards?.graficos?.desc ||
        "Dispersão, Histograma, Boxplot, Curva de Previsão e Correlação.",
      color: "#FFB800",
    },
    {
      title: t?.cards?.interpretacao?.title || "Interpretação Automática",
      emoji: "🔍",
      icon: FileText,
      content:
        t?.cards?.interpretacao?.desc ||
        "Geração de explicações personalizadas por tipo de modelo e variável.",
      color: "#FF6B6B",
    },
    {
      title: t?.cards?.bases?.title || "Integração com Bases de Dados",
      emoji: "💾",
      icon: Database,
      content:
        t?.cards?.bases?.desc ||
        "Suporte a múltiplos formatos e integração direta com bases de dados reais.",
      color: "#8E44AD",
    },
  ];

  return (
    <main className={`p-8 md:p-12 h-full overflow-y-auto ${COLORS.primaryBg}`}>
      <PanelHeader
        icon={Users}
        title={t?.quemSomos?.title || "Quem Somos"}
        description={
          t?.quemSomos?.desc ||
          "JIAM - Predictivo é uma aplicação analítica avançada para previsão e interpretação de dados em contextos económicos, sociais e administrativos."
        }
      />

      <p className={`${COLORS.text} text-base mb-8`}>
        {t?.quemSomos?.intro ||
          "O sistema integra métodos estatísticos, algoritmos de Machine Learning e modelos de Séries Temporais para auxiliar na tomada de decisões fundamentadas."}
      </p>

      {/* Cards interativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 border-l-4 border-[#00CFFF] hover:border-l-8 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{card.emoji}</span>
              <h3
                className="text-lg font-bold text-[#0A1F44] dark:text-white"
                style={{ color: card.color }}
              >
                {card.title}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{card.content}</p>
          </motion.div>
        ))}
      </div>

      {/* Direitos autorais e autor */}
      <div className="mt-12 p-6 bg-[#0A1F44] text-white rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold mb-2">📝 Direitos Autorais</h3>
        <p className="text-sm leading-relaxed">
          Autor: <b>Venâncio Elavoco Cassova Martins</b> <br />
          JIAM é uma homenagem a Jerônimo Inocêncio Alberto Martins (seu filho). <br />
          Ano de criação: 2025 <br />
          Contacto: +244 928 565 837 — Email: venanciomartinse@gmail.com <br />
          Empresa: AnDioTech Inovações <br />
          Todos os direitos reservados © 2025.
        </p>
      </div>
    </main>
  );
}

