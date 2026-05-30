// WhatsApp Cloud API client (outbound only).
// Credentials come from env vars (WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN) — see .env.example.
// Server-only: never import this into a Client Component (it reads secret env).

const GRAPH_VERSION = "v21.0"

type WhatsAppSendResult = { messageId: string }

// Shape of Meta's Graph API error envelope (non-2xx responses).
type GraphError = { error?: { message?: string; code?: number } }

function endpoint(phoneNumberId: string) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`
}

async function postMessage(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID
  const accessToken = process.env.WA_ACCESS_TOKEN
  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp is not configured (missing WA_PHONE_NUMBER_ID / WA_ACCESS_TOKEN).")
  }

  const res = await fetch(endpoint(phoneNumberId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  })

  const json = (await res.json().catch(() => null)) as
    | { messages?: { id: string }[] }
    | GraphError
    | null

  if (!res.ok) {
    const message =
      (json as GraphError | null)?.error?.message ??
      `WhatsApp API error (HTTP ${res.status}).`
    throw new Error(message)
  }

  const messageId = (json as { messages?: { id: string }[] } | null)?.messages?.[0]?.id
  if (!messageId) throw new Error("WhatsApp API returned no message id.")
  return { messageId }
}

// Free-form text message. Only delivered inside Meta's 24h customer-service
// window; outside it Meta rejects with an error (surfaced to the caller).
export async function sendWhatsAppText(
  to: string,
  body: string
): Promise<WhatsAppSendResult> {
  return postMessage({ to, type: "text", text: { body } })
}

export interface WhatsAppTemplate {
  name: string
  language: string
  params?: string[]
}

// Template message for first-contact outside the 24h window.
// Meta requires a pre-approved template name + language code (e.g. "es", "en_US").
// Positional params map to {{1}}, {{2}}, … body variables in the template.
export async function sendWhatsAppTemplate(
  to: string,
  template: WhatsAppTemplate
): Promise<WhatsAppSendResult> {
  const components =
    template.params && template.params.length > 0
      ? [
          {
            type: "body",
            parameters: template.params.map((text) => ({ type: "text", text })),
          },
        ]
      : undefined

  return postMessage({
    to,
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language },
      ...(components ? { components } : {}),
    },
  })
}
