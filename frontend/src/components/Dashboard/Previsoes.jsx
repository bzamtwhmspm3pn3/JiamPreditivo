import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Importar todos os modelos
import LinearSimples from './RegressaoLinear/LinearSimples';
import LinearMultipla from './RegressaoLinear/LinearMultipla';
import LinearLogistica from './RegressaoLinear/LinearLogistica';
import ARIMA from './SeriesTemporais/ARIMA';
import SARIMA from './SeriesTemporais/SARIMA';
import ETS from './SeriesTemporais/ETS';
import Prophet from './SeriesTemporais/Prophet';
import RandomForest from './MachineLearning/RandomForest';
import XGBoost from './MachineLearning/XGBoost';

// Componentes UI
import Card from './componentes/Card';
import Button from './componentes/Button';
import Badge from './componentes/Badge';

export default function PrevisoesMultiModelo({ 
  dados, 
  onSaveModel, 
  modelosAjustados,
  onResultadoModelo // 🔥 ADICIONADO
}) {
  const [modeloSelecionado, setModeloSelecionado] = useState('');
  const [statusSistema, setStatusSistema] = useState({ connected: false });

  // Verificar status do sistema
  useEffect(() => {
    verificarStatusSistema();
  }, []);

  const verificarStatusSistema = async () => {
    try {
      const status = await api.testConnection();
      setStatusSistema(status);
      
      if (!status.connected) {
        toast.error('Backend R não conectado. Verifique a conexão.');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatusSistema({ connected: false, message: error.message });
    }
  };

  // Mapeamento de componentes
  const MODELO_COMPONENTES = {
    linear_simples: LinearSimples,
    linear_multipla: LinearMultipla,
    logistica: LinearLogistica,
    arima: ARIMA,
    sarima: SARIMA,
    ets: ETS,
    prophet: Prophet,
    random_forest: RandomForest,
    xgboost: XGBoost,
  };

  const ComponenteModelo = MODELO_COMPONENTES[modeloSelecionado];

  if (ComponenteModelo) {
    return (
      <ComponenteModelo 
        dados={dados}
        onSaveModel={onSaveModel}
        modelosAjustados={modelosAjustados}
        onVoltar={() => setModeloSelecionado('')}
        statusSistema={statusSistema}
        onResultadoModelo={onResultadoModelo} // 🔥 CORRIGIDO
      />
    );
  }

  // Tela de seleção inicial
  return (
    <div className="space-y-6 p-4">
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
              {statusSistema.connected ? '✅ Sistema R Conectado' : '⚠️ Backend R Desconectado'}
            </span>
          </div>
          <button
            onClick={verificarStatusSistema}
            className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            Verificar
          </button>
        </div>
      </motion.div>

      {/* Título */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Modelos Preditivos</h1>
        <p className="text-gray-600">Selecione o tipo de modelo para análise</p>
      </div>

      {/* Grid de Modelos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* REGRESSÃO LINEAR */}
        <Card className="hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-xl">📈</span>
              </div>
              <h2 className="text-xl font-bold text-blue-700">Regressão Linear</h2>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('linear_simples')}
              >
                <div className="flex items-center gap-2">
                  <span>➡️</span>
                  <div className="text-left">
                    <div className="font-medium">Linear Simples</div>
                    <div className="text-xs text-gray-500">Y = β₀ + β₁X</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('linear_multipla')}
              >
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <div className="text-left">
                    <div className="font-medium">Linear Múltipla</div>
                    <div className="text-xs text-gray-500">Y = β₀ + β₁X₁ + β₂X₂ + ...</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('logistica')}
              >
                <div className="flex items-center gap-2">
                  <span>🧠</span>
                  <div className="text-left">
                    <div className="font-medium">Logística</div>
                    <div className="text-xs text-gray-500">P = 1/(1 + e⁻ᶻ)</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </Card>

        {/* SÉRIES TEMPORAIS */}
        <Card className="hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-xl">⏰</span>
              </div>
              <h2 className="text-xl font-bold text-green-700">Séries Temporais</h2>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('arima')}
              >
                <div className="flex items-center gap-2">
                  <span>📉</span>
                  <div className="text-left">
                    <div className="font-medium">ARIMA</div>
                    <div className="text-xs text-gray-500">Auto-regressivo integrado</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('sarima')}
              >
                <div className="flex items-center gap-2">
                  <span>🔄</span>
                  <div className="text-left">
                    <div className="font-medium">SARIMA</div>
                    <div className="text-xs text-gray-500">ARIMA + sazonalidade</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('ets')}
              >
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <div className="text-left">
                    <div className="font-medium">ETS</div>
                    <div className="text-xs text-gray-500">Suavização exponencial</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('prophet')}
              >
                <div className="flex items-center gap-2">
                  <span>🔮</span>
                  <div className="text-left">
                    <div className="font-medium">Prophet</div>
                    <div className="text-xs text-gray-500">Facebook Prophet</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </Card>

        {/* MACHINE LEARNING */}
        <Card className="hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-xl">🤖</span>
              </div>
              <h2 className="text-xl font-bold text-purple-700">Machine Learning</h2>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('random_forest')}
              >
                <div className="flex items-center gap-2">
                  <span>🌲</span>
                  <div className="text-left">
                    <div className="font-medium">Random Forest</div>
                    <div className="text-xs text-gray-500">Ensemble de árvores</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setModeloSelecionado('xgboost')}
              >
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <div className="text-left">
                    <div className="font-medium">XGBoost</div>
                    <div className="text-xs text-gray-500">Gradient boosting</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Histórico de Modelos */}
      {Object.keys(modelosAjustados || {}).length > 0 && (
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">📋 Histórico de Modelos</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {Object.entries(modelosAjustados)
                .reverse()
                .slice(0, 5)
                .map(([nome, modelo]) => (
                  <div
                    key={nome}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setModeloSelecionado(modelo.tipo);
                      // Aqui você poderia carregar os dados do modelo salvo
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{modelo.nome || modelo.tipo}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(modelo.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {modelo.tipo}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}