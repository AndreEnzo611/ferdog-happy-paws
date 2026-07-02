import { supabase } from "@/integrations/supabase/client";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  active: boolean;
};

export async function listActiveServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, price_cents, duration_minutes, active")
    .eq("active", true)
    .order("price_cents", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Service[];
}
