import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export type StageId =
  | 'lead_frio'
  | 'lead_morno'
  | 'lead_quente'
  | 'agendado'
  | 'confirmado'
  | 'consulta_realizada'
  | 'plano_oferecido'
  | 'plano_ativo'

export type LeadSource = 'Instagram' | 'Google' | 'Indicação' | 'Outro'
export type PlanCycle = '6' | '8' | '12' | '24'

export const STAGE_ORDER: StageId[] = [
  'lead_frio',
  'lead_morno',
  'lead_quente',
  'agendado',
  'confirmado',
  'consulta_realizada',
  'plano_oferecido',
  'plano_ativo',
]

export const STAGE_LABELS: Record<StageId, string> = {
  lead_frio: 'Leads Frios',
  lead_morno: 'Leads Mornos',
  lead_quente: 'Leads Quentes',
  agendado: 'Pacientes Agendados',
  confirmado: 'Pacientes Confirmados',
  consulta_realizada: 'Consultas Realizadas',
  plano_oferecido: 'Planos de Acompanhamento Oferecidos',
  plano_ativo: 'Planos de Acompanhamento Ativos',
}

// rótulos curtos usados em eixos, gráficos e badges
export const STAGE_SHORT: Record<StageId, string> = {
  lead_frio: 'Frios',
  lead_morno: 'Mornos',
  lead_quente: 'Quentes',
  agendado: 'Agendados',
  confirmado: 'Confirmados',
  consulta_realizada: 'Realizadas',
  plano_oferecido: 'Plano ofertado',
  plano_ativo: 'Plano ativo',
}

// cor do marcador de cada coluna no funil
export const STAGE_ACCENTS: Record<StageId, string> = {
  lead_frio: '#94a3b8',
  lead_morno: '#60a5fa',
  lead_quente: '#f97316',
  agendado: '#22c55e',
  confirmado: '#16a34a',
  consulta_realizada: '#0d9488',
  plano_oferecido: '#8b5cf6',
  plano_ativo: '#7c3aed',
}

export const PLAN_CYCLES: PlanCycle[] = ['6', '8', '12', '24']
export const CYCLE_LABELS: Record<PlanCycle, string> = {
  '6': '6 semanas',
  '8': '8 semanas',
  '12': '12 semanas',
  '24': '24 semanas',
}

export interface LifeUpMap {
  sleep?: string
  nutrition?: string
  movement?: string
  stress?: string
  interpretation?: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  mainComplaint: string
  source: LeadSource
  stage: StageId
  stageChangedAt: string
  marketingCost: number
  lifeUpMap: LifeUpMap | null
  lifeUpNotes: string
  planCycle: PlanCycle | ''
  planStartedAt: string
  createdAt: string
}

export interface StageHistoryEntry {
  id: string
  lead: string
  fromStage: string
  toStage: StageId
  created: string
}

export interface Habit {
  id: string
  title: string
  description: string
  category: 'Sono' | 'Alimentação' | 'Movimento' | 'Gestão de Estresse'
}

export interface HabitPrescription {
  id: string
  lead: string
  habit: string
  planCycle: PlanCycle
  startDate: string
  weeklyCheckin: boolean
  notes: string
  expand?: { habit?: Habit }
}

export interface MessageTemplate {
  id: string
  name: string
  stage: StageId
  body: string
}

const toLead = (r: Record<string, unknown>): Lead => ({
  id: String(r.id),
  name: String(r.name ?? ''),
  phone: String(r.phone ?? ''),
  email: String(r.email ?? ''),
  mainComplaint: String(r.main_complaint ?? ''),
  source: (r.source as LeadSource) ?? 'Outro',
  stage: (r.stage as StageId) ?? 'lead_frio',
  stageChangedAt: String(r.stage_changed_at ?? r.created ?? ''),
  marketingCost: Number(r.marketing_cost ?? 0),
  lifeUpMap: (r.life_up_map as LifeUpMap | null) ?? null,
  lifeUpNotes: String(r.life_up_notes ?? ''),
  planCycle: (r.plan_cycle as PlanCycle) || '',
  planStartedAt: String(r.plan_started_at ?? ''),
  createdAt: String(r.created ?? ''),
})

const expand = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : undefined

