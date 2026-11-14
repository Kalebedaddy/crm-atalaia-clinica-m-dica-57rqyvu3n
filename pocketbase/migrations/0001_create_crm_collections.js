// Collections: leads (contatos captados), patients (perfis do CRM),
// stage_history (rastro de mudanças de estágio), habit_library (biblioteca
// de hábitos), habit_prescriptions (hábitos prescritos num plano),
// message_templates (modelos de mensagem por etapa do funil).
migrate(
  (app) => {
    // ---------- leads ----------
    const leads = new Collection({
      name: 'leads',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true, max: 200 },
        { name: 'phone', type: 'text', required: true, max: 40 },
        { name: 'email', type: 'email', required: false },
        { name: 'main_complaint', type: 'text', max: 2000 },
        {
          name: 'source',
          type: 'select',
          required: true,
          values: ['Instagram', 'Google', 'Indicação', 'Outro'],
          maxSelect: 1,
        },
        {
          name: 'stage',
          type: 'select',
          required: true,
          values: [
            'lead_frio',
            'lead_morno',
            'lead_quente',
            'agendado',
            'confirmado',
            'consulta_realizada',
            'plano_oferecido',
            'plano_ativo',
          ],
          maxSelect: 1,
        },
        // data de entrada no estágio atual (para tempo de conversão)
        { name: 'stage_changed_at', type: 'date' },
        // custo de marketing atribuído ao lead (origem)
        { name: 'marketing_cost', type: 'number' },
        // campos do Mapa da Saúde Life Up
        { name: 'life_up_map', type: 'json' },
        { name: 'life_up_notes', type: 'text', max: 5000 },
        // campos de plano de acompanhamento
        {
          name: 'plan_cycle',
          type: 'select',
          values: ['6', '8', '12', '24'],
          maxSelect: 1,
        },
        { name: 'plan_started_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_leads_stage ON leads (stage)',
        'CREATE INDEX idx_leads_created ON leads (created DESC)',
        'CREATE INDEX idx_leads_phone ON leads (phone)',
      ],
    })
    app.save(leads)

    // ---------- stage_history ----------
    const history = new Collection({
      name: 'stage_history',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'lead',
          type: 'relation',
          required: true,
          collectionId: leads.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'from_stage', type: 'text', max: 60 },
        { name: 'to_stage', type: 'text', required: true, max: 60 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_stage_history_lead ON stage_history (lead)',
        'CREATE INDEX idx_stage_history_created ON stage_history (created DESC)',
      ],
    })
    app.save(history)

    // ---------- habit_library ----------
    const habits = new Collection({
      name: 'habit_library',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'title', type: 'text', required: true, max: 200 },
        { name: 'description', type: 'text', max: 3000 },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['Sono', 'Alimentação', 'Movimento', 'Gestão de Estresse'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_habit_library_category ON habit_library (category)',
      ],
    })
    app.save(habits)

    // ---------- habit_prescriptions ----------
    const prescriptions = new Collection({
      name: 'habit_prescriptions',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'lead',
          type: 'relation',
          required: true,
          collectionId: leads.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'habit',
          type: 'relation',
          required: true,
          collectionId: habits.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        // plano de acompanhamento vinculado (apenas um por prescription)
        {
          name: 'plan_cycle',
          type: 'select',
          required: true,
          values: ['6', '8', '12', '24'],
          maxSelect: 1,
        },
        // check-in semanal: data do início do ciclo
        { name: 'start_date', type: 'date', required: true },
        { name: 'weekly_checkin', type: 'bool' },
        { name: 'notes', type: 'text', max: 2000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_habit_prescriptions_lead ON habit_prescriptions (lead)',
        'CREATE INDEX idx_habit_prescriptions_habit ON habit_prescriptions (habit)',
      ],
    })
    app.save(prescriptions)

    // ---------- message_templates ----------
    const templates = new Collection({
      name: 'message_templates',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'name', type: 'text', required: true, max: 200 },
        // etapa do funil a que o modelo pertence
        {
          name: 'stage',
          type: 'select',
          required: true,
          values: [
            'lead_frio',
            'lead_morno',
            'lead_quente',
            'agendado',
            'confirmado',
            'consulta_realizada',
            'plano_oferecido',
            'plano_ativo',
          ],
          maxSelect: 1,
        },
        { name: 'body', type: 'text', required: true, max: 4000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_message_templates_stage ON message_templates (stage)',
      ],
    })
    app.save(templates)
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
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
