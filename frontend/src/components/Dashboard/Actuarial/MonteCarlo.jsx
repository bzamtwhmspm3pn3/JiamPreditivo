// src/components/Dashboard/Actuarial/MonteCarlo.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function MonteCarlo({ 
  dados,  // 🔥 NOVO: Dados recebidos da aba principal
  statusSistema,
  resultadoMonteCarlo,
  executarMonteCarlo,
  onVoltar, // 🔥 NOVO: callback para voltar
  modeloFrequencia,  // Modelos opcionais (do a_priori)
  modeloSeveridade
}) {
  const [config, setConfig] = useState({
    n_sim: 1000,
    vol_freq: 0.2,
    vol_sev: 0.3,
    incluir_correlacao: true,
    nivel_confianca: 0.99
  });

  const [executando, setExecutando] = useState(false);
  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0 });
  const [variaveisDisponiveis, setVariaveisDisponiveis] = useState([]);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState('metricas');

  // Extrair dados do objeto
  const extrairDadosArray = (dadosObj) => {
    if (!dadosObj) return [];
    
    if (Array.isArray(dadosObj)) return dadosObj;
    
    if (typeof dadosObj === 'object') {
      if (dadosObj.dados_completos && Array.isArray(dadosObj.dados_completos)) {
        return dadosObj.dados_completos;
      }
      if (dadosObj.amostra && Array.isArray(dadosObj.amostra)) {
        return dadosObj.amostra;
      }
      if (dadosObj.data && Array.isArray(dadosObj.data)) {
        return dadosObj.data;
      }
      if (dadosObj.dados && Array.isArray(dadosObj.dados)) {
        return dadosObj.dados;
      }
    }
    
    return [];
  };

  // Inicializar com dados
  useEffect(() => {
    const dadosArray = extrairDadosArray(dados);
    
    if (dadosArray && dadosArray.length > 0) {
      const primeiraLinha = dadosArray[0];
      const vars = Object.keys(primeiraLinha);
      
      setVariaveisDisponiveis(vars);
      setInfoDados({
        linhas: dadosArray.length,
        colunas: vars.length
      });
    } else {
      setInfoDados({ linhas: 0, colunas: 0 });
      setVariaveisDisponiveis([]);
    }
  }, [dados]);

  const handleExecutar = async () => {
    const dadosArray = extrairDadosArray(dados);
    
    if (!dadosArray || dadosArray.length === 0) {
      toast.error("❌ Carregue dados primeiro!");
      return;
    }

    setExecutando(true);
    try {
      // 🔥 PREPARAR PAYLOAD IGUAL AO A_PRIORI
      const payload = {
        dados: dadosArray,
        parametros: {
          n_sim: config.n_sim,
          vol_freq: config.vol_freq,
          vol_sev: config.vol_sev,
          incluir_correlacao: config.incluir_correlacao,
          nivel_confianca: config.nivel_confianca
        }
      };
      
      // 🔥 ADICIONAR MODELOS SE DISPONÍVEIS
      if (modeloFrequencia && modeloSeveridade) {
        payload.modelos_ajustados = {
          frequencia: modeloFrequencia,
          severidade: modeloSeveridade
        };
      }
      
      await executarMonteCarlo(payload);
      toast.success('✅ Simulação Monte Carlo executada!');
    } catch (error) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setExecutando(false);
    }
  };

  const prepararDadosDistribuicao = () => {
    if (!resultadoMonteCarlo?.distribuicao_perdas?.intervalos) return [];
    
    const { intervalos, frequencias } = resultadoMonteCarlo.distribuicao_perdas;
    
    return intervalos.map((intervalo, idx) => ({
      intervalo: `Até ${intervalo.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
      frequencia: frequencias[idx] || 0
    }));
  };

  const prepararDadosPercentis = () => {
    if (!resultadoMonteCarlo?.dados_graficos) return [];
    
    const percentis = resultadoMonteCarlo.dados_graficos.percentis;
    const valores = resultadoMonteCarlo.dados_graficos.valores_percentis;
    
    return percentis.map((percentil, idx) => ({
      percentil: `${(percentil * 100).toFixed(0)}%`,
      valor: valores[idx] || 0
    }));
  };

  const renderConfiguracao = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de Simulações
        </label>
        <input
          type="number"
          min="100"
          max="10000"
          step="100"
          value={config.n_sim}
          onChange={(e) => setConfig({...config, n_sim: parseInt(e.target.value) || 1000})}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <div className="text-xs text-gray-500 mt-1">
          Recomendado: 1.000-5.000 para boa precisão
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vol. Frequência (%)
          </label>
          <input
            type="number"
            min="5"
            max="50"
            step="1"
            value={config.vol_freq * 100}
            onChange={(e) => setConfig({...config, vol_freq: parseFloat(e.target.value) / 100})}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <div className="text-xs text-gray-500 mt-1">
            Incerteza na frequência
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vol. Severidade (%)
          </label>
          <input
            type="number"
            min="10"
            max="60"
            step="1"
            value={config.vol_sev * 100}
            onChange={(e) => setConfig({...config, vol_sev: parseFloat(e.target.value) / 100})}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <div className="text-xs text-gray-500 mt-1">
            Incerteza na severidade
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nível de Confiança
          </label>
          <select
            value={config.nivel_confianca}
            onChange={(e) => setConfig({...config, nivel_confianca: parseFloat(e.target.value)})}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
            <option value="0.995">99.5%</option>
            <option value="0.999">99.9%</option>
          </select>
        </div>
        
        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            id="correlacao"
            checked={config.incluir_correlacao}
            onChange={(e) => setConfig({...config, incluir_correlacao: e.target.checked})}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="correlacao" className="ml-2 text-sm text-gray-700">
            Incluir correlação
          </label>
        </div>
      </div>

      <div className="pt-2">
        <Button
          onClick={handleExecutar}
          disabled={executando || infoDados.linhas === 0}
          className={`w-full py-3 ${
            executando 
              ? 'bg-gray-400 cursor-not-allowed' 
              : infoDados.linhas === 0
              ? 'bg-gray-300 text-gray-500'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {executando ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Simulando...
            </>
          ) : (
            <>
              <span className="mr-2">🎲</span>
              Executar Simulação Monte Carlo
            </>
          )}
        </Button>

        {infoDados.linhas === 0 ? (
          <div className="text-sm text-red-600 mt-2">
            ⚠️ Carregue dados primeiro
          </div>
        ) : modeloFrequencia && modeloSeveridade ? (
          <div className="text-sm text-green-600 mt-2">
            ✅ Modelos GLM detectados - usando parâmetros estimados
          </div>
        ) : (
          <div className="text-sm text-yellow-600 mt-2">
            ⚠️ Modelos GLM não detectados - usando estimativas dos dados
          </div>
        )}
      </div>
    </div>
  );

  const renderMetricasRisco = () => {
    if (!resultadoMonteCarlo?.metricas_risco) return null;
    
    const metricas = resultadoMonteCarlo.metricas_risco;
    const sensibilidade = resultadoMonteCarlo.sensibilidade;
    
    return (
      <div className="space-y-6">
        {/* Cartões Principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800 font-medium">Valor Esperado</div>
            <div className="text-xl font-bold mt-1">
              R$ {metricas.valor_esperado?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Perda média esperada
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800 font-medium">VaR {config.nivel_confianca * 100}%</div>
            <div className="text-xl font-bold mt-1">
              R$ {metricas.var_99?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-yellow-600 mt-1">
              Máxima perda com {config.nivel_confianca * 100}% confiança
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-800 font-medium">TVaR {config.nivel_confianca * 100}%</div>
            <div className="text-xl font-bold mt-1">
              R$ {metricas.tvar_99?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-red-600 mt-1">
              Perda média na cauda
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            (metricas.prob_ruina || 0) < 0.001 ? 'bg-green-50 border-green-200' :
            (metricas.prob_ruina || 0) < 0.01 ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="text-sm font-medium">Prob. Ruína</div>
            <div className="text-xl font-bold mt-1">
              {((metricas.prob_ruina || 0) * 100).toFixed(2)}%
            </div>
            <div className="text-xs mt-1">
              {metricas.prob_ruina < 0.001 ? 'Baixo risco' :
               metricas.prob_ruina < 0.01 ? 'Risco moderado' : 'Alto risco'}
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-medium mb-4">Distribuição das Perdas</h5>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepararDadosDistribuicao()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="intervalo" angle={-45} textAnchor="end" height={60} />
                  <YAxis label={{ value: 'Frequência', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value}`, 'Frequência']} />
                  <Bar dataKey="frequencia" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-medium mb-4">Função de Distribuição Acumulada</h5>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepararDadosPercentis()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="percentil" />
                  <YAxis label={{ value: 'Perda (R$)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, 'Perda']} />
                  <Line type="monotone" dataKey="valor" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sensibilidade */}
        {sensibilidade && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h5 className="font-medium mb-3">Análise de Sensibilidade</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(sensibilidade).map(([cenario, dados]) => (
                <div key={cenario} className="bg-white p-3 rounded border">
                  <div className="font-medium text-sm mb-2 capitalize">{cenario}</div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">VaR 99%:</span>
                      <span className="font-medium">R$ {dados.var_99?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prob. Ruína:</span>
                      <span className="font-medium">{((dados.prob_ruina || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Vol: {dados.params?.vol_freq?.toFixed(2)} / {dados.params?.vol_sev?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interpretação */}
        {resultadoMonteCarlo.interpretacao && (
          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-medium mb-3">Interpretação dos Resultados</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Nível de Risco</div>
                <Badge variant={
                  resultadoMonteCarlo.interpretacao.nivel_risco === 'Baixo' ? 'success' :
                  resultadoMonteCarlo.interpretacao.nivel_risco === 'Moderado' ? 'warning' : 'danger'
                }>
                  {resultadoMonteCarlo.interpretacao.nivel_risco}
                </Badge>
                <div className="text-sm text-gray-600 mt-2">
                  Coeficiente de Variação: {(metricas.coeficiente_variacao * 100).toFixed(1)}%
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">Adequação de Capital</div>
                <Badge variant={
                  resultadoMonteCarlo.interpretacao.adequacao_capital === 'Adequado' ? 'success' :
                  resultadoMonteCarlo.interpretacao.adequacao_capital === 'Marginal' ? 'warning' : 'danger'
                }>
                  {resultadoMonteCarlo.interpretacao.adequacao_capital}
                </Badge>
                <div className="text-sm text-gray-600 mt-2">
                  {resultadoMonteCarlo.interpretacao.recomendacao_margem}
                </div>
              </div>
            </div>
            
            {resultadoMonteCarlo.interpretacao.alertas && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start">
                  <span className="text-red-600 mr-2">⚠️</span>
                  <div className="text-sm text-red-800">
                    {resultadoMonteCarlo.interpretacao.alertas}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🎲</span>
            Simulação Monte Carlo Atuarial
          </h3>
          <p className="text-gray-600">
            Análise estocástica de riscos e determinação de capital
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {infoDados.linhas > 0 && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              📊 {infoDados.linhas} observações
            </div>
          )}
          
          {onVoltar && (
            <Button
              variant="outline"
              onClick={onVoltar}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className={`p-3 rounded-lg border ${
        statusSistema?.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {statusSistema?.connected ? (
            <span className="text-green-600 text-lg">✅</span>
          ) : (
            <span className="text-red-600 text-lg">❌</span>
          )}
          <div>
            <div className="font-medium">
              {statusSistema?.connected ? 'Backend R conectado' : 'Backend R desconectado'}
            </div>
            <div className="text-sm text-gray-600">
              {infoDados.linhas > 0 
                ? `${infoDados.linhas} observações disponíveis`
                : 'Nenhum dado carregado'}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Configurações</CardTitle>
              <CardDescription>
                Parâmetros da simulação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderConfiguracao()}
            </CardContent>
          </Card>
          
          {/* Informações dos Dados */}
          {infoDados.linhas > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">📋 Informações dos Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Observações:</span>
                  <span className="font-medium">{infoDados.linhas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Variáveis:</span>
                  <span className="font-medium">{infoDados.colunas}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Modelos GLM:</span>
                  <span className="font-medium">
                    {modeloFrequencia && modeloSeveridade ? 'Detectados' : 'Não detectados'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {resultadoMonteCarlo ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>📊 Resultados da Simulação</CardTitle>
                    <CardDescription>
                      {resultadoMonteCarlo.parametros_simulacao?.n_simulacoes} simulações executadas
                    </CardDescription>
                  </div>
                  
                  {/* Tabs de Visualização */}
                  <div className="flex space-x-2">
                    <Button
                      variant={visualizacaoAtiva === 'metricas' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVisualizacaoAtiva('metricas')}
                    >
                      Métricas
                    </Button>
                    <Button
                      variant={visualizacaoAtiva === 'detalhes' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVisualizacaoAtiva('detalhes')}
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {visualizacaoAtiva === 'metricas' ? (
                  renderMetricasRisco()
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h5 className="font-medium mb-3">Parâmetros da Simulação</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Simulações:</div>
                          <div className="font-medium">{resultadoMonteCarlo.parametros_simulacao?.n_simulacoes}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">λ estimado:</div>
                          <div className="font-medium">{resultadoMonteCarlo.parametros_simulacao?.lambda_estimado}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">μ estimado:</div>
                          <div className="font-medium">R$ {resultadoMonteCarlo.parametros_simulacao?.mu_estimado?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Correlação:</div>
                          <div className="font-medium">{resultadoMonteCarlo.parametros_simulacao?.correlacao_estimada}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Confiança:</div>
                          <div className="font-medium">{resultadoMonteCarlo.parametros_simulacao?.nivel_confianca * 100}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Data:</div>
                          <div className="font-medium">{resultadoMonteCarlo.timestamp?.split(' ')[0]}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h5 className="font-medium mb-3">Estatísticas das Simulações</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Simulações válidas:</div>
                          <div className="font-medium">{resultadoMonteCarlo.resumo_simulacoes?.n_simulacoes_validas}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Taxa zero sinistros:</div>
                          <div className="font-medium">{((resultadoMonteCarlo.resumo_simulacoes?.taxa_zero_sinistros || 0) * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Perda máxima:</div>
                          <div className="font-medium">R$ {resultadoMonteCarlo.resumo_simulacoes?.perda_maxima?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Percentil 90%:</div>
                          <div className="font-medium">R$ {resultadoMonteCarlo.resumo_simulacoes?.percentil_90?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Margem segurança:</div>
                          <div className="font-medium">R$ {resultadoMonteCarlo.metricas_risco?.margem_seguranca_recomendada?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Capital mínimo:</div>
                          <div className="font-medium">R$ {resultadoMonteCarlo.metricas_risco?.capital_minimo?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>📈 Resultados da Simulação</CardTitle>
                <CardDescription>
                  Execute uma simulação para ver os resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🎲</div>
                  <h4 className="font-semibold text-lg mb-2">Simulação Monte Carlo</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Execute uma simulação estocástica para avaliar o risco da carteira
                    e determinar níveis adequados de capital e margens de segurança.
                  </p>
                  
                  {infoDados.linhas === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-start">
                        <span className="text-yellow-600 mr-2">⚠️</span>
                        <div>
                          <h5 className="font-medium text-yellow-800">Dados necessários</h5>
                          <p className="text-yellow-700 text-sm mt-1">
                            Carregue dados atuariais antes de executar a simulação.
                          </p>
                          {onVoltar && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={onVoltar}
                              className="mt-3"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Voltar para carregar dados
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}