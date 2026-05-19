// backend/scripts/diagnostico.js
/**
 * SCRIPT DE DIAGNÓSTICO - JIAM PREDITIVO
 * Verifica toda a estrutura do backend e identifica o que está funcionando
 * 
 * Executar: node backend/scripts/diagnostico.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n' + '='.repeat(80));
console.log('🔍 DIAGNÓSTICO DO BACKEND - JIAM PREDITIVO');
console.log('='.repeat(80) + '\n');

// Estrutura para armazenar resultados
const diagnostico = {
  timestamp: new Date().toISOString(),
  backend: {
    existente: false,
    arquivos: [],
    rotas: [],
    modelos_r: [],
    servicos: [],
    configuracoes: {}
  },
  frontend: {
    existente: false,
    componentes: [],
    paginas: [],
    servicos: [],
    utilitarios: []
  },
  problemas: [],
  sugestoes: []
};

// ==================== 1. VERIFICAR ESTRUTURA DO BACKEND ====================
console.log('📁 1. VERIFICANDO ESTRUTURA DO BACKEND\n');

const backendPaths = {
  controllers: './backend/controllers',
  models: './backend/models',
  routes: './backend/routes',
  services: './backend/services',
  middleware: './backend/middleware',
  rEngine: './backend/r-engine',
  utils: './backend/utils',
  scripts: './backend/scripts'
};

// Verificar cada diretório
for (const [name, dirPath] of Object.entries(backendPaths)) {
  const fullPath = path.join(process.cwd(), dirPath);
  
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    diagnostico.backend[name] = {
      existe: true,
      arquivos: files.filter(f => f.endsWith('.js') || f.endsWith('.R'))
    };
    console.log(`   ✅ ${name}/ - ${diagnostico.backend[name].arquivos.length} arquivos`);
  } else {
    diagnostico.backend[name] = { existe: false, arquivos: [] };
    console.log(`   ❌ ${name}/ - NÃO ENCONTRADO`);
    diagnostico.problemas.push(`Diretório ${name}/ não encontrado`);
  }
}

// ==================== 2. VERIFICAR ROTAS EXISTENTES ====================
console.log('\n📡 2. VERIFICANDO ROTAS DA API\n');

const rotasPath = path.join(process.cwd(), 'backend/routes');
if (fs.existsSync(rotasPath)) {
  const rotasFiles = fs.readdirSync(rotasPath);
  
  for (const file of rotasFiles) {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(rotasPath, file), 'utf8');
      
      // Extrair rotas definidas
      const routeMatches = content.match(/router\.(get|post|put|delete)\(['"]([^'"]+)['"]/g) || [];
      const routes = routeMatches.map(r => {
        const match = r.match(/router\.(get|post|put|delete)\(['"]([^'"]+)['"]/);
        return match ? `${match[1].toUpperCase()} ${match[2]}` : null;
      }).filter(r => r);
      
      diagnostico.backend.rotas.push({
        arquivo: file,
        rotas: routes
      });
      
      console.log(`   📄 ${file}: ${routes.length} rotas`);
    }
  }
}

// ==================== 3. VERIFICAR MODELOS R ====================
console.log('\n📊 3. VERIFICANDO MODELOS R\n');

const rPath = path.join(process.cwd(), 'backend/r-engine');
if (fs.existsSync(rPath)) {
  const rFiles = fs.readdirSync(rPath);
  
  for (const file of rFiles) {
    if (file.endsWith('.R') || file.endsWith('.r')) {
      const content = fs.readFileSync(path.join(rPath, file), 'utf8');
      
      // Verificar quais modelos estão implementados
      const temARIMA = content.includes('arima') || content.includes('Arima');
      const temETS = content.includes('ets') || content.includes('ETS');
      const temProphet = content.includes('prophet') || content.includes('Prophet');
      const temXGBoost = content.includes('xgboost') || content.includes('XGBoost');
      
      diagnostico.backend.modelos_r.push({
        arquivo: file,
        modelos: {
          ARIMA: temARIMA,
          ETS: temETS,
          Prophet: temProphet,
          XGBoost: temXGBoost
        }
      });
      
      console.log(`   📊 ${file}: ARIMA=${temARIMA ? '✅' : '❌'} | ETS=${temETS ? '✅' : '❌'} | Prophet=${temProphet ? '✅' : '❌'} | XGBoost=${temXGBoost ? '✅' : '❌'}`);
    }
  }
}

// ==================== 4. VERIFICAR SERVIÇOS ====================
console.log('\n🔧 4. VERIFICANDO SERVIÇOS\n');

const servicesPath = path.join(process.cwd(), 'backend/services');
if (fs.existsSync(servicesPath)) {
  const servicesFiles = fs.readdirSync(servicesPath);
  
  for (const file of servicesFiles) {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(servicesPath, file), 'utf8');
      
      // Verificar funcionalidades implementadas
      const temValidacao = content.includes('validate') || content.includes('Quality');
      const temOutliers = content.includes('outlier') || content.includes('IQR');
      const temGARCH = content.includes('garch') || content.includes('GARCH');
      const temBootstrap = content.includes('bootstrap');
      
      diagnostico.backend.servicos.push({
        arquivo: file,
        funcionalidades: {
          validacao: temValidacao,
          outliers: temOutliers,
          garch: temGARCH,
          bootstrap: temBootstrap
        }
      });
      
      console.log(`   🔧 ${file}: Validação=${temValidacao ? '✅' : '❌'} | Outliers=${temOutliers ? '✅' : '❌'} | GARCH=${temGARCH ? '✅' : '❌'}`);
    }
  }
}

// ==================== 5. VERIFICAR CONFIGURAÇÕES ====================
console.log('\n⚙️ 5. VERIFICANDO CONFIGURAÇÕES\n');

const envPath = path.join(process.cwd(), 'backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      envVars[match[1]] = match[2].replace(/['"]/g, '');
    }
  });
  
  diagnostico.backend.configuracoes = {
    PORT: envVars.PORT || '5000',
    NODE_ENV: envVars.NODE_ENV || 'development',
    MONGO_URI: envVars.MONGO_URI ? '✅ Configurado' : '❌ Não configurado',
    JWT_SECRET: envVars.JWT_SECRET ? '✅ Configurado' : '❌ Não configurado',
    USE_R_PLUMBER: envVars.USE_R_PLUMBER || 'false',
    R_API_URL: envVars.R_API_URL || 'http://localhost:8000'
  };
  
  console.log(`   📝 PORT: ${diagnostico.backend.configuracoes.PORT}`);
  console.log(`   📝 NODE_ENV: ${diagnostico.backend.configuracoes.NODE_ENV}`);
  console.log(`   📝 MongoDB: ${diagnostico.backend.configuracoes.MONGO_URI}`);
  console.log(`   📝 JWT: ${diagnostico.backend.configuracoes.JWT_SECRET}`);
  console.log(`   📝 R Integration: ${diagnostico.backend.configuracoes.USE_R_PLUMBER}`);
} else {
  console.log('   ❌ Arquivo .env não encontrado');
  diagnostico.problemas.push('Arquivo .env não configurado');
}

// ==================== 6. VERIFICAR ESTRUTURA DO FRONTEND ====================
console.log('\n🎨 6. VERIFICANDO ESTRUTURA DO FRONTEND\n');

const frontendPaths = {
  components: './frontend/src/components',
  pages: './frontend/src/pages',
  services: './frontend/src/services',
  utils: './frontend/src/utils',
  contexts: './frontend/src/contexts'
};

for (const [name, dirPath] of Object.entries(frontendPaths)) {
  const fullPath = path.join(process.cwd(), dirPath);
  
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    diagnostico.frontend[name] = {
      existe: true,
      arquivos: files.filter(f => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx'))
    };
    console.log(`   ✅ ${name}/ - ${diagnostico.frontend[name].arquivos.length} arquivos`);
  } else {
    diagnostico.frontend[name] = { existe: false, arquivos: [] };
    console.log(`   ❌ ${name}/ - NÃO ENCONTRADO`);
  }
}

// ==================== 7. VERIFICAR COMPONENTES ESPECÍFICOS ====================
console.log('\n🧩 7. VERIFICANDO COMPONENTES ESPECÍFICOS\n');

const componentesEspecificos = [
  'PublicMetrics',
  'ResultadoSeriesTemporais',
  'ARIMA',
  'ETS',
  'Prophet',
  'Dashboard'
];

const componentsPath = path.join(process.cwd(), 'frontend/src/components');
if (fs.existsSync(componentsPath)) {
  for (const comp of componentesEspecificos) {
    const compFile = `${comp}.jsx`;
    const compPath = path.join(componentsPath, compFile);
    const compPathAlt = path.join(componentsPath, 'modelos', compFile);
    
    if (fs.existsSync(compPath)) {
      diagnostico.frontend.componentes.push({ nome: comp, arquivo: compFile, localizacao: 'components/' });
      console.log(`   ✅ ${comp}.jsx - ENCONTRADO`);
    } else if (fs.existsSync(compPathAlt)) {
      diagnostico.frontend.componentes.push({ nome: comp, arquivo: compFile, localizacao: 'components/modelos/' });
      console.log(`   ✅ ${comp}.jsx - ENCONTRADO (em modelos/)`);
    } else {
      diagnostico.frontend.componentes.push({ nome: comp, arquivo: compFile, localizacao: 'NÃO ENCONTRADO' });
      console.log(`   ❌ ${comp}.jsx - NÃO ENCONTRADO`);
      diagnostico.problemas.push(`Componente ${comp}.jsx não encontrado`);
    }
  }
}

// ==================== 8. VERIFICAR SERVIÇOS DO FRONTEND ====================
console.log('\n🔌 8. VERIFICANDO SERVIÇOS DO FRONTEND\n');

const servicesFrontPath = path.join(process.cwd(), 'frontend/src/services');
if (fs.existsSync(servicesFrontPath)) {
  const servicesFiles = fs.readdirSync(servicesFrontPath);
  
  for (const file of servicesFiles) {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(path.join(servicesFrontPath, file), 'utf8');
      
      // Verificar funções implementadas
      const temApi = content.includes('api.') || content.includes('axios');
      const temModelos = content.includes('modelos') || content.includes('Modelos');
      const temValidacao = content.includes('validate') || content.includes('Quality');
      
      diagnostico.frontend.servicos.push({
        arquivo: file,
        temApi: temApi,
        temModelos: temModelos,
        temValidacao: temValidacao
      });
      
      console.log(`   📡 ${file}: API=${temApi ? '✅' : '❌'} | Modelos=${temModelos ? '✅' : '❌'} | Validação=${temValidacao ? '✅' : '❌'}`);
    }
  }
}

// ==================== 9. VERIFICAR INTEGRAÇÃO COM R ====================
console.log('\n🔬 9. VERIFICANDO INTEGRAÇÃO COM R\n');

try {
  // Verificar se R está instalado
  const rVersion = execSync('R --version', { encoding: 'utf8' }).split('\n')[0];
  diagnostico.backend.r_integration = {
    installed: true,
    version: rVersion
  };
  console.log(`   ✅ R instalado: ${rVersion}`);
} catch (error) {
  diagnostico.backend.r_integration = {
    installed: false,
    error: error.message
  };
  console.log(`   ❌ R não encontrado no sistema`);
  diagnostico.problemas.push('R não está instalado no servidor');
}

// Verificar pacotes R necessários
const rPackages = ['forecast', 'tseries', 'prophet', 'xgboost', 'jsonlite'];
console.log('\n   📦 Verificando pacotes R:');

for (const pkg of rPackages) {
  try {
    const check = execSync(`Rscript -e "if(!require('${pkg}', quietly=TRUE)) quit(status=1)"`, { encoding: 'utf8' });
    console.log(`      ✅ ${pkg} - INSTALADO`);
    diagnostico.backend.r_packages = diagnostico.backend.r_packages || {};
    diagnostico.backend.r_packages[pkg] = true;
  } catch (error) {
    console.log(`      ❌ ${pkg} - NÃO INSTALADO`);
    diagnostico.backend.r_packages = diagnostico.backend.r_packages || {};
    diagnostico.backend.r_packages[pkg] = false;
    diagnostico.sugestoes.push(`Instalar pacote R: ${pkg}`);
  }
}

// ==================== 10. RESUMO E RECOMENDAÇÕES ====================
console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO DO DIAGNÓSTICO');
console.log('='.repeat(80) + '\n');

// Contar problemas
console.log(`🔴 PROBLEMAS DETECTADOS: ${diagnostico.problemas.length}`);
diagnostico.problemas.forEach((p, i) => {
  console.log(`   ${i + 1}. ${p}`);
});

console.log(`\n💡 SUGESTÕES DE MELHORIA: ${diagnostico.sugestoes.length}`);
diagnostico.sugestoes.forEach((s, i) => {
  console.log(`   ${i + 1}. ${s}`);
});

// Verificar o que está funcionando
console.log('\n✅ O QUE ESTÁ FUNCIONANDO:');

if (diagnostico.backend.controllers.existe) console.log('   • Backend controllers');
if (diagnostico.backend.routes.existe) console.log('   • Rotas da API');
if (diagnostico.backend.services.existe) console.log('   • Serviços backend');
if (diagnostico.frontend.components.existe) console.log('   • Componentes frontend');
if (diagnostico.frontend.services.existe) console.log('   • Serviços frontend');
if (diagnostico.backend.r_integration?.installed) console.log('   • Integração com R');

// Verificar o que está faltando
console.log('\n❌ O QUE PODE ESTAR FALTANDO:');

const modelosRExistentes = diagnostico.backend.modelos_r.filter(m => 
  m.modelos.ARIMA || m.modelos.ETS || m.modelos.Prophet || m.modelos.XGBoost
);

if (modelosRExistentes.length === 0) {
  console.log('   • Nenhum modelo R encontrado (ARIMA, ETS, Prophet, XGBoost)');
}

const temValidacaoBackend = diagnostico.backend.servicos.some(s => s.funcionalidades.validacao);
if (!temValidacaoBackend) {
  console.log('   • Serviço de validação de qualidade não encontrado');
}

const temPublicMetrics = diagnostico.frontend.componentes.some(c => c.nome === 'PublicMetrics');
if (!temPublicMetrics) {
  console.log('   • Componente PublicMetrics não encontrado');
}

const temResultadoSeries = diagnostico.frontend.componentes.some(c => c.nome === 'ResultadoSeriesTemporais');
if (!temResultadoSeries) {
  console.log('   • Componente ResultadoSeriesTemporais não encontrado');
}

// Salvar diagnóstico em arquivo
const diagnosticoPath = path.join(process.cwd(), 'diagnostico_completo.json');
fs.writeFileSync(diagnosticoPath, JSON.stringify(diagnostico, null, 2));
console.log(`\n📄 Diagnóstico salvo em: ${diagnosticoPath}`);

console.log('\n' + '='.repeat(80));
console.log('✅ DIAGNÓSTICO CONCLUÍDO');
console.log('='.repeat(80) + '\n');