"use server"

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"

export type ActionState = { error?: string; success?: boolean } | undefined

const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().nullable()
)

const ContactSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.email({ error: "Enter a valid email." }).nullable()
  ),
  phone: optionalText,
  company_id: optionalText, // "" / "none" → null handled below
})

function parse(formData: FormData) {
  const rawCompany = formData.get("company_id")
  return ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company_id: rawCompany === "none" ? null : rawCompany,
  })
}

function firstError(error: z.ZodError) {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >
  return (
    fieldErrors.name?.[0] ??
    fieldErrors.email?.[0] ??
    fieldErrors.phone?.[0] ??
    fieldErrors.company_id?.[0] ??
    "Invalid input."
  )
}

export async function createContact(
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
    .from("contacts")
    .insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: error.message }

  revalidatePath("/contacts")
  return { success: true }
}

export async function updateContact(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id")
  if (typeof id !== "string" || !id) return { error: "Missing contact id." }

  const parsed = parse(formData)
  if (!parsed.success) return { error: firstError(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase
    .from("contacts")
    .update(parsed.data)
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/contacts")
  return { success: true }
}

export async function deleteContact(id: string): Promise<ActionState> {
  if (!id) return { error: "Missing contact id." }

  const supabase = await createClient()
  const { error } = await supabase.from("contacts").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/contacts")
  return { success: true }
}
