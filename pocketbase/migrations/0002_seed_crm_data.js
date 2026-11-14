// Seed: leads de exemplo em vários estágios (com histórico de estágio),
// biblioteca de hábitos por categoria, hábitos prescritos em planos ativos
// de 6/8/12/24 semanas e templates de mensagem por etapa do funil.
// Idempotente: aplica uma vez e não reaplica em cópias do projeto.
migrate(
  (app) => {
    const leads = app.findCollectionByNameOrId('leads')
    if (app.countRecords('leads') > 0) return

    const day = 24 * 60 * 60 * 1000
    const now = Date.now()
    const iso = (d) =>
      new Date(d).toISOString().replace('T', ' ').replace('Z', '+00:00')

    const S = (v) => iso(v)
    const STAGES = {
      frio: 'lead_frio',
      morno: 'lead_morno',
      quente: 'lead_quente',
      agendado: 'agendado',
      confirmado: 'confirmado',
      realizada: 'consulta_realizada',
      oferecido: 'plano_oferecido',
      ativo: 'plano_ativo',
    }
    const SOURCES = { ig: 'Instagram', g: 'Google', i: 'Indicação', o: 'Outro' }

    // [name, phone, email, queixa, source, stage, stage_changed_at(+d), marketing_cost, created(+d ago)]
    const leadRows = [
      [
        'Ana Beatriz Costa',
        '5511987654321',
        'ana.costa@email.com',
        'Dor lombar crônica há 3 anos, piorando ao sentar',
        SOURCES.ig,
        STAGES.frio,
        0,
        0,
        1,
      ],
      [
        'Rafael Monteiro',
        '5511976543210',
        'rafael.monteiro@email.com',
        'Dor no joelho direito ao correr',
        SOURCES.g,
        STAGES.frio,
        0,
        0,
        2,
      ],
      [
        'Juliana Pacheco',
        '5511965432109',
        'juliana.p@email.com',
        'Insônia e dores de cabeça tensionais',
        SOURCES.i,
        STAGES.frio,
        0,
        0,
        4,
      ],
      [
        'Marcos Vinícius Alves',
        '5511954321098',
        'marcos.alves@email.com',
        'Dor no ombro esquerdo, radiando para o braço',
        SOURCES.g,
        STAGES.morno,
        1,
        0,
        5,
      ],
      [
        'Patrícia Nogueira',
        '5511943210987',
        'patricia.n@email.com',
        'Artrose no quadril, quer evitar cirurgia',
        SOURCES.ig,
        STAGES.morno,
        1,
        0,
        7,
      ],
      [
        'Carlos Eduardo Lima',
        '5511932109876',
        'carlos.lima@email.com',
        'Hérnia de disco lombar L4-L5',
        SOURCES.i,
        STAGES.quente,
        2,
        0,
        9,
      ],
      [
        'Fernanda Ribeiro',
        '5511921098765',
        'fernanda.r@email.com',
        'Fibromialgia, dores difusas no corpo',
        SOURCES.ig,
        STAGES.quente,
        2,
        0,
        11,
      ],
      [
        'Lucas Andrade',
        '5511910987654',
        'lucas.andrade@email.com',
        'Tendinite no punho, trabalha digitando',
        SOURCES.g,
        STAGES.agendado,
        3,
        0,
        14,
      ],
      [
        'Camila Duarte',
        '5511909876543',
        'camila.duarte@email.com',
        'Dor cervical por postura de trabalho',
        SOURCES.ig,
        STAGES.agendado,
        4,
        0,
        16,
      ],
      [
        'Bruno Ferreira',
        '5511898765432',
        'bruno.f@email.com',
        'Dor no joelho pós-trauma esportivo',
        SOURCES.g,
        STAGES.confirmado,
        6,
        0,
        20,
      ],
      [
        'Renata Sampaio',
        '5511887654321',
        'renata.s@email.com',
        'Dores nas mãos, suspeita de artrite',
        SOURCES.i,
        STAGES.realizada,
        10,
        0,
        26,
      ],
      [
        'Eduardo Tavares',
        '5511876543210',
        'eduardo.t@email.com',
        'Dor crônica nas costas, sedentário',
        SOURCES.g,
        STAGES.oferecido,
        12,
        0,
        30,
      ],
      [
        'Sofia Barbosa',
        '5511865432109',
        'sofia.b@email.com',
        'Dor no quadril direito, dificuldade para caminhar',
        SOURCES.ig,
        STAGES.oferecido,
        12,
        0,
        32,
      ],
      [
        'Tiago Almeida',
        '5511854321098',
        'tiago.a@email.com',
        'Dor lombar e desalinhamento postural',
        SOURCES.i,
        STAGES.ativo,
        20,
        0,
        40,
      ],
      [
        'Marina Fonseca',
        '5511843210987',
        'marina.f@email.com',
        'Dor no tornozelo, retomar corrida',
        SOURCES.g,
        STAGES.ativo,
        25,
        0,
        45,
      ],
    ]

    const leadIds = {}
    for (const [
      name,
      phone,
      email,
      complaint,
      source,
      stage,
      stageDays,
      cost,
      createdDays,
    ] of leadRows) {
      const r = new Record(leads)
      r.set('name', name)
      r.set('phone', phone)
      r.set('email', email)
      r.set('main_complaint', complaint)
      r.set('source', source)
      r.set('stage', stage)
      r.set('stage_changed_at', S(now - stageDays * day))
      r.set('marketing_cost', cost)
      // custo de marketing por origem (soma entra no custo por agendado)
      app.save(r)
      leadIds[name] = r.id
      // registro inicial de histórico: entrada no estágio frio
      const h = new Record(app.findCollectionByNameOrId('stage_history'))
      h.set('lead', r.id)
      h.set('from_stage', '')
      h.set('to_stage', STAGES.frio)
      app.save(h)
      // histórico de progressão: simula passagem por etapas intermediárias
      if (stage !== STAGES.frio) {
        const path = [
          STAGES.frio,
          STAGES.morno,
          STAGES.quente,
          STAGES.agendado,
          STAGES.confirmado,
          STAGES.realizada,
          STAGES.oferecido,
          STAGES.ativo,
        ]
        const targetIdx = path.indexOf(stage)
        for (let i = 1; i <= targetIdx; i++) {
          const hh = new Record(app.findCollectionByNameOrId('stage_history'))
          hh.set('lead', r.id)
          hh.set('from_stage', path[i - 1])
          hh.set('to_stage', path[i])
          app.save(hh)
        }
      }
    }

    // ---------- custo de marketing por origem (para custo por paciente agendado) ----------
    // Instagram: R$ 2200  Google: R$ 1800  Indicação: R$ 0  Outro: R$ 300
    // Alocado por lead existente dessa origem (simplificação: divide igualmente).
    const costPerSource = {
      Instagram: 2200,
      Google: 1800,
      Indicação: 0,
      Outro: 300,
    }
    for (const [source, total] of Object.entries(costPerSource)) {
      const count = leadRows.filter((l) => l[4] === source).length
      if (!count) continue
      const per = Math.round((total / count) * 100) / 100
      for (const row of leadRows.filter((l) => l[4] === source)) {
        const r = app.findRecordById('leads', leadIds[row[0]])
        r.set('marketing_cost', per)
        app.save(r)
      }
    }

    // ---------- biblioteca de hábitos ----------
    const habitRows = [
      [
        'Higiene do sono: rotina noturna',
        'Desligar telas 60 min antes de dormir, quarto escuro e silencioso, horário fixo para deitar e acordar. Objetivo: melhorar a qualidade do sono e a recuperação noturna.',
        'Sono',
      ],
      [
        'Café da manhã proteico',
        'Incluir 25–30g de proteína no café da manhã para estabilizar energia e reduzir picos glicêmicos ao longo do dia.',
        'Alimentação',
      ],
      [
        'Caminhada diária de 30 minutos',
        'Caminhada leve a moderada, preferencialmente ao ar livre, para mobilidade articular e saúde cardiovascular.',
        'Movimento',
      ],
      [
        'Respiração diafragmática 4-7-8',
        'Três ciclos de respiração profunda, duas vezes ao dia, para modular o sistema nervoso autônomo e reduzir a percepção de dor.',
        'Gestão de Estresse',
      ],
      [
        'Exposição à luz solar matinal',
        '10 a 15 minutos de luz natural nas primeiras horas do dia para regular o ritmo circadiano e o humor.',
        'Sono',
      ],
      [
        'Alongamento de cadeia posterior',
        'Sequência de alongamentos de panturrilha, posterior de coxa e lombar, 10 minutos, uma vez ao dia.',
        'Movimento',
      ],
      [
        'Redução de ultraprocessados',
        'Trocar dois itens ultraprocessados do dia por comida de verdade: fruta, castanhas, iogurte natural ou ovo.',
        'Alimentação',
      ],
      [
        'Diário de gratidão e estresse',
        'Anotar à noite três pontos positivos do dia e o principal estressor, com nota de intensidade de 0 a 10.',
        'Gestão de Estresse',
      ],
      [
        'Pausas ativas a cada 50 minutos',
        'Levantar, caminhar 2 minutos e alongar a coluna a cada hora de trabalho sentado.',
        'Movimento',
      ],
      [
        'Hidratação pautada',
        'Meta de 35 ml de água por kg de peso, distribuída ao longo do dia; garrafa marcada como lembrete visual.',
        'Alimentação',
      ],
      [
        'Pilates ou fortalecimento 2x/semana',
        'Sessões de fortalecimento de core e glúteos para estabilizar a coluna e articulações.',
        'Movimento',
      ],
      [
        'Meditação guiada de 10 minutos',
        'Meditação de atenção plena pela manhã, com áudio guiado, para reduzir cortisol e tensão muscular.',
        'Gestão de Estresse',
      ],
    ]
    const habitIds = {}
    for (const [title, description, category] of habitRows) {
      const r = new Record(app.findCollectionByNameOrId('habit_library'))
      r.set('title', title)
      r.set('description', description)
      r.set('category', category)
      app.save(r)
      habitIds[title] = r.id
    }

    // ---------- hábitos prescritos em planos ativos ----------
    const prescriptions = [
      // Tiago Almeida — plano de 12 semanas ativo
      ['Tiago Almeida', 'Higiene do sono: rotina noturna', '12', 40],
      ['Tiago Almeida', 'Café da manhã proteico', '12', 40],
      ['Tiago Almeida', 'Caminhada diária de 30 minutos', '12', 40],
      ['Tiago Almeida', 'Respiração diafragmática 4-7-8', '12', 40],
      // Marina Fonseca — plano de 6 semanas ativo
      ['Marina Fonseca', 'Exposição à luz solar matinal', '6', 45],
      ['Marina Fonseca', 'Alongamento de cadeia posterior', '6', 45],
      ['Marina Fonseca', 'Hidratação pautada', '6', 45],
      // Ana Beatriz Costa — plano de 24 semanas ativo (exemplo extra)
      ['Renata Sampaio', 'Pausas ativas a cada 50 minutos', '8', 26],
      ['Renata Sampaio', 'Diário de gratidão e estresse', '8', 26],
      ['Renata Sampaio', 'Meditação guiada de 10 minutos', '8', 26],
    ]
    for (const [leadName, habitTitle, cycle, daysAgo] of prescriptions) {
      const r = new Record(app.findCollectionByNameOrId('habit_prescriptions'))
      r.set('lead', leadIds[leadName])
      r.set('habit', habitIds[habitTitle])
      r.set('plan_cycle', cycle)
      r.set('start_date', S(now - daysAgo * day))
      r.set('weekly_checkin', true)
      app.save(r)
    }

    // ---------- planos ativos: marca os leads com plano e ciclo ----------
    const planByLead = {
      'Tiago Almeida': '12',
      'Marina Fonseca': '6',
      'Renata Sampaio': '8',
    }
    for (const [name, cycle] of Object.entries(planByLead)) {
      const r = app.findRecordById('leads', leadIds[name])
      r.set('plan_cycle', cycle)
      r.set('plan_started_at', S(now - 30 * day))
      app.save(r)
    }

    // ---------- templates de mensagem por etapa do funil ----------
    const templates = [
      [
        'Boas-vindas — Lead Frio',
        STAGES.frio,
        'Olá {{nome}}, tudo bem? Aqui é a equipe do Dr. Kleber Barbosa. Recebemos seu contato e ficamos felizes com seu interesse em cuidar da sua saúde de forma integrativa. Podemos te ajudar com dores crônicas, ortopedia e acompanhamento de longo prazo. Gostaria de saber mais sobre o Mapa da Saúde Life Up?',
      ],
      [
        'Follow-up — Lead Morno',
        STAGES.morno,
        'Oi {{nome}}, passando para saber como você está. Vi que você tem interesse em resolver {{queixa}} — temos uma avaliação completa integrativa que investiga a causa da dor, não só o sintoma. Posso te explicar como funciona em uma conversa rápida?',
      ],
      [
        'Convite para avaliação — Lead Quente',
        STAGES.quente,
        '{{nome}}, vimos que você está pronto para dar o próximo passo! A avaliação completa integrativa do Dr. Kleber Barbosa dura cerca de 60 minutos e mapeia sono, alimentação, movimento e gestão de estresse junto com a ortopedia. Posso te mostrar os horários disponíveis desta semana?',
      ],
      [
        'Confirmação de agendamento',
        STAGES.agendado,
        'Olá {{nome}}, sua consulta com o Dr. Kleber Barbosa está agendada! 🎉 Dia {{data}} às {{hora}}. Você vai receber um lembrete 24h antes. Alguma dúvida antes da consulta, estou à disposição.',
      ],
      [
        'Lembrete de consulta',
        STAGES.confirmado,
        '{{nome}}, passando para confirmar sua consulta com o Dr. Kleber Barbosa amanhã às {{hora}}. Por favor, leve exames anteriores, se tiver, e chegue 10 minutos antes. Até lá!',
      ],
      [
        'Pós-consulta — Mapa da Saúde Life Up',
        STAGES.realizada,
        'Olá {{nome}}, foi um prazer te receber hoje! Com base na sua avaliação, o Dr. Kleber preparou um plano de acompanhamento personalizado — o Mapa da Saúde Life Up — com protocolos de sono, alimentação, movimento e gestão de estresse. Posso te enviar o resumo?',
      ],
      [
        'Apresentação de plano de acompanhamento',
        STAGES.oferecido,
        '{{nome}}, conforme conversamos, o plano de acompanhamento {{ciclo}} semanas do Dr. Kleber Barbosa inclui: mapa completo da sua saúde, protocolos de hábitos personalizados, check-ins semanais e ajustes contínuos do tratamento. Quer que eu te envie os valores e formas de pagamento?',
      ],
      [
        'Boas-vindas ao plano ativo',
        STAGES.ativo,
        'Bem-vindo(a) ao seu plano de {{ciclo}} semanas, {{nome}}! 🚀 Seu acompanhamento com o Dr. Kleber Barbosa começa agora: você terá check-in semanal, protocolos de hábitos e ajustes no tratamento conforme sua evolução. Qualquer dúvida, me chame por aqui.',
      ],
    ]
    for (const [name, stage, body] of templates) {
      const r = new Record(app.findCollectionByNameOrId('message_templates'))
      r.set('name', name)
      r.set('stage', stage)
      r.set('body', body)
      app.save(r)
    }
  },
  (app) => {
    for (const name of [
      'message_templates',
      'habit_prescriptions',
      'habit_library',
      'stage_history',
      'leads',
    ]) {
      try {
        app.truncateCollection(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
