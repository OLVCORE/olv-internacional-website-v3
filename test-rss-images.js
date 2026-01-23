// Script para testar se as fontes RSS têm imagens
const axios = require('axios');

const RSS_FEEDS = [
    { url: 'https://www.valor.com.br/rss', name: 'Valor Econômico' },
    { url: 'https://exame.com/feed/', name: 'Exame' },
    { url: 'https://agenciabrasil.ebc.com.br/rss', name: 'Agência Brasil' },
    { url: 'https://www.reuters.com/rssFeed/worldNews', name: 'Reuters' },
    { url: 'https://www.bcb.gov.br/rss/noticias/moedaestabilidadefin.xml', name: 'Banco Central do Brasil' },
    { url: 'https://www.iccwbo.org/news-publications/news/rss/', name: 'Câmara de Comércio Internacional' },
    { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets' }
];

async function testRSSFeed(feedUrl, feedName) {
    try {
        console.log(`\n🔍 Testando: ${feedName}`);
        console.log(`   URL: ${feedUrl}`);
        
        const response = await axios.get(feedUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OLV-Blog/1.0)'
            }
        });
        
        const xmlText = response.data;
        const items = [];
        
        // Extrair itens do RSS
        const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
        let match;
        let count = 0;
        
        while ((match = itemRegex.exec(xmlText)) !== null && count < 5) {
            const itemXml = match[1];
            const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
            
            // Extrair imagem de várias fontes possíveis
            let imageUrl = null;
            let imageSource = null;
            
            // 1. Tentar <enclosure>
            const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\/([^"']+)["']/i);
            if (enclosureMatch) {
                imageUrl = enclosureMatch[1];
                imageSource = 'enclosure';
            }
            
            // 2. Tentar <media:content> ou <media:thumbnail>
            if (!imageUrl) {
                const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i);
                if (mediaMatch) {
                    imageUrl = mediaMatch[1];
                    imageSource = 'media:content/thumbnail';
                }
            }
            
            // 3. Tentar primeira <img> no description
            if (!imageUrl && descMatch) {
                const imgMatch = descMatch[1].match(/<img[^>]*src=["']([^"']+)["']/i);
                if (imgMatch) {
                    imageUrl = imgMatch[1];
                    imageSource = 'img tag in description';
                }
            }
            
            if (titleMatch) {
                items.push({
                    title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim().substring(0, 60),
                    hasImage: !!imageUrl,
                    imageSource: imageSource,
                    imageUrl: imageUrl ? imageUrl.substring(0, 80) : null
                });
                count++;
            }
        }
        
        const itemsWithImages = items.filter(i => i.hasImage).length;
        const percentage = items.length > 0 ? ((itemsWithImages / items.length) * 100).toFixed(1) : 0;
        
        console.log(`   ✅ Itens analisados: ${items.length}`);
        console.log(`   🖼️  Com imagens: ${itemsWithImages} (${percentage}%)`);
        
        if (itemsWithImages > 0) {
            console.log(`   📸 Fontes de imagem encontradas:`);
            items.filter(i => i.hasImage).forEach(item => {
                console.log(`      - ${item.imageSource}: ${item.imageUrl}...`);
            });
        } else {
            console.log(`   ⚠️  Nenhuma imagem encontrada nos primeiros ${items.length} itens`);
        }
        
        return {
            feedName,
            feedUrl,
            totalItems: items.length,
            itemsWithImages,
            percentage: parseFloat(percentage),
            items: items
        };
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return {
            feedName,
            feedUrl,
            error: error.message,
            totalItems: 0,
            itemsWithImages: 0,
            percentage: 0
        };
    }
}

async function testAllFeeds() {
    console.log('📊 TESTE DE IMAGENS NOS RSS FEEDS\n');
    console.log('='.repeat(60));
    
    const results = [];
    
    for (const feed of RSS_FEEDS) {
        const result = await testRSSFeed(feed.url, feed.name);
        results.push(result);
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📈 RESUMO GERAL:\n');
    
    const totalItems = results.reduce((sum, r) => sum + r.totalItems, 0);
    const totalWithImages = results.reduce((sum, r) => sum + r.itemsWithImages, 0);
    const overallPercentage = totalItems > 0 ? ((totalWithImages / totalItems) * 100).toFixed(1) : 0;
    
    console.log(`Total de itens analisados: ${totalItems}`);
    console.log(`Total com imagens: ${totalWithImages} (${overallPercentage}%)`);
    console.log(`\nPor fonte:`);
    
    results.forEach(r => {
        const status = r.error ? '❌ ERRO' : r.percentage > 50 ? '✅ BOM' : r.percentage > 0 ? '⚠️  BAIXO' : '❌ SEM IMAGENS';
        console.log(`  ${status} ${r.feedName}: ${r.percentage}% (${r.itemsWithImages}/${r.totalItems})`);
    });
    
    console.log('\n💡 RECOMENDAÇÕES:');
    
    if (overallPercentage < 30) {
        console.log('⚠️  A maioria das fontes não tem imagens nos RSS feeds.');
        console.log('📋 ALTERNATIVAS:');
        console.log('   1. Usar serviços de imagem por palavra-chave (Unsplash, Pexels)');
        console.log('   2. Gerar imagens baseadas na categoria do artigo');
        console.log('   3. Usar ícones temáticos mais elaborados');
        console.log('   4. Integrar com APIs de imagem (OpenGraph, Twitter Cards)');
        console.log('   5. Scraping da página original (com cuidado legal)');
    } else if (overallPercentage < 60) {
        console.log('⚠️  Algumas fontes têm imagens, mas não todas.');
        console.log('📋 SUGESTÕES:');
        console.log('   1. Priorizar fontes com imagens');
        console.log('   2. Usar fallback para fontes sem imagens');
        console.log('   3. Gerar imagens baseadas em palavras-chave');
    } else {
        console.log('✅ A maioria das fontes tem imagens!');
        console.log('📋 AÇÃO:');
        console.log('   1. Melhorar extração de imagens');
        console.log('   2. Validar URLs de imagem');
        console.log('   3. Adicionar fallback para imagens quebradas');
    }
}

// Executar teste
testAllFeeds().catch(console.error);
