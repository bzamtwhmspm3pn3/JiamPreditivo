// src/components/Dashboard/InterpretacaoModelos.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import api from '../../services/api';

// Componentes UI personalizados
const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-xl font-bold text-gray-800 ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, variant = "default", size = "default", className = "", disabled, ...props }) => {
  const baseClasses = "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
  };

  const sizeClasses = {
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    sm: "px-3 py-1.5 text-sm",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = "default", className = "", ...props }) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    secondary: "bg-blue-100 text-blue-800",
    outline: "border border-gray-300 text-gray-700",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-indigo-100 text-indigo-800",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

const Table = ({ children, className = "", ...props }) => (
  <div className="overflow-x-auto border border-gray-200 rounded-lg">
    <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
      {children}
    </table>
  </div>
);

const TableHeader = ({ children, ...props }) => (
  <thead className="bg-gray-50" {...props}>
    {children}
  </thead>
);

const TableBody = ({ children, ...props }) => (
  <tbody className="bg-white divide-y divide-gray-200" {...props}>
    {children}
  </tbody>
);

const TableRow = ({ children, ...props }) => (
  <tr {...props}>{children}</tr>
);

const TableHead = ({ children, ...props }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>
    {children}
  </th>
);

const TableCell = ({ children, className = "", ...props }) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`} {...props}>
    {children}
  </td>
);

// Componente de loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      <p className="mt-4 text-sm text-gray-600">Processando análise...</p>
    </div>
  </div>
);

// Componente para mensagem vazia
const EmptyState = ({ icon = "📊", title, description }) => (
  <div className="text-center py-12">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 max-w-md mx-auto">{description}</p>
  </div>
);

export default function InterpretacaoModelos({ modelosAjustados }) {
  const [modeloSelecionado, setModeloSelecionado] = useState(null);
  const [interpretacoes, setInterpretacoes] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [tipoInterpretacao, setTipoInterpretacao] = useState('coeficientes');
  const [comparacao, setComparacao] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [statusSistema, setStatusSistema] = useState({ connected: false });

  // Obter lista de modelos disponíveis para interpretação
  const modelosDisponiveis = Object.values(modelosAjustados || {});

  // Verificar status do sistema
  useEffect(() => {
    const verificarStatus = async () => {
      try {
        const status = await api.testConnection();
        setStatusSistema(status);
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        setStatusSistema({ connected: false });
      }
    };
    verificarStatus();
  }, []);

  const interpretarModelo = async (tipo = tipoInterpretacao) => {
    if (!modeloSelecionado) {
      toast.warning('Selecione um modelo primeiro');
      return;
    }

    setCarregando(true);
    setInterpretacoes(null);
    setComparacao(null);
    setRelatorio(null);

    try {
      let resultado;
      
      switch(tipo) {
        case 'coeficientes':
          if (modeloSelecionado.resultado?.coeficientes) {
            resultado = await api.interpretarCoeficientes(
              modeloSelecionado.tipo,
              modeloSelecionado.resultado.coeficientes
            );
          } else {
            toast.warning('Este modelo não possui coeficientes para interpretar');
            return;
          }
          break;
          
        case 'metricas':
          if (modeloSelecionado.resultado?.qualidade) {
            resultado = await api.interpretarMetricas(
              modeloSelecionado.tipo,
              modeloSelecionado.resultado.qualidade
            );
          } else {
            toast.warning('Este modelo não possui métricas para interpretar');
            return;
          }
          break;
          
        case 'relatorio':
          resultado = await api.gerarRelatorio(
            modeloSelecionado.tipo,
            modeloSelecionado.resultado,
            { 
              timestamp: modeloSelecionado.timestamp,
              simulacao: modeloSelecionado.simulacao,
              fonte: modeloSelecionado.fonte 
            }
          );
          break;
          
        default:
          break;
      }

      if (resultado?.success) {
        setInterpretacoes(resultado);
        
        if (tipo === 'relatorio') {
          setRelatorio(resultado);
        }
        
        const mensagem = resultado.simulacao 
          ? 'Interpretação simulada (backend offline)'
          : 'Interpretação gerada com sucesso!';
        
        toast.success(
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{mensagem}</span>
            {resultado.simulacao && (
              <Badge variant="warning" className="ml-2 text-xs">
                SIM
              </Badge>
            )}
          </div>
        );
      } else {
        toast.error(resultado?.error || 'Erro ao interpretar modelo');
      }

    } catch (error) {
      console.error('Erro na interpretação:', error);
      
      const errorMessage = error.isNetworkError
        ? 'Erro de conexão com o servidor. Usando simulação.'
        : error.message || 'Erro ao processar interpretação';
      
      toast.error(
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      );
      
      // Criar interpretação simulada como fallback
      criarInterpretacaoSimulada(tipo);
    } finally {
      setCarregando(false);
    }
  };

  const criarInterpretacaoSimulada = (tipo) => {
    if (!modeloSelecionado) return;

    let interpretacaoSimulada;
    
    switch(tipo) {
      case 'coeficientes':
        interpretacaoSimulada = {
          success: true,
          simulacao: true,
          interpretacoes: modeloSelecionado.resultado?.coeficientes?.map(coef => ({
            termo: coef.termo,
            estimativa: coef.estimativa,
            p_value: coef.p_value,
            interpretacao: `O coeficiente ${coef.termo} tem valor ${coef.estimativa} (p = ${coef.p_value})`,
            importancia: coef.p_value < 0.05 ? 'Significativo' : 'Não significativo',
            recomendacao: coef.p_value < 0.05 
              ? 'Manter no modelo' 
              : 'Considerar remover do modelo'
          })) || [],
          resumo: 'Interpretação simulada dos coeficientes (backend offline)'
        };
        break;
        
      case 'metricas':
        interpretacaoSimulada = {
          success: true,
          simulacao: true,
          interpretacoes: Object.entries(modeloSelecionado.resultado?.qualidade || {}).map(([key, value]) => {
            let classificacao, interpretacao;
            
            if (key === 'R2') {
              const r2 = parseFloat(value) || 0;
              classificacao = r2 > 0.7 ? 'Excelente' : r2 > 0.5 ? 'Bom' : r2 > 0.3 ? 'Regular' : 'Ruim';
              interpretacao = `O modelo explica ${(r2 * 100).toFixed(1)}% da variabilidade dos dados`;
            } else if (key === 'RMSE') {
              const rmse = parseFloat(value) || 0;
              classificacao = rmse < 0.5 ? 'Excelente' : rmse < 1 ? 'Bom' : rmse < 2 ? 'Regular' : 'Ruim';
              interpretacao = `Erro médio das previsões: ${value} unidades`;
            } else {
              classificacao = 'N/A';
              interpretacao = `Valor da métrica ${key}: ${value}`;
            }
            
            return {
              metrica: key,
              valor: value,
              interpretacao,
              classificacao
            };
          }),
          resumo: 'Interpretação simulada das métricas (backend offline)'
        };
        break;
        
      case 'relatorio':
        interpretacaoSimulada = {
          success: true,
          simulacao: true,
          relatorio: {
            titulo: `Relatório do Modelo ${modeloSelecionado.tipo}`,
            data_analise: new Date().toISOString(),
            resumo_executivo: 'Análise simulada para demonstração. Em condições reais, esta análise seria gerada pelo sistema R/JS.',
            pontos_fortes: [
              'Modelo adequado para o tipo de dados analisados',
              'Parâmetros configurados de forma apropriada',
              'Resultados consistentes com o esperado'
            ],
            pontos_fracos: [
              'Necessária validação com dados de teste',
              'Considerar outras variáveis para melhorar precisão'
            ],
            recomendacoes: [
              'Validar o modelo com novos dados',
              'Monitorar performance ao longo do tempo',
              'Considerar atualização periódica do modelo'
            ],
            conclusao: 'O modelo apresenta potencial para uso, mas requer validação adicional.'
          }
        };
        break;
        
      default:
        interpretacaoSimulada = {
          success: true,
          simulacao: true,
          mensagem: 'Interpretação simulada'
        };
    }
    
    setInterpretacoes(interpretacaoSimulada);
    
    if (tipo === 'relatorio') {
      setRelatorio(interpretacaoSimulada);
    }
  };

  const compararModelos = async () => {
    if (modelosDisponiveis.length < 2) {
      toast.warning('É necessário pelo menos 2 modelos para comparação');
      return;
    }

    setCarregando(true);
    setComparacao(null);
    setInterpretacoes(null);
    setRelatorio(null);

    try {
      const resultado = await api.compararModelos(modelosDisponiveis);
      
      if (resultado?.success) {
        setComparacao(resultado);
        toast.success(
          <div className="flex items-center gap-2">
            <span>📊</span>
            <span>{resultado.simulacao ? 'Comparação simulada' : 'Comparação realizada'}</span>
          </div>
        );
      } else {
        toast.error('Erro ao comparar modelos');
      }
    } catch (error) {
      console.error('Erro na comparação:', error);
      
      // Criar comparação simulada
      const comparacaoSimulada = {
        success: true,
        simulacao: true,
        comparacao: modelosDisponiveis.map((modelo, idx) => ({
          nome: modelo.tipo,
          r2: modelo.resultado?.qualidade?.R2 || (0.6 + Math.random() * 0.3).toFixed(3),
          rmse: modelo.resultado?.qualidade?.RMSE || (0.5 + Math.random() * 1.5).toFixed(3),
          aic: modelo.resultado?.qualidade?.AIC || (100 + Math.random() * 50).toFixed(1),
          classificacao: idx === 0 ? 'Recomendado' : 'Alternativo',
          pontos_fortes: ['Bom ajuste', 'Estável', 'Interpretável'],
          pontos_fracos: ['Pode overfitting', 'Complexo']
        })),
        recomendacao: modelosDisponiveis[0]?.tipo || 'Nenhum',
        criterios: ['R² mais alto', 'RMSE mais baixo', 'AIC mais baixo']
      };
      
      setComparacao(comparacaoSimulada);
      
      toast.info(
        <div className="flex items-center gap-2">
          <span>ℹ️</span>
          <span>Comparação simulada (backend offline)</span>
        </div>
      );
    } finally {
      setCarregando(false);
    }
  };

  const renderInterpretacoes = () => {
    if (!interpretacoes) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Cabeçalho da Interpretação */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {interpretacoes.simulacao && <Badge variant="warning">SIMULAÇÃO</Badge>}
                  {tipoInterpretacao === 'coeficientes' && '📈 Análise de Coeficientes'}
                  {tipoInterpretacao === 'metricas' && '📊 Análise de Métricas'}
                  {tipoInterpretacao === 'relatorio' && '📋 Relatório Completo'}
                </CardTitle>
                <CardDescription>
                  Modelo: {modeloSelecionado?.tipo} • {interpretacoes.simulacao ? 'Modo simulação' : 'Análise real'}
                </CardDescription>
              </div>
              <Badge variant={interpretacoes.simulacao ? "warning" : "success"}>
                {interpretacoes.simulacao ? 'Demo' : 'Real'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {/* Resumo Geral */}
            {interpretacoes.resumo && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Resumo da Análise</h4>
                <p className="text-blue-700">{interpretacoes.resumo}</p>
              </div>
            )}

            {/* Interpretações Detalhadas */}
            {interpretacoes.interpretacoes && interpretacoes.interpretacoes.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-800">Análise Detalhada</h4>
                {interpretacoes.interpretacoes.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold text-gray-800">
                          {item.termo || item.metrica}
                        </span>
                        {item.valor && (
                          <span className="ml-2 text-gray-600">({item.valor})</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-2 md:mt-0">
                        {item.importancia && (
                          <Badge variant={
                            item.importancia.includes('Significativo') ? 'success' : 
                            item.importancia.includes('Não') ? 'warning' : 'info'
                          }>
                            {item.importancia}
                          </Badge>
                        )}
                        
                        {item.classificacao && (
                          <Badge variant={
                            item.classificacao === 'Excelente' ? 'success' : 
                            item.classificacao === 'Bom' ? 'info' : 
                            item.classificacao === 'Regular' ? 'warning' : 'default'
                          }>
                            {item.classificacao}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{item.interpretacao}</p>
                    
                    {item.recomendacao && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-sm font-medium text-gray-600">Recomendação:</p>
                        <p className="text-sm text-gray-700">{item.recomendacao}</p>
                      </div>
                    )}
                    
                    {item.p_value && (
                      <p className="text-xs text-gray-500 mt-1">
                        Valor p: {item.p_value} {parseFloat(item.p_value) < 0.05 ? '(* significativo)' : '(não significativo)'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Relatório Completo */}
            {relatorio?.relatorio && (
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                  <h4 className="font-bold text-lg text-gray-800">{relatorio.relatorio.titulo}</h4>
                  <p className="text-sm text-gray-600">
                    Data da análise: {new Date(relatorio.relatorio.data_analise).toLocaleDateString()}
                  </p>
                </div>

                {relatorio.relatorio.resumo_executivo && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h5 className="font-semibold text-gray-700 mb-2">📋 Resumo Executivo</h5>
                    <p className="text-gray-700">{relatorio.relatorio.resumo_executivo}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatorio.relatorio.pontos_fortes && relatorio.relatorio.pontos_fortes.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h5 className="font-semibold text-green-800 mb-3">✅ Pontos Fortes</h5>
                      <ul className="space-y-2">
                        {relatorio.relatorio.pontos_fortes.map((ponto, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span className="text-green-700">{ponto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {relatorio.relatorio.pontos_fracos && relatorio.relatorio.pontos_fracos.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h5 className="font-semibold text-yellow-800 mb-3">⚠️ Pontos de Melhoria</h5>
                      <ul className="space-y-2">
                        {relatorio.relatorio.pontos_fracos.map((ponto, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            <span className="text-yellow-700">{ponto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {relatorio.relatorio.recomendacoes && relatorio.relatorio.recomendacoes.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-3">🎯 Recomendações</h5>
                    <ul className="space-y-2">
                      {relatorio.relatorio.recomendacoes.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-blue-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {relatorio.relatorio.conclusao && (
                  <div className="p-4 bg-gray-100 rounded-lg border">
                    <h5 className="font-semibold text-gray-800 mb-2">📌 Conclusão</h5>
                    <p className="text-gray-700">{relatorio.relatorio.conclusao}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderComparacao = () => {
    if (!comparacao) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {comparacao.simulacao && <Badge variant="warning">SIMULAÇÃO</Badge>}
                  🔄 Comparação de Modelos
                </CardTitle>
                <CardDescription>
                  Análise comparativa entre {comparacao.comparacao?.length || 0} modelos
                </CardDescription>
              </div>
              <Badge variant={comparacao.simulacao ? "warning" : "success"}>
                {comparacao.simulacao ? 'Demo' : 'Real'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {/* Critérios de Comparação */}
            {comparacao.criterios && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2">Critérios de Avaliação</h4>
                <div className="flex flex-wrap gap-2">
                  {comparacao.criterios.map((criterio, idx) => (
                    <Badge key={idx} variant="info">{criterio}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela de Comparação */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>R²</TableHead>
                    <TableHead>RMSE</TableHead>
                    <TableHead>AIC</TableHead>
                    <TableHead>Classificação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparacao.comparacao?.map((modelo, idx) => (
                    <TableRow 
                      key={idx} 
                      className={
                        modelo.classificacao === 'Recomendado' 
                          ? 'bg-green-50 hover:bg-green-100' 
                          : 'hover:bg-gray-50'
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {modelo.nome}
                          {modelo.classificacao === 'Recomendado' && (
                            <Badge variant="success" className="ml-2">⭐ Recomendado</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={
                          parseFloat(modelo.r2) > 0.7 ? 'text-green-600 font-semibold' :
                          parseFloat(modelo.r2) > 0.5 ? 'text-blue-600' : 'text-gray-600'
                        }>
                          {modelo.r2}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={
                          parseFloat(modelo.rmse) < 0.5 ? 'text-green-600 font-semibold' :
                          parseFloat(modelo.rmse) < 1 ? 'text-blue-600' : 'text-gray-600'
                        }>
                          {modelo.rmse}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{modelo.aic}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          modelo.classificacao === 'Recomendado' ? 'success' :
                          modelo.classificacao === 'Alternativo' ? 'secondary' : 'default'
                        }>
                          {modelo.classificacao}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Recomendação Final */}
            {comparacao.recomendacao && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-lg text-green-800 mb-2">🎯 Modelo Recomendado</h4>
                <p className="text-green-700">
                  Com base na análise comparativa, o modelo <strong className="text-green-900">{comparacao.recomendacao}</strong> apresenta o melhor equilíbrio entre performance estatística e estabilidade.
                </p>
                
                {comparacao.comparacao?.find(m => m.nome === comparacao.recomendacao)?.pontos_fortes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-green-800 mb-1">Principais pontos fortes:</p>
                    <ul className="text-sm text-green-700">
                      {comparacao.comparacao
                        .find(m => m.nome === comparacao.recomendacao)
                        ?.pontos_fortes?.map((ponto, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{ponto}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-lg ${statusSistema.connected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${statusSistema.connected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium">
              {statusSistema.connected ? '✅ Sistema R/JS Conectado' : '⚠️ Modo Simulação'}
            </span>
          </div>
          <Badge variant={statusSistema.connected ? "success" : "warning"}>
            {statusSistema.connected ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </motion.div>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <CardTitle>🧠 Interpretação de Modelos</CardTitle>
          <CardDescription>
            Analise, interprete e compare os resultados dos modelos estatísticos ajustados
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Seleção do Modelo */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecione um Modelo para Interpretar
            </label>
            
            {modelosDisponiveis.length === 0 ? (
              <EmptyState
                icon="📈"
                title="Nenhum modelo disponível"
                description="Ajuste modelos na seção de Previsões Multi-Modelo para interpretá-los aqui."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modelosDisponiveis.map((modelo, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => {
                        setModeloSelecionado(modelo);
                        setInterpretacoes(null);
                        setComparacao(null);
                        setRelatorio(null);
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                        modeloSelecionado?.id === modelo.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">{modelo.tipo}</span>
                        <div className="flex gap-1">
                          {modelo.simulacao ? (
                            <Badge variant="warning" className="text-xs">SIM</Badge>
                          ) : (
                            <Badge variant="success" className="text-xs">REAL</Badge>
                          )}
                          {modelo.fonte === 'backend' && (
                            <Badge variant="info" className="text-xs">R</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {new Date(modelo.timestamp).toLocaleString()}
                      </p>
                      
                      <div className="space-y-1">
                        {modelo.resultado?.qualidade?.R2 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">R²:</span>
                            <span className="font-medium text-gray-800">{modelo.resultado.qualidade.R2}</span>
                          </div>
                        )}
                        {modelo.resultado?.qualidade?.RMSE && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">RMSE:</span>
                            <span className="font-medium text-gray-800">{modelo.resultado.qualidade.RMSE}</span>
                          </div>
                        )}
                        {modelo.resultado?.coeficientes && (
                          <div className="text-xs text-gray-500 mt-2">
                            {modelo.resultado.coeficientes.length} coeficientes
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Modelo Selecionado */}
          {modeloSelecionado && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{modeloSelecionado.tipo}</h4>
                  <p className="text-sm text-gray-600">
                    Executado em {new Date(modeloSelecionado.timestamp).toLocaleString()}
                    {modeloSelecionado.fonte && ` • Fonte: ${modeloSelecionado.fonte}`}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                  {modeloSelecionado.simulacao ? (
                    <Badge variant="warning">Simulação</Badge>
                  ) : (
                    <Badge variant="success">Modelo Real</Badge>
                  )}
                  
                  {modeloSelecionado.resultado?.qualidade?.R2 && (
                    <Badge variant="info">R²: {modeloSelecionado.resultado.qualidade.R2}</Badge>
                  )}
                  
                  {modeloSelecionado.resultado?.coeficientes && (
                    <Badge variant="secondary">
                      {modeloSelecionado.resultado.coeficientes.length} Coeficientes
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tipos de Interpretação */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Análise
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { id: 'coeficientes', icon: '📈', label: 'Coeficientes', color: 'blue' },
                { id: 'metricas', icon: '📊', label: 'Métricas', color: 'green' },
                { id: 'relatorio', icon: '📋', label: 'Relatório', color: 'purple' },
                { id: 'comparar', icon: '🔄', label: 'Comparar', color: 'orange' }
              ].map((tipo) => (
                <motion.div
                  key={tipo.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={() => {
                      if (tipo.id === 'comparar') {
                        compararModelos();
                      } else {
                        setTipoInterpretacao(tipo.id);
                        if (modeloSelecionado) {
                          interpretarModelo(tipo.id);
                        } else if (tipo.id !== 'comparar') {
                          toast.warning('Selecione um modelo primeiro');
                        }
                      }
                    }}
                    disabled={carregando || (tipo.id !== 'comparar' && !modeloSelecionado)}
                    className={`w-full p-4 rounded-xl border text-center transition-all duration-200 ${
                      tipoInterpretacao === tipo.id
                        ? `border-${tipo.color}-500 bg-${tipo.color}-50 ring-2 ring-${tipo.color}-200`
                        : `border-gray-200 hover:border-${tipo.color}-300 hover:bg-${tipo.color}-50`
                    } ${carregando || (tipo.id !== 'comparar' && !modeloSelecionado) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-2xl mb-2">{tipo.icon}</div>
                    <div className="font-medium text-gray-800">{tipo.label}</div>
                    {tipo.id === 'comparar' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {modelosDisponiveis.length} modelos
                      </div>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Botão de Interpretação */}
          {modeloSelecionado && tipoInterpretacao !== 'comparar' && (
            <div className="flex gap-3">
              <Button
                onClick={() => interpretarModelo()}
                disabled={carregando}
                size="lg"
                className="flex-1"
              >
                {carregando ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Processando Análise...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
                    {statusSistema.connected ? 'Interpretar Modelo' : 'Simular Interpretação'}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setInterpretacoes(null);
                  setComparacao(null);
                  setRelatorio(null);
                }}
                disabled={carregando}
                size="lg"
              >
                Limpar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {carregando ? (
        <Card>
          <CardContent>
            <LoadingSpinner />
          </CardContent>
        </Card>
      ) : (
        <>
          {interpretacoes && renderInterpretacoes()}
          {comparacao && renderComparacao()}
        </>
      )}
    </div>
  );
}