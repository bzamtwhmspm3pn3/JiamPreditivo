// src/components/Dashboard/Dados.jsx - VERSÃO CORRIGIDA COM TODOS OS DADOS
import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { 
  FaUpload, 
  FaDownload, 
  FaFilter, 
  FaChartLine, 
  FaSearch, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaDatabase,
  FaTable,
  FaChartBar,
  FaCalendarAlt,
  FaInfoCircle,
  FaSync,
  FaFileExcel
} from "react-icons/fa";
import DataTable from "../DataTable/DataTable";
import StatCard from "../StatCard/StatCard";

export default function Dados({ dados, onUpload }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processamentoInfo, setProcessamentoInfo] = useState(null);
  
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Preparar colunas para a tabela
  const tableColumns = useMemo(() => {
    if (!dados?.colunas) return [];
    
    return dados.colunas.map(col => ({
      Header: col,
      accessor: col
    }));
  }, [dados?.colunas]);

  // Dados para a tabela - CORREÇÃO CRÍTICA AQUI
  const tableData = useMemo(() => {
    console.log('🔍 ANALISANDO DADOS PARA TABELA:');
    console.log('- Dados recebidos:', dados);
    console.log('- Tem dados_completos?', !!dados?.dados_completos);
    console.log('- Tamanho dados_completos:', dados?.dados_completos?.length);
    console.log('- Tem amostra?', !!dados?.amostra);
    console.log('- Tamanho amostra:', dados?.amostra?.length);
    console.log('- Total completo?', dados?.total_completo);
    console.log('- Registros reportados:', dados?.registros);
    
    // PRIORIDADE 1: Dados completos da API
    if (dados?.dados_completos && Array.isArray(dados.dados_completos)) {
      console.log(`✅ USANDO dados_completos: ${dados.dados_completos.length} registros`);
      return dados.dados_completos;
    }
    
    // PRIORIDADE 2: Se total_completo é true, então amostra = todos os dados
    if (dados?.total_completo && dados?.amostra && Array.isArray(dados.amostra)) {
      console.log(`✅ total_completo=true, usando amostra como todos: ${dados.amostra.length} registros`);
      return dados.amostra;
    }
    
    // PRIORIDADE 3: Amostra normal
    if (dados?.amostra && Array.isArray(dados.amostra)) {
      console.log(`⚠️ Usando amostra: ${dados.amostra.length} registros`);
      return dados.amostra;
    }
    
    console.log('❌ Nenhum dado válido encontrado');
    return [];
  }, [dados]);

  // Log quando tableData muda
  useEffect(() => {
    if (tableData.length > 0) {
      console.log(`📈 TableData atualizado: ${tableData.length} registros`);
      console.log(`📈 Primeiros 3 registros:`, tableData.slice(0, 3));
    }
  }, [tableData]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setSucesso(null);
    setProcessamentoInfo({
      etapa: 'Iniciando upload...',
      progresso: 10
    });
    setSelectedFile(file);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      setProcessamentoInfo({
        etapa: 'Enviando para o servidor...',
        progresso: 30
      });
      
      console.log('📤 Enviando arquivo para processamento...');
      const response = await axios.post(`${API_URL}/api/r/processamento/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProcessamentoInfo({
              etapa: 'Enviando arquivo...',
              progresso: percentCompleted
            });
          }
        }
      });
      
      setProcessamentoInfo({
        etapa: 'Processando dados...',
        progresso: 80
      });
      
      const result = response.data;
      console.log('✅ RESPOSTA DA API:', result);
      console.log('🔍 ESTRUTURA DOS DADOS:');
      console.log('- Dados.registros:', result.dados?.registros);
      console.log('- Dados.variaveis:', result.dados?.variaveis);
      console.log('- Dados.dados_completos?', !!result.dados?.dados_completos);
      console.log('- Dados.dados_completos length:', result.dados?.dados_completos?.length);
      console.log('- Dados.amostra length:', result.dados?.amostra?.length);
      console.log('- Dados.total_completo:', result.dados?.total_completo);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro no processamento');
      }
      
      // CORREÇÃO CRÍTICA: garantir que dados_completos contenha todos os dados
      const dadosFormatados = {
        registros: result.dados?.registros || 0,
        variaveis: result.dados?.variaveis || 0,
        nomeArquivo: result.arquivo?.nome || file.name,
        colunas: result.dados?.colunas || [],
        // SE total_completo=true, então dados_completos deve ter todos os dados
        dados_completos: result.dados?.dados_completos || result.dados?.amostra || [],
        amostra: result.dados?.amostra || [],
        total_completo: result.dados?.total_completo || false,
        performance: result.performance,
        metadados: result.metadados,
        analise: result.analise
      };
      
      console.log(`📊 Dados formatados:`);
      console.log(`- Registros: ${dadosFormatados.registros}`);
      console.log(`- Dados completos: ${dadosFormatados.dados_completos?.length || 0} registros`);
      console.log(`- Amostra: ${dadosFormatados.amostra?.length || 0} registros`);
      console.log(`- Total completo: ${dadosFormatados.total_completo}`);
      
      // VALIDAÇÃO CRÍTICA: se total_completo=true, mas dados_completos está vazio
      if (dadosFormatados.total_completo && dadosFormatados.dados_completos?.length === 0) {
        console.warn('⚠️ AVISO: total_completo=true mas dados_completos vazio!');
        console.warn('⚠️ Usando amostra como fallback...');
        // Se amostra tem todos os dados, usar amostra
        if (dadosFormatados.amostra?.length === dadosFormatados.registros) {
          console.log(`✅ Amostra tem todos os ${dadosFormatados.registros} registros`);
          dadosFormatados.dados_completos = dadosFormatados.amostra;
        }
      }
      
      setProcessamentoInfo({
        etapa: 'Finalizando...',
        progresso: 95
      });
      
      onUpload(dadosFormatados);
      
      setSucesso({
        title: "Upload Concluído! ✅",
        message: `Arquivo "${file.name}" processado com sucesso`,
        details: `${dadosFormatados.registros.toLocaleString()} registros • ${dadosFormatados.variaveis} variáveis`,
        performance: result.performance
      });
      
      setProcessamentoInfo({
        etapa: 'Completo!',
        progresso: 100
      });
      
      setTimeout(() => {
        setProcessamentoInfo(null);
      }, 2000);
      
    } catch (err) {
      console.error('❌ ERRO NO UPLOAD:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erro desconhecido';
      const detalhes = err.response?.data?.detalhes || err.response?.data?.error;
      
      setError({
        title: "Erro no Processamento ❌",
        message: errorMsg,
        details: detalhes
      });
      
      setProcessamentoInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.txt'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError({
          title: "Formato Inválido",
          message: `Formato ${fileExtension} não suportado. Use: CSV, Excel ou JSON`
        });
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) {
        setError({
          title: "Arquivo Muito Grande",
          message: "Tamanho máximo: 100MB. Seu arquivo: " + (file.size / 1024 / 1024).toFixed(2) + "MB"
        });
        return;
      }
      
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect({ target: { files } });
    }
  };

  const exportarDados = () => {
    if (!tableData?.length) {
      setError({ 
        title: "Sem Dados", 
        message: "Não há dados para exportar" 
      });
      return;
    }
    
    if (!dados?.colunas?.length) {
      setError({ 
        title: "Erro na Exportação", 
        message: "Colunas não definidas" 
      });
      return;
    }
    
    const headers = dados.colunas.join(';');
    const rows = tableData.map(row => 
      dados.colunas.map(col => {
        const value = row[col];
        if (value === null || value === undefined || value === '') {
          return '';
        }
        
        const strValue = typeof value === 'string' ? value : String(value);
        const escapedValue = strValue
          .replace(/"/g, '""')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ');
        
        if (escapedValue.includes(';') || escapedValue.includes(',') || escapedValue.includes('"')) {
          return `"${escapedValue}"`;
        }
        
        return escapedValue;
      }).join(';')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = dados.nomeArquivo 
      ? `dados_${dados.nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`
      : `dados_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSucesso({
      title: "Exportação Concluída",
      message: `Arquivo ${fileName} baixado com sucesso`,
      details: `${tableData.length.toLocaleString()} registros exportados`
    });
  };

  const estatisticas = useMemo(() => {
    if (!dados) return [];
    
    return [
      {
        title: "Registros",
        value: dados.registros?.toLocaleString() || "0",
        icon: <FaDatabase className="text-white text-lg" />,
        color: "blue",
        description: "Total de linhas",
        subInfo: tableData.length > 0 ? `${tableData.length.toLocaleString()} carregados` : null
      },
      {
        title: "Variáveis",
        value: dados.variaveis?.toString() || "0",
        icon: <FaTable className="text-white text-lg" />,
        color: "green",
        description: "Total de colunas",
        subInfo: dados.colunas?.length > 0 ? `${dados.colunas.length} colunas` : null
      },
      {
        title: "Status",
        value: dados.total_completo ? "Completo" : "Amostra",
        icon: <FaInfoCircle className="text-white text-lg" />,
        color: dados.total_completo ? "green" : "orange",
        description: dados.total_completo ? "Todos os dados carregados" : "Carregada amostra"
      },
      {
        title: "Arquivo",
        value: dados.nomeArquivo ? dados.nomeArquivo.substring(0, 12) + (dados.nomeArquivo.length > 12 ? '...' : '') : 'N/A',
        icon: <FaFileExcel className="text-white text-lg" />,
        color: "purple",
        description: dados.nomeArquivo || "Nome do arquivo"
      }
    ];
  }, [dados, tableData]);

  const hasData = tableData.length > 0 && tableColumns.length > 0;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaDatabase className="text-blue-600" />
              Gerenciamento de Dados
            </h1>
            <p className="text-gray-600">Carregue, visualize e analise seus dados</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => document.getElementById('fileInput').click()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <FaSync className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FaUpload />
                  Carregar Dados
                </>
              )}
            </button>
            
            {hasData && (
              <button 
                onClick={exportarDados}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <FaFileExcel />
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              loading 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mb-4">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-gray-700 text-lg font-medium mb-2">
                Arraste e solte seu arquivo aqui
              </p>
              <p className="text-gray-500 mb-6">
                ou clique para selecionar
              </p>
            </div>
            
            <input
              type="file"
              id="fileInput"
              className="hidden"
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.xls,.json,.txt"
              disabled={loading}
            />
            
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}>
                <FaUpload />
                Selecionar Arquivo
              </div>
            </label>
            
            <p className="mt-4 text-sm text-gray-500">
              Formatos suportados: CSV, Excel (XLSX, XLS), JSON, TXT
            </p>
            <p className="text-sm text-gray-500">
              Tamanho máximo: 100MB
            </p>
            
            {selectedFile && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg inline-block">
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">
                    {selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') ? '📊' :
                     selectedFile.name.endsWith('.csv') ? '📄' :
                     selectedFile.name.endsWith('.json') ? '🔧' : '📁'}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800 truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {processamentoInfo && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{processamentoInfo.etapa}</span>
              <span>{processamentoInfo.progresso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processamentoInfo.progresso}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 text-lg mb-1">{error.title}</h4>
                <p className="text-red-700">{error.message}</p>
                {error.details && (
                  <p className="text-red-600 text-sm mt-2 bg-red-100 p-2 rounded">
                    {error.details}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-start">
              <FaCheckCircle className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800 text-lg mb-1">{sucesso.title}</h4>
                <p className="text-green-700">{sucesso.message}</p>
                {sucesso.details && (
                  <p className="text-green-600 font-medium mt-2">{sucesso.details}</p>
                )}
                {sucesso.performance && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-green-100 p-2 rounded">
                      <span className="text-green-800">Tempo:</span>{' '}
                      <span className="font-medium">{sucesso.performance.tempo_processamento}</span>
                    </div>
                    <div className="bg-green-100 p-2 rounded">
                      <span className="text-green-800">Velocidade:</span>{' '}
                      <span className="font-medium">{sucesso.performance.velocidade}</span>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setSucesso(null)}
                className="text-green-400 hover:text-green-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Data Info Panel */}
        {dados && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaInfoCircle className="text-blue-500" />
              <h3 className="font-medium text-blue-800">Informações do Dataset</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-blue-600">Arquivo:</span>{' '}
                <span className="font-medium">{dados.nomeArquivo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-blue-600">Registros carregados:</span>{' '}
                <span className="font-medium">{tableData.length.toLocaleString()}</span>
                {dados.registros && tableData.length !== dados.registros && (
                  <span className="text-yellow-600 ml-1">
                    (de {dados.registros.toLocaleString()})
                  </span>
                )}
              </div>
              <div>
                <span className="text-blue-600">Status:</span>{' '}
                <span className={`font-medium ${dados.total_completo ? 'text-green-600' : 'text-yellow-600'}`}>
                  {dados.total_completo ? 'Completo' : 'Amostra'}
                  {dados.total_completo && tableData.length < dados.registros && ' (mas não carregou todos)'}
                </span>
              </div>
            </div>
            {dados.total_completo && tableData.length < dados.registros && (
              <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                ⚠️ A API diz que é "Completo" mas apenas {tableData.length} de {dados.registros} registros foram carregados.
                Isso pode ser um erro na resposta da API.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loaded Data */}
      {dados && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {estatisticas.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Visualização dos Dados</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaTable />
                      <span>{tableColumns.length} colunas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaDatabase />
                      <span>
                        {tableData.length.toLocaleString()} registros
                        {dados.registros && tableData.length !== dados.registros && (
                          <span className="text-yellow-600 ml-1">
                            (de {dados.registros.toLocaleString()})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                  <FaFilter />
                  <span>Use os filtros abaixo de cada coluna</span>
                </div>
              </div>
              
              {/* Warning if not all data is loaded */}
              {dados.registros && tableData.length !== dados.registros && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-800 font-medium">
                        Carregados {tableData.length} de {dados.registros} registros
                      </p>
                      <p className="text-yellow-700 text-sm mt-1">
                        {dados.total_completo 
                          ? 'A API indica que deveriam ser todos os dados, mas apenas uma amostra foi enviada.'
                          : 'A API enviou apenas uma amostra dos dados. Para todos os registros, verifique a configuração da API.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Data Table Component */}
            {hasData ? (
              <div className="px-6 pb-6">
                <DataTable 
                  columns={tableColumns} 
                  data={tableData} 
                  key={`datatable-${tableData.length}-${tableColumns.length}`}
                />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl text-gray-300 mb-4">📊</div>
                <p className="text-gray-600 text-lg mb-2">Nenhum dado para exibir</p>
                <p className="text-gray-500">
                  Carregue um arquivo para visualizar os dados
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}