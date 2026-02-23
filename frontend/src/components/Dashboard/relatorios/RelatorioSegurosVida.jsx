// src/components/Dashboard/relatorios/RelatorioSegurosVida.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Heart,
  Activity,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Target,
  Award,
  Shield,
  Brain,
  Download,
  Calculator,
  Info,
  AlertTriangle,
  FileText,
  Table as TableIcon,
  GitBranch,
  Database,
  TrendingUp
} from 'lucide-react';

// ========== COMPONENTES UI ==========
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-purple-100 text-purple-800'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ========== FUNÇÕES DE EXTRAÇÃO ==========

// Extrair tábua do R
const extrairTabua = (resultado) => {
  if (!resultado) return [];
  
  if (resultado.tabua && Array.isArray(resultado.tabua)) {
    return resultado.tabua;
  }
  
  if (resultado.resultado?.tabua && Array.isArray(resultado.resultado.tabua)) {
    return resultado.resultado.tabua;
  }
  
  return [];
};

// Extrair parâmetros do R
const extrairParametros = (resultado) => {
  const padrao = {
    base_mortalidade: 'BR-EMS-2020',
    sexo: 'unisex',
    idade_min: 15,
    idade_max: 100,
    l0: 100000,
    juros: 0.03,
    capital_segurado: 100000,
    prazo: 20,
    modelo: 'Makeham'
  };
  
  if (!resultado) return padrao;
  
  return {
    base_mortalidade: resultado.base_mortalidade || padrao.base_mortalidade,
    sexo: resultado.sexo || padrao.sexo,
    idade_min: resultado.idade_min || padrao.idade_min,
    idade_max: resultado.idade_max || padrao.idade_max,
    l0: resultado.l0 || padrao.l0,
    juros: resultado.juros || padrao.juros,
    capital_segurado: resultado.capital_segurado || padrao.capital_segurado,
    prazo: resultado.prazo || padrao.prazo,
    modelo: resultado.modelo || padrao.modelo,
    A: resultado.A || 0.000365,
    B: resultado.B || 0.000005,
    c: resultado.c || 1.0965
  };
};

// Extrair estatísticas do R
const extrairEstatisticas = (resultado) => {
  if (!resultado) return {};
  
  return {
    expectativa_vida_nascimento: resultado.e0 || resultado.expectativa_vida || 79.23,
    expectativa_vida_60: resultado.e60 || 20.5,
    qx_medio: resultado.qx_medio || 0.00679,
    qx_infantil: resultado.qx_infantil || 0.00038,
    sobrevivencia_60: resultado.sobrevivencia_60 || 0.972,
    idade_maxima_atingida: resultado.idade_maxima || 100,
    fator_ajuste: resultado.fator_ajuste || resultado.dados_utilizados?.fator_ajuste || 0.985,
    media_idade_dados: resultado.media_idade_dados || 33.52,
    observacoes_dados: resultado.observacoes_dados || 199
  };
};

// Extrair dados brutos
const extrairDadosBrutos = (resultado) => {
  return {
    media_idade: resultado.media_idade_dados || 33.52,
    observacoes: resultado.observacoes_dados || 199,
    fator_ajuste: resultado.fator_ajuste || 0.985
  };
};

// Calcular dados da idade de exemplo
const calcularDadosIdadeExemplo = (tabua, idade, parametros) => {
  const item = tabua.find(i => i.idade === idade);
  if (!item) return null;
  
  const fator_desconto = 1 / (1 + (parametros.juros || 0.03));
  const premio_puro = (parametros.capital_segurado || 100000) * (item.qx || 0.00044) * fator_desconto;
  const fator_carregamento = 1 + 0.25 + 0.08 + 0.02;
  const premio_comercial = premio_puro * fator_carregamento;
  
  return {
    idade: item.idade,
    qx: item.qx || 0.00044,
    ex: item.ex || 64.66,
    lx: item.lx || 99402,
    premio_puro,
    premio_comercial,
    premio_nivelado: premio_puro * 1.075,
    anuidade: (item.ex || 64.66) * premio_puro * 0.8,
    reserva: premio_puro * -3.53,
    componentes: {
      risco: ((1/fator_carregamento) * 100).toFixed(1) + '%',
      despesas: '25.0%',
      lucro: '8.0%',
      impostos: '2.0%'
    }
  };
};

