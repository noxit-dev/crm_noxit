"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  LEAD_STAGE_LABELS,
  type LeadStage,
  type LeadWithRelations,
} from "@/lib/types"
import { LeadCard } from "@/components/kanban/lead-card"

export function KanbanColumn({
  stage,
  leads,
  onOpen,
  onEdit,
  onDelete,
}: {
  stage: LeadStage
  leads: LeadWithRelations[]
  onOpen: (lead: LeadWithRelations) => void
  onEdit: (lead: LeadWithRelations) => void
  onDelete: (lead: LeadWithRelations) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  })

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium">{LEAD_STAGE_LABELS[stage]}</h3>
        <span className="text-muted-foreground text-xs">{leads.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-muted/50" : "border-transparent bg-muted/30"
        }`}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 ? (
            <p className="text-muted-foreground px-1 py-4 text-center text-xs">
              No leads
            </p>
          ) : (
            leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
