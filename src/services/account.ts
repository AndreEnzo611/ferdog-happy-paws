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
});

export type MyAppointmentInput = z.infer<typeof myAppointmentSchema>;

export async function updateMyAppointment(id: string, input: MyAppointmentInput) {
  const p = myAppointmentSchema.parse(input);
  const { error } = await supabase
    .from("appointments")
    .update({ service_id: p.service_id, guest_phone: p.guest_phone })
    .eq("id", id);
  if (error) throw error;
}
