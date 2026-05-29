"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { SendIcon } from "lucide-react"
import {
  sendWhatsAppMessage,
  type ActionState,
} from "@/lib/actions/messages"
import { createClient } from "@/lib/supabase/client"
import type { Message } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function MessageThread({
  leadId,
  messages,
  refresh,
  canSend,
}: {
  leadId: string
  messages: Message[]
  refresh: () => void
  canSend: boolean
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    sendWhatsAppMessage,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, refresh])

  // Live updates: refresh on any new message row for this lead (inbound or
  // outbound). RLS applies to authenticated postgres_changes; the messages
  // table is already in the supabase_realtime publication.
  useEffect(() => {
    if (!leadId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `lead_id=eq.${leadId}`,
        },
        () => refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId, refresh])

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No messages yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {messages.map((msg) => {
            const outbound = msg.direction === "outbound"
            return (
              <li
                key={msg.id}
                className={`flex flex-col ${outbound ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    outbound
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.body}
                </div>
                <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {msg.channel}
                  </Badge>
                  <span>{formatWhen(msg.sent_at ?? msg.created_at)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {canSend ? (
        <form ref={formRef} action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="lead_id" value={leadId} />
          <Input
            name="body"
            required
            placeholder="Type a WhatsApp message…"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="shrink-0" disabled={pending}>
            <SendIcon className="size-4" />
            <span className="sr-only">Send WhatsApp message</span>
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground text-center text-xs">
          Add a primary contact with a phone number to send WhatsApp messages.
        </p>
      )}
    </div>
  )
}
