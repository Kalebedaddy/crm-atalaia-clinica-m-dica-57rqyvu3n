// Dashboard de métricas semanais do funil: tempo médio até agendamento,
// custo por paciente agendado, volume semanal por etapa, taxas de conversão
// e evolução semanal em gráficos (recharts).
import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { useCrmStore } from '@/stores/useCrmStore'
import {
  computeWeeklyVolume,
  computeAvgDaysToSchedule,
  computeCostPerScheduled,
  computeFunnelRates,
  computeWeeklyEvolution,
} from '@/services/crmMetrics'
import {
  STAGE_SHORT,
  STAGE_ORDER,
  currency,
  type StageId,
} from '@/services/crm'

const STAGE_COLORS: Record<StageId, string> = {
  lead_frio: '#94a3b8',
  lead_morno: '#60a5fa',
  lead_quente: '#f97316',
  agendado: '#22c55e',
  confirmado: '#16a34a',
  consulta_realizada: '#0d9488',
  plano_oferecido: '#8b5cf6',
  plano_ativo: '#7c3aed',
}

const Kpi = ({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) => (
  <Card>
    <CardHeader className="pb-1">
      <CardDescription>{label}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const { leads, loading } = useCrmStore()

  const weeklyVolume = useMemo(() => computeWeeklyVolume(leads), [leads])
  const evolution = useMemo(() => computeWeeklyEvolution(leads), [leads])
  const funnelRates = useMemo(() => computeFunnelRates(leads), [leads])
  const avgDays = useMemo(() => computeAvgDaysToSchedule(leads), [leads])
  const costPer = useMemo(() => computeCostPerScheduled(leads), [leads])

  const totalLeads = leads.length
  const agendadosOrBeyond = useMemo(
    () =>
      leads.filter(
        (l) => STAGE_ORDER.indexOf(l.stage) >= STAGE_ORDER.indexOf('agendado'),
      ).length,
    [leads],
  )
  const consultas = useMemo(
    () =>
      leads.filter(
        (l) =>
          STAGE_ORDER.indexOf(l.stage) >=
          STAGE_ORDER.indexOf('consulta_realizada'),
      ).length,
    [leads],
  )
  const planos = useMemo(
    () => leads.filter((l) => l.stage === 'plano_ativo').length,
    [leads],
  )
  const investimentoTotal = useMemo(
    () => leads.reduce((acc, l) => acc + (Number(l.marketingCost) || 0), 0),
    [leads],
  )

  if (loading)
    return <p className="text-sm text-muted-foreground">Carregando métricas…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard semanal</h1>
        <p className="text-sm text-muted-foreground">
          Métricas de conversão do funil da clínica — atualizadas em tempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Tempo médio até agendamento"
          value={avgDays === null ? '—' : `${avgDays} dias`}
          hint="Da criação do lead à entrada em 'Agendados'"
        />
        <Kpi
          label="Custo por paciente agendado"
          value={costPer === null ? '—' : currency(costPer)}
          hint={`${currency(investimentoTotal)} investidos · ${agendadosOrBeyond} agendados`}
        />
        <Kpi
          label="Total de leads"
          value={String(totalLeads)}
          hint={`${planos} planos ativos`}
        />
        <Kpi
          label="Conversão lead → consulta"
          value={
            totalLeads === 0
              ? '—'
              : `${Math.round((consultas / totalLeads) * 100)}%`
          }
          hint={`${consultas} consultas realizadas`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Volume de leads por semana e etapa
          </CardTitle>
          <CardDescription>
            Últimas 8 semanas, por etapa do funil.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyVolume}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="weekLabel"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ReTooltip labelFormatter={(l) => `Semana de ${l}`} />
              <Legend />
              {STAGE_ORDER.map((s) => (
                <Bar
                  key={s}
                  dataKey={`counts.${s}`}
                  name={STAGE_SHORT[s]}
                  stackId="a"
                  fill={STAGE_COLORS[s]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução semanal</CardTitle>
            <CardDescription>
              Novos leads, agendamentos, consultas e planos ativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <ReTooltip labelFormatter={(l) => `Semana de ${l}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="novosLeads"
                  name="Novos leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="agendados"
                  name="Agendados"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="consultas"
                  name="Consultas"
                  stroke="#0d9488"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="planosAtivos"
                  name="Planos ativos"
                  stroke="#7c3aed"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Taxas de conversão entre etapas
            </CardTitle>
            <CardDescription>
              Percentual de leads que avançou de uma etapa para a próxima.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelRates.map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{r.label}</span>
                  <span className="font-medium">
                    {r.rate === null ? '—' : `${r.rate}%`}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, r.rate ?? 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
