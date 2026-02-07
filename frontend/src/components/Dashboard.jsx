// src/components/Dashboard.jsx
import React, { useState, useEffect } from "react";
import FooterJIAMUpdated from "./FooterJIAM";
import Profile from "./Profile";
import AbaAjuda from "./AbaAjuda";
import AbaQuemSomos from "./AbaQuemSomos";
import { getUserProfile } from "../services/auth";

// Componentes esqueletos das funcionalidades
import Dados from "./Dashboard/Dados";
import Previsoes from "./Dashboard/Previsoes";
import AtuarialSeguros from "./Dashboard/AtuarialSeguros";
import Relatorios from "./Dashboard/Relatorios"; 
import IAPreditivo from "./Dashboard/IAPreditivo";
import DataMining from "./Dashboard/DataMining";
import BigData from "./Dashboard/BigData";
import InterpretacaoModelos from "./Dashboard/InterpretacaoModelos";

export default function Dashboard({ user, lang, onLogout }) {
  const translations = {
    pt: {
      bemVindo: "Bem-vindo",
      perfil: "Perfil",
      previsoes: "Previsões",
      bigData: "Big Data",
      relatorios: "Relatórios", 
      interpretacao: "Interpretação dos Modelos",
      dataMining: "Data Mining",
      iaJIAM: "IA JIAM - Preditivo",
      executarPrevisao: "Executar Previsão",
      execucoesUsadas: "Execuções usadas",
      produtoAtivo: "Produto ativo",
      limiteExecucoes: "Limite atingido. Active o produto.",
      codigoAtivacao: "Código de Ativação",
      ativarProduto: "Ativar Produto",
      logout: "Sair",
      dashboard: "Dashboard",
      estatisticas: "Estatísticas",
      recentes: "Atividades Recentes",
      config: "Configurações",
      ajuda: "Ajuda",
      sobre: "Sobre",
      versao: "Versão 2.0.0",
      completo: "Completo",
      incompleto: "Incompleto",
      bemVindoDeVolta: "Bem-vindo de volta",
      ultimoAcesso: "Último acesso",
      tipoConta: "Tipo de Conta",
      statusConta: "Status da Conta",
      verEstatisticas: "Ver Estatísticas",
      completarPerfil: "Completar Perfil",
      atualizarPerfil: "Atualizar Perfil",
      previsoesDisponiveis: "Previsões Disponíveis",
      modeloAtivo: "Modelo Ativo",
      executarAnalise: "Executar Análise",
      visualizarDados: "Visualizar Dados",
      exportarDados: "Exportar Dados",
      ajudaSuporte: "Ajuda e Suporte",
      documentacao: "Documentação",
      contato: "Contato",
      terminarSessao: "Terminar Sessão",
      dados: "Dados",
      modelagemPredicoes: "Modelagem e Predições",
      atuarialSeguros: "Actuariado e Seguros",
    },
    en: {
      bemVindo: "Welcome",
      perfil: "Profile",
      previsoes: "Forecasts",
      bigData: "Big Data",
      relatorios: "Reports",
      interpretacao: "Model Interpretation",
      dataMining: "Data Mining",
      iaJIAM: "JIAM AI - Predictive",
      executarPrevisao: "Run Forecast",
      execucoesUsadas: "Executions used",
      produtoAtivo: "Active product",
      limiteExecucoes: "Limit reached. Activate product.",
      codigoAtivacao: "Activation Code",
      ativarProduto: "Activate Product",
      logout: "Logout",
      dashboard: "Dashboard",
      estatisticas: "Statistics",
      recentes: "Recent Activities",
      config: "Settings",
      ajuda: "Help",
      sobre: "About",
      versao: "Version 2.0.0",
      completo: "Complete",
      incompleto: "Incomplete",
      bemVindoDeVolta: "Welcome back",
      ultimoAcesso: "Last access",
      tipoConta: "Account Type",
      statusConta: "Account Status",
      verEstatisticas: "View Statistics",
      completarPerfil: "Complete Profile",
      atualizarPerfil: "Update Profile",
      previsoesDisponiveis: "Available Forecasts",
      modeloAtivo: "Active Model",
      executarAnalise: "Run Analysis",
      visualizarDados: "View Data",
      exportarDados: "Export Data",
      ajudaSuporte: "Help & Support",
      documentacao: "Documentation",
      contato: "Contact",
      terminarSessao: "End Session",
      dados: "Data",
      modelagemPredicoes: "Modeling and Predictions",
      atuarialSeguros: "Actuarial and Insurance",
    },
  };

  const t = translations[lang] || translations.pt;
  const [abaAtiva, setAbaAtiva] = useState("Dashboard");
  const [abaSecundaria, setAbaSecundaria] = useState("dados");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  
  // Dados em memória
  const [estadoLocal, setEstadoLocal] = useState({
    execucoes: 0,
    produtoAtivo: false,
    atividades: [],
    dadosUpload: null,
    modelosAjustados: {},
    codigoAtivacao: "",
    relatorios: [],
    resultadosModelos: [], // ← ADICIONADO: Para armazenar resultados dos modelos
  });

  useEffect(() => {
    loadUserProfile();
    carregarEstadoLocal();
  }, []);

  const loadUserProfile = async () => {
    try {
      if (user && (user.userId || user._id || user.id)) {
        const userId = user.userId || user._id || user.id;
        const result = await getUserProfile(userId);
        
        if (result?.success) {
          setProfileData({
            nome: result.profile?.nome || result.profile?.username || user.username || '',
            email: user.email || '',
            tipo: user.role === 'organizacao' ? 'organizacao' : 'individual',
            status: result.profile?.status || 'incompleto',
            email_confirmado: user.email_confirmado || false,
          });
        } else {
          setProfileData({
            nome: user.username || '',
            email: user.email || '',
            tipo: user.role === 'organizacao' ? 'organizacao' : 'individual',
            status: 'incompleto',
            email_confirmado: user.email_confirmado || false
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setProfileData({
        nome: user?.username || '',
        email: user?.email || '',
        tipo: 'individual',
        status: 'incompleto',
        email_confirmado: false
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarEstadoLocal = () => {
    // Carregar do localStorage para estado inicial
    try {
      const saved = localStorage.getItem("jiam_dashboard_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        setEstadoLocal(prev => ({
          ...prev,
          execucoes: parsed.execucoes || 0,
          produtoAtivo: parsed.produtoAtivo || false,
          atividades: parsed.atividades || [],
          dadosUpload: parsed.dadosUpload || null,
          modelosAjustados: parsed.modelosAjustados || {},
          relatorios: parsed.relatorios || [],
          resultadosModelos: parsed.resultadosModelos || [], // ← ADICIONADO
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar estado local:", error);
    }
  };

  const salvarEstadoLocal = (novoEstado) => {
    setEstadoLocal(prev => {
      const estadoCompleto = { ...prev, ...novoEstado };
      try {
        localStorage.setItem("jiam_dashboard_data", JSON.stringify(estadoCompleto));
      } catch (error) {
        console.error("Erro ao salvar estado local:", error);
      }
      return estadoCompleto;
    });
  };

  // Função para adicionar resultado de modelo (chamada pelos componentes de execução)
  const adicionarResultadoModelo = (resultado) => {
    if (!resultado || !resultado.nome) return;
    
    const novoResultado = {
      id: `modelo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nome: resultado.nome,
      tipo: resultado.tipo || 'desconhecido',
      data: new Date().toISOString(),
      resultado: resultado.dados || resultado,
      parametros: resultado.parametros || resultado.params || {},
      classificacao: resultado.classificacao || 'MODERADA',
      metricas: resultado.metricas || {}
    };

    salvarEstadoLocal({
      resultadosModelos: [...estadoLocal.resultadosModelos, novoResultado],
      atividades: [
        {
          tipo: "modelo_executado",
          data: novoResultado.data,
          descricao: `Modelo ${novoResultado.nome} executado com sucesso`,
          modelo: novoResultado.nome,
          tipoModelo: novoResultado.tipo
        },
        ...estadoLocal.atividades.slice(0, 9)
      ]
    });

    return novoResultado;
  };

  const handleProfileUpdate = () => {
    loadUserProfile();
  };

  const usarModelo = () => {
    if (!estadoLocal.produtoAtivo && estadoLocal.execucoes >= 3) {
      alert(t.limiteExecucoes);
      return;
    }
    
    salvarEstadoLocal({
      execucoes: estadoLocal.execucoes + 1,
      atividades: [
        {
          tipo: "modelo_executado",
          data: new Date().toISOString(),
          descricao: "Execução de modelo preditivo",
          aba: abaAtiva
        },
        ...estadoLocal.atividades.slice(0, 9)
      ]
    });
    
    alert("Modelo executado com sucesso! ✓");
  };

  const ativarProduto = (codigo) => {
    if (codigo === "JIAM2025" || codigo === "JIAM2024") {
      salvarEstadoLocal({
        produtoAtivo: true,
        atividades: [
          {
            tipo: "produto_ativado",
            data: new Date().toISOString(),
            descricao: "Produto ativado com sucesso"
          },
          ...estadoLocal.atividades.slice(0, 9)
        ]
      });
      
      alert(`${t.produtoAtivo} ✅`);
      return true;
    } else {
      alert("Código inválido ❌");
      return false;
    }
  };

  // Handlers para comunicação entre componentes
  const handleUploadDados = (dados) => {
    salvarEstadoLocal({
      dadosUpload: dados,
      atividades: [
        {
          tipo: "dados_carregados",
          data: new Date().toISOString(),
          descricao: `Dados carregados: ${dados.registros} registros, ${dados.variaveis} variáveis`
        },
        ...estadoLocal.atividades.slice(0, 9)
      ]
    });
  };

  const handleSalvarModelo = (nomeModelo, modelo) => {
    // Adicionar também aos resultados se for um novo modelo
    if (modelo.resultado && !estadoLocal.modelosAjustados[nomeModelo]) {
      adicionarResultadoModelo({
        nome: nomeModelo,
        tipo: modelo.tipo || 'desconhecido',
        dados: modelo.resultado,
        parametros: modelo.parametros || {},
        classificacao: modelo.classificacao || 'MODERADA'
      });
    }

    salvarEstadoLocal({
      modelosAjustados: {
        ...estadoLocal.modelosAjustados,
        [nomeModelo]: modelo
      }
    });
  };

  // Função para buscar resultados da API/localStorage
  const carregarResultadosDaAPI = async () => {
    try {
      // Tentar buscar da API se disponível
      const response = await fetch('/api/r/resultados', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const dados = await response.json();
        if (dados.resultados && dados.resultados.length > 0) {
          salvarEstadoLocal({
            resultadosModelos: dados.resultados
          });
        }
      }
    } catch (error) {
      console.log('Usando resultados locais:', error.message);
    }
  };

  // Carregar resultados ao montar componente
  useEffect(() => {
    carregarResultadosDaAPI();
  }, []);

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-[#0A1F44] to-[#1a3a6e] text-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-2">{t.bemVindoDeVolta}, {profileData?.nome || "Usuário"}!</h2>
          <p className="text-gray-300">
            {profileData?.tipo === 'organizacao' 
              ? 'Gerencie as previsões e análises da sua organização.' 
              : 'Acompanhe suas previsões e análises preditivas.'}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="bg-[#00CFFF]/20 p-3 rounded-lg">
              <span className="text-sm text-gray-300">{t.tipoConta}</span>
              <p className="font-bold capitalize">{profileData?.tipo === 'organizacao' ? 'Organização' : 'Individual'}</p>
            </div>
            <div className="bg-[#00CFFF]/20 p-3 rounded-lg">
              <span className="text-sm text-gray-300">{t.statusConta}</span>
              <p className={`font-bold ${profileData?.status === 'active' || profileData?.status === 'completo' ? 'text-green-400' : 'text-yellow-400'}`}>
                {profileData?.status === 'active' || profileData?.status === 'completo' ? t.completo : t.incompleto}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{estadoLocal.produtoAtivo ? "✅ Produto Ativo" : t.codigoAtivacao}</h3>
          {estadoLocal.produtoAtivo ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
                <div>
                  <p className="font-medium text-green-800">Licença Premium Ativa</p>
                  <p className="text-sm text-green-600">Válida até 31/12/2025</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={estadoLocal.codigoAtivacao}
                  onChange={(e) => salvarEstadoLocal({ codigoAtivacao: e.target.value })}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00CFFF] focus:border-transparent"
                  placeholder="Código JIAM2025"
                />
                <button 
                  onClick={() => ativarProduto(estadoLocal.codigoAtivacao)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition"
                >
                  Ativar
                </button>
              </div>
              <p className="text-xs text-gray-500">Execuções usadas: {estadoLocal.execucoes}/3</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cards de acesso rápido */}
        {[
          { 
            key: "Dashboard", 
            icon: "🏠", 
            title: "Página Inicial",
            desc: "Visão geral do sistema",
            color: "from-cyan-500 to-blue-600"
          },
          { 
            key: "Perfil", 
            icon: "👤", 
            title: "Meu Perfil",
            desc: "Gerencie sua conta",
            color: "from-emerald-500 to-green-600"
          },
          { 
            key: "ModelagemPredicoes", 
            icon: "📊", 
            title: "Modelagem e Predições",
            desc: "Dados, previsões e análises",
            color: "from-blue-500 to-blue-600"
          },
          { 
            key: "Relatorios", 
            icon: "📋", 
            title: "Relatórios",
            desc: `Relatórios e análises (${estadoLocal.resultadosModelos.length})`,
            color: "from-purple-500 to-purple-600"
          },
        ].map((card) => (
          <div 
            key={card.key}
            className={`bg-gradient-to-br ${card.color} text-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300`}
            onClick={() => {
              setAbaAtiva(card.key);
              if (card.key === "ModelagemPredicoes") setAbaSecundaria("dados");
            }}
          >
            <div className="text-3xl mb-4">{card.icon}</div>
            <h4 className="font-bold text-lg mb-2">{card.title}</h4>
            <p className="text-white/80 text-sm">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Mais cards de acesso rápido */}
        {[
          { 
            key: "IAJIAM", 
            icon: "🤖", 
            title: "IA JIAM",
            desc: "Assistente preditivo",
            color: "from-teal-500 to-teal-600"
          },
          { 
            key: "Interpretacao", 
            icon: "🔍", 
            title: "Interpretação",
            desc: "Análise de modelos",
            color: "from-indigo-500 to-indigo-600"
          },
          { 
            key: "DataMining", 
            icon: "⛏️", 
            title: "Data Mining",
            desc: "Mineração de dados",
            color: "from-amber-500 to-orange-600"
          },
          { 
            key: "BigData", 
            icon: "💾", 
            title: "Big Data",
            desc: "Análise em larga escala",
            color: "from-rose-500 to-pink-600"
          },
        ].map((card) => (
          <div 
            key={card.key}
            className={`bg-gradient-to-br ${card.color} text-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300`}
            onClick={() => {
              setAbaAtiva(card.key);
              if (card.key === "ModelagemPredicoes") setAbaSecundaria("dados");
            }}
          >
            <div className="text-3xl mb-4">{card.icon}</div>
            <h4 className="font-bold text-lg mb-2">{card.title}</h4>
            <p className="text-white/80 text-sm">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status do sistema */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📂 Dados</h3>
          <div className="space-y-3">
            {estadoLocal.dadosUpload ? (
              <>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">✓ Dados disponíveis</p>
                  <p className="text-sm text-green-600">
                    {estadoLocal.dadosUpload.registros} registros, {estadoLocal.dadosUpload.variaveis} variáveis
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setAbaAtiva("ModelagemPredicoes");
                    setAbaSecundaria("dados");
                  }}
                  className="w-full bg-[#0A1F44] text-white py-2 rounded hover:bg-[#1a3a6e] transition"
                >
                  Ver Dados
                </button>
              </>
            ) : (
              <>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">Nenhum dado carregado</p>
                </div>
                <button 
                  onClick={() => {
                    setAbaAtiva("ModelagemPredicoes");
                    setAbaSecundaria("dados");
                  }}
                  className="w-full bg-[#0A1F44] text-white py-2 rounded hover:bg-[#1a3a6e] transition"
                >
                  Carregar Dados
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🧠 Modelos</h3>
          <div className="space-y-3">
            {estadoLocal.resultadosModelos.length > 0 ? (
              <>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">
                    {estadoLocal.resultadosModelos.length} modelo(s) executados
                  </p>
                  <div className="mt-2 space-y-1">
                    {estadoLocal.resultadosModelos.slice(0, 3).map((resultado, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 truncate">{resultado.nome}</span>
                      </div>
                    ))}
                    {estadoLocal.resultadosModelos.length > 3 && (
                      <p className="text-xs text-gray-500">+{estadoLocal.resultadosModelos.length - 3} mais</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setAbaAtiva("Relatorios")}
                  className="w-full bg-[#0A1F44] text-white py-2 rounded hover:bg-[#1a3a6e] transition"
                >
                  Ver Relatórios
                </button>
              </>
            ) : (
              <>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800">Nenhum modelo executado</p>
                  <p className="text-sm text-gray-600">Execute análises para ver resultados</p>
                </div>
                <button 
                  onClick={() => {
                    setAbaAtiva("ModelagemPredicoes");
                    setAbaSecundaria("previsoes");
                  }}
                  className="w-full bg-[#0A1F44] text-white py-2 rounded hover:bg-[#1a3a6e] transition"
                >
                  Executar Modelo
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Atividades</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {estadoLocal.atividades.slice(0, 3).map((atividade, index) => (
              <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">
                    {atividade?.tipo?.includes('modelo') ? '🤖' : 
                     atividade?.tipo?.includes('produto') ? '🎁' : '📝'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{atividade?.descricao || "Atividade"}</p>
                  <p className="text-xs text-gray-500">
                    {atividade?.data ? new Date(atividade.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                  </p>
                </div>
              </div>
            ))}
            {estadoLocal.atividades.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Modelos Recentes */}
      {estadoLocal.resultadosModelos.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Modelos Recentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estadoLocal.resultadosModelos.slice(0, 3).map((resultado, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800 truncate">{resultado.nome}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      resultado.classificacao === 'EXCELENTE' ? 'bg-green-100 text-green-800' :
                      resultado.classificacao === 'BOA' ? 'bg-blue-100 text-blue-800' :
                      resultado.classificacao === 'MODERADA' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {resultado.classificacao || 'MODERADA'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Tipo: {resultado.tipo || 'desconhecido'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Executado: {new Date(resultado.data).toLocaleDateString('pt-BR')}
                  </p>
                  <button
                    onClick={() => {
                      setAbaAtiva("Relatorios");
                      // Aqui poderia passar o resultado específico para análise
                    }}
                    className="mt-3 w-full text-sm bg-purple-600 text-white py-1 px-3 rounded hover:bg-purple-700 transition"
                  >
                    Ver Análise
                  </button>
                </div>
              ))}
            </div>
            {estadoLocal.resultadosModelos.length > 3 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setAbaAtiva("Relatorios")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver todos os {estadoLocal.resultadosModelos.length} modelos →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderConteudo = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#00CFFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      );
    }

    switch (abaAtiva) {
      case "Dashboard":
        return renderDashboard();
      case "Perfil":
        return <Profile user={user} onUpdate={handleProfileUpdate} />;
      
      case "ModelagemPredicoes":
        return (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="border-b border-gray-200">
              <div className="flex space-x-1 px-6 pt-4">
                <button
                  className={`px-4 py-2 rounded-t-lg font-medium transition ${abaSecundaria === "dados" ? "bg-[#0A1F44] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                  onClick={() => setAbaSecundaria("dados")}
                >
                  📊 Dados
                </button>
                <button
                  className={`px-4 py-2 rounded-t-lg font-medium transition ${abaSecundaria === "previsoes" ? "bg-[#0A1F44] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                  onClick={() => setAbaSecundaria("previsoes")}
                >
                  📈 Previsões
                </button>
                <button
                  className={`px-4 py-2 rounded-t-lg font-medium transition ${abaSecundaria === "atuarial" ? "bg-[#0A1F44] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                  onClick={() => setAbaSecundaria("atuarial")}
                >
                  🛡️ Actuariado e Seguros
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {abaSecundaria === "dados" && (
                <Dados 
                  dados={estadoLocal.dadosUpload}
                  onUpload={handleUploadDados}
                  usarModelo={usarModelo}
                  onResultadoModelo={adicionarResultadoModelo} // ← ADICIONADO
                />
              )}
              {abaSecundaria === "previsoes" && (
                <Previsoes 
                  dados={estadoLocal.dadosUpload}
                  usarModelo={usarModelo}
                  onSaveModel={handleSalvarModelo}
                  modelosAjustados={estadoLocal.modelosAjustados}
                  onResultadoModelo={adicionarResultadoModelo} // ← ADICIONADO
                />
              )}
              {abaSecundaria === "atuarial" && (
                <AtuarialSeguros 
                  dados={estadoLocal.dadosUpload}
                  usarModelo={usarModelo}
                  onSaveModel={handleSalvarModelo}
                  modelosAjustados={estadoLocal.modelosAjustados}
                  onResultadoModelo={adicionarResultadoModelo} // ← ADICIONADO
                />
              )}
            </div>
          </div>
        );
      
      case "Relatorios": 
        return (
          <Relatorios 
            resultados={estadoLocal.resultadosModelos} // ← CORRIGIDO: Passando os resultados dos modelos
            relatorios={estadoLocal.relatorios || []}
            modelos={estadoLocal.modelosAjustados}
            dados={estadoLocal.dadosUpload}
            atividades={estadoLocal.atividades}
            onExportar={(novoRelatorio) => {
              const novosRelatorios = [...(estadoLocal.relatorios || []), novoRelatorio];
              salvarEstadoLocal({
                relatorios: novosRelatorios
              });
            }}
          />
        );
      
      case "IAJIAM":
        return <IAPreditivo onResultadoModelo={adicionarResultadoModelo} />;
      
      case "DataMining":
        return <DataMining 
          dados={estadoLocal.dadosUpload} 
          onResultadoModelo={adicionarResultadoModelo}
        />;
      
      case "BigData":
        return <BigData 
          dados={estadoLocal.dadosUpload}
          onResultadoModelo={adicionarResultadoModelo}
        />;
      
      case "Interpretacao":
        return <InterpretacaoModelos 
          modelos={estadoLocal.modelosAjustados} 
          dados={estadoLocal.dadosUpload}
          resultados={estadoLocal.resultadosModelos}
        />;
      
      case "Sobre":
        return <AbaQuemSomos />;
      
      case "Ajuda":
        return <AbaAjuda />;
      
      case "Configuracoes":
        return (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-[#0A1F44] mb-6">{t.config}</h2>
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Preferências</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                    <div className="flex items-center space-x-4">
                      <button 
                        className={`px-4 py-2 rounded-lg ${lang === 'pt' ? 'bg-[#0A1F44] text-white' : 'bg-gray-100 text-gray-800'}`}
                        onClick={() => {
                          localStorage.setItem('jiam_lang', 'pt');
                          window.location.reload();
                        }}
                      >
                        Português 🇵🇹
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg ${lang === 'en' ? 'bg-[#0A1F44] text-white' : 'bg-gray-100 text-gray-800'}`}
                        onClick={() => {
                          localStorage.setItem('jiam_lang', 'en');
                          window.location.reload();
                        }}
                      >
                        English 🇬🇧
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                    <div className="flex items-center space-x-4">
                      <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
                        Claro ☀️
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-gray-800 text-white">
                        Escuro 🌙
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limpar Dados</label>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja limpar todos os dados locais?')) {
                            localStorage.removeItem('jiam_dashboard_data');
                            window.location.reload();
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      >
                        Limpar Dados Locais
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Em Desenvolvimento</h3>
              <p className="text-gray-500">
                Esta funcionalidade estará disponível em breve.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#0A1F44] to-[#00CFFF] rounded-lg flex items-center justify-center">
                <img 
                  src="/jiam.ico" 
                  alt="JIAM" 
                  className="w-8 h-8"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0A1F44]">JIAM - Predictivo</h1>
                <p className="text-sm text-gray-500">{t.dashboard}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="font-medium">{profileData?.nome || user?.username || "Usuário"}</p>
              <p className="text-sm text-gray-500">{user?.email || ""}</p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 bg-[#0A1F44] rounded-full flex items-center justify-center text-white font-bold">
                {(profileData?.nome?.charAt(0) || user?.username?.charAt(0) || "U").toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0A1F44] text-white flex flex-col">
          <div className="p-4 flex-1">
            <nav className="space-y-2">
              {/* Botões principais no topo */}
              <button
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
                  abaAtiva === "Dashboard" 
                    ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                    : "hover:bg-white/10"
                }`}
                onClick={() => setAbaAtiva("Dashboard")}
              >
                <span className="text-lg">🏠</span>
                <span>{t.dashboard}</span>
              </button>

              <button
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
                  abaAtiva === "Perfil" 
                    ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                    : "hover:bg-white/10"
                }`}
                onClick={() => setAbaAtiva("Perfil")}
              >
                <span className="text-lg">👤</span>
                <span>{t.perfil}</span>
              </button>

              {/* Grupo: Modelagem e Predições */}
              <div className="mt-4 mb-4">
                <div className="flex items-center gap-2 mb-2 px-3 py-2 text-gray-300 text-sm font-medium">
                  <span>📊</span>
                  <span>{t.modelagemPredicoes}</span>
                </div>
                <div className="ml-4 space-y-1">
                  <button
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left text-sm transition ${
                      abaAtiva === "ModelagemPredicoes" && abaSecundaria === "dados" 
                        ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                        : "hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setAbaAtiva("ModelagemPredicoes");
                      setAbaSecundaria("dados");
                    }}
                  >
                    <span>💾</span>
                    <span>Dados</span>
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left text-sm transition ${
                      abaAtiva === "ModelagemPredicoes" && abaSecundaria === "previsoes" 
                        ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                        : "hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setAbaAtiva("ModelagemPredicoes");
                      setAbaSecundaria("previsoes");
                    }}
                  >
                    <span>📈</span>
                    <span>Previsões</span>
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left text-sm transition ${
                      abaAtiva === "ModelagemPredicoes" && abaSecundaria === "atuarial" 
                        ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                        : "hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setAbaAtiva("ModelagemPredicoes");
                      setAbaSecundaria("atuarial");
                    }}
                  >
                    <span>🛡️</span>
                    <span>Actuariado e Seguros</span>
                  </button>
                </div>
              </div>

              {/* Outras abas */}
              {[
                { key: "Relatorios", icon: "📋", label: `${t.relatorios} (${estadoLocal.resultadosModelos.length})` },
                { key: "IAJIAM", icon: "🤖", label: t.iaJIAM },
                { key: "Interpretacao", icon: "📊", label: t.interpretacao },
                { key: "DataMining", icon: "⛏️", label: t.dataMining },
                { key: "BigData", icon: "💾", label: t.bigData },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
                    abaAtiva === item.key 
                      ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => setAbaAtiva(item.key)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Seção inferior */}
            <div className="mt-8 pt-4 border-t border-white/20">
              <div className="space-y-1">
                <button
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full ${
                    abaAtiva === "Configuracoes" 
                      ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => setAbaAtiva("Configuracoes")}
                >
                  <span>⚙️</span>
                  <span>{t.config}</span>
                </button>
                <button
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full ${
                    abaAtiva === "Ajuda" 
                      ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => setAbaAtiva("Ajuda")}
                >
                  <span>❓</span>
                  <span>{t.ajuda}</span>
                </button>
                <button
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full ${
                    abaAtiva === "Sobre" 
                      ? "bg-[#00CFFF] text-[#0A1F44] font-semibold" 
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => setAbaAtiva("Sobre")}
                >
                  <span>ℹ️</span>
                  <span>{t.sobre}</span>
                </button>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors w-full"
                >
                  <span>🚪</span>
                  <span>{t.logout}</span>
                </button>
              </div>
              
              <div className="mt-4 text-center text-xs text-gray-400">
                <p>{t.versao}</p>
                <p className="mt-1">Modelos: {estadoLocal.resultadosModelos.length} • Relatórios: {estadoLocal.relatorios.length}</p>
                <p className="mt-1">© 2025 JIAM Preditivo</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderConteudo()}
        </main>
      </div>

      <FooterJIAMUpdated setAbaAtiva={setAbaAtiva} lang={lang} />
    </div>
  );
}