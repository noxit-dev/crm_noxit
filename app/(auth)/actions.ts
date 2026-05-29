"use server"

import { redirect } from "next/navigation"
import * as z from "zod"
import { createClient } from "@/lib/supabase/server"

const CredentialsSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
  password: z
    .string()
    .min(6, { error: "Password must be at least 6 characters." }),
})

export type AuthState = { error?: string } | undefined

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).fieldErrors.email?.[0]
      ?? "Invalid credentials." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: error.message }

  redirect("/dashboard")
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors
    return { error: fieldErrors.email?.[0] ?? fieldErrors.password?.[0]
      ?? "Invalid input." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp(parsed.data)
  if (error) return { error: error.message }

  // config.toml has enable_confirmations=false, so the session is active now.
  redirect("/dashboard")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
