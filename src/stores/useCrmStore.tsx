// Store do CRM: carrega todos os leads (com realtime do PocketBase) e expõe
// helpers de atualização de estágio, Mapa da Saúde e prescrição de hábitos.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { pb } from '@/lib/pocketbase/client'
import {
  leadsService,
  mapService,
  habitsService,
  type Lead,
  type StageId,
  type HealthMapData,
  type HabitPrescription,
} from '@/services/crm'

interface CrmStoreValue {
  leads: Lead[]
  loading: boolean
  updateStage: (id: string, stage: StageId) => Promise<void>
  updateCost: (id: string, cost: number) => Promise<void>
  updateMap: (id: string, data: Partial<HealthMapData>) => Promise<void>
  prescribeHabit: (
    leadId: string,
    habitId: string,
    cycleWeeks: 6 | 8 | 12 | 24,
  ) => Promise<void>
  removePrescription: (id: string) => Promise<void>
  prescriptionsOf: (leadId: string) => HabitPrescription[]
  refresh: () => Promise<void>
}

const CrmStoreContext = createContext<CrmStoreValue | null>(null)

const STAGES_BEFORE = [
  'lead_frio',
  'lead_morno',
  'lead_quente',
  'agendado',
  'confirmado',
  'consulta_realizada',
  'plano_oferecido',
]

export function CrmProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await leadsService.list()
      setLeads(data)
    } catch {
      // mantém o que tem; erro silencioso para não travar o painel
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    refresh()
    const collection = pb.collection('leads')
    const onChange = () => {
      if (!cancelled) refresh()
    }
    collection.subscribe('*', onChange)
    return () => {
      cancelled = true
      collection.unsubscribe('*')
    }
  }, [refresh])

  const updateStage = useCallback(
    async (id: string, stage: StageId) => {
      // atualização otimista + histórico gravado pelo backend (hook) ou aqui
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, stage, stageChangedAt: new Date().toISOString() }
            : l,
        ),
      )
      try {
        await leadsService.updateStage(id, stage)
      } catch {
        await refresh()
      }
    },
    [refresh],
  )

  const updateCost = useCallback(
    async (id: string, cost: number) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, marketingCost: cost } : l)),
      )
      try {
        await leadsService.update(id, { marketing_cost: cost })
      } catch {
        await refresh()
      }
    },
    [refresh],
  )

  const updateMap = useCallback(
    async (id: string, data: Partial<HealthMapData>) => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, healthMap: { ...l.healthMap, ...data } } : l,
        ),
      )
      try {
        await mapService.upsert(id, data)
      } catch {
        await refresh()
      }
    },
    [refresh],
  )

  const prescribeHabit = useCallback(
    async (leadId: string, habitId: string, cycleWeeks: 6 | 8 | 12 | 24) => {
      try {
        const created = await habitsService.prescribe(
          leadId,
          habitId,
          cycleWeeks,
        )
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  prescriptions: [...l.prescriptions, created],
                  planCycleWeeks: l.planCycleWeeks ?? cycleWeeks,
                }
              : l,
          ),
        )
      } catch {
        await refresh()
      }
    },
    [refresh],
  )

  const removePrescription = useCallback(
    async (id: string) => {
      try {
        await habitsService.removePrescription(id)
        setLeads((prev) =>
          prev.map((l) => ({
            ...l,
            prescriptions: l.prescriptions.filter((p) => p.id !== id),
          })),
        )
      } catch {
        await refresh()
      }
    },
    [refresh],
  )

  const prescriptionsOf = useCallback(
    (leadId: string) => leads.find((l) => l.id === leadId)?.prescriptions ?? [],
    [leads],
  )

  const value = useMemo(
    () => ({
      leads,
      loading,
      updateStage,
      updateCost,
      updateMap,
      prescribeHabit,
      removePrescription,
      prescriptionsOf,
      refresh,
    }),
    [
      leads,
      loading,
      updateStage,
      updateCost,
      updateMap,
      prescribeHabit,
      removePrescription,
      prescriptionsOf,
      refresh,
    ],
  )

  return (
    <CrmStoreContext.Provider value={value}>
      {children}
    </CrmStoreContext.Provider>
  )
}

export function useCrmStore(): CrmStoreValue {
  const ctx = useContext(CrmStoreContext)
  if (!ctx)
    throw new Error('useCrmStore deve ser usado dentro de <CrmProvider>')
  return ctx
}
