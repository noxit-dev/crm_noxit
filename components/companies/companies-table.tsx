"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontalIcon, PlusIcon } from "lucide-react"
import { deleteCompany } from "@/lib/actions/companies"
import type { Company } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CompanyForm } from "@/components/companies/company-form"

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [isPending, startTransition] = useTransition()

  function openNew() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(company: Company) {
    setEditing(company)
    setOpen(true)
  }

  function handleDelete(company: Company) {
    if (!window.confirm(`Delete "${company.name}"?`)) return
    startTransition(async () => {
      const result = await deleteCompany(company.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Company deleted.")
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Companies</h2>
        <Button onClick={openNew}>
          <PlusIcon />
          New company
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No companies yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.industry ?? "—"}</TableCell>
                  <TableCell>{company.website ?? "—"}</TableCell>
                  <TableCell>{company.phone ?? "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                        >
                          <MoreHorizontalIcon />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(company)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(company)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CompanyForm company={editing} open={open} onOpenChange={setOpen} />
    </div>
  )
}
