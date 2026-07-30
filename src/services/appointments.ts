import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const petSizeEnum = z.enum(["pequeno", "medio", "grande", "gigante"]);
export type PetSize = z.infer<typeof petSizeEnum>;

export const guestAppointmentSchema = z.object({
  guest_name: z.string().trim().min(2, "Informe seu nome").max(120),
  guest_phone: z
    .string()
    .trim()
    .min(8, "Telefone inválido")
    .max(20, "Telefone inválido"),
  guest_pet_name: z.string().trim().min(1, "Nome do pet").max(60),
  guest_pet_size: petSizeEnum,
  service_id: z.string().uuid(),
  scheduled_at: z.string().min(1, "Escolha data e hora"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type GuestAppointmentInput = z.infer<typeof guestAppointmentSchema>;

export async function createGuestAppointment(input: GuestAppointmentInput) {
  const payload = guestAppointmentSchema.parse(input);
  // Se houver sessão ativa, o agendamento fica vinculado ao cliente logado.
  const { data: sessionData } = await supabase.auth.getSession();
  const customerId = sessionData.session?.user.id ?? null;

  // Sem .select(): visitantes (anon) não têm permissão de leitura na tabela,
  // e pedir a linha de volta faria o insert falhar com erro de RLS.
  const { error } = await supabase.from("appointments").insert({
    customer_id: customerId,
    service_id: payload.service_id,
    guest_name: payload.guest_name,
    guest_phone: payload.guest_phone,
    guest_pet_name: payload.guest_pet_name,
    guest_pet_size: payload.guest_pet_size,
    scheduled_at: new Date(payload.scheduled_at).toISOString(),
    notes: payload.notes || null,
    status: "pendente",
  });
  if (error) throw error;
  return { ok: true };
}

export async function listMyAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, status, notes, service:services(name, price_cents, duration_minutes)"
    )
    .order("scheduled_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
