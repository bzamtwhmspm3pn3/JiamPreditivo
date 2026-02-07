// src/components/Dashboard/Actuarial/APosteriori.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '../componentes/Card';
import Button from '../componentes/Button';
import Badge from '../componentes/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function APosteriori({ 
  dados,  // 🔥 NOVO: Dados recebidos da aba principal
  statusSistema,
  resultadoCredibilidade,
  executarCredibilidade,
  onVoltar  // 🔥 NOVO: callback para voltar
}) {
  const [config, setConfig] = useState({
    metodo: 'Bühlmann-Straub',
    grupo_var: 'regiao',
    tempo_var: 'ano',
    sinistro_var: 'n_sinistros',
    custo_var: 'custo_total',
    z_min: 0.3,
    z_max: 0.9
  });

  const [executando, setExecutando] = useState(false);
  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0 });
  const [variaveisDisponiveis, setVariaveisDisponiveis] = useState([]);
  const [visualizacaoAtiva, setVisualizacaoAtiva] = useState('ajustes');

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
      
      // Tentar identificar variáveis automaticamente
      const sugestoes = {
        grupo_var: vars.find(v => 
          v.toLowerCase().includes('regiao') || 
          v.toLowerCase().includes('grupo') ||
          v.toLowerCase().includes('classe') ||
          v.toLowerCase().includes('categoria')
        ),
        tempo_var: vars.find(v => 
          v.toLowerCase().includes('ano') || 
          v.toLowerCase().includes('periodo') ||
          v.toLowerCase().includes('mes') ||
          v.toLowerCase().includes('data')
        ),
        sinistro_var: vars.find(v => 
          v.toLowerCase().includes('sinistro') || 
          v.toLowerCase().includes('frequencia') ||
          v.toLowerCase().includes('count') ||
          v.toLowerCase().includes('n_')
        ),
        custo_var: vars.find(v => 
          v.toLowerCase().includes('custo') || 
          v.toLowerCase().includes('valor') ||
          v.toLowerCase().includes('severidade') ||
          v.toLowerCase().includes('amount')
        )
      };
      
      setConfig(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(sugestoes)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, value])
        )
      }));
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

    // Validar configuração
    if (!config.grupo_var || !config.tempo_var || !config.sinistro_var || !config.custo_var) {
      toast.error("❌ Configure todas as variáveis obrigatórias");
      return;
    }

    setExecutando(true);
    try {
      // 🔥 PREPARAR PAYLOAD IGUAL AO A_PRIORI
      const payload = {
        dados: dadosArray,
        parametros: {
          metodo: config.metodo,
          grupo_var: config.grupo_var,
          tempo_var: config.tempo_var,
          sinistro_var: config.sinistro_var,
          custo_var: config.custo_var,
          z_min: config.z_min,
          z_max: config.z_max
        }
      };
      
      await executarCredibilidade(payload);
      toast.success('✅ Credibilidade calculada com sucesso!');
    } catch (error) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setExecutando(false);
    }
  };

  const prepararDadosGrafico = () => {
    if (!resultadoCredibilidade?.premios_calculados) return [];
    
    return resultadoCredibilidade.premios_calculados
      .slice(0, 15) // Limitar para visualização
      .map(item => ({
        grupo: item.grupo,
        'Prêmio A Priori': resultadoCredibilidade.estatisticas_gerais?.premio_global_priori || 0,
        'Prêmio A Posteriori': item.premio_posteriori || 0,
        'Ajuste %': item.ajuste_percentual || 0,
        'Credibilidade': (item.fator_credibilidade || 0) * 100
      }));
  };

  const prepararDadosCredibilidade = () => {
    if (!resultadoCredibilidade?.fatores_credibilidade) return [];
    
    return resultadoCredibilidade.fatores_credibilidade.map(item => ({
      grupo: item.grupo,
      credibilidade: (item.fator_credibilidade || 0) * 100,
      n_anos: item.n_anos || 0
    }));
  };

  const renderConfiguracao = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Método de Credibilidade
        </label>
        <select
          value={config.metodo}
          onChange={(e) => setConfig({...config, metodo: e.target.value})}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="Bühlmann">Bühlmann (simples)</option>
          <option value="Bühlmann-Straub">Bühlmann-Straub (com peso)</option>
        </select>
        <div className="text-xs text-gray-500 mt-1">
          {config.metodo === 'Bühlmann' && 'Para dados equilibrados entre grupos'}
          {config.metodo === 'Bühlmann-Straub' && 'Para exposição variável entre anos'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Z mínimo
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={config.z_min}
            onChange={(e) => setConfig({...config, z_min: parseFloat(e.target.value)})}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Z máximo
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={config.z_max}
            onChange={(e) => setConfig({...config, z_max: parseFloat(e.target.value)})}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variável de Agrupamento
          </label>
          <select
            value={config.grupo_var}
            onChange={(e) => setConfig({...config, grupo_var: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Selecione...</option>
            {variaveisDisponiveis.map(variavel => (
              <option key={variavel} value={variavel}>{variavel}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variável de Tempo
          </label>
          <select
            value={config.tempo_var}
            onChange={(e) => setConfig({...config, tempo_var: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Selecione...</option>
            {variaveisDisponiveis.map(variavel => (
              <option key={variavel} value={variavel}>{variavel}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sinistros
            </label>
            <select
              value={config.sinistro_var}
              onChange={(e) => setConfig({...config, sinistro_var: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Selecione...</option>
              {variaveisDisponiveis.map(variavel => (
                <option key={variavel} value={variavel}>{variavel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custos
            </label>
            <select
              value={config.custo_var}
              onChange={(e) => setConfig({...config, custo_var: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Selecione...</option>
              {variaveisDisponiveis.map(variavel => (
                <option key={variavel} value={variavel}>{variavel}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button
          onClick={handleExecutar}
          disabled={executando || 
                   !config.grupo_var || 
                   !config.tempo_var || 
                   !config.sinistro_var || 
                   !config.custo_var ||
                   infoDados.linhas === 0}
          className={`w-full py-3 ${
            executando 
              ? 'bg-gray-400 cursor-not-allowed' 
              : infoDados.linhas === 0 ||
                !config.grupo_var || 
                !config.tempo_var || 
                !config.sinistro_var || 
                !config.custo_var
              ? 'bg-gray-300 text-gray-500'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {executando ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Calculando...
            </>
          ) : (
            <>
              <span className="mr-2">📊</span>
              Calcular Credibilidade
            </>
          )}
        </Button>

        {infoDados.linhas === 0 ? (
          <div className="text-sm text-red-600 mt-2">
            ⚠️ Carregue dados primeiro
          </div>
        ) : (!config.grupo_var || !config.tempo_var || !config.sinistro_var || !config.custo_var) ? (
          <div className="text-sm text-yellow-600 mt-2">
            ⚠️ Configure todas as variáveis obrigatórias
          </div>
        ) : null}
      </div>
    </div>
  );

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
            <span>📊</span>
            Teoria da Credibilidade (A Posteriori)
          </h3>
          <p className="text-gray-600">
            Ajuste de prêmios baseado na experiência histórica
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
              <CardTitle>⚙️ Configuração</CardTitle>
              <CardDescription>
                Defina as variáveis para cálculo da credibilidade
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
                {config.grupo_var && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Grupos únicos:</span>
                    <span className="font-medium">
                      {(() => {
                        const dadosArray = extrairDadosArray(dados);
                        if (dadosArray.length > 0) {
                          const grupos = new Set(dadosArray.map(d => d[config.grupo_var]));
                          return grupos.size;
                        }
                        return 0;
                      })()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {resultadoCredibilidade ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>📈 Resultados da Credibilidade</CardTitle>
                    <CardDescription>
                      Método {resultadoCredibilidade.metodo_aplicado}
                    </CardDescription>
                  </div>
                  
                  {/* Tabs de Visualização */}
                  <div className="flex space-x-2">
                    <Button
                      variant={visualizacaoAtiva === 'ajustes' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVisualizacaoAtiva('ajustes')}
                    >
                      Ajustes
                    </Button>
                    <Button
                      variant={visualizacaoAtiva === 'credibilidade' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVisualizacaoAtiva('credibilidade')}
                    >
                      Credibilidade
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
                {/* Cartões de Resumo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 font-medium">Prêmio A Priori</div>
                    <div className="text-xl font-bold mt-1">
                      R$ {resultadoCredibilidade.estatisticas_gerais?.premio_global_priori?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Média global
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-800 font-medium">Prêmio A Posteriori</div>
                    <div className="text-xl font-bold mt-1">
                      R$ {resultadoCredibilidade.estatisticas_gerais?.premio_medio_posteriori?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Média ajustada
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-800 font-medium">Credibilidade Média</div>
                    <div className="text-xl font-bold mt-1">
                      {((resultadoCredibilidade.estatisticas_gerais?.credibilidade_media || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Confiança na experiência própria
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border ${
                    (resultadoCredibilidade.estatisticas_gerais?.ajuste_medio_percentual || 0) >= 0
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-sm font-medium">Ajuste Médio</div>
                    <div className="text-xl font-bold mt-1">
                      {resultadoCredibilidade.estatisticas_gerais?.ajuste_medio_percentual?.toFixed(1)}%
                    </div>
                    <div className="text-xs mt-1">
                      {resultadoCredibilidade.estatisticas_gerais?.grupos_com_ajuste_positivo}↑ / {resultadoCredibilidade.estatisticas_gerais?.grupos_com_ajuste_negativo}↓
                    </div>
                  </div>
                </div>

                {/* Conteúdo das Tabs */}
                {visualizacaoAtiva === 'ajustes' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-4">Ajustes nos Prêmios por Grupo</h5>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={prepararDadosGrafico()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grupo" angle={-45} textAnchor="end" height={60} />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}`, 'Valor']} />
                            <Legend />
                            <Bar dataKey="Prêmio A Priori" fill="#8884d8" />
                            <Bar dataKey="Prêmio A Posteriori" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {visualizacaoAtiva === 'credibilidade' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-4">Fatores de Credibilidade por Grupo</h5>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={prepararDadosCredibilidade()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grupo" angle={-45} textAnchor="end" height={60} />
                            <YAxis label={{ value: 'Credibilidade (%)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Credibilidade']} />
                            <Bar dataKey="credibilidade" fill="#0088FE" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-sm font-medium mb-2">Interpretação da Credibilidade</div>
                        <div className="text-sm text-gray-600">
                          Credibilidade média de {((resultadoCredibilidade.estatisticas_gerais?.credibilidade_media || 0) * 100).toFixed(1)}% indica que:
                          <ul className="mt-2 space-y-1">
                            <li>• {(resultadoCredibilidade.estatisticas_gerais?.credibilidade_media || 0) > 0.7 ? 'Alta' : 
                                 (resultadoCredibilidade.estatisticas_gerais?.credibilidade_media || 0) > 0.4 ? 'Média' : 'Baixa'} confiança na experiência própria</li>
                            <li>• {resultadoCredibilidade.estatisticas_gerais?.grupos_com_ajuste_positivo || 0} grupos com prêmios acima da média</li>
                            <li>• {resultadoCredibilidade.estatisticas_gerais?.grupos_com_ajuste_negativo || 0} grupos com prêmios abaixo da média</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-sm font-medium mb-2">Impacto Financeiro</div>
                        <div className="text-sm text-gray-600">
                          <div className="mb-2">
                            <span className="font-medium">Total:</span> R$ {
                              resultadoCredibilidade.impacto_financeiro?.impacto_total?.toLocaleString() || '0'
                            }
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Percentual:</span> {
                              resultadoCredibilidade.impacto_financeiro?.impacto_percentual?.toFixed(1) || '0'
                            }%
                          </div>
                          <div className="mb-2">
                            <span className="font-medium">Receita adicional:</span> R$ {
                              resultadoCredibilidade.impacto_financeiro?.receita_adicional_estimada?.toLocaleString() || '0'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {visualizacaoAtiva === 'detalhes' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-3">Estatísticas do Método {resultadoCredibilidade.metodo_aplicado}</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Variância Entre Grupos (σ²):</div>
                          <div className="font-medium">
                            {resultadoCredibilidade.metricas_credibilidade?.var_entre?.toExponential(3) || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Variância Dentro dos Grupos (τ²):</div>
                          <div className="font-medium">
                            {resultadoCredibilidade.metricas_credibilidade?.var_dentro?.toExponential(3) || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Homogeneidade:</div>
                          <div className="font-medium">
                            {resultadoCredibilidade.metricas_credibilidade?.homogeneidade || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Confiabilidade da Estimação:</div>
                          <div className="font-medium">
                            {resultadoCredibilidade.metricas_credibilidade?.confiabilidade_estimacao || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-3">Recomendações</h5>
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <div className="mt-1 mr-2">📋</div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Ações Prioritárias:</span> {resultadoCredibilidade.recomendacoes?.acoes_prioritarias}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="mt-1 mr-2">🎯</div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Grupos Prioritários:</span> {
                              resultadoCredibilidade.recomendacoes?.grupos_prioritarios?.join(', ') || 'Nenhum'
                            }
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="mt-1 mr-2">➡️</div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Próximos Passos:</span> {resultadoCredibilidade.recomendacoes?.proximos_passos}
                          </div>
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
                <CardTitle>📈 Resultados da Credibilidade</CardTitle>
                <CardDescription>
                  Calcule os fatores de credibilidade para ver os resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📊</div>
                  <h4 className="font-semibold text-lg mb-2">Teoria da Credibilidade</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Calcule fatores de credibilidade para ajustar prêmios baseados 
                    na experiência histórica de cada grupo de risco.
                  </p>
                  
                  {infoDados.linhas === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-start">
                        <span className="text-yellow-600 mr-2">⚠️</span>
                        <div>
                          <h5 className="font-medium text-yellow-800">Dados necessários</h5>
                          <p className="text-yellow-700 text-sm mt-1">
                            Carregue dados atuariais antes de calcular a credibilidade.
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