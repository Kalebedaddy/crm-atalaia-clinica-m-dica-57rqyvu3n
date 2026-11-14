// Store do CRM: carrega leads, biblioteca de hábitos e prescrições
// (com realtime do PocketBase) e expõe helpers de atualização.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import pb from '@/lib/pocketbase/client'
import {
  leadsService,
  habitLibraryService,
  habitPrescriptionsService,
  type Lead,
  type StageId,
  type LifeUpMap,
  type Habit,
  type HabitPrescription,
} from '@/services/crm'

interface CrmStoreValue {
  leads: Lead[]
  habitLibrary: Habit[]
  prescriptions: HabitPrescription[]
  loading: boolean
  updateStage: (id: string, stage: StageId) => Promise<void>
  updateCost: (id: string, cost: number) => Promise<void>
  updateMap: (id: string, map: LifeUpMap | null) => Promise<void>
  updateNotes: (id: string, notes: string) => Promise<void>
  createHabit: (data: {
    title: string
    category: Habit['category']
    description?: string
  }) => Promise<void>
  removeHabit: (id: string) => Promise<void>
  prescribeHabit: (data: {
    lead: string
    habit: string
    plan_cycle: HabitPrescription['planCycle']
    start_date?: string
    weekly_checkin?: boolean
    notes?: string
  }) => Promise<void>
  removePrescription: (id: string) => Promise<void>
  prescriptionsOf: (leadId: string) => HabitPrescription[]
  refresh: () => Promise<void>
}

const CrmStoreContext = createContext<CrmStoreValue | null>(null)

export function CrmProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [habitLibrary, setHabitLibrary] = useState<Habit[]>([])
  const [prescriptions, setPrescriptions] = useState<HabitPrescription[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [ls, habits, prescs] = await Promise.all([
        leadsService.list(),
        habitLibraryService.list(),
        habitPrescriptionsService.list(),
      ])
      setLeads(ls)
      setHabitLibrary(habits)
      setPrescriptions(prescs)
    } catch {
      // mantém o que tem; erro silencioso para não travar o painel
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    refresh()
    const leadsCol = pb.collection('leads')
    const onChange = () => {
      if (!cancelled) refresh()
    }
    leadsCol.subscribe('*', onChange)
    return () => {
      cancelled = true
      leadsCol.unsubscribe('*')
    }
  }, [refresh])

  const updateStage = useCallback(
    async (id: string, stage: StageId) => {
      const lead = leads.find((l) => l.id === id)
      if (!lead) return
      // atualização otimista; o histórico em stage_history é gravado pelo serviço
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, stage, stageChangedAt: new Date().toISOString() }
            : l,
        ),
      )
      try {
        await leadsService.changeStage(lead, stage)
        await refresh()
      } catch {
        await refresh()
      }
    },
    [leads, refresh],
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
    async (id: string, map: LifeUpMap | null) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, lifeUpMap: map } : l)),
      )
      try {
        await leadsService.update(id, { life_up_map: map ?? {} })
      } catch {
        await refresh()
      }
    },
    [refresh],
  )

  const updateNotes = useCallback(
    async (id: string, notes: string) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, lifeUpNotes: notes } : l)),
      )
      try {
        await leadsService.update(id, { life_up_notes: notes })
      } catch {
        await refresh()
      }
    },
    [refresh],
  )

  const createHabit = useCallback<CrmStoreValue['createHabit']>(
    async (data) => {
      try {
        await pb.collection('habit_library').create({
          title: data.title,
          category: data.category,
          description: data.description ?? '',
        })
        const habits = await habitLibraryService.list()
        setHabitLibrary(habits)
      } catch {
        // erro ignorado; a lista é recarregada para refletir o estado real
        await refresh()
      }
    },
    [refresh],
  )

  const removeHabit = useCallback(async (id: string) => {
    try {
      await pb.collection('habit_library').delete(id)
    } catch {
      // segue para o reload mesmo em erro
    }
    const habits = await habitLibraryService.list().catch(() => undefined)
    if (habits) setHabitLibrary(habits)
  }, [])

  const prescribeHabit = useCallback<CrmStoreValue['prescribeHabit']>(
    async (data) => {
      try {
        await habitPrescriptionsService.create({
          lead: data.lead,
          habit: data.habit,
          plan_cycle: data.plan_cycle,
          start_date: data.start_date ?? new Date().toISOString().slice(0, 10),
          weekly_checkin: data.weekly_checkin,
          notes: data.notes,
        })
      } catch {
        // segue para o reload mesmo em erro
      }
      const prescs = await habitPrescriptionsService
        .list()
        .catch(() => undefined)
      if (prescs) setPrescriptions(prescs)
    },
    [],
  )

  const removePrescription = useCallback(async (id: string) => {
    try {
      await habitPrescriptionsService.remove(id)
    } catch {
      // segue para o reload mesmo em erro
    }
    const prescs = await habitPrescriptionsService.list().catch(() => undefined)
    if (prescs) setPrescriptions(prescs)
  }, [])

  const prescriptionsOf = useCallback(
    (leadId: string) => prescriptions.filter((p) => p.lead === leadId),
    [prescriptions],
  )

  const value = useMemo(
    () => ({
      leads,
      habitLibrary,
      prescriptions,
      loading,
      updateStage,
      updateCost,
      updateMap,
      updateNotes,
      createHabit,
      removeHabit,
      prescribeHabit,
      removePrescription,
      prescriptionsOf,
      refresh,
    }),
    [
      leads,
      habitLibrary,
      prescriptions,
      loading,
      updateStage,
      updateCost,
      updateMap,
      updateNotes,
      createHabit,
      removeHabit,
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
