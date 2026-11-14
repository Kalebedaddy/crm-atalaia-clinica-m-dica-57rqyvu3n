// Perfil do paciente: dados de contato, histórico de estágio, investimento em
// marketing, Mapa da Saúde Life Up e Prescrição de Hábitos (planos de 6/8/12/24 semanas).
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus, Trash2, Save } from 'lucide-react'
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
import { leadsService, STAGE_LABELS, StageId } from '@/services/crm'
import {
  habitPrescriptionsService,
  HabitCategory,
  HABIT_CATEGORY_LABEL,
  PLAN_CYCLES,
} from '@/services/habitPrescriptions'

const CATEGORIES: HabitCategory[] = [
  'sono',
  'alimentacao',
  'movimento',
  'estresse',
]

interface HabitRow {
  id: string
  title: string
  category: HabitCategory
}

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { leads, habitLibrary, refresh } = useCrmStore()
  const lead = leads.find((l) => l.id === id)

  const [mapa, setMapa] = useState(lead?.lifeUpMap ?? '')
  const [cost, setCost] = useState(
    lead?.marketingCost ? String(lead.marketingCost) : '',
  )
  const [mapaSaved, setMapaSaved] = useState(false)
  const [costSaved, setCostSaved] = useState(false)

  const [prescriptions, setPrescriptions] = useState<
    Awaited<ReturnType<typeof habitPrescriptionsService.listByLead>>
  >([])
  const [prescLoading, setPrescLoading] = useState(true)
  const [prescDialogOpen, setPrescDialogOpen] = useState(false)
  const [selectedHabitId, setSelectedHabitId] = useState('')
  const [cycle, setCycle] = useState<number>(12)
  const [checkinsPerWeek, setCheckinsPerWeek] = useState(1)
  const [prescError, setPrescError] = useState<string | null>(null)

  const [history, setHistory] = useState<
    Array<{ id: string; stage: string; changedAt: string }>
  >([])

  useEffect(() => {
    if (!id) return
    let alive = true
    habitPrescriptionsService
      .listByLead(id)
      .then((rows) => {
        if (alive) {
          setPrescriptions(rows)
          setPrescLoading(false)
        }
      })
      .catch(() => setPrescLoading(false))
    leadsService
      .stageHistory(id)
      .then((rows) => {
        if (alive) setHistory(rows)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (lead) {
      setMapa(lead.lifeUpMap ?? '')
      setCost(lead.marketingCost ? String(lead.marketingCost) : '')
    }
  }, [lead?.id])

  const habitsByCategory = useMemo(() => {
    const map: Record<HabitCategory, typeof habitLibrary> = {
      sono: [],
      alimentacao: [],
      movimento: [],
      estresse: [],
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
    await leadsService.update(lead.id, { life_up_map: mapa })
    setMapaSaved(true)
    setTimeout(() => setMapaSaved(false), 2000)
    refresh()
  }

  const saveCost = async () => {
    await leadsService.update(lead.id, { marketing_cost: Number(cost) || 0 })
    setCostSaved(true)
    setTimeout(() => setCostSaved(false), 2000)
    refresh()
  }

  const addPrescription = async () => {
    const habit = habitLibrary.find((h) => h.id === selectedHabitId)
    if (!habit) {
      setPrescError('Selecione um hábito da biblioteca.')
      return
    }
    setPrescError(null)
    try {
      await habitPrescriptionsService.create({
        lead: lead.id,
        habit: habit.id,
        cycle_weeks: cycle,
        checkins_per_week: checkinsPerWeek,
      })
      setPrescriptions(await habitPrescriptionsService.listByLead(lead.id))
      setPrescDialogOpen(false)
      setSelectedHabitId('')
      // um plano ativo move o lead para "plano_ativo" se ainda não estiver
      if (lead.stage !== 'plano_ativo')
        await leadsService.update(lead.id, { stage: 'plano_ativo' })
      refresh()
    } catch (err) {
      setPrescError(habitPrescriptionsService.error(err))
    }
  }

  const removePrescription = async (prescId: string) => {
    await habitPrescriptionsService.remove(prescId)
    setPrescriptions(await habitPrescriptionsService.listByLead(lead.id))
    refresh()
  }

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
              Plano {lead.planCycle} semanas
            </Badge>
          )}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-[#25D366] hover:bg-[#1eb856] text-white border-transparent"
          >
            <a
              href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
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
                Análise e interpretação dos dados do paciente: queixas, sono,
                alimentação, movimento, gestão de estresse e achados do exame.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={8}
                value={mapa}
                onChange={(e) => setMapa(e.target.value)}
                placeholder={
                  'Ex.: dor lombar crônica com piora ao final do dia; sono fragmentado (5–6h/noite);\nsedentarismo; alimentação irregular. Interpretação: sobrecarga mecânica associada a\nbaixa recuperação — priorizar protocolo de sono + fortalecimento progressivo.'
                }
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveMapa}>
                  <Save className="mr-2 h-4 w-4" /> Salvar mapa
                </Button>
                {mapaSaved && (
                  <span className="text-sm text-emerald-600">Salvo!</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Prescrição de Hábitos</CardTitle>
                <CardDescription>
                  Hábitos e protocolos vinculados ao plano de acompanhamento,
                  com período e check-ins semanais.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setPrescDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Prescrever
              </Button>
            </CardHeader>
            <CardContent>
              {prescLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                </div>
              ) : prescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum hábito prescrito ainda. Clique em "Prescrever" para
                  vincular hábitos da biblioteca.
                </p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.habitTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {HABIT_CATEGORY_LABEL[p.habitCategory]} · Plano de{' '}
                          {p.cycleWeeks} semanas · {p.checkinsPerWeek}{' '}
                          check-in(s) por semana
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removePrescription(p.id)}
                        aria-label="Remover prescrição"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                          {STAGE_LABELS[h.stage as StageId] ?? h.stage}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.changedAt).toLocaleString('pt-BR', {
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
                  {HABIT_CATEGORY_LABEL[cat]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {habitsByCategory[cat].map((h: HabitRow) => (
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
                  value={String(cycle)}
                  onValueChange={(v) => setCycle(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_CYCLES.map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        {c} semanas
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Check-ins semanais</Label>
                <Select
                  value={String(checkinsPerWeek)}
                  onValueChange={(v) => setCheckinsPerWeek(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} por semana
                      </SelectItem>
                    ))}
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
