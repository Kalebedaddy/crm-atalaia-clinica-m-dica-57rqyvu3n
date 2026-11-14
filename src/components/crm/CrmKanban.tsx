// Kanban do funil de vendas: colunas exatas pedidas pela clínica, arrastar
// cartão entre colunas salva o estágio e registra a data da mudança.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrmStore } from '@/stores/useCrmStore'
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_ACCENTS,
  waLink,
  StageId,
} from '@/services/crm'
import { KanbanColumn } from '@/components/crm/KanbanColumn'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { NewLeadDialog } from '@/components/crm/NewLeadDialog'

const STAGE_CYCLE = { 6: '6 sem', 8: '8 sem', 12: '12 sem', 24: '24 sem' }

export function CrmKanban() {
  const { leads, updateStage } = useCrmStore()
  const [newLeadOpen, setNewLeadOpen] = useState(false)

  const byStage = useMemo(() => {
    const map: Record<StageId, typeof leads> = {} as never
    for (const s of STAGE_ORDER) map[s] = []
    for (const l of leads) map[l.stage]?.push(l)
    return map
  }, [leads])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funil de vendas</h1>
          <p className="text-sm text-muted-foreground">
            Arraste um cartão entre colunas para atualizar o estágio — a data da
            mudança é registrada automaticamente.
          </p>
        </div>
        <Button onClick={() => setNewLeadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo lead
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            title={STAGE_LABELS[stage]}
            accent={STAGE_ACCENTS[stage]}
            leads={byStage[stage]}
            onDrop={(leadId) => updateStage(leadId, stage)}
            renderCard={(lead) => (
              <Link
                to={`/crm/pacientes/${lead.id}`}
                className="block rounded-lg border bg-card p-3 shadow-sm transition hover:shadow-md hover:border-primary/40"
              >
                <p className="text-sm font-semibold">{lead.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lead.phone}
                </p>
                {lead.mainComplaint && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {lead.mainComplaint}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {lead.source}
                  </span>
                  {lead.stage === 'plano_ativo' && lead.planCycle && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      Plano{' '}
                      {
                        STAGE_CYCLE[
                          lead.planCycle as unknown as keyof typeof STAGE_CYCLE
                        ]
                      }
                    </span>
                  )}
                </div>
              </Link>
            )}
          />
        ))}
      </div>

      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
      <p className="text-xs text-muted-foreground">
        Dica: clique em um cartão para abrir o perfil do paciente, o Mapa da
        Saúde Life Up e a prescrição de hábitos.
      </p>
    </div>
  )
}

export { waLink }
