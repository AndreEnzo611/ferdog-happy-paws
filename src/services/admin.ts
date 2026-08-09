import { supabase } from "@/integrations/supabase/client";
import { logAppointmentChange } from "./history";

export type AppRole = "admin" | "staff" | "cliente";

export type AdminAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_pet_name: string | null;
  guest_pet_size: string | null;
  customer_id: string | null;
  service: { name: string; price_cents: number; duration_minutes: number } | null;
};

export async function getMyRoles(): Promise<AppRole[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}

export async function listAllAppointments(): Promise<AdminAppointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, status, notes, guest_name, guest_phone, guest_pet_name, guest_pet_size, customer_id, service:services(name, price_cents, duration_minutes)"
    )
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AdminAppointment[];
}

export async function updateAppointmentStatus(id: string, status: string) {
  const { data: before } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("appointments")
    .update({ status: status as never })
    .eq("id", id);
  if (error) throw error;

  await logAppointmentChange([
    {
      appointment_id: id,
      change_type: status === "cancelado" ? "cancelado" : "status_alterado",
      old_status: before?.status ?? null,
      new_status: status,
    },
  ]);
}
