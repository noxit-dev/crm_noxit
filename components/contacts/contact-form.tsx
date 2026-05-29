"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import {
  createContact,
  updateContact,
  type ActionState,
} from "@/lib/actions/contacts"
import type { Company, Contact } from "@/lib/types"
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

export function ContactForm({
  contact,
  companies,
  open,
  onOpenChange,
}: {
  contact?: Contact | null
  companies: Pick<Company, "id" | "name">[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isEdit = Boolean(contact)
  const action = isEdit ? updateContact : createContact
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined
  )

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Contact updated." : "Contact created.")
      onOpenChange(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, isEdit, onOpenChange])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit contact" : "New contact"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this contact's details."
              : "Add a contact to your CRM."}
          </SheetDescription>
        </SheetHeader>
        <form
          key={contact?.id ?? "new"}
          action={formAction}
          className="flex flex-1 flex-col gap-4 px-6"
        >
          {isEdit && <input type="hidden" name="id" value={contact!.id} />}
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={contact?.name ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={contact?.email ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={contact?.phone ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company_id">Company</Label>
            {/* Radix Select `name` renders a hidden input for form submission */}
            <Select
              name="company_id"
              defaultValue={contact?.company_id ?? "none"}
            >
              <SelectTrigger id="company_id">
                <SelectValue placeholder="No company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create contact"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
