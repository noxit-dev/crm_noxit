"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: boolean } | undefined;

// Empty form fields arrive as "" — normalize to null for nullable columns.
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().nullable(),
);

const CompanySchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  industry: optionalText,
  website: optionalText,
  phone: optionalText,
});

function parse(formData: FormData) {
  return CompanySchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    website: formData.get("website"),
    phone: formData.get("phone"),
  });
}

function firstError(error: z.ZodError) {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  return (
    fieldErrors.name?.[0] ??
    fieldErrors.industry?.[0] ??
    fieldErrors.website?.[0] ??
    fieldErrors.phone?.[0] ??
    "Invalid input."
  );
}

export async function createCompany(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  console.log(
    "%ccrm_next\lib\actions\companies.ts:49 formData",
    "color: white; background-color: #007acc;",
    formData,
  );
  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("companies")
    .insert({ ...parsed.data, user_id: user.id });
  if (error) return { error: error.message };

  revalidatePath("/companies");
  return { success: true };
}

export async function updateCompany(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing company id." };

  const parsed = parse(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  // RLS ("user owns row") restricts the update to the caller's rows.
  const { error } = await supabase
    .from("companies")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/companies");
  return { success: true };
}

export async function deleteCompany(id: string): Promise<ActionState> {
  if (!id) return { error: "Missing company id." };

  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/companies");
  revalidatePath("/contacts"); // contacts.company_id → SET NULL on delete
  return { success: true };
}
