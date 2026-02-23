// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\DataMining.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent } from './componentes/Card';
import Badge from './componentes/Badge';
import Tabs from './componentes/Tabs';

// Ícones
import { Database, Network, Layers, GitBranch } from 'lucide-react';

// Subcomponentes (cada um com sua própria lógica)
import Clustering from './DataMining/Clustering';
import Associacao from './DataMining/Associacao';
import Classificacao from './DataMining/Classificacao';
import Reducao from './DataMining/Reducao';
import Anomalias from './DataMining/Anomalias';

// Utilitário
import { extrairInfoDados } from './Actuarial/utils/dataExtractor';

export default function DataMining({ dados, onResultadoModelo }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('clustering');
  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0, temDados: false, variaveis: [] });

  // Processar dados quando receber
  React.useEffect(() => {
    if (dados) {
      const info = extrairInfoDados(dados);
      setInfoDados(info);
    }
  }, [dados]);

  const categorias = [
    { id: 'clustering', nome: 'Clustering', icon: '🎯', componente: Clustering },
    { id: 'associacao', nome: 'Associação', icon: '🛒', componente: Associacao },
    { id: 'classificacao', nome: 'Classificação', icon: '🏷️', componente: Classificacao },
    { id: 'reducao', nome: 'Redução', icon: '📉', componente: Reducao },
    { id: 'anomalias', nome: 'Anomalias', icon: '⚠️', componente: Anomalias }
  ];

  const ComponenteAtivo = categorias.find(c => c.id === categoriaAtiva)?.componente;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Network className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Data Mining</h1>
              <p className="text-blue-100">Selecione o tipo de análise</p>
            </div>
          </div>
          
          {infoDados.temDados && (
            <Badge variant="outline" className="bg-white/20 text-white">
              <Database className="w-3 h-3 mr-2" />
              {infoDados.linhas} registros
            </Badge>
          )}
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com categorias */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaAtiva(cat.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      categoriaAtiva === cat.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <div className="font-medium">{cat.nome}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área de conteúdo - Renderiza o componente ativo */}
        <div className="lg:col-span-3">
          {ComponenteAtivo && (
            <ComponenteAtivo 
              dados={dados}
              infoDados={infoDados}
              onResultadoModelo={onResultadoModelo} // 🔥 AGORA PASSA A FUNÇÃO
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}