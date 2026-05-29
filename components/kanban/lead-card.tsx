"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MoreHorizontalIcon } from "lucide-react"
import type { LeadWithRelations } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function formatValue(value: number | null) {
  if (value == null) return null
  return `$${value.toLocaleString()}`
}

export function LeadCard({
  lead,
  onOpen,
  onEdit,
  onDelete,
}: {
  lead: LeadWithRelations
  onOpen: (lead: LeadWithRelations) => void
  onEdit: (lead: LeadWithRelations) => void
  onDelete: (lead: LeadWithRelations) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { stage: lead.stage } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const value = formatValue(lead.value)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      // A genuine drag passes the PointerSensor distance threshold; a plain
      // click does not, so guard against opening detail mid-drag.
      onClick={() => {
        if (!isDragging) onOpen(lead)
      }}
      className="bg-card text-card-foreground rounded-lg border p-3 shadow-sm cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">{lead.title}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              // prevent drag from starting / card from opening when using the menu
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Lead actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(lead)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {lead.company && (
        <p className="text-muted-foreground mt-1 text-xs">
          {lead.company.name}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {lead.project_tag && (
          <Badge variant="secondary">{lead.project_tag}</Badge>
        )}
        {value && (
          <span className="text-muted-foreground text-xs font-medium">
            {value}
          </span>
        )}
      </div>
    </div>
  )
}
