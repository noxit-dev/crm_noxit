"use client"

import { useMemo, useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { deleteLead, moveLeadStage } from "@/lib/actions/leads"
import {
  LEAD_STAGES,
  type Company,
  type Contact,
  type LeadStage,
  type LeadWithRelations,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KanbanColumn } from "@/components/kanban/kanban-column"
import { LeadForm } from "@/components/lead/lead-form"
import { LeadDetail } from "@/components/lead/lead-detail"

type Move = { id: string; stage: LeadStage }

export function KanbanBoard({
  leads,
  companies,
  contacts,
}: {
  leads: LeadWithRelations[]
  companies: Pick<Company, "id" | "name">[]
  contacts: Pick<Contact, "id" | "name" | "company_id">[]
}) {
  const [optimisticLeads, applyMove] = useOptimistic(
    leads,
    (current: LeadWithRelations[], move: Move) =>
      current.map((l) => (l.id === move.id ? { ...l, stage: move.stage } : l))
  )

  const [, startTransition] = useTransition()
  const [isPending, startDeleteTransition] = useTransition()

  const [tag, setTag] = useState<string>("all")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LeadWithRelations | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLead, setDetailLead] = useState<LeadWithRelations | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const l of leads) if (l.project_tag) set.add(l.project_tag)
    return Array.from(set).sort()
  }, [leads])

  const filtered =
    tag === "all"
      ? optimisticLeads
      : optimisticLeads.filter((l) => l.project_tag === tag)

  function openNew() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(lead: LeadWithRelations) {
    setEditing(lead)
    setOpen(true)
  }

  function openDetail(lead: LeadWithRelations) {
    setDetailLead(lead)
    setDetailOpen(true)
  }

  function handleDelete(lead: LeadWithRelations) {
    if (!window.confirm(`Delete "${lead.title}"?`)) return
    startDeleteTransition(async () => {
      const result = await deleteLead(lead.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Lead deleted.")
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeLead = optimisticLeads.find((l) => l.id === active.id)
    if (!activeLead) return

    const newStage = (over.data.current?.stage ??
      (LEAD_STAGES.includes(over.id as LeadStage)
        ? (over.id as LeadStage)
        : undefined)) as LeadStage | undefined

    if (!newStage || newStage === activeLead.stage) return

    startTransition(async () => {
      applyMove({ id: activeLead.id, stage: newStage })
      const result = await moveLeadStage(activeLead.id, newStage)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Pipeline</h2>
        <div className="flex items-center gap-2">
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="w-44" disabled={isPending}>
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNew}>
            <PlusIcon />
            New lead
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={filtered.filter((l) => l.stage === stage)}
              onOpen={openDetail}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>

      <LeadForm
        key={editing?.id ?? "new"}
        lead={editing}
        companies={companies}
        contacts={contacts}
        open={open}
        onOpenChange={setOpen}
      />

      <LeadDetail
        key={detailLead?.id ?? "none"}
        lead={detailLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
