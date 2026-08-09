import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export type MyProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
};

export const myProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome").max(120),
  phone: z.string().trim().min(8, "Telefone inválido").max(20, "Telefone inválido"),
  address: z.string().trim().max(200).optional().or(z.literal("")),
});

export type MyProfileInput = z.infer<typeof myProfileSchema>;

export async function getMyProfile(): Promise<MyProfile | null> {
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, address")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as MyProfile | null;
}

export async function updateMyProfile(input: MyProfileInput) {
  const p = myProfileSchema.parse(input);
  const { data: session } = await supabase.auth.getUser();
  const uid = session.user?.id;
  if (!uid) throw new Error("Faça login para atualizar seus dados");
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: p.full_name,
      phone: p.phone,
      address: p.address || null,
    })
    .eq("id", uid);
  if (error) throw error;
}

/** Status em que o cliente ainda pode alterar o próprio agendamento. */
export const EDITABLE_STATUS = ["pendente", "confirmado"] as const;

export const myAppointmentSchema = z.object({
  service_id: z.string().uuid("Escolha o serviço"),
  guest_phone: z.string().trim().min(8, "Telefone inválido").max(20, "Telefone inválido"),
  scheduled_at: z.string().min(1, "Escolha data e hora"),
});

export type MyAppointmentInput = z.infer<typeof myAppointmentSchema>;

export async function updateMyAppointment(id: string, input: MyAppointmentInput) {
  const p = myAppointmentSchema.parse(input);

  const { data: before } = await supabase
    .from("appointments")
    .select("scheduled_at, status, service_id, guest_phone")
    .eq("id", id)
    .maybeSingle();

  const newScheduled = new Date(p.scheduled_at).toISOString();
  const { error } = await supabase
    .from("appointments")
    .update({
      service_id: p.service_id,
      guest_phone: p.guest_phone,
      scheduled_at: newScheduled,
      // Ao adiar, o agendamento volta para confirmação da equipe.
      status: "pendente",
    })
    .eq("id", id);
  if (error) throw error;

  const entries: Parameters<typeof logAppointmentChange>[0] = [];
  if (before && before.scheduled_at !== newScheduled) {
    entries.push({
      appointment_id: id,
      change_type: "adiado",
      old_scheduled_at: before.scheduled_at,
      new_scheduled_at: newScheduled,
      old_status: before.status,
      new_status: "pendente",
    });
  }
  if (before && before.service_id !== p.service_id) {
    entries.push({ appointment_id: id, change_type: "servico_alterado" });
  }
  if (before && (before.guest_phone ?? "") !== p.guest_phone) {
    entries.push({ appointment_id: id, change_type: "contato_alterado" });
  }
  await logAppointmentChange(entries);
}

export async function cancelMyAppointment(id: string) {
  const { data: before } = await supabase
    .from("appointments")
    .select("status, scheduled_at")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelado" })
    .eq("id", id);
  if (error) throw error;

  await logAppointmentChange([
    {
      appointment_id: id,
      change_type: "cancelado",
      old_status: before?.status ?? null,
      new_status: "cancelado",
      old_scheduled_at: before?.scheduled_at ?? null,
    },
  ]);
}

