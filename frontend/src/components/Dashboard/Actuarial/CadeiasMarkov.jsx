// src/components/Dashboard/abas/CadeiasMarkov.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';


export default function CadeiasMarkov({ dados, statusBackend, modeloFrequencia }) {
  const [config, setConfig] = useState({
    var_analise: '',
    n_estados: 3,
    nomes_estados: 'Baixo,Médio,Alto',
    metodo: 'MLE',
    periodo_analise: 5,
    calcular_estacionario: true
  });

  const [variaveisDisponiveis, setVariaveisDisponiveis] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [executando, setExecutando] = useState(false);
  const [matrizSelecionada, setMatrizSelecionada] = useState(0);
  const [projecao, setProjecao] = useState([]);

  useEffect(() => {
    if (dados && dados.colunas) {
      setVariaveisDisponiveis(dados.colunas);
      setConfig(prev => ({
        ...prev,
        var_analise: dados.colunas.find(c => 
          c.toLowerCase().includes('estado') || 
          c.toLowerCase().includes('nivel') ||
          c.toLowerCase().includes('class')
        ) || dados.colunas[0]
      }));
    }
  }, [dados]);

  const executarAnaliseMarkov = async () => {
    if (!dados || dados.dados.length === 0) {
      toast.error("Carregue dados primeiro!");
      return;
    }

    setExecutando(true);
    setResultado(null);

    try {
      // Simulação de dados
      const resultadoSimulado = {
        matrizes_transicao: [
          {
            periodo: "Anual",
            matriz: [
              [0.7, 0.2, 0.1],
              [0.15, 0.6, 0.25],
              [0.05, 0.15, 0.8]
            ]
          },
          {
            periodo: "Trimestral",
            matriz: [
              [0.85, 0.1, 0.05],
              [0.08, 0.84, 0.08],
              [0.02, 0.08, 0.9]
            ]
          }
        ],
        estados: config.nomes_estados.split(','),
        distribuicao_estacionaria: [0.286, 0.381, 0.333],
        tempos_permanencia: [3.33, 2.50, 5.00],
        taxa_transicao_global: 0.35,
        diagnostico: {
          ergodico: true,
          irredutivel: true,
          estacionario: true
        }
      };

      setResultado(resultadoSimulado);
      
      // Gerar projeção
      gerarProjecao(resultadoSimulado.matrizes_transicao[0].matriz);
      
      toast.success("Análise de Markov concluída!");
    } catch (error) {
      toast.error(`Erro na análise: ${error.message}`);
    } finally {
      setExecutando(false);
    }
  };

  const gerarProjecao = (matriz) => {
    const estados = config.nomes_estados.split(',');
    const projecaoTemp = [];
    
    // Distribuição inicial uniforme
    let distribuicaoAtual = Array(estados.length).fill(1/estados.length);
    
    for (let periodo = 0; periodo <= config.periodo_analise; periodo++) {
      projecaoTemp.push({
        periodo: `T${periodo}`,
        distribuicao: [...distribuicaoAtual],
        estado_mais_provavel: estados[distribuicaoAtual.indexOf(Math.max(...distribuicaoAtual))]
      });
      
      // Calcular próxima distribuição
      if (periodo < config.periodo_analise) {
        const novaDistribuicao = [];
        for (let i = 0; i < estados.length; i++) {
          let soma = 0;
          for (let j = 0; j < estados.length; j++) {
            soma += distribuicaoAtual[j] * matriz[j][i];
          }
          novaDistribuicao.push(soma);
        }
        distribuicaoAtual = novaDistribuicao;
      }
    }
    
    setProjecao(projecaoTemp);
  };

  const calcularProbabilidadeAbsorcao = () => {
    if (!resultado) return null;
    
    const matriz = resultado.matrizes_transicao[matrizSelecionada].matriz;
    const n = matriz.length;
    
    // Identificar estados absorventes (probabilidade de permanecer = 1)
    const estadosAbsorventes = [];
    for (let i = 0; i < n; i++) {
      if (matriz[i][i] === 1 || (matriz[i][i] > 0.95 && matriz[i].reduce((a, b, j) => j !== i ? a + b : a, 0) < 0.05)) {
        estadosAbsorventes.push(i);
      }
    }
    
    return estadosAbsorventes;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800">📊 Análise por Cadeias de Markov</h3>
      <p className="text-gray-600">Tarifação a posteriori e análise de transição de estados</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div className="bg-white p-6 rounded-xl border shadow">
          <h4 className="font-semibold text-lg mb-4">Configurações da Cadeia</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variável de Análise
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={config.var_analise}
                onChange={(e) => setConfig({...config, var_analise: e.target.value})}
              >
                <option value="">Selecione...</option>
                {variaveisDisponiveis.map((variavel, idx) => (
                  <option key={idx} value={variavel}>{variavel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Estados
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={config.n_estados}
                onChange={(e) => {
                  const n = parseInt(e.target.value);
                  let nomes = '';
                  if (n === 2) nomes = 'Baixo,Alto';
                  else if (n === 3) nomes = 'Baixo,Médio,Alto';
                  else if (n === 4) nomes = 'Muito Baixo,Baixo,Alto,Muito Alto';
                  else if (n === 5) nomes = 'Muito Baixo,Baixo,Médio,Alto,Muito Alto';
                  
                  setConfig({
                    ...config, 
                    n_estados: n,
                    nomes_estados: nomes
                  });
                }}
              >
                <option value="2">2 Estados</option>
                <option value="3">3 Estados</option>
                <option value="4">4 Estados</option>
                <option value="5">5 Estados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomes dos Estados
              </label>
              <input
                type="text"
                value={config.nomes_estados}
                onChange={(e) => setConfig({...config, nomes_estados: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Ex: Baixo,Médio,Alto"
              />
              <p className="text-xs text-gray-500 mt-1">Separe por vírgula</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Estimação
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={config.metodo}
                onChange={(e) => setConfig({...config, metodo: e.target.value})}
              >
                <option value="MLE">Máxima Verossimilhança (MLE)</option>
                <option value="Bayesiano">Bayesiano</option>
                <option value="Empírico">Empírico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Períodos para Projeção
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.periodo_analise}
                onChange={(e) => setConfig({...config, periodo_analise: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="estacionario"
                checked={config.calcular_estacionario}
                onChange={(e) => setConfig({...config, calcular_estacionario: e.target.checked})}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="estacionario" className="ml-2 text-sm text-gray-700">
                Calcular distribuição estacionária
              </label>
            </div>

            <button
              onClick={executarAnaliseMarkov}
              disabled={executando || !dados}
              className={`w-full py-3 rounded-lg font-medium ${
                executando 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {executando ? 'Analisando...' : '▶️ Executar Análise Markov'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {resultado ? (
            <>
              {/* Matrizes de Transição */}
              <div className="bg-white p-6 rounded-xl border shadow">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Matriz(es) de Transição</h4>
                  <div className="flex space-x-2">
                    {resultado.matrizes_transicao.map((matriz, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMatrizSelecionada(idx)}
                        className={`px-3 py-1 rounded text-sm ${
                          matrizSelecionada === idx
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {matriz.periodo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border">De \ Para</th>
                        {resultado.estados.map((estado, idx) => (
                          <th key={idx} className="px-4 py-2 border bg-gray-50">
                            {estado}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.matrizes_transicao[matrizSelecionada].matriz.map((linha, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 border bg-gray-50 font-medium">
                            {resultado.estados[i]}
                          </td>
                          {linha.map((celula, j) => (
                            <td key={j} className="px-4 py-2 border text-center">
                              <div className={`inline-block px-2 py-1 rounded ${
                                celula >= 0.7 ? 'bg-green-100 text-green-800' :
                                celula >= 0.4 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {celula.toFixed(3)}
                              </div>
                              {i === j && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Permanência
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Diagnóstico */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded border ${
                    resultado.diagnostico.ergodico 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-sm font-medium">
                      {resultado.diagnostico.ergodico ? '✅' : '❌'} Ergodica
                    </div>
                    <div className="text-xs text-gray-600">
                      Estados comunicantes
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${
                    resultado.diagnostico.irredutivel 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-sm font-medium">
                      {resultado.diagnostico.irredutivel ? '✅' : '❌'} Irredutível
                    </div>
                    <div className="text-xs text-gray-600">
                      Todos estados acessíveis
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${
                    resultado.diagnostico.estacionario 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-sm font-medium">
                      {resultado.diagnostico.estacionario ? '✅' : '❌'} Estacionária
                    </div>
                    <div className="text-xs text-gray-600">
                      Distribuição limite
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribuição Estacionária e Projeção */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribuição Estacionária */}
                <div className="bg-white p-6 rounded-xl border shadow">
                  <h4 className="font-semibold text-lg mb-4">Distribuição Estacionária</h4>
                  
                  <div className="space-y-3">
                    {resultado.estados.map((estado, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                          <span>{estado}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div 
                              className="h-full bg-purple-600"
                              style={{ width: `${resultado.distribuicao_estacionaria[idx] * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">
                            {(resultado.distribuicao_estacionaria[idx] * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-sm font-medium text-blue-800">
                      Tempo Médio de Permanência
                    </div>
                    <div className="mt-1 text-xs text-blue-700">
                      {resultado.estados.map((estado, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{estado}:</span>
                          <span>{resultado.tempos_permanencia[idx].toFixed(2)} períodos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Projeção Temporal */}
                <div className="bg-white p-6 rounded-xl border shadow">
                  <h4 className="font-semibold text-lg mb-4">Projeção Temporal</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 border text-left">Período</th>
                          {resultado.estados.map((estado, idx) => (
                            <th key={idx} className="px-3 py-2 border text-center">
                              {estado}
                            </th>
                          ))}
                          <th className="px-3 py-2 border text-left">Mais Provável</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projecao.map((item, idx) => (
                          <tr key={idx} className={idx === 0 ? 'bg-blue-50' : ''}>
                            <td className="px-3 py-2 border font-medium">
                              {item.periodo}
                            </td>
                            {item.distribuicao.map((prob, pIdx) => (
                              <td key={pIdx} className="px-3 py-2 border text-center">
                                <div className={`inline-block px-2 py-1 rounded text-xs ${
                                  prob === Math.max(...item.distribuicao)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {(prob * 100).toFixed(1)}%
                                </div>
                              </td>
                            ))}
                            <td className="px-3 py-2 border">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                {item.estado_mais_provavel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Estados Absorventes */}
                  {(() => {
                    const estadosAbsorventes = calcularProbabilidadeAbsorcao();
                    if (estadosAbsorventes && estadosAbsorventes.length > 0) {
                      return (
                        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                          <div className="text-sm font-medium text-yellow-800">
                            ⚠️ Estados Absorventes Detectados
                          </div>
                          <div className="text-xs text-yellow-700 mt-1">
                            Estados que, uma vez atingidos, não são deixados:
                            {estadosAbsorventes.map(idx => (
                              <span key={idx} className="ml-2 px-2 py-1 bg-yellow-100 rounded">
                                {resultado.estados[idx]}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 p-12 rounded-xl border text-center">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="font-semibold text-lg mb-2">Análise de Cadeias de Markov</h4>
              <p className="text-gray-600 mb-4">
                Analise a dinâmica de transição entre estados de sinistralidade
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• Identifique padrões de migração entre classes de risco</p>
                <p>• Calcule distribuições estacionárias</p>
                <p>• Projete estados futuros da carteira</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}