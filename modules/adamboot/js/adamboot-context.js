/* ============================================
   ADAMBOOT — Contexto Operacional
   Adapta respostas ao pátio, turno e trem atual
   ============================================ */

const AdamBootContext = (function () {

  /* Lê o contexto atual do T4 */
  function getContext() {
    const ctx = T4.context.get();
    return {
      patio: ctx.patio || null,
      turno: ctx.turno || T4.context.getCurrentTurno(),
      trem: ctx.trem || null,
      maquinista: ctx.maquinista || null
    };
  }

  /* Retorna o nome do maquinista logado */
  function getUserName() {
    const user = T4.auth.getUser();
    if (user && user.nome) {
      return user.nome.split(' ')[0];
    }
    const ctx = getContext();
    return ctx.maquinista ? ctx.maquinista.split(' ')[0] : null;
  }

  /* Retorna saudação baseada no horário */
  function getTimeGreeting() {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 'Bom dia';
    if (h >= 12 && h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  /* Retorna o turno atual como texto descritivo */
  function getTurnoDescricao() {
    const turno = getContext().turno;
    const descricoes = {
      'A': 'Turno A (manhã, 06h-14h)',
      'B': 'Turno B (tarde, 14h-22h)',
      'C': 'Turno C (noite, 22h-06h)'
    };
    return descricoes[turno] || 'Turno não definido';
  }

  /* Monta um texto de contexto para enriquecer as respostas */
  function getContextSummary() {
    const ctx = getContext();
    const parts = [];

    if (ctx.patio) {
      parts.push('Pátio: **' + ctx.patio + '**');
    }
    if (ctx.turno) {
      parts.push(getTurnoDescricao());
    }
    if (ctx.trem) {
      parts.push('Trem: **' + ctx.trem + '**');
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  }

  /* Adapta a resposta com informações contextuais quando relevante */
  function enrichResponse(answer, category) {
    const ctx = getContext();

    /* Para questões de operação, adiciona contexto do pátio se disponível */
    if (category === 'operacao' && ctx.patio) {
      const patioInfo = getPatioInfo(ctx.patio);
      if (patioInfo) {
        answer += '\n\n*Informação do seu pátio (' + ctx.patio + '): ' + patioInfo + '*';
      }
    }

    /* Para questões de turno/jornada, menciona o turno atual */
    if (category === 'procedimento' && ctx.turno) {
      const turnoAtual = getTurnoDescricao();
      if (answer.toLowerCase().includes('turno') || answer.toLowerCase().includes('escala')) {
        answer += '\n\n*Você está no ' + turnoAtual + '.*';
      }
    }

    return answer;
  }

  /* Informações básicas dos pátios principais */
  function getPatioInfo(sigla) {
    const patios = {
      'TUB': 'Terminal de Tubarão — terminal portuário de embarque de minério em Vitória/ES.',
      'VOD': 'Pátio de Volta da Ostra — pátio intermediário na região de Colatina/ES.',
      'ITA': 'Pátio de Itabira — pátio de carregamento de minério na região de Itabira/MG.',
      'GOV': 'Pátio de Governador Valadares — pátio intermediário com oficina de manutenção.',
      'FBR': 'Pátio de Fabriciano — pátio de referência na região do Vale do Aço.',
      'COR': 'Pátio de Coronel Fabriciano — pátio operacional no Vale do Aço.',
      'VCS': 'Pátio de Vitória Centro-Sul — pátio na região metropolitana de Vitória.',
      'VFZ': 'Pátio de Valadares-Fazenda — pátio auxiliar na região de Gov. Valadares.',
      'CDV': 'Pátio de Costa Duarte — pátio intermediário na via principal.',
      'MGA': 'Pátio de Mangaratiba — pátio operacional na região sul.',
      'SBR': 'Pátio de Sabará — pátio na região metropolitana de BH.'
    };
    return patios[sigla] || null;
  }

  /* Verifica se a pergunta é sobre contexto operacional */
  function isContextQuestion(question) {
    const contextKeywords = [
      'meu pátio', 'meu trem', 'meu turno', 'minha escala',
      'onde estou', 'qual pátio', 'qual trem', 'qual turno',
      'meu prefixo', 'minha jornada'
    ];
    const lower = question.toLowerCase();
    return contextKeywords.some(k => lower.includes(k));
  }

  /* Responde perguntas sobre o contexto atual do usuário */
  function answerContextQuestion(question) {
    const ctx = getContext();
    const lower = question.toLowerCase();

    if (lower.includes('pátio') || lower.includes('onde estou')) {
      if (ctx.patio) {
        const info = getPatioInfo(ctx.patio);
        return {
          answer: 'Você está registrado no pátio **' + ctx.patio + '**.' + (info ? '\n\n' + info : ''),
          category: 'operacao'
        };
      }
      return {
        answer: 'Seu pátio de operação não está configurado no sistema. Verifique com seu supervisor ou atualize nas configurações do T4.',
        category: 'operacao'
      };
    }

    if (lower.includes('trem') || lower.includes('prefixo')) {
      if (ctx.trem) {
        return {
          answer: 'Seu trem atual é o **' + ctx.trem + '**. Verifique o BOLL para restrições do trecho.',
          category: 'operacao'
        };
      }
      return {
        answer: 'Nenhum trem está vinculado à sua sessão atual. Registre o prefixo no sistema quando assumir a composição.',
        category: 'operacao'
      };
    }

    if (lower.includes('turno') || lower.includes('escala') || lower.includes('jornada')) {
      return {
        answer: 'Você está no **' + getTurnoDescricao() + '**.\n\nLembre-se: a jornada máxima é de 8 horas, podendo ser estendida para até 10 horas em situações excepcionais. O interjornada mínimo é de 11 horas.',
        category: 'procedimento'
      };
    }

    return null;
  }

  return {
    getContext,
    getUserName,
    getTimeGreeting,
    getTurnoDescricao,
    getContextSummary,
    enrichResponse,
    getPatioInfo,
    isContextQuestion,
    answerContextQuestion
  };
})();
