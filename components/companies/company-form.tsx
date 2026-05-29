"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import {
  createCompany,
  updateCompany,
  type ActionState,
} from "@/lib/actions/companies"
import type { Company } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function CompanyForm({
  company,
  open,
  onOpenChange,
}: {
  company?: Company | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isEdit = Boolean(company)
  const action = isEdit ? updateCompany : createCompany
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined
  )

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Company updated." : "Company created.")
      onOpenChange(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, isEdit, onOpenChange])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit company" : "New company"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this company's details."
              : "Add a company to your CRM."}
          </SheetDescription>
        </SheetHeader>
        {/* key resets the uncontrolled inputs when switching rows */}
        <form
          key={company?.id ?? "new"}
          action={formAction}
          className="flex flex-1 flex-col gap-4 px-6"
        >
          {isEdit && <input type="hidden" name="id" value={company!.id} />}
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={company?.name ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={company?.industry ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              defaultValue={company?.website ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={company?.phone ?? ""}
            />
          </div>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create company"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
