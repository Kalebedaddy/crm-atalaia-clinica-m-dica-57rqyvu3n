// Métricas semanais do funil: tempo até agendamento, custo por paciente
// agendado, volume por etapa/semana e taxas de conversão entre etapas.
import {
  Lead,
  StageId,
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_SHORT,
} from '@/services/crm'

export interface WeekBucket {
  // segunda-feira da semana, ISO yyyy-MM-dd
  weekLabel: string
  counts: Record<StageId, number>
}

const startOfWeek = (d: Date): Date => {
  const day = (d.getDay() + 6) % 7 // segunda = 0
  const monday = new Date(d)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - day)
  return monday
}

const weekLabelOf = (d: Date): string => {
  const m = startOfWeek(d)
  return `${String(m.getDate()).padStart(2, '0')}/${String(m.getMonth() + 1).padStart(2, '0')}`
}

export const computeWeeklyVolume = (leads: Lead[], weeks = 8): WeekBucket[] => {
  const buckets: WeekBucket[] = []
  const now = new Date()
  for (let i = weeks - 1; i >= 0; i--) {
    const monday = startOfWeek(now)
    monday.setDate(monday.getDate() - i * 7)
    buckets.push({
      weekLabel: weekLabelOf(monday),
      counts: STAGE_ORDER.reduce(
        (acc, s) => ({ ...acc, [s]: 0 }),
        {} as Record<StageId, number>,
      ),
    })
  }
  for (const lead of leads) {
    const created = new Date(lead.createdAt)
    const idx = buckets.findIndex(
      (b) => weekLabelOf(new Date(created)) === b.weekLabel,
    )
    if (idx >= 0) buckets[idx].counts[lead.stage] += 1
  }
  return buckets
}

/** Média de dias entre a criação do lead e a entrada em "agendado". */
export const computeAvgDaysToSchedule = (leads: Lead[]): number | null => {
  const scheduled = leads.filter((l) =>
    [
      'agendado',
      'confirmado',
      'consulta_realizada',
      'plano_oferecido',
      'plano_ativo',
    ].includes(l.stage),
  )
  if (scheduled.length === 0) return null
  const totalDays = scheduled.reduce((acc, l) => {
    const created = new Date(l.createdAt).getTime()
    const changed = new Date(l.stageChangedAt).getTime()
    if (Number.isNaN(created) || Number.isNaN(changed)) return acc
    return acc + Math.max(0, (changed - created) / 86400000)
  }, 0)
  return Math.round((totalDays / scheduled.length) * 10) / 10
}

/** Custo por paciente agendado: investimento total ÷ leads que chegaram a agendado+. */
export const computeCostPerScheduled = (leads: Lead[]): number | null => {
  const scheduled = leads.filter((l) =>
    [
      'agendado',
      'confirmado',
      'consulta_realizada',
      'plano_oferecido',
      'plano_ativo',
    ].includes(l.stage),
  )
  if (scheduled.length === 0) return null
  const totalCost = leads.reduce(
    (acc, l) => acc + (Number(l.marketingCost) || 0),
    0,
  )
  return Math.round(totalCost / scheduled.length)
}

const pct = (n: number, d: number): number | null =>
  d === 0 ? null : Math.round((n / d) * 100)

export interface FunnelRate {
  from: StageId
  to: StageId
  label: string
  rate: number | null
}

const reached = (stage: StageId) => STAGE_ORDER.indexOf(stage as StageId)

/** Conversão acumulada: lead que alcançou a etapa `to` entre os que alcançaram `from`. */
export const computeFunnelRates = (leads: Lead[]): FunnelRate[] => {
  const pairs: Array<[StageId, StageId]> = [
    ['lead_frio', 'lead_morno'],
    ['lead_frio', 'lead_quente'],
    ['lead_frio', 'agendado'],
    ['agendado', 'consulta_realizada'],
    ['consulta_realizada', 'plano_oferecido'],
    ['plano_oferecido', 'plano_ativo'],
  ]
  return pairs.map(([from, to]) => {
    const fromCount = leads.filter(
      (l) => reached(l.stage) >= reached(from),
    ).length
    const toCount = leads.filter((l) => reached(l.stage) >= reached(to)).length
    return {
      from,
      to,
      label: `${STAGE_SHORT[from]} → ${STAGE_SHORT[to]}`,
      rate: pct(toCount, fromCount),
    }
  })
}

export interface WeeklyEvolution {
  weekLabel: string
  novosLeads: number
  agendados: number
  consultas: number
  planosAtivos: number
}

export const computeWeeklyEvolution = (
  leads: Lead[],
  weeks = 8,
): WeeklyEvolution[] => {
  const buckets = computeWeeklyVolume(leads, weeks)
  return buckets.map((b) => ({
    weekLabel: b.weekLabel,
    novosLeads:
      b.counts.lead_frio +
      b.counts.lead_morno +
      b.counts.lead_quente +
      b.counts.agendado +
      b.counts.confirmado +
      b.counts.consulta_realizada +
      b.counts.plano_oferecido +
      b.counts.plano_ativo,
    agendados: b.counts.agendado + b.counts.confirmado,
    consultas: b.counts.consulta_realizada,
    planosAtivos: b.counts.plano_ativo,
  }))
}

export const metricsSummary = (leads: Lead[]) => {
  const byStage = STAGE_ORDER.reduce(
    (acc, s) => {
      acc[s] = leads.filter((l) => l.stage === s).length
      return acc
    },
    {} as Record<StageId, number>,
  )
  const total = leads.length
  const agendadosOrBeyond = leads.filter(
    (l) => reached(l.stage) >= reached('agendado'),
  ).length
  return {
    total,
    byStage,
    taxaLeadConsulta: pct(
      leads.filter((l) => reached(l.stage) >= reached('consulta_realizada'))
        .length,
      total,
    ),
    taxaLeadPlano: pct(
      leads.filter((l) => reached(l.stage) >= reached('plano_ativo')).length,
      total,
    ),
    custoPorAgendado: computeCostPerScheduled(leads),
    mediaDiasAgendamento: computeAvgDaysToSchedule(leads),
    agendadosOrBeyond,
  }
}
