import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";

// Componente MiniChart
function MiniChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="#00CFFF"
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// FreeLanding avançado
function FreeLanding({ lang }) {
const translations = {
  pt: {
    indicadores: "Indicadores Macroeconómicos",
    indicadoresDesc: "Visualize previsões em tempo real de inflação, PIB, desemprego e outros indicadores críticos.",
    historicos: "Análise de Dados Históricos",
    historicosDesc: "Acesse dados históricos e veja tendências para apoiar decisões estratégicas.",
    modelos: "Modelos Preditivos",
    modelosDesc: "Saiba como nossos modelos estatísticos e de Machine Learning prevêem cenários futuros.",
    bemVindo: "Bem-vindo ao JIAM Preditivo",
    verDetalhes: "Ver Detalhes",
    precisao: "Precisão",
    rmse: "RMSE"
  },
  en: {
    indicadores: "Macroeconomic Indicators",
    indicadoresDesc: "View real-time forecasts for inflation, GDP, unemployment, and other critical indicators.",
    historicos: "Historical Data Analysis",
    historicosDesc: "Access historical data and see trends to support strategic decisions.",
    modelos: "Predictive Models",
    modelosDesc: "Learn how our statistical and Machine Learning models forecast future scenarios.",
    bemVindo: "Welcome to JIAM Predictive",
    verDetalhes: "View Details",
    precisao: "Accuracy",
    rmse: "RMSE"
  }
};


  const t = translations[lang];

  // Dados dos cards
  const cards = [
    {
      title: t.indicadores,
      desc: t.indicadoresDesc,
      accuracy: 95,
      rmse: 1.2,
      chartData: [{ value: 10 }, { value: 15 }, { value: 8 }, { value: 12 }],
    },
    {
      title: t.historicos,
      desc: t.historicosDesc,
      accuracy: 92,
      rmse: 1.5,
      chartData: [{ value: 8 }, { value: 12 }, { value: 6 }, { value: 10 }],
    },
    {
      title: t.modelos,
      desc: t.modelosDesc,
      accuracy: 97,
      rmse: 0.9,
      chartData: [{ value: 9 }, { value: 14 }, { value: 7 }, { value: 13 }],
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  // Animação automática
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % cards.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const openDetail = (card) => {
    alert(
      `${card.title}\n\n${card.desc}\n\nPrecisão: ${card.accuracy}%\nRMSE: ${card.rmse}`
    );
  };

  return (
    <div className="pt-24 flex flex-col items-center bg-white min-h-screen w-full">
      <h1 className="text-4xl font-extrabold mb-12 text-[#0A1F44]">
        {t.bemVindo}
      </h1>

      <div className="relative w-full max-w-6xl overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="min-w-full px-4 flex justify-center"
            >
              <div className="bg-[#0A1F44] text-white p-6 rounded-2xl shadow-2xl flex flex-col gap-4 w-11/12 md:w-3/4 hover:scale-105 transition-transform duration-500">
                <h2 className="text-2xl font-bold">{card.title}</h2>
                <p className="text-white/80">{card.desc}</p>

                {/* Mini-métricas com destaque */}
                <div className="flex justify-between mt-2 text-sm bg-white/10 p-2 rounded-lg animate-pulse">
  <span>🎯 {t.precisao}: <b>{card.accuracy}%</b></span>
  <span>📉 {t.rmse}: <b>{card.rmse}</b></span>
</div>


                {/* Mini-gráfico */}
                <div className="h-24 mt-2">
                  <MiniChart data={card.chartData} />
                </div>

                {/* Botão de ação */}
                <button
                  onClick={() => openDetail(card)}
                  className="bg-cyan-400 text-[#0A1F44] py-2 px-4 rounded-full hover:bg-cyan-300 transition font-semibold mt-4 animate-bounce"
                >
                  {t.verDetalhes}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navegação */}
        <button
          onClick={() =>
            setActiveIndex((activeIndex - 1 + cards.length) % cards.length)
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#00CFFF] text-[#0A1F44] p-3 rounded-full hover:bg-[#00E0FF] shadow-lg"
        >
          ‹
        </button>

        <button
          onClick={() => setActiveIndex((activeIndex + 1) % cards.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#00CFFF] text-[#0A1F44] p-3 rounded-full hover:bg-[#00E0FF] shadow-lg"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default FreeLanding;
