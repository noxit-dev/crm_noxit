"use server"

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import type { Task } from "@/lib/types"

export type ActionState = { error?: string; success?: boolean } | undefined

// Empty form fields arrive as "" — normalize to null for nullable columns.
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().nullable()
)

const TaskSchema = z.object({
  lead_id: z.string().min(1, { error: "Missing lead id." }),
  title: z.string().trim().min(1, { error: "Title is required." }),
  due_date: optionalText,
})

function firstError(error: z.ZodError) {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >
  return (
    fieldErrors.title?.[0] ??
    fieldErrors.due_date?.[0] ??
    fieldErrors.lead_id?.[0] ??
    "Invalid input."
  )
}

// RLS auto-scopes to the caller's rows.
export async function listTasks(leadId: string): Promise<Task[]> {
  if (!leadId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("lead_id", leadId)
    .order("completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
  if (error) return []
  return data as Task[]
}

export async function createTask(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = TaskSchema.safeParse({
    lead_id: formData.get("lead_id"),
    title: formData.get("title"),
    due_date: formData.get("due_date"),
  })
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { error } = await supabase
    .from("tasks")
    .insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function toggleTask(
  id: string,
  completed: boolean
): Promise<ActionState> {
  if (!id) return { error: "Missing task id." }

  const supabase = await createClient()
  // RLS ("user owns row") restricts the update to the caller's rows.
  const { error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteTask(id: string): Promise<ActionState> {
  if (!id) return { error: "Missing task id." }

  const supabase = await createClient()
  const { error } = await supabase.from("tasks").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}
