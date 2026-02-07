// src/components/Dashboard/Graficos.jsx
import React, { useState } from "react";

export default function Graficos({ dados }) {
  const [tipoGrafico, setTipoGrafico] = useState("dispersao");

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-2xl font-bold text-[#0A1F44] mb-6">📈 Gráficos</h2>
        
        {/* Controles */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["dispersao", "histograma", "boxplot", "correlacao", "densidade"].map((tipo) => (
            <button
              key={tipo}
              className={`px-4 py-2 rounded-lg ${tipoGrafico === tipo ? "bg-[#0A1F44] text-white" : "bg-gray-100"}`}
              onClick={() => setTipoGrafico(tipo)}
            >
              {tipo === "dispersao" && "Dispersão"}
              {tipo === "histograma" && "Histograma"}
              {tipo === "boxplot" && "Boxplot"}
              {tipo === "correlacao" && "Correlação"}
              {tipo === "densidade" && "Densidade"}
            </button>
          ))}
        </div>

        {/* Área do Gráfico */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">
            {tipoGrafico === "dispersao" && "📊"}
            {tipoGrafico === "histograma" && "📉"}
            {tipoGrafico === "boxplot" && "📦"}
            {tipoGrafico === "correlacao" && "🔗"}
            {tipoGrafico === "densidade" && "🌊"}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {tipoGrafico === "dispersao" && "Gráfico de Dispersão"}
            {tipoGrafico === "histograma" && "Histograma"}
            {tipoGrafico === "boxplot" && "Boxplot"}
            {tipoGrafico === "correlacao" && "Matriz de Correlação"}
            {tipoGrafico === "densidade" && "Gráfico de Densidade"}
          </h3>
          <p className="text-gray-600">
            {dados ? "Configure as variáveis para visualizar o gráfico" : "Carregue dados para criar gráficos"}
          </p>
        </div>
      </div>
    </div>
  );
}