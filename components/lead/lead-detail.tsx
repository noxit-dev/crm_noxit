"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { listTasks } from "@/lib/actions/tasks";
import { listNotes } from "@/lib/actions/notes";
import { listMessages } from "@/lib/actions/messages";
import {
  LEAD_STAGE_LABELS,
  type LeadWithRelations,
  type Message,
  type Note,
  type Task,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/lead/task-list";
import { NoteList } from "@/components/lead/note-list";
import { MessageThread } from "@/components/lead/message-thread";

export function LeadDetail({
  lead,
  open,
  onOpenChange,
}: {
  lead: LeadWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isLoading, startTransition] = useTransition();

  const leadId = lead?.id;

  const refresh = useCallback(() => {
    if (!leadId) return;
    startTransition(async () => {
      const [t, n, m] = await Promise.all([
        listTasks(leadId),
        listNotes(leadId),
        listMessages(leadId),
      ]);
      setTasks(t);
      setNotes(n);
      setMessages(m);
      setLoaded(true);
    });
  }, [leadId]);

  // Lazy-load when the slide-over opens for a lead.
  useEffect(() => {
    if (open && leadId) refresh();
  }, [open, leadId, refresh]);

  const subtitle = [lead?.company?.name, lead && LEAD_STAGE_LABELS[lead.stage]]
    .filter(Boolean)
    .join(" · ");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{lead?.title ?? "Lead"}</SheetTitle>
          <SheetDescription>{subtitle || "Lead detail"}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6">
          {!leadId ? null : !loaded && isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="tasks">
              <TabsList className="w-full">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>
              <TabsContent value="tasks" className="mt-4">
                <TaskList leadId={leadId} tasks={tasks} refresh={refresh} />
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <NoteList leadId={leadId} notes={notes} refresh={refresh} />
              </TabsContent>
              <TabsContent value="messages" className="mt-4">
                <MessageThread
                  leadId={leadId}
                  messages={messages}
                  refresh={refresh}
                  canSend={!!lead?.primary_contact}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
