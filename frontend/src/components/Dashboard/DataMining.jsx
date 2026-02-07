// src/components/Dashboard/DataMining.jsx
import React from "react";

export default function DataMining({ dados }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-2xl font-bold text-[#0A1F44] mb-6">🔍 Data Mining</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Técnicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Técnicas</h3>
            {[
              "Agrupamento (Clustering)",
              "Associação (Market Basket)",
              "Classificação",
              "Regressão",
              "Detecção de Anomalias",
              "Redução de Dimensionalidade"
            ].map((tecnica, idx) => (
              <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>{tecnica}</span>
              </div>
            ))}
          </div>

          {/* Configurações */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Configurações</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Algoritmo
              </label>
              <select className="w-full p-2 border border-gray-300 rounded">
                <option>K-Means</option>
                <option>DBSCAN</option>
                <option>Apriori</option>
                <option>FP-Growth</option>
                <option>PCA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Clusters
              </label>
              <input 
                type="range" 
                min="2" 
                max="10" 
                defaultValue="3"
                className="w-full"
              />
            </div>
          </div>

          {/* Resultados */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Resultados</h3>
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-600">Execute uma análise</p>
              <p className="text-sm text-gray-500">Os resultados aparecerão aqui</p>
            </div>
          </div>
        </div>

        {/* Botão de Execução */}
        <div className="mt-6">
          <button className="w-full bg-[#0A1F44] text-white py-3 rounded-lg hover:bg-[#1a3a6e] transition">
            Executar Mineração de Dados
          </button>
        </div>
      </div>
    </div>
  );
}