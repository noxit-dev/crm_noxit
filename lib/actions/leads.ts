"use server"

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import { LEAD_STAGES, type LeadStage } from "@/lib/types"

export type ActionState = { error?: string; success?: boolean } | undefined

// Empty form fields arrive as "" — normalize to null for nullable columns.
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().nullable()
)

const optionalNumber = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.coerce.number({ error: "Value must be a number." }).nullable()
)

const LeadSchema = z.object({
  title: z.string().trim().min(1, { error: "Title is required." }),
  stage: z.enum(LEAD_STAGES as [LeadStage, ...LeadStage[]], {
    error: "Invalid stage.",
  }),
  project_tag: optionalText,
  company_id: optionalText, // "none" → null handled below
  primary_contact_id: optionalText,
  value: optionalNumber,
})

function parse(formData: FormData) {
  const rawCompany = formData.get("company_id")
  const rawContact = formData.get("primary_contact_id")
  return LeadSchema.safeParse({
    title: formData.get("title"),
    stage: formData.get("stage") ?? "lead",
    project_tag: formData.get("project_tag"),
    company_id: rawCompany === "none" ? null : rawCompany,
    primary_contact_id: rawContact === "none" ? null : rawContact,
    value: formData.get("value"),
  })
}

function firstError(error: z.ZodError) {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >
  return (
    fieldErrors.title?.[0] ??
    fieldErrors.stage?.[0] ??
    fieldErrors.value?.[0] ??
    fieldErrors.project_tag?.[0] ??
    fieldErrors.company_id?.[0] ??
    fieldErrors.primary_contact_id?.[0] ??
    "Invalid input."
  )
}

export async function createLead(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parse(formData)
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { error } = await supabase
    .from("leads")
    .insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateLead(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id")
  if (typeof id !== "string" || !id) return { error: "Missing lead id." }

  const parsed = parse(formData)
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  // RLS ("user owns row") restricts the update to the caller's rows.
  const { error } = await supabase
    .from("leads")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

// Drag-and-drop stage move. Plain fn (not useActionState) — called from onDragEnd.
export async function moveLeadStage(
  id: string,
  stage: LeadStage
): Promise<ActionState> {
  if (!id) return { error: "Missing lead id." }
  if (!LEAD_STAGES.includes(stage)) return { error: "Invalid stage." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("leads")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteLead(id: string): Promise<ActionState> {
  if (!id) return { error: "Missing lead id." }

  const supabase = await createClient()
  const { error } = await supabase.from("leads").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}
