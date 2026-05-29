"use server"

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import type { Note } from "@/lib/types"

export type ActionState = { error?: string; success?: boolean } | undefined

const NoteSchema = z.object({
  lead_id: z.string().min(1, { error: "Missing lead id." }),
  body: z.string().trim().min(1, { error: "Note can't be empty." }),
})

function firstError(error: z.ZodError) {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >
  return fieldErrors.body?.[0] ?? fieldErrors.lead_id?.[0] ?? "Invalid input."
}

// RLS auto-scopes to the caller's rows.
export async function listNotes(leadId: string): Promise<Note[]> {
  if (!leadId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
  if (error) return []
  return data as Note[]
}

export async function createNote(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = NoteSchema.safeParse({
    lead_id: formData.get("lead_id"),
    body: formData.get("body"),
  })
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { error } = await supabase
    .from("notes")
    .insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteNote(id: string): Promise<ActionState> {
  if (!id) return { error: "Missing note id." }

  const supabase = await createClient()
  const { error } = await supabase.from("notes").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}
