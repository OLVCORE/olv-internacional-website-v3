// Servidor HTTP simples para desenvolvimento local
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Tentar carregar dotenv se disponível
try {
    require('dotenv').config();
} catch (e) {
    // dotenv não instalado, continuar sem ele
}

// Tentar carregar nodemailer se disponível
let nodemailer = null;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    // nodemailer não instalado
}

const PORT = 3000;

// Email configuration
// Configure estas variáveis de ambiente ou crie um arquivo .env
let emailTransporter = null;

if (nodemailer) {
    const EMAIL_CONFIG = {
        host: process.env.SMTP_HOST || 'mail.olvinternacional.com.br',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true, // true para 465 (SSL/TLS), false para outras portas
        auth: {
            user: process.env.SMTP_USER || 'consultores@olvinternacional.com.br',
            pass: process.env.SMTP_PASS || ''
        },
        tls: {
            // Não rejeitar certificados não autorizados (ajuste conforme necessário)
            rejectUnauthorized: false
        }
    };
    
    // Criar transporter de email (será inicializado se configurado)
    try {
        // Verificar se as credenciais estão configuradas
        const hasCredentials = EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass && EMAIL_CONFIG.auth.pass !== '';
        
        if (hasCredentials) {
            emailTransporter = nodemailer.createTransport(EMAIL_CONFIG);
            console.log('✅ Email transporter configurado');
            console.log('   Host:', EMAIL_CONFIG.host);
            console.log('   Port:', EMAIL_CONFIG.port);
            console.log('   User:', EMAIL_CONFIG.auth.user);
            console.log('   Secure:', EMAIL_CONFIG.secure);
            
            // Testar conexão SMTP
            emailTransporter.verify(function(error, success) {
                if (error) {
                    console.log('⚠️  Erro ao verificar conexão SMTP:', error.message);
                    console.log('   Verifique as credenciais no arquivo .env');
                } else {
                    console.log('✅ Conexão SMTP verificada com sucesso');
                }
            });
        } else {
            console.log('⚠️  Email não configurado - usando apenas salvamento em arquivo');
            console.log('   Configure SMTP_USER e SMTP_PASS no arquivo .env');
            console.log('   Veja email-config.md para instruções');
            console.log('   SMTP_USER atual:', EMAIL_CONFIG.auth.user || 'não definido');
            console.log('   SMTP_PASS definido:', EMAIL_CONFIG.auth.pass ? 'sim' : 'não');
        }
    } catch (err) {
        console.log('⚠️  Erro ao configurar email:', err.message);
        console.log('   Detalhes:', err);
    }
} else {
    console.log('⚠️  nodemailer não disponível - usando apenas salvamento em arquivo');
    console.log('   Execute: npm install nodemailer dotenv');
}

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
    // CORS headers para todas as requisições
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    try {
        // Handle API endpoints
        if (req.method === 'POST' && req.url === '/api/contact') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    
                    // Log the contact form
                    console.log('\n📧 FORMULÁRIO DE CONTATO RECEBIDO:');
                    console.log('================================');
                    console.log(`Nome: ${data.nome}`);
                    console.log(`Email: ${data.email}`);
                    console.log(`Telefone: ${data.telefone}`);
                    console.log(`Empresa: ${data.empresa || 'N/A'}`);
                    console.log(`Cargo: ${data.cargo || 'N/A'}`);
                    console.log(`Interesse: ${data.interesse || 'N/A'}`);
                    console.log(`Mensagem: ${data.mensagem || 'N/A'}`);
                    console.log('================================\n');
                    
                    // Prepare email content
                    const emailSubject = `Novo Contato - ${data.empresa || data.nome}`;
                    const emailHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
                                .content { background: #f9f9f9; padding: 20px; }
                                .highlight { background: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc; }
                                .field { margin: 10px 0; }
                                .field-label { font-weight: bold; color: #0066cc; }
                                .message-box { background: #fff; padding: 15px; border-radius: 5px; margin-top: 10px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>📧 Novo Contato - OLV Internacional</h1>
                                </div>
                                <div class="content">
                                    <div class="highlight">
                                        <h2>Dados do Contato</h2>
                                        <div class="field">
                                            <span class="field-label">Nome:</span> ${data.nome}
                                        </div>
                                        <div class="field">
                                            <span class="field-label">Email:</span> <a href="mailto:${data.email}">${data.email}</a>
                                        </div>
                                        <div class="field">
                                            <span class="field-label">Telefone:</span> <a href="tel:${data.telefone}">${data.telefone}</a>
                                        </div>
                                        ${data.empresa ? `<div class="field"><span class="field-label">Empresa:</span> ${data.empresa}</div>` : ''}
                                        ${data.cargo ? `<div class="field"><span class="field-label">Cargo:</span> ${data.cargo}</div>` : ''}
                                        ${data.interesse ? `<div class="field"><span class="field-label">Área de Interesse:</span> ${data.interesse}</div>` : ''}
                                    </div>
                                    
                                    ${data.mensagem ? `
                                    <div class="highlight">
                                        <h2>Mensagem</h2>
                                        <div class="message-box">
                                            ${data.mensagem.replace(/\n/g, '<br>')}
                                        </div>
                                    </div>
                                    ` : ''}
                                    
                                    <div class="highlight">
                                        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                                        <p style="margin-top: 15px;">
                                            <a href="mailto:${data.email}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                                Responder ao Cliente
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    `;
                    
                    const emailText = `
NOVO CONTATO - OLV INTERNACIONAL

Nome: ${data.nome}
Email: ${data.email}
Telefone: ${data.telefone}
${data.empresa ? `Empresa: ${data.empresa}` : ''}
${data.cargo ? `Cargo: ${data.cargo}` : ''}
${data.interesse ? `Área de Interesse: ${data.interesse}` : ''}

${data.mensagem ? `Mensagem:\n${data.mensagem}` : ''}

Data: ${new Date().toLocaleString('pt-BR')}
                    `;
                    
                    // Send email if configured
                    if (emailTransporter && nodemailer) {
                        const emailUser = process.env.SMTP_USER || 'consultores@olvinternacional.com.br';
                        const receiveEmail = process.env.RECEIVE_EMAIL || 'consultores@olvinternacional.com.br';
                        const mailOptions = {
                            from: `"OLV Internacional - Formulário de Contato" <${emailUser}>`,
                            to: receiveEmail,
                            replyTo: data.email,
                            subject: `📧 Novo Contato - ${data.nome} (${data.empresa})`,
                            text: emailText,
                            html: emailHtml,
                            priority: 'high',
                            headers: {
                                'X-Priority': '1',
                                'X-MSMail-Priority': 'High',
                                'Importance': 'high',
                                'X-Mailer': 'OLV Internacional - Sistema de Contato'
                            },
                            envelope: {
                                from: emailUser,
                                to: receiveEmail
                            }
                        };
                        
                        console.log('\n📧 Tentando enviar email de contato...');
                        console.log('   De:', emailUser);
                        console.log('   Para:', receiveEmail);
                        console.log('   Cliente:', data.nome, `(${data.empresa})`);
                        
                        emailTransporter.sendMail(mailOptions)
                            .then(info => {
                                console.log('✅ Email de contato enviado:', info.messageId);
                                console.log('📧 Para:', receiveEmail);
                                console.log('📧 De:', data.email);
                                console.log('📧 Assunto:', mailOptions.subject);
                                console.log('📧 Resposta do servidor:', info.response || 'N/A');
                                
                                // Resposta de sucesso APÓS email enviado
                                res.writeHead(200, { 
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                });
                                res.end(JSON.stringify({ 
                                    success: true, 
                                    message: 'Mensagem recebida com sucesso. Entraremos em contato em breve.',
                                    emailSent: true
                                }), 'utf-8');
                            })
                            .catch(error => {
                                console.error('\n❌ ERRO AO ENVIAR EMAIL DE CONTATO:');
                                console.error('   Mensagem:', error.message);
                                console.error('   Código:', error.code);
                                console.error('   Comando:', error.command || 'N/A');
                                console.error('   Resposta:', error.response || 'N/A');
                                console.error('   Detalhes completos:', error);
                                
                                // Mesmo com erro no email, retornar sucesso (dados foram recebidos)
                                res.writeHead(200, { 
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                });
                                res.end(JSON.stringify({ 
                                    success: true, 
                                    message: 'Mensagem recebida. Entraremos em contato em breve.',
                                    emailSent: false,
                                    warning: 'Email pode não ter sido enviado. Verifique logs do servidor.'
                                }), 'utf-8');
                            });
                    } else {
                        // Email transporter não configurado
                        console.log('⚠️ Email transporter não configurado - dados salvos apenas em log');
                        res.writeHead(200, { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: 'Mensagem recebida. Entraremos em contato em breve.',
                            emailSent: false,
                            warning: 'Sistema de email não configurado'
                        }), 'utf-8');
                    }
                } catch (err) {
                    console.error('Error processing contact form:', err);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid data' }), 'utf-8');
                }
            });
            return;
        }
        
        if (req.method === 'POST' && req.url === '/api/checklist-report') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    
                    // Log the report
                    console.log('\n📊 RELATÓRIO DE ADERÊNCIA RECEBIDO:');
                    console.log('================================');
                    console.log(`Cliente: ${data.nome}`);
                    console.log(`Empresa: ${data.empresa}`);
                    console.log(`Email: ${data.email}`);
                    console.log(`Telefone: ${data.telefone}`);
                    console.log(`Aderência: ${data.adherence}%`);
                    console.log(`Itens selecionados: ${data.selectedItems.length}`);
                    console.log('================================\n');
                    
                    // Save to file (in production, send email)
                    const reportData = {
                        timestamp: new Date().toISOString(),
                        ...data
                    };
                    
                    const reportsDir = path.join(__dirname, 'reports');
                    if (!fs.existsSync(reportsDir)) {
                        fs.mkdirSync(reportsDir);
                    }
                    
                    const filename = `report-${Date.now()}.json`;
                    fs.writeFileSync(
                        path.join(reportsDir, filename),
                        JSON.stringify(reportData, null, 2),
                        'utf-8'
                    );
                    
                    // Prepare email content
                    const emailSubject = `Relatório de Aderência OLV - ${data.empresa}`;
                    const emailHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
                                .content { background: #f9f9f9; padding: 20px; }
                                .highlight { background: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc; }
                                .adherence-score { font-size: 48px; font-weight: bold; color: #0066cc; text-align: center; }
                                .items-list { list-style: none; padding: 0; }
                                .items-list li { padding: 8px; margin: 5px 0; background: #fff; border-radius: 4px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>📊 Relatório de Aderência OLV</h1>
                                </div>
                                <div class="content">
                                    <div class="highlight">
                                        <h2>Dados do Cliente</h2>
                                        <p><strong>Nome:</strong> ${data.nome}</p>
                                        <p><strong>Empresa:</strong> ${data.empresa}</p>
                                        <p><strong>Email:</strong> ${data.email}</p>
                                        <p><strong>Telefone:</strong> ${data.telefone}</p>
                                    </div>
                                    
                                    <div class="highlight">
                                        <h2>Nível de Aderência</h2>
                                        <div class="adherence-score">${data.adherence}%</div>
                                        <p style="text-align: center; margin-top: 10px;">
                                            ${data.adherence < 30 ? 'Aderência Baixa' : 
                                              data.adherence < 60 ? 'Aderência Média' :
                                              data.adherence < 80 ? 'Aderência Alta' :
                                              'Aderência Muito Alta'}
                                        </p>
                                    </div>
                                    
                                    <div class="highlight">
                                        <h2>Itens Identificados (${data.selectedItems.length})</h2>
                                        <ul class="items-list">
                                            ${data.selectedItems.map((item, index) => 
                                                `<li>${index + 1}. ${item.label} <strong>(Peso: ${item.weight})</strong></li>`
                                            ).join('')}
                                        </ul>
                                    </div>
                                    
                                    <div class="highlight">
                                        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                                        <p><strong>Análise:</strong> ${data.adherence < 30 ? 
                                            'Cliente com algumas dificuldades que podemos ajudar a resolver.' :
                                            data.adherence < 60 ? 
                                            'Cliente com várias dificuldades - a OLV pode fazer a diferença.' :
                                            data.adherence < 80 ?
                                            'Cliente precisa de ajuda urgente - alto potencial de conversão.' :
                                            'Cliente precisa de ajuda estratégica imediata - prioridade máxima.'}</p>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    `;
                    
                    const emailText = `
RELATÓRIO DE ADERÊNCIA - OLV INTERNACIONAL

Cliente: ${data.nome}
Empresa: ${data.empresa}
Email: ${data.email}
Telefone: ${data.telefone}

NÍVEL DE ADERÊNCIA: ${data.adherence}%

ITENS IDENTIFICADOS:
${data.selectedItems.map((item, index) => `${index + 1}. ${item.label} (Peso: ${item.weight})`).join('\n')}

ANÁLISE:
${data.adherence < 30 ? 'Aderência Baixa - Cliente com algumas dificuldades' : 
  data.adherence < 60 ? 'Aderência Média - Cliente com várias dificuldades' :
  data.adherence < 80 ? 'Aderência Alta - Cliente precisa de ajuda urgente' :
  'Aderência Muito Alta - Cliente precisa de ajuda estratégica imediata'}

Data: ${new Date().toLocaleString('pt-BR')}
                    `;
                    
                // Send email if configured (NOTIFICAÇÃO IMEDIATA)
                if (emailTransporter && nodemailer) {
                    const emailUser = process.env.SMTP_USER || 'consultores@olvinternacional.com.br';
                    const receiveEmail = process.env.RECEIVE_EMAIL || 'consultores@olvinternacional.com.br';
                    const mailOptions = {
                        from: `"OLV Internacional - Sistema" <${emailUser}>`,
                        to: receiveEmail, // Email que receberá os relatórios
                        replyTo: data.email, // Email do cliente para resposta direta
                        subject: `🚨 URGENTE: Relatório de Aderência - ${data.empresa} (${data.adherence})`, // Marca como urgente
                        text: emailText,
                        html: emailHtml,
                        priority: 'high', // Prioridade alta para notificação imediata
                        headers: {
                            'X-Priority': '1',
                            'X-MSMail-Priority': 'High',
                            'Importance': 'high',
                            'List-Unsubscribe': `<mailto:${emailUser}?subject=Unsubscribe>`,
                            'X-Mailer': 'OLV Internacional - Sistema de Relatórios'
                        },
                        // Adicionar informações adicionais para evitar spam
                        envelope: {
                            from: emailUser,
                            to: receiveEmail
                        }
                    };
                        
                    emailTransporter.sendMail(mailOptions)
                        .then(info => {
                            console.log('✅ Email enviado IMEDIATAMENTE:', info.messageId);
                            console.log('📧 Para:', receiveEmail);
                            console.log('📧 Cliente pronto para contato:', data.email, data.telefone);
                            console.log('📊 Aderência:', data.adherence);
                        })
                        .catch(error => {
                            console.error('❌ Erro ao enviar email:', error.message);
                            console.error('❌ Detalhes do erro:', error);
                            // Tentar enviar novamente após 2 segundos
                            setTimeout(() => {
                                emailTransporter.sendMail(mailOptions)
                                    .then(info => {
                                        console.log('✅ Email reenviado com sucesso:', info.messageId);
                                    })
                                    .catch(retryError => {
                                        console.error('❌ Erro no reenvio:', retryError.message);
                                    });
                            }, 2000);
                        });
                } else {
                    console.log('⚠️ Email transporter não configurado - relatório salvo apenas em arquivo');
                } else {
                    // Log para notificação mesmo sem email configurado
                    console.log('\n🚨 NOVO LEAD - Entre em contato IMEDIATAMENTE:');
                    console.log(`   Nome: ${data.nome}`);
                    console.log(`   Empresa: ${data.empresa}`);
                    console.log(`   Email: ${data.email}`);
                    console.log(`   Telefone: ${data.telefone}`);
                    console.log(`   Aderência: ${data.adherence}%\n`);
                }
                    
                    res.writeHead(200, { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Relatório recebido com sucesso',
                        filename: filename,
                        emailSent: emailTransporter ? true : false
                    }), 'utf-8');
                } catch (err) {
                    console.error('Error processing report:', err);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid data' }), 'utf-8');
                }
            });
            return;
        }
        
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
    } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('500 - Erro interno do servidor', 'utf-8');
    }
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
    if (emailTransporter) {
        console.log('📧 Email configurado e pronto para envio');
    } else {
        console.log('📧 Email não configurado - veja email-config.md para instruções');
    }
    console.log('\n💡 Pressione Ctrl+C para parar o servidor\n');
});
