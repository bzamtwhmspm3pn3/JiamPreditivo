# corrigir-tudo.ps1
Write-Host "🚀 INICIANDO CORREÇÃO COMPLETA DO JIAM PREDITIVO" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ============================================================
# 1. CRIAR PROXY NO BACKEND
# ============================================================
Write-Host "`n📦 1. Criando proxy no backend..." -ForegroundColor Yellow

$proxyContent = @'
// backend/routes/proxy.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Mapeamento das APIs externas
const API_ENDPOINTS = {
  bna: 'https://www.bna.ao/api',
  ine: 'https://www.ine.gov.ao/api',
  imf: 'https://www.imf.org/external/datamapper/api/v1',
  tradingeco: 'https://api.tradingeconomics.com'
};

// Rota genérica de proxy
router.get('/:source/:path(*)', async (req, res) => {
  const { source, path } = req.params;
  const baseUrl = API_ENDPOINTS[source];

  if (!baseUrl) {
    return res.status(400).json({ error: 'Fonte de dados não suportada' });
  }

  try {
    const fullUrl = `${baseUrl}/${path}`;
    console.log(`🔀 Proxy: ${req.originalUrl} -> ${fullUrl}`);

    const response = await axios.get(fullUrl, {
      params: req.query,
      timeout: 10000
    });

    res.json(response.data);
  } catch (error) {
    console.error(`❌ Erro no proxy para ${source}:`, error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erro ao buscar dados da fonte externa',
      details: error.message
    });
  }
});

module.exports = router;
'@

# Criar diretório routes se não existir
if (!(Test-Path "backend\routes")) {
    New-Item -ItemType Directory -Path "backend\routes" -Force
}

# Salvar arquivo proxy.js
$proxyContent | Set-Content -Path "backend\routes\proxy.js" -Encoding UTF8
Write-Host "   ✅ Proxy criado: backend/routes/proxy.js" -ForegroundColor Green

# ============================================================
# 2. ATUALIZAR SERVER.JS PARA INCLUIR PROXY
# ============================================================
Write-Host "`n📦 2. Atualizando server.js para incluir proxy..." -ForegroundColor Yellow

$serverPath = "backend\server.js"
if (Test-Path $serverPath) {
    $serverContent = Get-Content $serverPath -Raw
    
    # Verificar se já tem a linha do proxy
    if ($serverContent -notmatch "require\('\.\/routes\/proxy'\)") {
        # Adicionar importação após as outras importações
        $serverContent = $serverContent -replace "(const [^;]+;\s*)+", "`$&`nconst proxyRoutes = require('./routes/proxy');`n"
        
        # Adicionar uso do proxy antes das outras rotas
        $serverContent = $serverContent -replace "(app\.use\([^;]+\);\s*)+", "`$&`napp.use('/api/proxy', proxyRoutes);`n"
        
        $serverContent | Set-Content -Path $serverPath -Encoding UTF8
        Write-Host "   ✅ server.js atualizado com proxy" -ForegroundColor Green
    } else {
        Write-Host "   ⏩ proxy já existe em server.js" -ForegroundColor Yellow
    }
}

# ============================================================
# 3. CORRIGIR URL DUPLICADA EM DADOS.JSX
# ============================================================
Write-Host "`n📦 3. Corrigindo URL duplicada em Dados.jsx..." -ForegroundColor Yellow

$dadosPath = "frontend\src\components\Dashboard\Dados.jsx"
if (Test-Path $dadosPath) {
    $dadosContent = Get-Content $dadosPath -Raw
    
    # Corrigir URL duplicada
    $dadosContent = $dadosContent -replace '\${API_URL}/api/api/r/processamento/upload', '${API_URL}/r/processamento/upload'
    
    $dadosContent | Set-Content -Path $dadosPath -Encoding UTF8
    Write-Host "   ✅ Dados.jsx corrigido" -ForegroundColor Green
}

# ============================================================
# 4. CORRIGIR PUBLICMETRICS.JSX PARA USAR PROXY
# ============================================================
Write-Host "`n📦 4. Corrigindo PublicMetrics.jsx para usar proxy..." -ForegroundColor Yellow

$metricsPath = "frontend\src\components\PublicMetrics.jsx"
if (Test-Path $metricsPath) {
    $metricsContent = Get-Content $metricsPath -Raw
    
    # Substituir chamadas diretas por proxy
    $metricsContent = $metricsContent -replace "fetch\(['`"]https://www\.bna\.ao/api/([^'`"]+)['`"]\)", 'fetch(`${API_URL}/proxy/bna/$1`)'
    $metricsContent = $metricsContent -replace "fetch\(['`"]https://www\.ine\.gov\.ao/api/([^'`"]+)['`"]\)", 'fetch(`${API_URL}/proxy/ine/$1`)'
    $metricsContent = $metricsContent -replace "fetch\(['`"]https://www\.imf\.org/external/datamapper/api/v1/([^'`"]+)['`"]\)", 'fetch(`${API_URL}/proxy/imf/$1`)'
    $metricsContent = $metricsContent -replace "fetch\(['`"]https://api\.tradingeconomics\.com/([^'`"]+)(\?[^'`"]*)?['`"]\)", 'fetch(`${API_URL}/proxy/tradingeco/$1$2`)'
    
    $metricsContent | Set-Content -Path $metricsPath -Encoding UTF8
    Write-Host "   ✅ PublicMetrics.jsx corrigido" -ForegroundColor Green
}

