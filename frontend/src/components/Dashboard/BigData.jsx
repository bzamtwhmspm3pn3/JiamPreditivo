// C:\Users\VhenancioMarthinz\Downloads\JiamPreditivo\frontend\src\components\Dashboard\BigData.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Componentes UI
import Card, { CardHeader, CardTitle, CardContent } from './componentes/Card';
import Button from './componentes/Button';
import Badge from './componentes/Badge';
import Tabs from './componentes/Tabs';

// Ícones
import { 
  Play, RefreshCw, Database, Cloud, Layers, GitBranch,
  Server, HardDrive, Network, Zap, Cpu, Activity,
  BarChart3, PieChart, LineChart, Download, FileJson, FileText
} from 'lucide-react';

// Subcomponentes
import SparkJobs from './BigData/SparkJobs';
import HadoopAnalise from './BigData/HadoopAnalise';
import Streaming from './BigData/Streaming';
import SQLDistribuido from './BigData/SQLDistribuido';

// Utilitário
import { extrairDadosArray, extrairInfoDados } from './Actuarial/utils/dataExtractor';

export default function BigData({ dados, onResultadoModelo }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('spark');
  const [infoDados, setInfoDados] = useState({ linhas: 0, colunas: 0, temDados: false, variaveis: [] });

  useEffect(() => {
    if (dados) {
      const info = extrairInfoDados(dados);
      setInfoDados(info);
    }
  }, [dados]);

  const categorias = [
    { id: 'spark', nome: 'Spark Jobs', icon: '⚡', componente: SparkJobs },
    { id: 'hadoop', nome: 'Hadoop Análise', icon: '🐘', componente: HadoopAnalise },
    { id: 'streaming', nome: 'Streaming', icon: '🌊', componente: Streaming },
    { id: 'sql', nome: 'SQL Distribuído', icon: '📊', componente: SQLDistribuido }
  ];

  const ComponenteAtivo = categorias.find(c => c.id === categoriaAtiva)?.componente;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Cloud className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Big Data Analytics</h1>
              <p className="text-purple-100">Processamento distribuído em larga escala</p>
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
                Motores Big Data
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
                        ? 'bg-purple-50 border-2 border-purple-500'
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

        {/* Área de conteúdo */}
        <div className="lg:col-span-3">
          {ComponenteAtivo && (
            <ComponenteAtivo 
              dados={dados}
              infoDados={infoDados}
              onResultadoModelo={onResultadoModelo}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}