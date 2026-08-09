import { supabase } from "@/integrations/supabase/client";

export type ChangeType =
  | "criado"
  | "adiado"
  | "cancelado"
  | "servico_alterado"
  | "status_alterado"
  | "contato_alterado";

export type AppointmentHistoryEntry = {
  id: string;
  appointment_id: string;
  change_type: ChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  old_scheduled_at: string | null;
  new_scheduled_at: string | null;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
};

export const CHANGE_LABEL: Record<ChangeType, string> = {
  criado: "Agendamento criado",
  adiado: "Adiado",
  cancelado: "Cancelado",
  servico_alterado: "Serviço alterado",
  status_alterado: "Status alterado",
  contato_alterado: "Contato alterado",
};

async function currentActor() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    name: profile?.full_name ?? user.email ?? "Usuário",
  };
}

export async function logAppointmentChange(entries: {
  appointment_id: string;
  change_type: ChangeType;
  old_scheduled_at?: string | null;
  new_scheduled_at?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  note?: string | null;
}[]) {
  if (entries.length === 0) return;
  const actor = await currentActor();
  const rows = entries.map((e) => ({
    appointment_id: e.appointment_id,
    change_type: e.change_type,
    changed_by: actor?.id ?? null,
    changed_by_name: actor?.name ?? null,
    old_scheduled_at: e.old_scheduled_at ?? null,
    new_scheduled_at: e.new_scheduled_at ?? null,
    old_status: (e.old_status ?? null) as never,
    new_status: (e.new_status ?? null) as never,
    note: e.note ?? null,
  }));
  // Histórico é informativo: uma falha aqui não deve derrubar a alteração.
  const { error } = await supabase.from("appointment_history").insert(rows);
  if (error) console.warn("Falha ao registrar histórico:", error.message);
}

export async function listAppointmentHistory(
  appointmentId: string,
): Promise<AppointmentHistoryEntry[]> {
  const { data, error } = await supabase
    .from("appointment_history")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AppointmentHistoryEntry[];
}