export const leadsService = {
  list: async (): Promise<Lead[]> => {
    const res = await pb.collection('leads').getFullList({ sort: '-created' })
    return res.map(toLead)
  },

  get: async (id: string): Promise<Lead> =>
    toLead(await pb.collection('leads').getOne(id)),

  getHistory: async (leadId: string): Promise<StageHistoryEntry[]> => {
    const res = await pb.collection('stage_history').getFullList({
      filter: `lead="${leadId}"`,
      sort: 'created',
    })
    return res.map((r) => ({
      id: r.id,
      lead: r.lead,
      fromStage: String(r.from_stage ?? ''),
      toStage: (r.to_stage as StageId) ?? 'lead_frio',
      created: r.created,
    }))
  },

  changeStage: async (lead: Lead, toStage: StageId): Promise<void> => {
    if (lead.stage === toStage) return
    await pb.collection('leads').update(lead.id, {
      stage: toStage,
      stage_changed_at: new Date().toISOString(),
    })
    await pb.collection('stage_history').create({
      lead: lead.id,
      from_stage: lead.stage,
      to_stage: toStage,
    })
  },

  update: async (
    id: string,
    data: Partial<{
      name: string
      phone: string
      email: string
      main_complaint: string
      life_up_map: LifeUpMap
      life_up_notes: string
      plan_cycle: PlanCycle | ''
      plan_started_at: string
      marketing_cost: number
    }>,
  ): Promise<Lead> => toLead(await pb.collection('leads').update(id, data)),

  create: async (data: {
    name: string
    phone: string
    email?: string
    main_complaint?: string
    source: LeadSource
    stage?: StageId
  }): Promise<Lead> =>
    toLead(
      await pb.collection('leads').create({
        ...data,
        stage: data.stage ?? 'lead_frio',
        stage_changed_at: new Date().toISOString(),
        marketing_cost: 0,
      }),
    ),

  remove: async (id: string): Promise<void> => {
    await pb.collection('leads').delete(id)
  },

  error: getErrorMessage,
}

export const habitLibraryService = {
  list: async (): Promise<Habit[]> => {
    const res = await pb
      .collection('habit_library')
      .getFullList({ sort: 'category,title' })
    return res.map((r) => ({
      id: r.id,
      title: String(r.title ?? ''),
      description: String(r.description ?? ''),
      category: (r.category as Habit['category']) ?? 'Movimento',
    }))
  },
}

export const habitPrescriptionsService = {
  list: async (): Promise<HabitPrescription[]> => {
    const res = await pb.collection('habit_prescriptions').getFullList({
      sort: '-created',
      expand: 'habit',
    })
    return res.map((r) => {
      const e = expand(r.expand)
      return {
        id: r.id,
        lead: r.lead,
        habit: r.habit,
        planCycle: (r.plan_cycle as PlanCycle) ?? '6',
        startDate: String(r.start_date ?? ''),
        weeklyCheckin: Boolean(r.weekly_checkin),
        notes: String(r.notes ?? ''),
        expand: {
          habit: e?.habit
            ? {
                id: (e.habit as Record<string, unknown>).id as string,
                title: String((e.habit as Record<string, unknown>).title ?? ''),
                description: String(
                  (e.habit as Record<string, unknown>).description ?? '',
                ),
                category: (e.habit as Record<string, unknown>)
                  .category as Habit['category'],
              }
            : undefined,
        },
      }
    })
  },

  create: async (data: {
    lead: string
    habit: string
    plan_cycle: PlanCycle
    start_date: string
    weekly_checkin?: boolean
    notes?: string
  }): Promise<void> => {
    await pb.collection('habit_prescriptions').create(data)
  },

  remove: async (id: string): Promise<void> => {
    await pb.collection('habit_prescriptions').delete(id)
  },
}

export const messageTemplatesService = {
  list: async (): Promise<MessageTemplate[]> => {
    const res = await pb
      .collection('message_templates')
      .getFullList({ sort: 'stage,name' })
    return res.map((r) => ({
      id: r.id,
      name: String(r.name ?? ''),
      stage: (r.stage as StageId) ?? 'lead_frio',
      body: String(r.body ?? ''),
    }))
  },

  create: async (data: {
    name: string
    stage: StageId
    body: string
  }): Promise<void> => {
    await pb.collection('message_templates').create(data)
  },

  remove: async (id: string): Promise<void> => {
    await pb.collection('message_templates').delete(id)
  },
}

export const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return raw
}

export const waLink = (phone: string, text?: string): string => {
  const digits = phone.replace(/\D/g, '')
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${q}`
}

export const currency = (v: number): string =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