# ============================================================
# 5. CORRIGIR FOOTERJIAM.JSX
# ============================================================
Write-Host "`n📦 5. Corrigindo FooterJIAM.jsx..." -ForegroundColor Yellow

$footerPath = "frontend\src\components\FooterJIAM.jsx"
if (Test-Path $footerPath) {
    $footerContent = Get-Content $footerPath -Raw
    
    # Corrigir URL das avaliações
    $footerContent = $footerContent -replace 'fetch\(`\${API_URL}/api/avaliacoes`\)', 'fetch(`${API_URL}/avaliacoes`)'
    $footerContent = $footerContent -replace 'fetch\(`\${API_URL}/api/avaliacoes`,', 'fetch(`${API_URL}/avaliacoes`,'
    
    $footerContent | Set-Content -Path $footerPath -Encoding UTF8
    Write-Host "   ✅ FooterJIAM.jsx corrigido" -ForegroundColor Green
}

# ============================================================
# 6. ADICIONAR FAVICON
# ============================================================
Write-Host "`n📦 6. Adicionando favicon..." -ForegroundColor Yellow

# Criar um favicon simples (ícone base64)
$faviconContent = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#3b82f6"/>
  <text x="50" y="70" font-size="70" text-anchor="middle" fill="white" font-family="Arial">J</text>
</svg>
'@

# Salvar como SVG (o navegador aceita)
$faviconPath = "frontend\public\favicon.svg"
$faviconContent | Set-Content -Path $faviconPath -Encoding UTF8
Write-Host "   ✅ Favicon criado: $faviconPath" -ForegroundColor Green

# Atualizar index.html
$indexPath = "frontend\public\index.html"
if (Test-Path $indexPath) {
    $indexContent = Get-Content $indexPath -Raw
    
    if ($indexContent -notmatch 'favicon\.svg') {
        $indexContent = $indexContent -replace '(?=</head>)', '  <link rel="icon" href="%PUBLIC_URL%/favicon.svg" />`n  '
        $indexContent | Set-Content -Path $indexPath -Encoding UTF8
        Write-Host "   ✅ index.html atualizado com favicon" -ForegroundColor Green
    }
}

# ============================================================
# 7. INSTALL AXIOS NO BACKEND (SE NECESSÁRIO)
# ============================================================
Write-Host "`n📦 7. Verificando axios no backend..." -ForegroundColor Yellow

if (Test-Path "backend\package.json") {
    Set-Location backend
    $hasAxios = npm list axios --depth=0 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️ Axios não encontrado. Instalando..." -ForegroundColor Yellow
        npm install axios --save
        Write-Host "   ✅ Axios instalado" -ForegroundColor Green
    } else {
        Write-Host "   ✅ Axios já instalado" -ForegroundColor Green
    }
    Set-Location ..
}

# ============================================================
# 8. PREPARAR COMMIT
# ============================================================
Write-Host "`n📦 8. Preparando commit..." -ForegroundColor Yellow

git add backend/routes/proxy.js
git add backend/server.js
git add frontend/src/components/Dashboard/Dados.jsx
git add frontend/src/components/PublicMetrics.jsx
git add frontend/src/components/FooterJIAM.jsx
git add frontend/public/favicon.svg
git add frontend/public/index.html

Write-Host "   ✅ Arquivos adicionados ao git" -ForegroundColor Green

# ============================================================
# 9. MOSTRAR INSTRUÇÕES FINAIS
# ============================================================
Write-Host "`n" -ForegroundColor Cyan
Write-Host "🎉 CORREÇÕES CONCLUÍDAS!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Revise as alterações: git status" -ForegroundColor White
Write-Host "2. Faça o commit: git commit -m 'Fix: correções completas (proxy, CORS, URLs)'" -ForegroundColor White
Write-Host "3. Envie para o GitHub: git push" -ForegroundColor White
Write-Host "4. No Render: faça um novo deploy com 'Clear build cache & deploy'" -ForegroundColor White
Write-Host "5. No Netlify: faça um novo deploy" -ForegroundColor White
Write-Host "`n✅ Tudo pronto! O sistema deve funcionar perfeitamente agora!" -ForegroundColor Green