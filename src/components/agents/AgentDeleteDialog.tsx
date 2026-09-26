import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgentOption { id: string; name: string; phone?: string | null; company_name?: string | null }
interface Props {
  agent: AgentOption | null;
  alternatives: AgentOption[];
  onClose: () => void;
  onDeleted: () => void;
}

export function AgentDeleteDialog({ agent, alternatives, onClose, onDeleted }: Props) {
  const agentId = agent?.id;
  const [usage, setUsage] = useState<{ booking_count: number; enquiry_count: number } | null>(null);
  const [error, setError] = useState("");
  const [replacement, setReplacement] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    setUsage(null); setError(""); setReplacement("");
    if (agentId) supabase.rpc("get_agent_usage", { p_agent_id: agentId }).then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      else if (data?.[0]) setUsage(data[0]);
      else setError("Unable to check linked records. Please try again.");
    });
    return () => { active = false; };
  }, [agentId]);

  const linked = !!usage && (usage.booking_count > 0 || usage.enquiry_count > 0);
  const submit = async () => {
    if (!agent || !usage || saving || (linked && !replacement)) return;
    setSaving(true); setError("");
    const { error } = await supabase.rpc("delete_or_merge_agent", {
      p_agent_id: agent.id,
      ...(replacement ? { p_replacement_id: replacement } : {}),
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    toast.success(linked ? "Duplicate removed; bookings and enquiries moved to the agent you kept" : "Agent deleted successfully");
    onDeleted(); onClose();
  };

  return <Dialog open={!!agent} onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>{linked ? "Merge and remove duplicate agent" : "Delete agent"}</DialogTitle><DialogDescription>
        {agent?.name}{agent?.phone ? ` (${agent.phone})` : ""}
      </DialogDescription></DialogHeader>
      {!usage && !error && <p>Checking linked bookings and enquiries…</p>}
      {usage && (linked ? <>
        <p>This agent has {usage.booking_count} booking(s) and {usage.enquiry_count} enquiry(s). Select the duplicate agent to keep. These records will move to it before this agent is deleted.</p>
        <label htmlFor="agent-to-keep" className="text-sm font-medium">Agent to keep</label>
        <select id="agent-to-keep" value={replacement} onChange={event => setReplacement(event.target.value)} disabled={saving} className="border rounded p-2 w-full bg-background">
          <option value="">--Choose the agent to keep--</option>
          {alternatives.filter(option => option.id !== agent?.id).map(option => <option key={option.id} value={option.id}>{option.name}{option.company_name ? ` — ${option.company_name}` : ""}{option.phone ? ` — ${option.phone}` : ""} ({option.id.slice(0, 8)})</option>)}
        </select>
        <p className="text-sm text-muted-foreground">The kept agent's name, commission, and contact details stay unchanged. No bookings or payment records will be deleted.</p>
      </> : <p>This agent has no linked bookings or enquiries. Delete it permanently?</p>)}
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <DialogFooter><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button variant="destructive" onClick={submit} disabled={saving || !usage || (linked && !replacement)}>{saving ? "Saving…" : linked ? "Merge and delete duplicate" : "Delete agent"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
