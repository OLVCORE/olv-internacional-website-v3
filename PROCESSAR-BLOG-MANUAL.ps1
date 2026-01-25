# Script PowerShell para processar blog manualmente
# Execute este script no PowerShell

Write-Host "🚀 Iniciando processamento do blog..." -ForegroundColor Green
Write-Host ""

# URL do endpoint de processamento
$url = "https://www.olvinternacional.com.br/api/blog/process"

Write-Host "📡 Chamando endpoint: $url" -ForegroundColor Cyan
Write-Host ""

try {
    # Fazer requisição POST
    $response = Invoke-WebRequest -Uri $url -Method POST -UseBasicParsing
    
    Write-Host "✅ Resposta recebida!" -ForegroundColor Green
    Write-Host ""
    
    # Converter resposta JSON
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "📊 RESULTADO DO PROCESSAMENTO:" -ForegroundColor Yellow
    Write-Host "   ✅ Sucesso: $($result.success)" -ForegroundColor Green
    Write-Host "   📝 Artigos processados nesta execução: $($result.articles)" -ForegroundColor Cyan
    Write-Host "   📚 Total de posts no banco: $($result.totalPostsInDB)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($result.postsByCategory) {
        Write-Host "📊 Distribuição por categoria:" -ForegroundColor Yellow
        Write-Host "   - Todos: $($result.postsByCategory.all)" -ForegroundColor White
        Write-Host "   - Análises: $($result.postsByCategory.analises)" -ForegroundColor White
        Write-Host "   - Notícias: $($result.postsByCategory.noticias)" -ForegroundColor White
        Write-Host "   - Guias: $($result.postsByCategory.guias)" -ForegroundColor White
        Write-Host "   - Insights: $($result.postsByCategory.insights)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "✅ Processamento concluído!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ ERRO ao processar:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalhes:" -ForegroundColor Yellow
    Write-Host $_.Exception -ForegroundColor Red
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
