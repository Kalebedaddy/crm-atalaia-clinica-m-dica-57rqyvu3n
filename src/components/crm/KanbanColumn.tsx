// Coluna do kanban do CRM (nova, baseada no modelo do funil da clínica).
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Lead } from '@/services/crm'
import { StageId } from '@/services/crm'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface KanbanColumnProps {
  stage: StageId
  title: string
  accent?: string
  leads: Lead[]
  onDrop: (leadId: string, stage: StageId) => void
  renderCard: (lead: Lead) => React.ReactNode
}

export function KanbanColumn({
  stage,
  title,
  accent,
  leads,
  onDrop,
  renderCard,
}: KanbanColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  return (
    <div
      className={cn(
        'flex h-full flex-col flex-shrink-0 transition-all duration-300',
        isCollapsed ? 'w-12' : 'w-[300px] min-w-[300px]',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        const leadId = e.dataTransfer.getData('text/lead-id') || dragOverId
        if (leadId) onDrop(leadId, stage)
        setDragOverId(null)
      }}
    >
      <div
        className={cn(
          'flex select-none items-center justify-between border-y border-r bg-gray-100/50 px-3 py-2 h-10',
          isCollapsed && 'justify-center',
        )}
      >
        {isCollapsed ? (
          <button
            className="flex h-full w-full flex-col items-center justify-center gap-1 hover:bg-gray-200/50"
            onClick={() => setIsCollapsed(false)}
          >
            <span className="text-xs font-bold text-gray-600">
              {leads.length}
            </span>
            <ChevronRight className="h-3 w-3 text-gray-400" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 overflow-hidden">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: accent ?? '#999' }}
                aria-hidden
              />
              <h3 className="truncate text-xs font-bold uppercase tracking-wide text-gray-700">
                {title}
              </h3>
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] font-bold text-gray-600">
                {leads.length}
              </span>
            </div>
            <button
              className="-mr-1 rounded p-1 text-gray-400 hover:text-gray-700"
              onClick={() => setIsCollapsed(true)}
              aria-label={`Recolher coluna ${title}`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      <div
        className={cn(
          'flex-1 space-y-3 overflow-y-auto border-r p-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent transition-colors',
          isDragOver
            ? 'bg-primary/5 ring-inset ring-2 ring-primary/20'
            : 'bg-[#f5f5f5]/30',
          isCollapsed && 'hidden',
        )}
      >
        {leads.map((lead) => (
          <div
            key={lead.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/lead-id', lead.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverId(lead.id)
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            {renderCard(lead)}
          </div>
        ))}
        {leads.length === 0 && !isCollapsed && (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-400">
            Arraste leads aqui
          </div>
        )}
      </div>

      {isCollapsed && (
        <div className="flex flex-1 items-center justify-center border-r bg-[#f5f5f5]/30">
          <span className="-rotate-90 whitespace-nowrap text-xs font-bold tracking-wider text-gray-400">
            {title}
          </span>
        </div>
      )}
    </div>
  )
}
