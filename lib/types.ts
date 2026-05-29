// Domain types mirroring the Supabase schema (PRD Section 1).
// No generated Supabase types yet — keep these in sync with the migration.

export type Company = {
  id: string
  name: string
  industry: string | null
  website: string | null
  phone: string | null
  user_id: string
  created_at: string
}

export type Contact = {
  id: string
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  user_id: string
  created_at: string
}

// Contact joined with its company name (page query convenience).
export type ContactWithCompany = Contact & {
  company: Pick<Company, "id" | "name"> | null
}

export type LeadStage =
  | "lead"
  | "opportunity"
  | "contacted"
  | "working"
  | "closed"

export const LEAD_STAGES: LeadStage[] = [
  "lead",
  "opportunity",
  "contacted",
  "working",
  "closed",
]

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  lead: "Lead",
  opportunity: "Opportunity",
  contacted: "Contacted",
  working: "Working",
  closed: "Closed",
}

export type Lead = {
  id: string
  title: string
  stage: LeadStage
  project_tag: string | null
  company_id: string | null
  primary_contact_id: string | null
  value: number | null
  user_id: string
  created_at: string
  updated_at: string
}

// Lead joined with company name + primary contact name (board query convenience).
export type LeadWithRelations = Lead & {
  company: Pick<Company, "id" | "name"> | null
  primary_contact: Pick<Contact, "id" | "name"> | null
}

export type Task = {
  id: string
  lead_id: string
  title: string
  due_date: string | null
  completed: boolean
  user_id: string
  created_at: string
}

export type Note = {
  id: string
  lead_id: string
  body: string
  user_id: string
  created_at: string
}

export type MessageChannel = "whatsapp" | "email"
export type MessageDirection = "inbound" | "outbound"

// Mirrors the messages table. Note: dedup col is email_message_id
// (renamed from gmail_message_id in migration 20260528000001).
export type Message = {
  id: string
  lead_id: string
  channel: MessageChannel
  direction: MessageDirection
  from_address: string | null
  to_address: string | null
  subject: string | null
  body: string | null
  whatsapp_message_id: string | null
  email_message_id: string | null
  sent_at: string | null
  user_id: string
  created_at: string
}

// Insert/update payloads omit DB-managed columns.
export type CompanyInput = Omit<Company, "id" | "user_id" | "created_at">
export type ContactInput = Omit<Contact, "id" | "user_id" | "created_at">
export type LeadInput = Omit<
  Lead,
  "id" | "user_id" | "created_at" | "updated_at"
>
// completed defaults false in the DB.
export type TaskInput = Omit<
  Task,
  "id" | "user_id" | "created_at" | "completed"
>
export type NoteInput = Omit<Note, "id" | "user_id" | "created_at">
