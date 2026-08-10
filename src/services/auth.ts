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

function traduzErro(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email ou senha incorretos. Se você criou a conta com o Google, entre em 'Continuar com Google'. Esqueceu a senha? Use 'Esqueci minha senha'.";
  if (m.includes("email not confirmed"))
    return "Confirme seu email pelo link que enviamos antes de entrar.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Este email já tem conta. Faça login ou use 'Esqueci minha senha'.";
  if (m.includes("password")) return "Senha inválida: use no mínimo 6 caracteres.";
  return msg;
}

export async function signUp(input: SignUpInput) {
  const data = signUpSchema.parse(input);
  const { data: res, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { full_name: data.full_name, phone: data.phone },
    },
  });
  if (error) throw new Error(traduzErro(error.message));
  return { needsEmailConfirmation: !res.session };
}

export async function signIn(input: SignInInput) {
  const data = signInSchema.parse(input);
  const { error } = await supabase.auth.signInWithPassword(data);
  if (error) throw new Error(traduzErro(error.message));
}

export async function resendConfirmation(email: string) {
  const parsed = z.string().trim().email("Email inválido").parse(email);
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed,
    options: { emailRedirectTo: `${window.location.origin}/` },
  });
  if (error) throw new Error(traduzErro(error.message));
}

export async function requestPasswordReset(email: string) {
  const parsed = z.string().trim().email("Email inválido").parse(email);
  const { error } = await supabase.auth.resetPasswordForEmail(parsed, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(traduzErro(error.message));
}

export async function updatePassword(password: string) {
  const parsed = z.string().min(6, "Mínimo de 6 caracteres").parse(password);
  const { error } = await supabase.auth.updateUser({ password: parsed });
  if (error) throw new Error(traduzErro(error.message));
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

