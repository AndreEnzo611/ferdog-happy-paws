import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

/* ---------------- Serviços ---------------- */

export type ManagedService = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  active: boolean;
};

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  price_cents: z.number().int().min(0, "Preço inválido").max(10_000_00),
  duration_minutes: z.number().int().min(10, "Mínimo 10 min").max(480),
  active: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export async function listAllServices(): Promise<ManagedService[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, price_cents, duration_minutes, active")
    .order("price_cents", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ManagedService[];
}

export async function createService(input: ServiceInput) {
  const p = serviceSchema.parse(input);
  const { error } = await supabase.from("services").insert({
    name: p.name,
    description: p.description || null,
    price_cents: p.price_cents,
    duration_minutes: p.duration_minutes,
    active: p.active,
  });
  if (error) throw error;
}

export async function updateService(id: string, input: ServiceInput) {
  const p = serviceSchema.parse(input);
  const { error } = await supabase
    .from("services")
    .update({
      name: p.name,
      description: p.description || null,
      price_cents: p.price_cents,
      duration_minutes: p.duration_minutes,
      active: p.active,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteService(id: string) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Clientes ---------------- */

export type ManagedClient = {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
};

export const clientSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome").max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;

export async function listClients(): Promise<ManagedClient[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, address, created_at")
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ManagedClient[];
}

export async function updateClient(id: string, input: ClientInput) {
  const p = clientSchema.parse(input);
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: p.full_name,
      phone: p.phone || null,
      address: p.address || null,
    })
    .eq("id", id);
  if (error) throw error;
}
