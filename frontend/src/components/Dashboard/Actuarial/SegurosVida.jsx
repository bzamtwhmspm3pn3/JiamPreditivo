// src/components/Dashboard/Actuarial/SegurosVida.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function SegurosVida({ 
  statusSistema,
  resultadoTabua,
  criarTabuaMortalidade,
  onSaveModel 
}) {
  const [config, setConfig] = useState({
    base_mortalidade: 'BR-EMS2020',
    idade_min: 20,
    idade_max: 100,
    sexo: 'unisex',
    l0: 100000,
    qx_adjust: 1.0,
    juros: 0.03,
    inflacao: 0.04
  });

  const [calculos, setCalculos] = useState(null);
  const [executando, setExecutando] = useState(false);
  const [idadeSelecionada, setIdadeSelecionada] = useState(30);

  const basesMortalidade = [
    { id: 'BR-EMS2020', nome: 'BR-EMS 2020', descricao: 'Brasil - Estimativas e Projeções' },
    { id: 'AT-2000', nome: 'AT-2000', descricao: 'American Mortality Tables' },
    { id: 'CSO-2017', nome: 'CSO-2017', descricao: 'Commissioners Standard Ordinary' },
    { id: 'RG-2021', nome: 'RG-2021', descricao: 'Regulatório SUSEP' },
    { id: 'personalizada', nome: 'Personalizada', descricao: 'Ajustar parâmetros manualmente' }
  ];

  const handleGerarTabua = async () => {
    setExecutando(true);
    setCalculos(null);
    
    try {
      await criarTabuaMortalidade(config);
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setExecutando(false);
    }
  };

  useEffect(() => {
    if (resultadoTabua && resultadoTabua.qx) {
      const idade = idadeSelecionada;
      const idx = idade - config.idade_min;
      
      if (idx >= 0 && idx < resultadoTabua.qx.length) {
        const qx_idade = resultadoTabua.qx[idx];
        const ex_idade = resultadoTabua.ex ? resultadoTabua.ex[idx] : 60;
        
        const premios = {
          premio_puro: {
            descricao: "Prêmio Puro (Risco)",
            valor: (100000 * qx_idade * (1 / (1 + config.juros))).toFixed(2),
            formula: "C × qx × ax"
          },
          premio_comercial: {
            descricao: "Prêmio Comercial",
            valor: (100000 * qx_idade * (1 / (1 + config.juros)) * 1.35).toFixed(2),
            componentes: {
              risco: "65%",
              despesas: "25%",
              lucro: "8%",
              impostos: "2%"
            }
          }
        };

        setCalculos(premios);
      }
    }
  }, [resultadoTabua, idadeSelecionada, config]);

  const renderGraficoMortalidade = () => {
    if (!resultadoTabua || !resultadoTabua.qx) return null;

    const maxQx = Math.max(...resultadoTabua.qx);
    const alturaMaxima = 200;

    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>qx (probabilidade de morte)</span>
          {resultadoTabua.idades && (
            <span>Idade: {idadeSelecionada} anos</span>
          )}
        </div>
        <div className="h-48 relative border-l border-b border-gray-300">
          {/* Eixo Y */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
            <span>{(maxQx).toFixed(4)}</span>
            <span>{(maxQx * 0.75).toFixed(4)}</span>
            <span>{(maxQx * 0.5).toFixed(4)}</span>
            <span>{(maxQx * 0.25).toFixed(4)}</span>
            <span>0</span>
          </div>

          {/* Barras */}
          {resultadoTabua.idades && (
            <div className="absolute left-8 right-0 top-0 bottom-0 flex items-end">
              {resultadoTabua.idades.map((idade, idx) => {
                const altura = (resultadoTabua.qx[idx] / maxQx) * alturaMaxima;
                const isSelecionada = idade === idadeSelecionada;
                
                return (
                  <div
                    key={idade}
                    className="flex-1 flex flex-col items-center mx-0.5 cursor-pointer"
                    onClick={() => setIdadeSelecionada(idade)}
                  >
                    <div
                      className={`w-full transition-all ${
                        isSelecionada
                          ? 'bg-red-600'
                          : idade < 65 ? 'bg-blue-500' : 'bg-purple-500'
                      }`}
                      style={{ height: `${altura}px` }}
                    ></div>
                    <div className={`text-xs mt-1 ${isSelecionada ? 'font-bold text-red-600' : 'text-gray-500'}`}>
                      {idade % 10 === 0 ? idade : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">🛡️ Seguros de Vida e Tábuas de Mortalidade</h3>
      <p className="text-gray-600">Cálculos atuariais para seguros de vida, pensões e previdência</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div className="bg-white p-6 rounded-xl border shadow">
          <h4 className="font-semibold text-lg mb-4">Configuração da Tábua</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base de Mortalidade
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={config.base_mortalidade}
                onChange={(e) => setConfig({...config, base_mortalidade: e.target.value})}
              >
                {basesMortalidade.map(base => (
                  <option key={base.id} value={base.id}>
                    {base.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idade Mínima
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={config.idade_min}
                  onChange={(e) => setConfig({...config, idade_min: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idade Máxima
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={config.idade_max}
                  onChange={(e) => setConfig({...config, idade_max: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={config.sexo}
                onChange={(e) => setConfig({...config, sexo: e.target.value})}
              >
                <option value="unisex">Unisex</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                População Inicial (l₀)
              </label>
              <input
                type="number"
                min="1000"
                max="1000000"
                step="1000"
                value={config.l0}
                onChange={(e) => setConfig({...config, l0: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ajuste de Mortalidade
              </label>
              <input
                type="number"
                min="0.1"
                max="3.0"
                step="0.1"
                value={config.qx_adjust}
                onChange={(e) => setConfig({...config, qx_adjust: parseFloat(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <button
              onClick={handleGerarTabua}
              disabled={executando}
              className={`w-full py-3 rounded-lg font-medium ${
                executando 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {executando ? 'Gerando tábua...' : '📊 Gerar Tábua de Mortalidade'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {resultadoTabua ? (
            <>
              <div className="bg-white p-6 rounded-xl border shadow">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <div className="text-sm text-blue-800">Esperança de Vida (e₀)</div>
                    <div className="text-xl font-bold">
                      {resultadoTabua.ex ? resultadoTabua.ex[0]?.toFixed(1) || '0' : '0'} anos
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <div className="text-sm text-green-800">Idades na Tábua</div>
                    <div className="text-xl font-bold">
                      {resultadoTabua.idades ? resultadoTabua.idades.length : '0'}
                    </div>
                  </div>
                </div>

                {renderGraficoMortalidade()}

                {resultadoTabua.idades && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idade para Cálculos: {idadeSelecionada} anos
                    </label>
                    <input
                      type="range"
                      min={config.idade_min}
                      max={config.idade_max}
                      value={idadeSelecionada}
                      onChange={(e) => setIdadeSelecionada(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {calculos && (
                <div className="bg-white p-6 rounded-xl border shadow">
                  <h4 className="font-semibold text-lg mb-4">
                    Cálculos para Idade {idadeSelecionada}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(calculos).map(([key, calc]) => (
                      <div key={key} className="bg-gray-50 p-4 rounded border">
                        <div className="font-medium text-gray-800 mb-1">{calc.descricao}</div>
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          R$ {parseFloat(calc.valor).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                        
                        {calc.formula && (
                          <div className="text-sm text-gray-600 mb-2">
                            Fórmula: {calc.formula}
                          </div>
                        )}
                        
                        {calc.componentes && (
                          <div className="text-xs text-gray-500">
                            <div className="font-medium mb-1">Composição:</div>
                            {Object.entries(calc.componentes).map(([comp, valor]) => (
                              <div key={comp} className="flex justify-between">
                                <span>{comp}:</span>
                                <span>{valor}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 p-12 rounded-xl border text-center">
              <div className="text-4xl mb-4">📈</div>
              <h4 className="font-semibold text-lg mb-2">Tábua de Mortalidade</h4>
              <p className="text-gray-600 mb-4">
                Gere tábuas de mortalidade personalizadas para cálculos atuariais
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}