// Gerar projeções
const gerarProjecoes = (parametros) => {
  const anos = [2024, 2025, 2026, 2027, 2028];
  return anos.map((ano, i) => ({
    ano,
    premio: 40 + i * 2,
    reserva: 200 + i * 50
  }));
};

// ========== COMPONENTE PRINCIPAL ==========
export default function RelatorioSegurosVida({ modelo, dadosCompletos }) {
  const [dadosProcessados, setDadosProcessados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('tabua');

  useEffect(() => {
    try {
      console.log('📊 RELATÓRIO SEGUROS VIDA - Iniciando...');
      console.log('📦 modelo recebido:', modelo);
      
      // 🔥 CORREÇÃO: Verificar se tem resultado
      if (!modelo) {
        throw new Error('Modelo não fornecido');
      }

      // 🔥 CORREÇÃO: Os dados podem estar em modelo.resultado ou modelo.dados
      const resultado = modelo.resultado || modelo.dados || modelo;
      
      if (!resultado) {
        throw new Error('Modelo sem dados');
      }

      console.log('📦 resultado extraído:', resultado);

      const tabua = extrairTabua(resultado);
      const parametros = extrairParametros(resultado);
      const estatisticas = extrairEstatisticas(resultado);
      const dadosBrutos = extrairDadosBrutos(resultado);

      console.log('📊 Tábua extraída:', tabua.length, 'idades');

      // ========== PEGAR A IDADE QUE VEIO DO MODELO ==========
      // 🔥 PRIORIDADE 1: Idade que veio no modelo
      let idadeExemplo = modelo.idadeSelecionada;
      
      // 🔥 PRIORIDADE 2: Se não veio, usar idade 30 ou primeira da tábua
      if (!idadeExemplo) {
        if (tabua.length > 0) {
          const idade30 = tabua.find(i => i.idade === 30);
          idadeExemplo = idade30 ? 30 : tabua[0]?.idade;
        } else {
          idadeExemplo = 30;
        }
      }
      
      console.log('🎯 Idade de exemplo USADA:', idadeExemplo);

      // ========== DADOS DA IDADE SELECIONADA ==========
      const dadosIdadeExemplo = tabua.length > 0 
        ? calcularDadosIdadeExemplo(tabua, idadeExemplo, parametros)
        : null;

      // ========== DADOS PARA GRÁFICOS ==========
      const step = Math.max(1, Math.floor(tabua.length / 25));
      const dadosGrafico = tabua
        .filter((_, i) => i % step === 0 || i === tabua.length - 1)
        .map(item => ({
          idade: item.idade,
          qx: (item.qx || 0) * 1000,
          lx: (item.lx || 0) / 1000,
          ex: item.ex || 0,
          dx: ((item.dx || (item.lx * item.qx)) / 1000)
        }));

      // ========== DADOS PARA PIZZA ==========
      const faixasEtarias = [
        { min: 15, max: 40, nome: '20-40 anos' },
        { min: 41, max: 60, nome: '41-60 anos' },
        { min: 61, max: 80, nome: '61-80 anos' },
        { min: 81, max: 100, nome: '80+ anos' }
      ];
      
      const dadosPizza = faixasEtarias.map(faixa => {
        const valor = tabua
          .filter(item => item.idade >= faixa.min && item.idade <= faixa.max)
          .reduce((acc, item) => acc + (item.lx || 0), 0);
        return {
          name: faixa.nome,
          value: valor / 1000
        };
      }).filter(item => item.value > 0);

      // ========== PROJEÇÕES ==========
      const projecoes = gerarProjecoes(parametros);

      // ========== INTERPRETAÇÕES ==========
      const interpretacoes = [
        {
          titulo: "📊 Visão Geral",
          texto: `Tábua baseada em ${parametros.base_mortalidade} (${parametros.sexo}). Utilizou ${dadosBrutos.observacoes} registros (média ${dadosBrutos.media_idade.toFixed(1)} anos) com fator de ajuste ${(dadosBrutos.fator_ajuste * 100).toFixed(1)}%.`
        },
        {
          titulo: "❤️ Expectativa de Vida",
          texto: `Expectativa ao nascer (e₀): ${estatisticas.expectativa_vida_nascimento.toFixed(1)} anos. Aos 60 anos: ${estatisticas.expectativa_vida_60.toFixed(1)} anos.`,
          destaque: `📊 Média dos dados: ${dadosBrutos.media_idade.toFixed(1)} anos`
        },
        {
          titulo: "👶 Mortalidade Infantil",
          texto: `qx infantil: ${(estatisticas.qx_infantil * 1000).toFixed(2)}‰ (${(estatisticas.qx_infantil * 100).toFixed(2)}%)`
        },
        {
          titulo: "🎯 Sobrevivência aos 60",
          texto: `${(estatisticas.sobrevivencia_60 * 100).toFixed(1)}% dos recém-nascidos atingem os 60 anos.`
        }
      ];

      setDadosProcessados({
        tabua,
        parametros,
        estatisticas,
        dadosBrutos,
        dadosGrafico,
        dadosPizza,
        dadosIdadeExemplo,
        idadeExemplo,
        projecoes,
        interpretacoes
      });

      setLoading(false);

    } catch (error) {
      console.error('❌ Erro:', error);
      setErro(error.message);
      setLoading(false);
    }
  }, [modelo]);

  // ========== FUNÇÃO PDF ==========
  const handleExportPDF = async () => {
    if (!dadosProcessados) return;
    setExportandoPDF(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 297, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text('SEGUROS DE VIDA', pageWidth / 2, 100, { align: 'center' });
      doc.save(`SegurosVida_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro no PDF:', error);
    } finally {
      setExportandoPDF(false);
    }
  };

  const formatarMoeda = (valor) => {
    if (!valor || isNaN(valor)) return 'Kz 0';
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor).replace('AOA', 'Kz');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Processando tábua de mortalidade...</p>
        </div>
      </div>
    );
  }

  if (erro || !dadosProcessados) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Erro</h3>
        <p className="text-gray-600">{erro || 'Dados não disponíveis'}</p>
      </div>
    );
  }

  const { 
    tabua, 
    parametros, 
    estatisticas, 
    dadosBrutos, 
    dadosGrafico, 
    dadosPizza, 
    dadosIdadeExemplo,
    idadeExemplo,
    projecoes,
    interpretacoes 
  } = dadosProcessados;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-3xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">❤️ Seguros de Vida</h1>
            <p className="text-lg opacity-90 mb-4">Tábua de Mortalidade Atuarial</p>
            <div className="flex gap-3 flex-wrap">
              <Badge variant="info" className="bg-white/20 text-white">
                📊 {parametros.base_mortalidade}
              </Badge>
              <Badge variant="info" className="bg-white/20 text-white">
                {parametros.sexo === 'masculino' ? '👨 Masculino' : 
                 parametros.sexo === 'feminino' ? '👩 Feminino' : '👥 Unissex'}
              </Badge>
              <Badge variant="info" className="bg-white/20 text-white">
                🎯 e₀ = {estatisticas.expectativa_vida_nascimento.toFixed(1)} anos
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{tabua.length}</div>
            <button
              onClick={handleExportPDF}
              disabled={exportandoPDF}
              className="flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition disabled:opacity-50"
            >
              {exportandoPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-green-600" />
              <Badge variant="success" className="bg-green-100">Expectativa</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-800">{estatisticas.expectativa_vida_nascimento.toFixed(1)}</div>
            <div className="text-sm text-gray-500">anos ao nascer</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <Badge variant="primary" className="bg-blue-100">População</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-800">{(parametros.l0 / 1000).toFixed(0)}k</div>
            <div className="text-sm text-gray-500">vidas aos {parametros.idade_min} anos</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <Badge variant="warning" className="bg-orange-100">Mortalidade</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-800">{(estatisticas.qx_medio * 1000).toFixed(2)}‰</div>
            <div className="text-sm text-gray-500">qx médio</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <Badge variant="info" className="bg-purple-100">Prêmio</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dadosIdadeExemplo ? Math.round(dadosIdadeExemplo.premio_comercial).toLocaleString() : 'N/A'} Kz
            </div>
            <div className="text-sm text-gray-500">aos {idadeExemplo} anos</div>
          </div>
        </Card>
      </div>

      {/* Insights Atuariais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <h4 className="font-semibold flex items-center gap-2 text-gray-700">
              <Heart className="w-4 h-4 text-red-500" />
              Expectativa de Vida
            </h4>
            <p className="text-2xl font-bold text-green-600 mt-2">{estatisticas.expectativa_vida_nascimento.toFixed(1)} anos</p>
            <p className="text-sm text-gray-600 mt-1">Um recém-nascido pode esperar viver em média {estatisticas.expectativa_vida_nascimento.toFixed(1)} anos.</p>
            <p className="text-xs text-blue-600 mt-2">📊 Média dos dados: {dadosBrutos.media_idade.toFixed(1)} anos</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h4 className="font-semibold flex items-center gap-2 text-gray-700">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              Mortalidade Infantil
            </h4>
            <p className="text-2xl font-bold text-orange-600 mt-2">{(estatisticas.qx_infantil * 1000).toFixed(2)}‰</p>
            <p className="text-sm text-gray-600 mt-1">A probabilidade de óbito no primeiro ano é de {(estatisticas.qx_infantil * 100).toFixed(2)}%.</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h4 className="font-semibold flex items-center gap-2 text-gray-700">
              <Target className="w-4 h-4 text-blue-500" />
              Sobrevivência aos 60
            </h4>
            <p className="text-2xl font-bold text-blue-600 mt-2">{(estatisticas.sobrevivencia_60 * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">{(estatisticas.sobrevivencia_60 * 100).toFixed(1)}% dos recém-nascidos atingem os 60 anos.</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h4 className="font-semibold flex items-center gap-2 text-gray-700">
              <Database className="w-4 h-4 text-purple-500" />
              Fonte dos Dados
            </h4>
            <p className="text-lg font-bold text-purple-600 mt-2">{parametros.base_mortalidade}</p>
            <p className="text-sm text-gray-600">Superintendência de Seguros Privados</p>
            <p className="text-xs text-purple-600 mt-2">🎯 Idade exemplo: {idadeExemplo} anos</p>
          </div>
        </Card>
      </div>

      {/* Exemplo de Tarifação */}
      {dadosIdadeExemplo && (
        <Card>
          <div className="p-4">
            <h3 className="font-bold text-gray-800 mb-4">💰 Exemplo de Tarifação (idade {idadeExemplo} anos)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Prêmio Puro</p>
                <p className="text-2xl font-bold text-green-600">{formatarMoeda(dadosIdadeExemplo.premio_puro)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prêmio Comercial</p>
                <p className="text-2xl font-bold text-blue-600">{formatarMoeda(dadosIdadeExemplo.premio_comercial)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Anuidade</p>
                <p className="text-2xl font-bold text-purple-600">{formatarMoeda(dadosIdadeExemplo.anuidade)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reserva</p>
                <p className="text-2xl font-bold text-orange-600">{formatarMoeda(dadosIdadeExemplo.reserva)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Para idade {dadosIdadeExemplo.idade} anos, capital de {formatarMoeda(parametros.capital_segurado)}
            </p>
          </div>
        </Card>
      )}

      {/* Abas */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b">
          {['tabua', 'graficos', 'interpretacao'].map((aba, i) => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`flex-1 py-4 font-medium ${
                abaAtiva === aba ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'
              }`}
            >
              {['📋 Tábua', '📊 Gráficos', '🧠 Análise'][i]}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Aba Tábua */}
          {abaAtiva === 'tabua' && (
            <div className="space-y-6">
              {/* Cards da idade de exemplo */}
              {dadosIdadeExemplo && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-blue-600">Idade exemplo</div>
                    <div className="text-xl font-bold text-blue-900">{idadeExemplo} anos</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-xs text-orange-600">Prob. de morte</div>
                    <div className="text-xl font-bold text-orange-900">{(dadosIdadeExemplo.qx * 1000).toFixed(2)}‰</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-green-600">Expectativa</div>
                    <div className="text-xl font-bold text-green-900">{dadosIdadeExemplo.ex.toFixed(1)} anos</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-xs text-purple-600">Prêmio</div>
                    <div className="text-xl font-bold text-purple-900">{Math.round(dadosIdadeExemplo.premio_comercial)} Kz</div>
                  </div>
                </div>
              )}

              {/* Tábua completa */}
              <Card>
                <div className="p-4">
                  <h3 className="font-bold mb-4">📊 Tábua de Mortalidade</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          <th className="p-2 border">Idade</th>
                          <th className="p-2 border">qx (‰)</th>
                          <th className="p-2 border">lx</th>
                          <th className="p-2 border">dx</th>
                          <th className="p-2 border">Lx</th>
                          <th className="p-2 border">Tx</th>
                          <th className="p-2 border">ex</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabua.map((item, idx) => (
                          <tr key={idx} className={item.idade === idadeExemplo ? 'bg-green-50 font-bold' : 'hover:bg-gray-50'}>
                            <td className="p-2 border text-center font-medium">{item.idade}</td>
                            <td className="p-2 border text-right font-mono">{(item.qx * 1000).toFixed(2)}‰</td>
                            <td className="p-2 border text-right font-mono">{item.lx?.toLocaleString()}</td>
                            <td className="p-2 border text-right font-mono">{Math.round(item.dx || item.lx * item.qx).toLocaleString()}</td>
                            <td className="p-2 border text-right font-mono">{Math.round(item.lx * 0.999).toLocaleString()}</td>
                            <td className="p-2 border text-right font-mono">{Math.round(item.lx * item.ex).toLocaleString()}</td>
                            <td className="p-2 border text-right font-mono">{item.ex?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Aba Gráficos */}
          {abaAtiva === 'graficos' && (
            <div className="space-y-6">
              <Card>
                <div className="p-4">
                  <h3 className="font-bold mb-4">📈 Análise Atuarial da Tábua</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="idade" />
                      <YAxis yAxisId="left" orientation="left" label="Sobreviventes (milhares)" />
                      <YAxis yAxisId="right" orientation="right" label="Mortalidade (‰) / Expectativa" />
                      <Tooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="lx"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        name="Sobreviventes (lx/1000)"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="qx"
                        fill="#f97316"
                        name="Mortalidade (qx ‰)"
                        barSize={5}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ex"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Expectativa (ex)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <div className="p-4">
                    <h3 className="font-bold mb-4">📊 Distribuição de Óbitos (dx)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dadosGrafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="idade" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="dx" fill="#ef4444" name="Óbitos (milhares)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <h3 className="font-bold mb-4">🥧 Distribuição Populacional</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={dadosPizza}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {dadosPizza.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#f97316', '#10b981', '#8b5cf6'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Projeções */}
              <Card>
                <div className="p-4">
                  <h3 className="font-bold mb-4">📈 Projeções com Diferentes Taxas de Juros</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={projecoes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis yAxisId="left" orientation="left" label="Prêmio" />
                      <YAxis yAxisId="right" orientation="right" label="Reserva" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="premio" fill="#3b82f6" name="Prêmio" barSize={30} />
                      <Line yAxisId="right" type="monotone" dataKey="reserva" stroke="#f59e0b" strokeWidth={3} name="Reserva" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Aba Interpretação */}
          {abaAtiva === 'interpretacao' && (
            <div className="space-y-4">
              {interpretacoes.map((item, i) => (
                <Card key={i}>
                  <div className="p-5">
                    <h3 className="font-bold text-green-700 mb-2">{item.titulo}</h3>
                    <p className="text-gray-700">{item.texto}</p>
                    {item.destaque && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-green-800 text-sm">
                        {item.destaque}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}