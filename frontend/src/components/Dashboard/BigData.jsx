// src/components/Dashboard/BigData.jsx
import React from "react";

export default function BigData({ dados }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-2xl font-bold text-[#0A1F44] mb-6">💾 Big Data</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Status do Sistema</h3>
            <div className="space-y-3">
              {[
                { label: "Processamento Distribuído", status: "Ativo", color: "green" },
                { label: "Armazenamento em Cluster", status: "Ativo", color: "green" },
                { label: "Processamento em Tempo Real", status: "Pendente", color: "yellow" },
                { label: "Análise de Streaming", status: "Inativo", color: "red" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>{item.label}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.color === "green" ? "bg-green-100 text-green-800" :
                    item.color === "yellow" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ferramentas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Ferramentas</h3>
            <div className="grid grid-cols-2 gap-3">
              {["Spark", "Hadoop", "Kafka", "Cassandra", "HBase", "Flink"].map((tool, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl mb-2">
                    {tool === "Spark" && "⚡"}
                    {tool === "Hadoop" && "🐘"}
                    {tool === "Kafka" && "📡"}
                    {tool === "Cassandra" && "🏛️"}
                    {tool === "HBase" && "🗄️"}
                    {tool === "Flink" && "🌊"}
                  </div>
                  <span className="font-medium">{tool}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Análise */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-4">Análise Big Data</h3>
          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-6xl mb-4">🚀</div>
            <p className="text-gray-600">Pronto para processamento em larga escala</p>
            <p className="text-sm text-gray-500 mt-2">
              Configure as opções e inicie a análise de grandes volumes de dados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}