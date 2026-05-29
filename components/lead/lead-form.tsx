"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  createLead,
  updateLead,
  type ActionState,
} from "@/lib/actions/leads"
import {
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  type Company,
  type Contact,
  type LeadWithRelations,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function LeadForm({
  lead,
  companies,
  contacts,
  open,
  onOpenChange,
}: {
  lead?: LeadWithRelations | null
  companies: Pick<Company, "id" | "name">[]
  contacts: Pick<Contact, "id" | "name" | "company_id">[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isEdit = Boolean(lead)
  const action = isEdit ? updateLead : createLead
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined
  )

  const [companyId, setCompanyId] = useState<string>(lead?.company_id ?? "none")
  const [contactId, setContactId] = useState<string>(
    lead?.primary_contact_id ?? "none"
  )
  const [stage, setStage] = useState<string>(lead?.stage ?? "lead")

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Lead updated." : "Lead created.")
      onOpenChange(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, isEdit, onOpenChange])

  // Only contacts belonging to the chosen company (or unassigned) are selectable.
  const visibleContacts =
    companyId === "none"
      ? contacts
      : contacts.filter((c) => c.company_id === companyId || c.company_id == null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit lead" : "New lead"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this lead's details."
              : "Add a lead to your pipeline."}
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-1 flex-col gap-4 px-6">
          {isEdit && <input type="hidden" name="id" value={lead!.id} />}

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={lead?.title ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="stage">Stage</Label>
            <Select name="stage" value={stage} onValueChange={setStage}>
              <SelectTrigger id="stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LEAD_STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company_id">Company</Label>
            <Select
              name="company_id"
              value={companyId}
              onValueChange={(v) => {
                setCompanyId(v)
                setContactId("none") // reset contact when company changes
              }}
            >
              <SelectTrigger id="company_id">
                <SelectValue placeholder="No company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="primary_contact_id">Primary contact</Label>
            <Select
              name="primary_contact_id"
              value={contactId}
              onValueChange={setContactId}
            >
              <SelectTrigger id="primary_contact_id">
                <SelectValue placeholder="No contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contact</SelectItem>
                {visibleContacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project_tag">Project tag</Label>
            <Input
              id="project_tag"
              name="project_tag"
              defaultValue={lead?.project_tag ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              name="value"
              type="number"
              step="any"
              defaultValue={lead?.value ?? ""}
            />
          </div>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
