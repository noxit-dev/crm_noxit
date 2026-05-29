"use client"

import { useActionState, useEffect, useRef, useTransition } from "react"
import { toast } from "sonner"
import { PlusIcon, Trash2Icon } from "lucide-react"
import {
  createTask,
  deleteTask,
  toggleTask,
  type ActionState,
} from "@/lib/actions/tasks"
import type { Task } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

function formatDue(due: string | null) {
  if (!due) return null
  // due_date is a plain date string (YYYY-MM-DD) — parse as local, no tz shift.
  const [y, m, d] = due.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function TaskList({
  leadId,
  tasks,
  refresh,
}: {
  leadId: string
  tasks: Task[]
  refresh: () => void
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createTask,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [isMutating, startTransition] = useTransition()

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset() // clear the uncontrolled inputs
      refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, refresh])

  function handleToggle(task: Task, completed: boolean) {
    startTransition(async () => {
      const result = await toggleTask(task.id, completed)
      if (result?.error) toast.error(result.error)
      else refresh()
    })
  }

  function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    startTransition(async () => {
      const result = await deleteTask(task.id)
      if (result?.error) toast.error(result.error)
      else {
        toast.success("Task deleted.")
        refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction} className="flex items-end gap-2">
        <input type="hidden" name="lead_id" value={leadId} />
        <div className="grid flex-1 gap-1">
          <Input name="title" placeholder="New task…" required />
        </div>
        <Input name="due_date" type="date" className="w-36" />
        <Button type="submit" size="icon" disabled={pending}>
          <PlusIcon />
          <span className="sr-only">Add task</span>
        </Button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No tasks yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tasks.map((task) => {
            const due = formatDue(task.due_date)
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                <Checkbox
                  checked={task.completed}
                  disabled={isMutating}
                  onCheckedChange={(c) => handleToggle(task, c === true)}
                />
                <span
                  className={`flex-1 text-sm ${
                    task.completed
                      ? "text-muted-foreground line-through"
                      : ""
                  }`}
                >
                  {task.title}
                </span>
                {due && <Badge variant="secondary">{due}</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={isMutating}
                  onClick={() => handleDelete(task)}
                >
                  <Trash2Icon className="size-4" />
                  <span className="sr-only">Delete task</span>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
