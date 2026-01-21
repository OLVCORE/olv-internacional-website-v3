// Servidor HTTP simples para desenvolvimento local
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for root
    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }
    
    // Build file path
    let filePath = path.join(__dirname, pathname);
    
    // Normalize path
    filePath = path.normalize(filePath);
    
    // Security: ensure file is within current directory
    const rootPath = path.normalize(path.join(__dirname, '.'));
    if (!filePath.startsWith(rootPath)) {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('403 - Acesso negado', 'utf-8');
        return;
    }
    
    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                console.log(`404: ${pathname}`);
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - Página não encontrada</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #0066cc; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - Página não encontrada</h1>
                        <p>A página que você está procurando não existe.</p>
                        <p>Arquivo: ${pathname}</p>
                        <a href="/">Voltar para a página inicial</a>
                    </body>
                    </html>
                `, 'utf-8');
            } else {
                // Server error
                console.error(`500 Error: ${error.code} - ${pathname}`);
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Erro do Servidor</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #cc0000; }
                            pre { text-align: left; background: #f5f5f5; padding: 20px; border-radius: 5px; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - Erro do Servidor</h1>
                        <p>Erro: ${error.code}</p>
                        <p>Arquivo: ${pathname}</p>
                        <pre>${error.stack || error.message}</pre>
                        <a href="/">Voltar para a página inicial</a>
                    </body>
                    </html>
                `, 'utf-8');
            }
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Erro: Porta ${PORT} já está em uso!`);
        console.error('   Feche outros servidores ou altere a porta no server.js\n');
    } else {
        console.error('Erro do servidor:', error);
    }
    process.exit(1);
});

server.listen(PORT, () => {
    console.log('\n🚀 Servidor local iniciado!');
    console.log(`📡 Acesse: http://localhost:${PORT}`);
    console.log(`📡 Ou: http://127.0.0.1:${PORT}`);
    console.log(`📂 Diretório: ${__dirname}`);
    console.log('\n💡 Pressione Ctrl+C para parar o servidor\n');
});
