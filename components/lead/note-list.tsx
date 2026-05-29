"use client"

import { useActionState, useEffect, useRef, useTransition } from "react"
import { toast } from "sonner"
import { Trash2Icon } from "lucide-react"
import {
  createNote,
  deleteNote,
  type ActionState,
} from "@/lib/actions/notes"
import type { Note } from "@/lib/types"
import { Button } from "@/components/ui/button"

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function NoteList({
  leadId,
  notes,
  refresh,
}: {
  leadId: string
  notes: Note[]
  refresh: () => void
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createNote,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [isMutating, startTransition] = useTransition()

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset() // clear the textarea
      refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, refresh])

  function handleDelete(note: Note) {
    if (!window.confirm("Delete this note?")) return
    startTransition(async () => {
      const result = await deleteNote(note.id)
      if (result?.error) toast.error(result.error)
      else {
        toast.success("Note deleted.")
        refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="lead_id" value={leadId} />
        <textarea
          name="body"
          required
          rows={3}
          placeholder="Add a note…"
          className="border-input bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 flex w-full resize-y rounded-md border px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="submit" className="self-end" disabled={pending}>
          {pending ? "Adding…" : "Add note"}
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No notes yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1 text-sm whitespace-pre-wrap">
                  {note.body}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={isMutating}
                  onClick={() => handleDelete(note)}
                >
                  <Trash2Icon className="size-4" />
                  <span className="sr-only">Delete note</span>
                </Button>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatWhen(note.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
