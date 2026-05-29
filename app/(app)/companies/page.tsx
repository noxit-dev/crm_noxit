import { createClient } from "@/lib/supabase/server"
import type { Company } from "@/lib/types"
import { CompaniesTable } from "@/components/companies/companies-table"

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false })

  return <CompaniesTable companies={(data as Company[]) ?? []} />
}
