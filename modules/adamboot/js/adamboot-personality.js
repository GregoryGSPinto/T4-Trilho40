/* ============================================
   ADAMBOOT — Personalidade do Bot
   Define tom, formatação e templates de resposta
   ============================================ */

const AdamBootPersonality = (function () {
  let prompts = null;

  /* Carrega os prompts do JSON */
  async function loadPrompts() {
    if (prompts) return prompts;
    try {
      const response = await fetch('./data/adamboot-prompts.json');
      prompts = await response.json();
      return prompts;
    } catch (err) {
      if (T4.log) { T4.log.error('[AdamBoot Personality] Erro ao carregar prompts:', err); }
      prompts = getFallbackPrompts();
      return prompts;
    }
  }

  /* Prompts de fallback caso o JSON não carregue */
  function getFallbackPrompts() {
    return {
      greetings: {
        morning: ['Bom dia, maquinista! AdamBoot à disposição.'],
        afternoon: ['Boa tarde, maquinista! Como posso ajudar?'],
        night: ['Boa noite, maquinista! Estou aqui para ajudar.']
      },
      responseTemplates: {
        safety: '{answer}\n\nEm caso de dúvida sobre segurança, consulte sempre seu supervisor ou o CCO.',
        rof: '{answer}\n\nConsulte o ROF completo para mais detalhes.',
        procedure: '{answer}',
        glossary: '**{term}**: {definition}\n\n{related}',
        unknown: 'Não tenho essa informação na minha base de conhecimento. Consulte seu supervisor ou o CCO.',
        greeting: '{greeting}'
      }
    };
  }

  /* Determina o período do dia */
  function getTimePeriod() {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    return 'night';
  }

  /* Retorna uma saudação aleatória conforme o período */
  async function getGreeting(userName) {
    const p = await loadPrompts();
    const period = getTimePeriod();
    const greetings = p.greetings[period];
    let greeting = greetings[Math.floor(Math.random() * greetings.length)];
    if (userName) {
      greeting = greeting.replace('maquinista', userName);
    }
    return greeting;
  }

  /* Formata a resposta de acordo com a categoria */
  async function formatResponse(answer, category, extra) {
    const p = await loadPrompts();
    const template = p.responseTemplates[category] || '{answer}';

    let formatted = template
      .replace('{answer}', answer || '')
      .replace('{term}', (extra && extra.term) || '')
      .replace('{definition}', (extra && extra.definition) || '')
      .replace('{greeting}', (extra && extra.greeting) || '')
      .replace('{related}', (extra && extra.related) || '');

    return formatted;
  }

  /* Converte marcação simples em HTML */
  function markdownToHTML(text) {
    if (!text) return '';

    let html = T4.utils.escapeHTML(text);

    /* Negrito: **texto** */
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    /* Itálico: *texto* */
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    /* Código inline: `texto` */
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    /* Listas ordenadas: linhas começando com número. */
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, function (match) {
      return '<ol>' + match + '</ol>';
    });

    /* Listas não ordenadas: linhas começando com • ou - */
    html = html.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, function (match) {
      if (match.includes('<ol>')) return match;
      return '<ul>' + match + '</ul>';
    });

    /* Parágrafos: linhas separadas por linha vazia */
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html + '</p>';

    /* Limpa parágrafos vazios e listas dentro de parágrafos */
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<[ou]l>)/g, '$1');
    html = html.replace(/(<\/[ou]l>)<\/p>/g, '$1');

    /* Quebras de linha simples */
    html = html.replace(/\n/g, '<br>');

    /* Limpa <br> extras dentro de listas */
    html = html.replace(/<\/li><br>/g, '</li>');
    html = html.replace(/<br><li>/g, '<li>');

    return html;
  }

  /* Adiciona um toque de personalidade à resposta */
  function addPersonalityTouch(text, category) {
    const touches = {
      seguranca: [
        '\n\nSegurança sempre em primeiro lugar, maquinista!',
        '\n\nOpere com segurança, colega!',
        '\n\nLembre-se: DSS não é só conversa, é atitude!'
      ],
      operacao: [
        '\n\nQualquer dúvida, estou aqui!',
        '\n\nBoa viagem, maquinista!',
        ''
      ],
      procedimento: [
        '\n\nSiga o procedimento e opere com segurança!',
        '',
        ''
      ]
    };

    const categoryTouches = touches[category];
    if (categoryTouches) {
      const touch = categoryTouches[Math.floor(Math.random() * categoryTouches.length)];
      return text + touch;
    }
    return text;
  }

  /* Gera sugestões relacionadas baseadas na categoria */
  function getRelatedSuggestions(category, currentQuestion) {
    const suggestions = {
      seguranca: [
        'Quais são os EPIs obrigatórios?',
        'O que é DSS?',
        'Procedimento de emergência para descarrilamento',
        'O que fazer com sinal vermelho?'
      ],
      operacao: [
        'Qual a VMA para trem carregado?',
        'Como funciona o freio dinâmico?',
        'Qual o procedimento de cruzamento?',
        'O que é licenciamento?'
      ],
      procedimento: [
        'Teste de freio antes da viagem',
        'Procedimento de acoplamento',
        'Como proceder em falha de rádio?',
        'Qual a escala de serviço?'
      ],
      rof: [
        'Explica o artigo 47 do ROF',
        'O que é BOLL?',
        'O que é licenciamento?',
        'Como funciona a sinalização?'
      ],
      glossario: [
        'O que é AMV?',
        'O que é CCO?',
        'O que é VMA?',
        'O que é CTC?'
      ]
    };

    const pool = suggestions[category] || suggestions.operacao;
    return pool
      .filter(s => s.toLowerCase() !== (currentQuestion || '').toLowerCase())
      .slice(0, 3);
  }

  return {
    loadPrompts,
    getGreeting,
    getTimePeriod,
    formatResponse,
    markdownToHTML,
    addPersonalityTouch,
    getRelatedSuggestions
  };
})();
