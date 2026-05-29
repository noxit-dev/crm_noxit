"use server"

import { revalidatePath } from "next/cache"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppText } from "@/lib/whatsapp"
import type { Message } from "@/lib/types"

export type ActionState = { error?: string; success?: boolean } | undefined

const SendSchema = z.object({
  lead_id: z.string().min(1, { error: "Missing lead id." }),
  body: z.string().trim().min(1, { error: "Message can't be empty." }),
})

function firstError(error: z.ZodError) {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >
  return fieldErrors.body?.[0] ?? fieldErrors.lead_id?.[0] ?? "Invalid input."
}

// RLS auto-scopes to the caller's rows. Oldest-first for chat order;
// sent_at may be null on rows that never sent, so fall back to created_at.
export async function listMessages(leadId: string): Promise<Message[]> {
  if (!leadId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("sent_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
  if (error) return []
  return data as Message[]
}

export async function sendWhatsAppMessage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = SendSchema.safeParse({
    lead_id: formData.get("lead_id"),
    body: formData.get("body"),
  })
  if (!parsed.success) return { error: firstError(parsed.error) }

  const { lead_id, body } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  // Resolve recipient phone from the lead's primary contact (RLS-scoped).
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("primary_contact:contacts!primary_contact_id(phone)")
    .eq("id", lead_id)
    .single()
  if (leadError) return { error: leadError.message }

  // Supabase infers the embedded relation as an array; normalize to one row.
  const contact = lead?.primary_contact as
    | { phone: string | null }
    | { phone: string | null }[]
    | null
  const row = Array.isArray(contact) ? contact[0] : contact
  const phone = row?.phone?.trim()
  if (!phone) return { error: "Lead has no contact phone number." }

  let messageId: string
  try {
    const result = await sendWhatsAppText(phone, body)
    messageId = result.messageId
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to send WhatsApp message." }
  }

  const { error } = await supabase.from("messages").insert({
    lead_id,
    channel: "whatsapp",
    direction: "outbound",
    to_address: phone,
    body,
    whatsapp_message_id: messageId,
    sent_at: new Date().toISOString(),
    user_id: user.id,
  })
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}
