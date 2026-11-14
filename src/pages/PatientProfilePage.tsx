// Perfil do paciente: dados de contato, histórico de estágio, investimento em
// marketing, Mapa da Saúde Life Up e Prescrição de Hábitos (planos de 6/8/12/24 semanas).
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCrmStore } from '@/stores/useCrmStore'
import {
  leadsService,
  type LifeUpMap,
  type PlanCycle,
  type Habit,
  type HabitPrescription,
  PLAN_CYCLES,
  CYCLE_LABELS,
  STAGE_LABELS,
  type StageId,
  waLink,
} from '@/services/crm'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const CATEGORIES: Array<Habit['category']> = [
  'Sono',
  'Alimentação',
  'Movimento',
  'Gestão de Estresse',
]

const MAP_FIELDS: Array<{
  key: keyof Omit<LifeUpMap, 'interpretation'>
  label: string
  placeholder: string
}> = [
  {
    key: 'sleep',
    label: 'Sono',
    placeholder: 'Ex.: 5–6h por noite, fragmentado, demora a pegar no sono…',
  },
  {
    key: 'nutrition',
    label: 'Alimentação',
    placeholder: 'Ex.: refeições irregulares, pouca proteína, muita cafeína…',
  },
  {
    key: 'movement',
    label: 'Movimento',
    placeholder: 'Ex.: sedentário, dor lombar ao final do dia…',
  },
  {
    key: 'stress',
    label: 'Gestão de estresse',
    placeholder: 'Ex.: jornada longa, má qualidade de recuperação…',
  },
]

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const {
    leads,
    habitLibrary,
    prescriptions,
    prescribeHabit,
    removePrescription,
    refresh,
  } = useCrmStore()
  const lead = leads.find((l) => l.id === id)

  const [mapa, setMapa] = useState<LifeUpMap>({})
  const [mapaDirty, setMapaDirty] = useState(false)
  const [cost, setCost] = useState('')
  const [mapaSaved, setMapaSaved] = useState(false)
  const [mapaError, setMapaError] = useState<string | null>(null)
  const [costSaved, setCostSaved] = useState(false)

  const [prescDialogOpen, setPrescDialogOpen] = useState(false)
  const [selectedHabitId, setSelectedHabitId] = useState('')
  const [cycle, setCycle] = useState<PlanCycle>('12')
  const [weeklyCheckin, setWeeklyCheckin] = useState(true)
  const [prescError, setPrescError] = useState<string | null>(null)

  const [history, setHistory] = useState<
    Array<{ id: string; fromStage: string; toStage: string; created: string }>
  >([])

  const leadPrescriptions = useMemo(
    () => (id ? prescriptions.filter((p) => p.lead === id) : []),
    [prescriptions, id],
  )

  useEffect(() => {
    if (!id) return
    let alive = true
    leadsService
      .getHistory(id)
      .then((rows) => {
        if (alive)
          setHistory(
            rows.map((r) => ({
              id: r.id,
              fromStage: r.fromStage,
              toStage: r.toStage,
              created: r.created,
            })),
          )
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (lead && !mapaDirty) {
      setMapa(lead.lifeUpMap ?? {})
      setCost(lead.marketingCost ? String(lead.marketingCost) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id])

  const habitsByCategory = useMemo(() => {
    const map: Record<Habit['category'], Habit[]> = {
      Sono: [],
      Alimentação: [],
      Movimento: [],
      'Gestão de Estresse': [],
    }
    for (const h of habitLibrary) map[h.category]?.push(h)
    return map
  }, [habitLibrary])

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/crm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao funil
          </Link>
        </Button>
        <p className="text-muted-foreground">Paciente não encontrado.</p>
      </div>
    )
  }

  const saveMapa = async () => {
    setMapaError(null)
    try {
      await leadsService.update(lead.id, { life_up_map: mapa })
      setMapaDirty(false)
      setMapaSaved(true)
      setTimeout(() => setMapaSaved(false), 2000)
      refresh()
    } catch (err) {
      setMapaError(getErrorMessage(err))
    }
  }

  const saveCost = async () => {
    await leadsService.update(lead.id, { marketing_cost: Number(cost) || 0 })
    setCostSaved(true)
    setTimeout(() => setCostSaved(false), 2000)
    refresh()
  }

  const addPrescription = async () => {
    if (!selectedHabitId) {
      setPrescError('Selecione um hábito da biblioteca.')
      return
    }
    setPrescError(null)
    try {
      await prescribeHabit({
        lead: lead.id,
        habit: selectedHabitId,
        plan_cycle: cycle,
        start_date: new Date().toISOString().slice(0, 10),
        weekly_checkin: weeklyCheckin,
      })
      // vincular um plano registra o ciclo e move o lead para "plano_ativo"
      await leadsService.update(lead.id, {
        plan_cycle: cycle,
        plan_started_at: new Date().toISOString(),
      })
      if (lead.stage !== 'plano_ativo') {
        await leadsService.changeStage(lead, 'plano_ativo')
      }
      refresh()
      setPrescDialogOpen(false)
      setSelectedHabitId('')
    } catch (err) {
      setPrescError(getErrorMessage(err))
    }
  }

  const waHref = waLink(
    lead.phone,
    `Olá ${lead.name.split(' ')[0]}, tudo bem? Aqui é da Atalaia Clínica Médica.`,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to="/crm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Funil de vendas
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
          <p className="text-sm text-muted-foreground">
            {lead.phone} {lead.email ? `· ${lead.email}` : ''} · Origem:{' '}
            {lead.source}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{STAGE_LABELS[lead.stage]}</Badge>
          {lead.planCycle && (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Plano {CYCLE_LABELS[lead.planCycle]}
            </Badge>
          )}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-[#25D366] hover:bg-[#1eb856] text-white border-transparent"
          >
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              Abrir WhatsApp
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal: Mapa da Saúde + Prescrição */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mapa da Saúde Life Up</CardTitle>
              <CardDescription>
                Análise integrativa do paciente: sono, alimentação, movimento,
                gestão de estresse e a interpretação clínica que orienta o
                plano.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MAP_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`mapa-${key}`}>{label}</Label>
                  <Textarea
                    id={`mapa-${key}`}
                    rows={2}
                    value={mapa[key] ?? ''}
                    onChange={(e) => {
                      setMapa((m) => ({ ...m, [key]: e.target.value }))
                      setMapaDirty(true)
                    }}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <Label htmlFor="mapa-interpretation">
                  Interpretação clínica
                </Label>
                <Textarea
                  id="mapa-interpretation"
                  rows={4}
                  value={mapa.interpretation ?? ''}
                  onChange={(e) => {
                    setMapa((m) => ({ ...m, interpretation: e.target.value }))
                    setMapaDirty(true)
                  }}
                  placeholder="Ex.: sobrecarga mecânica associada a baixa recuperação — priorizar protocolo de sono + fortalecimento progressivo."
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveMapa} disabled={!mapaDirty}>
                  <Save className="mr-2 h-4 w-4" /> Salvar mapa
                </Button>
                {mapaSaved && (
                  <span className="text-sm text-emerald-600">Salvo!</span>
                )}
                {mapaError && (
                  <span role="alert" className="text-sm text-destructive">
                    {mapaError}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Prescrição de Hábitos</CardTitle>
                <CardDescription>
                  Hábitos da biblioteca vinculados ao plano de acompanhamento,
                  com período e acompanhamento semanal.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setPrescDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Prescrever
              </Button>
            </CardHeader>
            <CardContent>
              {leadPrescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum hábito prescrito ainda. Clique em "Prescrever" para
                  vincular hábitos da biblioteca.
                </p>
              ) : (
                <div className="space-y-3">
                  {leadPrescriptions.map((p) => (
                    <PrescriptionRow
                      key={p.id}
                      prescription={p}
                      onRemove={removePrescription}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Investimento em marketing
              </CardTitle>
              <CardDescription>
                Usado no cálculo do custo por paciente agendado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="custo">Custo de aquisição (R$)</Label>
                <Input
                  id="custo"
                  type="number"
                  min={0}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={saveCost}>
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>
                {costSaved && (
                  <span className="text-sm text-emerald-600">Salvo!</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de estágio</CardTitle>
              <CardDescription>
                Movimentações no funil (registra a data de cada mudança).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem movimentações registradas.
                </p>
              ) : (
                <ol className="space-y-3">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-start gap-3 text-sm">
                      <span
                        className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium">
                          {h.fromStage
                            ? `${STAGE_LABELS[h.fromStage as StageId] ?? h.fromStage} → ${STAGE_LABELS[h.toStage as StageId] ?? h.toStage}`
                            : (STAGE_LABELS[h.toStage as StageId] ?? h.toStage)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.created).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de prescrição */}
      <Dialog open={prescDialogOpen} onOpenChange={setPrescDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Prescrever hábito</DialogTitle>
            <DialogDescription>
              Vincule um hábito da biblioteca ao plano de acompanhamento deste
              paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  {habitsByCategory[cat].map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setSelectedHabitId(h.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selectedHabitId === h.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {h.title}
                    </button>
                  ))}
                  {habitsByCategory[cat].length === 0 && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Período do plano</Label>
                <Select
                  value={cycle}
                  onValueChange={(v) => setCycle(v as PlanCycle)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_CYCLES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CYCLE_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Acompanhamento</Label>
                <Select
                  value={weeklyCheckin ? 'sim' : 'nao'}
                  onValueChange={(v) => setWeeklyCheckin(v === 'sim')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Check-in semanal</SelectItem>
                    <SelectItem value="nao">Sem check-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {prescError && (
              <p role="alert" className="text-sm text-destructive">
                {prescError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrescDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addPrescription}>Vincular ao plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PrescriptionRow({
  prescription,
  onRemove,
}: {
  prescription: HabitPrescription
  onRemove: (id: string) => void
}) {
  const habit = prescription.expand?.habit
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{habit?.title ?? 'Hábito'}</p>
        <p className="text-xs text-muted-foreground">
          {habit?.category} · {CYCLE_LABELS[prescription.planCycle]} · início{' '}
          {prescription.startDate
            ? new Date(prescription.startDate).toLocaleDateString('pt-BR')
            : '—'}
          {prescription.weeklyCheckin ? ' · check-in semanal' : ''}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(prescription.id)}
        aria-label="Remover prescrição"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
