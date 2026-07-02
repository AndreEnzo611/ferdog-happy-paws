import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome").max(120),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  email: z.string().trim().email("Email inválido").max(200),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export async function signUp(input: SignUpInput) {
  const data = signUpSchema.parse(input);
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { full_name: data.full_name, phone: data.phone },
    },
  });
  if (error) throw error;
}

export async function signIn(input: SignInInput) {
  const data = signInSchema.parse(input);
  const { error } = await supabase.auth.signInWithPassword(data);
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { lovable } = await import("@/integrations/lovable/index");
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
}
