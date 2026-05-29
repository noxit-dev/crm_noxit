"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MoreHorizontalIcon, PlusIcon } from "lucide-react"
import { deleteContact } from "@/lib/actions/contacts"
import type { Company, ContactWithCompany } from "@/lib/types"
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
import { ContactForm } from "@/components/contacts/contact-form"

export function ContactsTable({
  contacts,
  companies,
}: {
  contacts: ContactWithCompany[]
  companies: Pick<Company, "id" | "name">[]
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ContactWithCompany | null>(null)
  const [isPending, startTransition] = useTransition()

  function openNew() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(contact: ContactWithCompany) {
    setEditing(contact)
    setOpen(true)
  }

  function handleDelete(contact: ContactWithCompany) {
    if (!window.confirm(`Delete "${contact.name}"?`)) return
    startTransition(async () => {
      const result = await deleteContact(contact.id)
      if (result?.error) toast.error(result.error)
      else toast.success("Contact deleted.")
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Contacts</h2>
        <Button onClick={openNew}>
          <PlusIcon />
          New contact
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No contacts yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email ?? "—"}</TableCell>
                  <TableCell>{contact.phone ?? "—"}</TableCell>
                  <TableCell>{contact.company?.name ?? "—"}</TableCell>
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
                        <DropdownMenuItem onClick={() => openEdit(contact)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(contact)}
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

      <ContactForm
        contact={editing}
        companies={companies}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}
