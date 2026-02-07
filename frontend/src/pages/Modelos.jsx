import React, { useState, useEffect } from "react";
import ModelSelector from "../components/ModelSelector";
import VariableSelector from "../components/VariableSelector";
import MetricsPanel from "../components/MetricsPanel";
import CoefTable from "../components/CoefTable";
import EquationView from "../components/EquationView";
import { getModelosDisponiveis, executarModelo } from "../services/rApi";
import { toast } from "react-toastify";

export default function Modelos() {
  const [modelos, setModelos] = useState([]);
  const [modeloSelecionado, setModeloSelecionado] = useState("");
  const [variaveis, setVariaveis] = useState(["X", "Y", "Z"]); // substituir por dados reais do upload
  const [variavelY, setVariavelY] = useState("");
  const [variavelX, setVariavelX] = useState("");
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const loadModelos = async () => {
      const data = await getModelosDisponiveis();
      setModelos(data);
    };
    loadModelos();
  }, []);

  const runModel = async () => {
    if (!modeloSelecionado || !variavelY || !variavelX) {
      toast.warning("Selecione modelo e variáveis");
      return;
    }
    setCarregando(true);
    try {
      const res = await executarModelo(modeloSelecionado, [], `${variavelY} ~ ${variavelX}`);
      if (res.success) setResultado(res);
      else toast.error(res.error || "Erro ao executar modelo");
    } catch (err) {
      toast.error("Erro na API");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Executar Modelos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModelSelector modelos={modelos} selecionado={modeloSelecionado} onChange={setModeloSelecionado} />
        <VariableSelector variaveis={variaveis} selected={variavelY} label="Variável Y" onChange={setVariavelY} />
        <VariableSelector variaveis={variaveis} selected={variavelX} label="Variável X" onChange={setVariavelX} />
      </div>
      <button
        onClick={runModel}
        disabled={carregando}
        className={`mt-4 w-full py-3 rounded-lg text-white font-medium ${carregando ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {carregando ? "Executando..." : "Executar Modelo"}
      </button>

      {resultado && (
        <>
          <CoefTable coeficientes={resultado.coeficientes} />
          <MetricsPanel metricas={resultado.qualidade} />
          <EquationView variavelY={variavelY} variavelX={variavelX} coeficientes={resultado.coeficientes} />
        </>
      )}
    </div>
  );
}
