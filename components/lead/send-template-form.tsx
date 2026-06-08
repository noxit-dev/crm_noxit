"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SendIcon } from "lucide-react";
import { sendWhatsAppTemplateMessage, type ActionState } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TEMPLATE_DEFS: Record<string, { labels: string[]; hasButton: boolean }> = {
  appointment_confirmation_noxit: {
    labels: [
      "Client name",
      "Business name",
      "Product name",
      "Appointment date (YYYY-MM-DD)",
      "Appointment time (HH:MM)",
    ],
    hasButton: true,
  },
  appointment_cancellation_noxit: {
    labels: [
      "Client name",
      "Business name",
      "Appointment date (YYYY-MM-DD)",
      "Appointment time (HH:MM)",
    ],
    hasButton: true,
  },
  follow_up_whatsapp: {
    labels: ["Client name", "Business name", "Message"],
    hasButton: false,
  },
}

export function SendTemplateForm({
  leadId,
  onSuccess,
  onCancel,
}: {
  leadId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [params, setParams] = useState<string[]>([]);
  const [buttonSuffix, setButtonSuffix] = useState("");
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

  function handleTemplateChange(name: string) {
    const def = TEMPLATE_DEFS[name];
    setSelectedTemplate(name);
    setParams(def ? Array(def.labels.length).fill("") : []);
    setButtonSuffix("");
  }

  function updateParam(index: number, value: string) {
    setParams((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  const def = TEMPLATE_DEFS[selectedTemplate];

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-lg border p-3">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="language" value="es" />
      <input type="hidden" name="params" value={JSON.stringify(params)} />
      <input type="hidden" name="button_suffix" value={buttonSuffix} />

      <div className="flex flex-col gap-1">
        <Label htmlFor="template_name" className="text-xs">Template</Label>
        <select
          id="template_name"
          name="template_name"
          required
          value={selectedTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="border-input bg-background ring-offset-background focus:ring-ring h-8 w-full rounded-md border px-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
        >
          <option value="" disabled>Select template…</option>
          <option value="appointment_cancellation_noxit">Appointment cancellation</option>
          <option value="appointment_confirmation_noxit">Appointment confirmation</option>
          <option value="follow_up_whatsapp">Follow up</option>
        </select>
      </div>

      {def && (
        <>
          <div className="flex flex-col gap-1.5">
            {params.map((p, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <Label className="text-xs text-muted-foreground">{def.labels[i]}</Label>
                <Input
                  value={p}
                  onChange={(e) => updateParam(i, e.target.value)}
                  placeholder={def.labels[i]}
                  required
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>

          {def.hasButton && (
            <div className="flex flex-col gap-0.5">
              <Label className="text-xs text-muted-foreground">Button URL suffix</Label>
              <Input
                value={buttonSuffix}
                onChange={(e) => setButtonSuffix(e.target.value)}
                placeholder="website.com?service=X&token=Y"
                className="h-8 text-sm"
              />
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || !selectedTemplate} className="gap-1.5">
          <SendIcon className="size-3.5" />
          Send template
        </Button>
      </div>
    </form>
  );
}
