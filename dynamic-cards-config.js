// Configuração dos cards dinâmicos baseados nos checkboxes
const dynamicCardsConfig = {
    'check1': {
        icon: 'fa-dollar-sign',
        iconColor: '#ef4444',
        title: 'Custos Ocultos e Transparência',
        description: 'A OLV estrutura todo o processo de importação e exportação com transparência total. Antes de qualquer decisão, você recebe uma análise completa de todos os custos: taxas portuárias, armazenagem, impostos, desembaraço, seguro, câmbio. Nada fica oculto. Nossa metodologia prevê e comunica todos os custos desde o início, permitindo que você tome decisões com margem real, não estimada.',
        borderColor: '#ef4444'
    },
    'check2': {
        icon: 'fa-shield-alt',
        iconColor: '#6366f1',
        title: 'Governança e Auditoria',
        description: 'A OLV entrega governança completa. Você tem acesso a todas as memórias de cálculo, pode auditar cada número, entende cada classificação NCM, cada regime aduaneiro aplicado. Não dependemos de "caixas pretas". Toda informação é compartilhada, documentada e auditável. Isso aumenta seu poder de negociação, reduz riscos financeiros e cria transparência total no processo.',
        borderColor: '#6366f1'
    },
    'check3': {
        icon: 'fa-calculator',
        iconColor: '#f59e0b',
        title: 'TCO e Previsibilidade',
        description: 'A OLV calcula o TCO (Total Cost of Ownership) completo antes de qualquer operação. Você sabe exatamente quanto vai custar antes de decidir. Nossa metodologia inclui todos os custos: produto, frete, seguro, impostos, taxas, armazenagem, desembaraço, câmbio. Com previsibilidade total, você pode fazer planejamento financeiro real, calcular margens precisas e tomar decisões estratégicas com segurança.',
        borderColor: '#f59e0b'
    },
    'check4': {
        icon: 'fa-chart-line',
        iconColor: '#10b981',
        title: 'Proteção de Margem',
        description: 'A OLV protege sua margem desde o planejamento. Nossa metodologia identifica todos os custos antes da decisão, permitindo que você calcule margens reais, não estimadas. Com governança e transparência, você evita surpresas que comprometem viabilidade. Margens calculadas são margens reais. Isso permite crescimento sustentável e viabilidade do negócio.',
        borderColor: '#10b981'
    },
    'check5': {
        icon: 'fa-handshake',
        iconColor: '#8b5cf6',
        title: 'Negociação Estratégica',
        description: 'A OLV estrutura negociações com conhecimento técnico e volume consolidado. Conhecemos os mercados, temos histórico de transações, entendemos especificações, padrões e certificações. Com esse lastro, você negocia com poder, não no improviso. Volume consolidado aumenta poder de negociação. Conhecimento técnico garante condições favoráveis. Você paga preços de mercado e aceita condições proporcionais.',
        borderColor: '#8b5cf6'
    },
    'check6': {
        icon: 'fa-shield-virus',
        iconColor: '#ec4899',
        title: 'Gestão de Risco e Crédito',
        description: 'A OLV estrutura política de crédito e avaliação de risco para todas as operações. Antes de qualquer venda ou compra, fazemos due diligence completa: verificamos histórico financeiro, capacidade de pagamento, referências bancárias, estrutura jurídica. Com garantias proporcionais e avaliação de risco, você reduz inadimplência e transforma volume em receita real, não prejuízo.',
        borderColor: '#ec4899'
    },
    'check7': {
        icon: 'fa-fire-extinguisher',
        iconColor: '#f97316',
        title: 'Processos Estruturados e Preventivos',
        description: 'A OLV estrutura processos preventivos, não reativos. Com governança e processos documentados, você previne problemas antes que apareçam. Checklists, workflows e padronização garantem que nada seja esquecido. Você não "apaga incêndios" - você previne que eles aconteçam. Cada operação segue processos estruturados que reduzem riscos e aumentam eficiência.',
        borderColor: '#f97316'
    },
    'check8': {
        icon: 'fa-eye',
        iconColor: '#06b6d4',
        title: 'Visibilidade Total da Cadeia',
        description: 'A OLV entrega visibilidade completa de toda a cadeia de suprimentos. Você sabe onde está cada produto em tempo real: saiu do fornecedor, está no porto, em trânsito, chegou, está na alfândega, foi liberado. Com rastreamento completo e controle de todos os elos da cadeia, você aumenta capacidade de resposta, reduz riscos e gerencia expectativas de forma proativa.',
        borderColor: '#06b6d4'
    },
    'check9': {
        icon: 'fa-file-invoice-dollar',
        iconColor: '#14b8a6',
        title: 'Otimização Fiscal e Regimes Aduaneiros',
        description: 'A OLV identifica e aplica todos os regimes aduaneiros que podem reduzir seus custos: Drawback, Ex-tarifário, REPES, REPEX, acordos comerciais (Mercosul, UE). Nossa expertise garante que você aproveite todos os benefícios fiscais disponíveis. Economias significativas que aumentam margem e competitividade. Você paga apenas o que deve, não mais do que deveria.',
        borderColor: '#14b8a6'
    },
    'check10': {
        icon: 'fa-users',
        iconColor: '#a855f7',
        title: 'Seleção Estratégica de Parceiros',
        description: 'A OLV estrutura processo de seleção de parceiros com due diligence completa. Verificamos histórico financeiro, capacidade operacional, referências, estrutura jurídica. Com avaliação de risco e garantias proporcionais, você reduz inadimplência, atrasos, problemas de qualidade e questões legais. Parceiros confiáveis garantem operações seguras e resultados previsíveis.',
        borderColor: '#a855f7'
    },
    'check11': {
        icon: 'fa-file-contract',
        iconColor: '#3b82f6',
        title: 'Estruturação de Contratos Internacionais',
        description: 'A OLV estrutura contratos internacionais adequados com Incoterms bem definidos, responsabilidades claramente atribuídas, garantias proporcionais e cláusulas de força maior bem redigidas. Contratos que protegem seus interesses, não criam surpresas. Com estruturação adequada, você reduz riscos, evita custos inesperados e garante que responsabilidades sejam atribuídas corretamente.',
        borderColor: '#3b82f6'
    },
    'check12': {
        icon: 'fa-globe-americas',
        iconColor: '#0ea5e9',
        title: 'Identificação de Oportunidades em Novos Mercados',
        description: 'A OLV identifica oportunidades em novos mercados usando dados reais: demanda, concorrência, preços, barreiras comerciais. Com análise de mercado e identificação de parceiros além dos conhecidos, você explora mercados emergentes (Ásia, África, América Latina) onde há menos concorrência e maior margem. Oportunidades de crescimento que você não encontraria sozinho.',
        borderColor: '#0ea5e9'
    }
};
