// src/components/Dashboard/Actuarial/GLMDebug.jsx
import React from 'react';
import { useGLMModels } from '../../../contexts/GLMModelsContext';
import Card from '../componentes/Card';
import Button from '../componentes/Button';

export default function GLMDebug() {
  const { 
    modelosGLM,
    temModelosGLM,
    nCoeficientesGLM,
    estatisticasResumidas,
    loading,
    frequencia,
    severidade,
    timestamp
  } = useGLMModels();

  if (loading) {
    return (
      <Card className="p-4 mb-4 border-2 border-blue-300 bg-blue-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin">⏳</div>
          <span>Carregando modelos do contexto...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4 border-2 border-blue-500 bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2">
          <span>🔍</span>
          GLM Context Debug
        </h3>
        <Badge variant={temModelosGLM ? 'success' : 'warning'}>
          {temModelosGLM ? '✅ Modelos OK' : '⚠️ Sem Modelos'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="font-medium text-gray-700">Status:</div>
          <div className="bg-white p-2 rounded border">
            <div className="flex justify-between">
              <span>Modelos no Contexto:</span>
              <span className={temModelosGLM ? 'text-green-600 font-bold' : 'text-red-600'}>
                {temModelosGLM ? 'SIM' : 'NÃO'}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Total Coeficientes:</span>
              <span className="font-bold">{nCoeficientesGLM}</span>
            </div>
            {timestamp && (
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Atualizado:</span>
                <span>{new Date(timestamp).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {temModelosGLM && (
          <>
            <div className="space-y-2">
              <div className="font-medium text-gray-700">Frequência:</div>
              <div className="bg-white p-2 rounded border">
                <div>Família: <span className="font-medium">{frequencia?.familia || 'N/A'}</span></div>
                <div>Coeficientes: <span className="font-medium">{frequencia?.coeficientesCount || 0}</span></div>
                <div>AIC: <span className="font-medium">{frequencia?.metrics?.aic?.toFixed(2) || 'N/A'}</span></div>
                <div>Pseudo R²: <span className="font-medium">{frequencia?.metrics?.pseudo_r2?.toFixed(3) || 'N/A'}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-gray-700">Severidade:</div>
              <div className="bg-white p-2 rounded border">
                <div>Família: <span className="font-medium">{severidade?.familia || 'N/A'}</span></div>
                <div>Coeficientes: <span className="font-medium">{severidade?.coeficientesCount || 0}</span></div>
                <div>AIC: <span className="font-medium">{severidade?.metrics?.aic?.toFixed(2) || 'N/A'}</span></div>
                <div>Pseudo R²: <span className="font-medium">{severidade?.metrics?.pseudo_r2?.toFixed(3) || 'N/A'}</span></div>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <div className="font-medium text-gray-700">Estatísticas Resumidas:</div>
              <div className="bg-white p-2 rounded border grid grid-cols-3 gap-2">
                {estatisticasResumidas?.lambda_medio && (
                  <div className="text-center">
                    <div className="text-xs text-gray-500">λ médio</div>
                    <div className="font-bold">{estatisticasResumidas.lambda_medio.toFixed(4)}</div>
                  </div>
                )}
                {estatisticasResumidas?.mu_medio && (
                  <div className="text-center">
                    <div className="text-xs text-gray-500">μ médio</div>
                    <div className="font-bold">R$ {estatisticasResumidas.mu_medio.toLocaleString()}</div>
                  </div>
                )}
                {estatisticasResumidas?.premio_puro_medio && (
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Prêmio médio</div>
                    <div className="font-bold">R$ {estatisticasResumidas.premio_puro_medio.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex gap-2 justify-end">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => console.log('📦 Modelos no Contexto:', modelosGLM)}
        >
          Ver no Console
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            if (window.__GLM_CONTEXT__) {
              console.log('🔧 window.__GLM_CONTEXT__:', window.__GLM_CONTEXT__);
            } else {
              console.log('❌ window.__GLM_CONTEXT__ não disponível');
            }
          }}
        >
          Ver window.__GLM_CONTEXT__
        </Button>
      </div>
    </Card>
  );
}

// Componente Badge auxiliar (se não existir, criar)
function Badge({ variant, children }) {
  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}