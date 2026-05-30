"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlusIcon, XIcon, SendIcon } from "lucide-react";
import { sendWhatsAppTemplateMessage, type ActionState } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SendTemplateForm({
  leadId,
  onSuccess,
  onCancel,
}: {
  leadId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [params, setParams] = useState<string[]>([""]);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    sendWhatsAppTemplateMessage,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onSuccess();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  function updateParam(index: number, value: string) {
    setParams((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addParam() {
    setParams((prev) => [...prev, ""]);
  }

  function removeParam(index: number) {
    setParams((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-lg border p-3">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="params" value={JSON.stringify(params.filter((p) => p.trim()))} />

      <input type="hidden" name="language" value="es" />

      <div className="flex flex-col gap-1">
        <Label htmlFor="template_name" className="text-xs">Template</Label>
        <select
          id="template_name"
          name="template_name"
          required
          defaultValue=""
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring h-8 w-full rounded-md border px-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
        >
          <option value="" disabled>Select template…</option>
          <option value="appointment_cancellation_noxit">Appointment cancellation</option>
          <option value="appointment_confirmation_noxit">Appointment confirmation</option>
          <option value="follow_up_whatsapp">Follow up</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Params (positional: {`{{1}}`}, {`{{2}}`}, …)</Label>
        {params.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-muted-foreground w-5 text-right text-xs">{i + 1}</span>
            <Input
              value={p}
              onChange={(e) => updateParam(i, e.target.value)}
              placeholder={`Param ${i + 1}`}
              className="h-8 text-sm"
            />
            {params.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => removeParam(i)}
              >
                <XIcon className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-fit gap-1 text-xs"
          onClick={addParam}
        >
          <PlusIcon className="size-3.5" />
          Add param
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
          <SendIcon className="size-3.5" />
          Send template
        </Button>
      </div>
    </form>
  );
}
