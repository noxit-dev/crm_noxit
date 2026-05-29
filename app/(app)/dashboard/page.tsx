import { createClient } from "@/lib/supabase/server"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import type { Company, Contact, LeadWithRelations } from "@/lib/types"

export default async function Page() {
  const supabase = await createClient()

  const [leadsRes, companiesRes, contactsRes] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "*, company:companies(id, name), primary_contact:contacts(id, name)"
      )
      .order("updated_at", { ascending: false }),
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("contacts").select("id, name, company_id").order("name"),
  ])

  const leads = (leadsRes.data ?? []) as unknown as LeadWithRelations[]
  const companies = (companiesRes.data ?? []) as Pick<Company, "id" | "name">[]
  const contacts = (contactsRes.data ?? []) as Pick<
    Contact,
    "id" | "name" | "company_id"
  >[]

  return (
    <div className="flex flex-1 flex-col">
      <KanbanBoard leads={leads} companies={companies} contacts={contacts} />
    </div>
  )
}
