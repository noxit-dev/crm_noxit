import { createClient } from "@/lib/supabase/server"
import type { Company, ContactWithCompany } from "@/lib/types"
import { ContactsTable } from "@/components/contacts/contacts-table"

export default async function ContactsPage() {
  const supabase = await createClient()

  const [contactsRes, companiesRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, company:companies(id, name)")
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name").order("name"),
  ])

  return (
    <ContactsTable
      contacts={(contactsRes.data as ContactWithCompany[]) ?? []}
      companies={(companiesRes.data as Pick<Company, "id" | "name">[]) ?? []}
    />
  )
}
