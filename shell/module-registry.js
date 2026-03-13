(function () {
  'use strict';
  window.T4Shell = window.T4Shell || {};

  T4Shell.MODULE_DATA = {
    boajornada: {
      name: 'Boa Jornada',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-teal)',
      accentHex: '#008C7E',
      desc: 'Formulario digital de troca de turno. Preencha os dados da composicao, checklist da locomotiva e observacoes da viagem.',
      features: [
        { emoji: '\u{1F4CB}', text: 'Formulario completo de turno' },
        { emoji: '\u{1F682}', text: 'Checklist da locomotiva' },
        { emoji: '\u{1F4F8}', text: 'Anexar foto ou documento' },
        { emoji: '\u{1F4BE}', text: 'Salvar e consultar historico' }
      ],
      type: 'internal',
      path: 'modules/boa-jornada/'
    },
    art: {
      name: 'ART',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-gold)',
      accentHex: '#E5A100',
      desc: 'ART \u2014 Analise de Risco da Tarefa. Formulario obrigatorio de seguranca antes de executar qualquer atividade na EFVM.',
      features: [
        { emoji: '\u26A0\uFE0F', text: 'Avaliacao 360\u00B0 de seguranca' },
        { emoji: '\u{1F6E1}\uFE0F', text: 'Matriz de decisao de risco' },
        { emoji: '\u{1F4CB}', text: 'Registro de eventos indesejados' },
        { emoji: '\u{1F4F8}', text: 'Anexar foto ou documento' }
      ],
      type: 'internal',
      path: 'modules/art/'
    },
    timerJornada: {
      name: 'Timer Jornada',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-cyan)',
      accentHex: '#00B4D8',
      desc: 'Controle de jornada em tempo real. Timer com alertas autom\u00E1ticos em 10h, 11h e 11h30. Nunca mais perca o limite de 12h.',
      features: [
        { emoji: '\u23F1\uFE0F', text: 'Timer em tempo real' },
        { emoji: '\u{1F514}', text: 'Alertas em 10h, 11h, 11h30' },
        { emoji: '\u{1F4CA}', text: 'Hist\u00F3rico de jornadas' },
        { emoji: '\u{1F6E1}\uFE0F', text: 'Prote\u00E7\u00E3o contra excesso' }
      ],
      type: 'internal',
      path: 'modules/timer-jornada/'
    },
    logCco: {
      name: 'Log CCO',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-gold)',
      accentHex: '#E5A100',
      desc: 'Registro de comunica\u00E7\u00F5es com o Centro de Controle Operacional. Documente ordens, autoriza\u00E7\u00F5es e comunicados em tempo real.',
      features: [
        { emoji: '\u{1F4FB}', text: 'Registro de comunica\u00E7\u00F5es r\u00E1dio' },
        { emoji: '\u23F1\uFE0F', text: 'Timestamp autom\u00E1tico' },
        { emoji: '\u{1F4CB}', text: 'Categorias pr\u00E9-definidas' },
        { emoji: '\u{1F4E4}', text: 'Exportar log do turno' }
      ],
      type: 'internal',
      path: 'modules/log-cco/'
    },
    calculadora: {
      name: 'Calculadora',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-teal)',
      accentHex: '#008C7E',
      desc: 'Calculadora ferrovi\u00E1ria com f\u00F3rmulas do dia a dia. Peso por eixo, acr\u00E9scimo de 10psi, dist\u00E2ncia de frenagem e mais.',
      features: [
        { emoji: '\u{1F522}', text: 'Peso por eixo e tonelada/metro' },
        { emoji: '\u{1F4A8}', text: 'Acr\u00E9scimo de 10psi' },
        { emoji: '\u{1F6D1}', text: 'Dist\u00E2ncia de frenagem' },
        { emoji: '\u{1F4D0}', text: 'Convers\u00F5es ferrovi\u00E1rias' }
      ],
      type: 'internal',
      path: 'modules/calculadora/'
    },
    contatos: {
      name: 'Contatos',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-green)',
      accentHex: '#7AB800',
      desc: 'Contatos r\u00E1pidos da opera\u00E7\u00E3o. Um toque para ligar para CCO, l\u00EDder, manuten\u00E7\u00E3o, emerg\u00EAncia e colegas.',
      features: [
        { emoji: '\u{1F4DE}', text: 'Liga\u00E7\u00E3o em 1 toque' },
        { emoji: '\u{1F4FB}', text: 'CCO, l\u00EDderes, manuten\u00E7\u00E3o' },
        { emoji: '\u{1F6A8}', text: 'Emerg\u00EAncia r\u00E1pida' },
        { emoji: '\u{1F465}', text: 'Contatos personalizados' }
      ],
      type: 'internal',
      path: 'modules/contatos/'
    },
    simulador: {
      name: 'Simulador EFVM',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-cyan)',
      accentHex: '#00B4D8',
      desc: 'Simulador de conducao ferroviaria da EFVM. Treinamento completo com cenarios reais, fisica de frenagem e sistema de pontuacao.',
      features: [
        { emoji: '\u{1F3AE}', text: 'Simulacao realista da EFVM' },
        { emoji: '\u{1F682}', text: 'Cenarios de trem carregado e vazio' },
        { emoji: '\u{1F4CA}', text: 'Sistema de pontuacao' },
        { emoji: '\u{1F393}', text: 'Treinamento operacional' }
      ],
      type: 'external',
      url: 'https://simulador-efvm.vercel.app/'
    },
    'efvm360-ext': {
      name: 'EFVM 360',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-teal)',
      accentHex: '#008C7E',
      desc: 'Plataforma completa EFVM 360 com Academy, Exames, ROF, Comunicacao via Radio, Performance e Assistente AdamBoot.',
      features: [
        { emoji: '\u{1F393}', text: 'Railway Academy + Exames' },
        { emoji: '\u{1F4D6}', text: 'ROF completo' },
        { emoji: '\u{1F4FB}', text: 'Comunicacao via Radio' },
        { emoji: '\u{1F916}', text: 'Assistente AdamBoot' }
      ],
      type: 'external',
      url: 'https://efvm360.vercel.app/login/'
    },
    'rof-digital': {
      name: 'ROF Digital',
      status: 'building',
      statusLabel: 'Em construcao',
      accent: 'var(--accent-gold)',
      accentHex: '#E5A100',
      desc: 'Regulamento de Operacao Ferroviaria digitalizado com busca inteligente por IA.',
      features: [
        { emoji: '\u{1F50D}', text: 'Busca por linguagem natural' },
        { emoji: '\u{1F4D6}', text: 'ROF completo indexado' },
        { emoji: '\u{1F6E4}\uFE0F', text: 'Filtro por km e trecho' },
        { emoji: '\u26A1', text: 'Respostas instantaneas com IA' }
      ],
      type: 'internal',
      path: 'modules/rof-digital/'
    },
    ccq: {
      name: 'CCQ Qualidade',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--accent-gold)',
      accentHex: '#E5A100',
      desc: 'Modulo CCQ \u2014 Circulo de Controle de Qualidade com ferramentas PDCA, Ishikawa, 5W2H e gestao de projetos.',
      features: [
        { emoji: '\u{1F4CB}', text: 'Ciclo PDCA visual' },
        { emoji: '\u{1F50D}', text: 'Diagrama de Ishikawa' },
        { emoji: '\u{1F4DD}', text: 'Plano de Acao 5W2H' },
        { emoji: '\u{1F4CA}', text: 'Gestao de projetos CCQ' }
      ],
      type: 'external',
      url: 'https://adamboot-mco.vercel.app/'
    },
    adamboot: {
      name: 'AdamBoot IA',
      status: 'ready',
      statusLabel: 'Pronto',
      accent: 'var(--accent-green)',
      accentHex: '#7AB800',
      desc: 'Assistente de inteligencia artificial especializado em operacao ferroviaria.',
      features: [
        { emoji: '\u{1F4AC}', text: 'Chat com IA ferroviaria' },
        { emoji: '\u{1F399}\uFE0F', text: 'Controle por voz' },
        { emoji: '\u{1F4D6}', text: 'Base de conhecimento ROF' },
        { emoji: '\u{1F504}', text: 'Contexto operacional integrado' }
      ],
      type: 'internal',
      path: 'modules/adamboot/'
    },
    gdb: {
      name: 'GDB',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-cyan)',
      accentHex: '#00B4D8',
      desc: 'GDB \u2014 Sistema de Gestao de Dados. Acesso ao banco de dados operacional da ferrovia.',
      features: [
        { emoji: '\u{1F5C4}\uFE0F', text: 'Banco de dados operacional' },
        { emoji: '\u{1F50D}', text: 'Consulta de registros' },
        { emoji: '\u{1F4CA}', text: 'Relatorios e extracoes' },
        { emoji: '\u{1F512}', text: 'Acesso seguro corporativo' }
      ],
      type: 'external',
      url: '#'
    },
    edados: {
      name: 'eDados',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-green)',
      accentHex: '#7AB800',
      desc: 'eDados \u2014 Plataforma de dados e indicadores operacionais. Consulta de relatorios e metricas da EFVM.',
      features: [
        { emoji: '\u{1F4CA}', text: 'Indicadores operacionais' },
        { emoji: '\u{1F4C8}', text: 'Metricas de performance' },
        { emoji: '\u{1F4CB}', text: 'Relatorios gerenciais' },
        { emoji: '\u{1F3AF}', text: 'KPIs da EFVM' }
      ],
      type: 'external',
      url: 'https://gentemobileprd-globalvale.msappproxy.net/portalrh/Produtos/SAAA/Principal2.aspx'
    },
    equipfer: {
      name: 'Equipfer',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-gold)',
      accentHex: '#E5A100',
      desc: 'Equipfer \u2014 Sistema de gestao de equipamentos ferroviarios. Controle de locomotivas, vagoes e materiais rodantes.',
      features: [
        { emoji: '\u{1F527}', text: 'Gestao de locomotivas' },
        { emoji: '\u{1F683}', text: 'Controle de vagoes' },
        { emoji: '\u{1F4CB}', text: 'Ordens de manutencao' },
        { emoji: '\u{1F4CD}', text: 'Rastreamento de frota' }
      ],
      type: 'external',
      url: '#'
    },
    cco: {
      name: 'Painel CCO',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-teal)',
      accentHex: '#008C7E',
      desc: 'Painel CCO \u2014 Centro de Controle Operacional. Visao em tempo real da circulacao de trens na malha EFVM.',
      features: [
        { emoji: '\u{1F5A5}\uFE0F', text: 'Monitoramento em tempo real' },
        { emoji: '\u{1F682}', text: 'Circulacao de trens' },
        { emoji: '\u{1F5FA}\uFE0F', text: 'Mapa da malha EFVM' },
        { emoji: '\u{1F4E1}', text: 'Status dos trechos' }
      ],
      type: 'external',
      url: '#'
    },
    convocacao: {
      name: 'Convocacao',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-cyan)',
      accentHex: '#00B4D8',
      desc: 'Convocacao \u2014 Sistema de convocacao e escala de equipagem. Gestao de chamadas e confirmacoes de turno.',
      features: [
        { emoji: '\u{1F4DE}', text: 'Convocacao de maquinistas' },
        { emoji: '\u{1F4C5}', text: 'Escala de turnos' },
        { emoji: '\u2705', text: 'Confirmacao de presenca' },
        { emoji: '\u{1F514}', text: 'Alertas de convocacao' }
      ],
      type: 'external',
      url: '#'
    },
    iris: {
      name: 'IRIS',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-green)',
      accentHex: '#7AB800',
      desc: 'IRIS \u2014 Sistema de registro e investigacao de incidentes e ocorrencias ferroviarias.',
      features: [
        { emoji: '\u{1F441}\uFE0F', text: 'Registro de ocorrencias' },
        { emoji: '\u{1F50D}', text: 'Investigacao de incidentes' },
        { emoji: '\u{1F4DD}', text: 'Relatorios de seguranca' },
        { emoji: '\u{1F4CA}', text: 'Estatisticas de acidentes' }
      ],
      type: 'external',
      url: 'https://iris.valeglobal.net/login'
    },
    central: {
      name: 'Central de Informacoes',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-gold)',
      accentHex: '#E5A100',
      desc: 'Central de Informacoes \u2014 Portal de comunicados, normas, procedimentos e avisos operacionais da EFVM.',
      features: [
        { emoji: '\u2139\uFE0F', text: 'Comunicados operacionais' },
        { emoji: '\u{1F4DC}', text: 'Normas e procedimentos' },
        { emoji: '\u{1F4E2}', text: 'Avisos importantes' },
        { emoji: '\u{1F4DA}', text: 'Base de conhecimento' }
      ],
      type: 'external',
      url: '#'
    },
    ves: {
      name: 'VES',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-teal)',
      accentHex: '#008C7E',
      desc: 'VES \u2014 Verificacao de Equipamento de Seguranca. Sistema de checklist e inspecao dos equipamentos de seguranca da locomotiva e composicao.',
      features: [
        { emoji: '\u2705', text: 'Checklist de equipamentos' },
        { emoji: '\u{1F682}', text: 'Inspecao de locomotiva' },
        { emoji: '\u{1F512}', text: 'Verificacao de seguranca' },
        { emoji: '\u{1F4CB}', text: 'Registro de conformidade' }
      ],
      type: 'external',
      url: 'https://performancemanager4.successfactors.com/sf/start?_s.crb=iORNSJUhFN65jL8S11RUC%252fHCdSDDApYx5mbb%252b9ijQL4%253d'
    },
    prontidao: {
      name: 'Prontidao',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-cyan)',
      accentHex: '#00B4D8',
      desc: 'Prontidao \u2014 Sistema de controle de prontidao da equipagem. Registro de disponibilidade, aptidao e confirmacao para o turno.',
      features: [
        { emoji: '\u23F1\uFE0F', text: 'Controle de prontidao' },
        { emoji: '\u{1F464}', text: 'Aptidao da equipagem' },
        { emoji: '\u2705', text: 'Confirmacao de turno' },
        { emoji: '\u{1F4CA}', text: 'Historico de disponibilidade' }
      ],
      type: 'external',
      url: 'https://sistemaprontos.com.br/auth/realms/vale/protocol/openid-connect/auth?client_id=teste-web&redirect_uri=https%3A%2F%2Fvale.sistemaprontos.com.br%2F&state=afd52c43-a5b6-4ac0-8217-d6f66c483b56&response_mode=fragment&response_type=code&scope=openid&nonce=65958f8d-23dd-47a7-a2e8-5d30d4360838'
    },
    avisos: {
      name: 'Avisos Operacionais',
      status: 'ready',
      statusLabel: 'Operacional',
      accent: 'var(--status-danger)',
      accentHex: '#dc3545',
      desc: 'Sistema de avisos em tempo real. Maquinistas reportam condicoes de trechos, patios e via para lideres e colegas.',
      features: [
        { emoji: '\u26A0\uFE0F', text: 'Reportar condicoes da via' },
        { emoji: '\u{1F4CD}', text: 'Avisos por km e trecho' },
        { emoji: '\u{1F3ED}', text: 'Informacoes de patios' },
        { emoji: '\u{1F465}', text: 'Comunicacao com lideranca' }
      ],
      type: 'internal',
      path: 'modules/avisos/'
    },
    epi: {
      name: 'Solicitar EPI',
      status: 'ready',
      statusLabel: 'Disponivel',
      accent: 'var(--accent-green)',
      accentHex: '#7AB800',
      desc: 'Formulario de solicitacao de Equipamentos de Protecao Individual. Solicite EPIs diretamente pelo portal Vale.',
      features: [
        { emoji: '\u{1F9BA}', text: 'Solicitacao de EPIs' },
        { emoji: '\u{1F9E4}', text: 'Capacete, luva, oculos, bota' },
        { emoji: '\u{1F4CB}', text: 'Formulario Vale oficial' },
        { emoji: '\u2705', text: 'Aprovacao automatica' }
      ],
      type: 'external',
      url: 'https://vale-forms.valeglobal.net/public?id=Ylabiry79tA%2fjLRjIfA55w%3d%3d&lang=pt-BR&need_auth=false'
    }
  };

  T4Shell.SEARCH_INDEX = [
    { term: 'Boa Jornada', cat: 'modulo', module: 'boajornada' },
    { term: 'Troca de turno', cat: 'modulo', module: 'boajornada' },
    { term: 'Checklist locomotiva', cat: 'modulo', module: 'boajornada' },
    { term: 'ART', cat: 'modulo', module: 'art' },
    { term: 'ART', cat: 'modulo', module: 'art' },
    { term: 'Analise de Risco', cat: 'modulo', module: 'art' },
    { term: 'Timer Jornada', cat: 'modulo', module: 'timerJornada' },
    { term: 'Jornada 12h', cat: 'modulo', module: 'timerJornada' },
    { term: 'Controle de jornada', cat: 'modulo', module: 'timerJornada' },
    { term: 'Log CCO', cat: 'modulo', module: 'logCco' },
    { term: 'Comunicacao CCO', cat: 'modulo', module: 'logCco' },
    { term: 'Registro radio', cat: 'modulo', module: 'logCco' },
    { term: 'Calculadora', cat: 'modulo', module: 'calculadora' },
    { term: 'Peso por eixo', cat: 'modulo', module: 'calculadora' },
    { term: 'Distancia frenagem', cat: 'modulo', module: 'calculadora' },
    { term: 'Contatos', cat: 'modulo', module: 'contatos' },
    { term: 'Telefone emergencia', cat: 'modulo', module: 'contatos' },
    { term: 'CCO telefone', cat: 'modulo', module: 'contatos' },
    { term: 'Simulador EFVM', cat: 'modulo', module: 'simulador' },
    { term: 'Simulador', cat: 'modulo', module: 'simulador' },
    { term: 'EFVM 360', cat: 'modulo', module: 'efvm360-ext' },
    { term: 'ROF Digital', cat: 'modulo', module: 'rof-digital' },
    { term: 'Regulamento', cat: 'modulo', module: 'rof-digital' },
    { term: 'CCQ', cat: 'modulo', module: 'ccq' },
    { term: 'Qualidade', cat: 'modulo', module: 'ccq' },
    { term: 'AdamBoot', cat: 'modulo', module: 'adamboot' },
    { term: 'Assistente IA', cat: 'modulo', module: 'adamboot' },
    { term: 'Academy', cat: 'modulo', module: 'efvm360-ext' },
    { term: 'Velocidade maxima', cat: 'glossario' },
    { term: 'Sinalizacao ferroviaria', cat: 'glossario' },
    { term: 'BOLL', cat: 'glossario' },
    { term: 'Comunicacao radio', cat: 'glossario' },
    { term: 'Passagem de nivel', cat: 'glossario' },
    { term: 'Procedimento de emergencia', cat: 'glossario' },
    { term: 'Manobra', cat: 'glossario' },
    { term: 'Cruzamento', cat: 'glossario' },
    { term: 'Licenca de via', cat: 'glossario' },
    { term: 'EPI', cat: 'glossario' },
    { term: 'Freio de emergencia', cat: 'glossario' },
    { term: 'Artigo 47', cat: 'rof' },
    { term: 'Artigo 52', cat: 'rof' },
    { term: 'Artigo 18', cat: 'rof' },
    { term: 'Artigo 33', cat: 'rof' },
    { term: 'Procedimento BOLL', cat: 'rof' },
    { term: 'Limite de velocidade', cat: 'rof' },
    { term: 'Configuracoes', cat: 'nav', navTo: 'config' },
    { term: 'Alertas', cat: 'nav', navTo: 'alertas' },
    { term: 'Emerg\u00EAncia', cat: 'modulo', module: 'contatos' },
    { term: 'Ligar CCO', cat: 'modulo', module: 'contatos' },
    { term: 'Intrajornada', cat: 'modulo', module: 'timerJornada' },
    { term: 'Acr\u00E9scimo 10psi', cat: 'modulo', module: 'calculadora' },
    { term: 'Gradiente compensado', cat: 'modulo', module: 'calculadora' },
    { term: 'Exportar log', cat: 'modulo', module: 'logCco' },
    { term: 'Registro r\u00E1dio CCO', cat: 'modulo', module: 'logCco' },
    { term: 'Avisos operacionais', cat: 'modulo', module: 'avisos' }
  ];

  // Classification metadata
  T4Shell.MODULE_CATEGORIES = {
    LAUNCHER: 'launcher',      // External link/hub
    CONTENT: 'content',        // Local cacheable content
    NATIVE_LOCAL: 'native',    // Native feature, no backend needed
    NATIVE_SYNC: 'sync',       // Native feature, future backend
    CORE: 'core'               // Core shell functionality
  };

  // Add category to each module
  // Launchers: simulador, efvm360-ext, ccq, gdb, edados, ves, epi, cco, iris, prontidao, convocacao, equipfer, central
  // Content: rof-digital, adamboot
  // Native Local: calculadora, contatos (when no backend)
  // Native Sync: boajornada, art, timerJornada, logCco, avisos, contatos, timerJornada
  // Core: (busca, alertas, config are shell features, not modules)
})();
