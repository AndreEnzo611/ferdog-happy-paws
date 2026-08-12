import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signUp, signInWithGoogle, requestPasswordReset, resendConfirmation } from "@/services/auth";
import { formatPhoneBR } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — FerDog House" },
      { name: "description", content: "Acesse sua conta FerDog House para gerenciar pets e agendamentos." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValido = phoneDigits.length >= 10 && phoneDigits.length <= 11;

  async function handleResend(email: string) {
    setBusy(true);
    try {
      await resendConfirmation(email);
      toast.success("Novo email de confirmação enviado!");
      setInfo(`Reenviamos o link de confirmação para ${email}. Verifique também a caixa de spam.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível reenviar");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    setBusy(true);
    setInfo(null);
    setPendingEmail(null);
    try {
      await signIn({
        email,
        password: String(fd.get("password") ?? ""),
      });
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/minha-conta" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível entrar";
      setInfo(msg);
      if (msg.toLowerCase().includes("confirme seu email")) setPendingEmail(email);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!phoneValido) {
      setInfo("Informe um WhatsApp válido com DDD, ex.: (44) 99999-9999");
      toast.error("Telefone / WhatsApp inválido");
      return;
    }
    const email = String(fd.get("email") ?? "").trim();
    setBusy(true);
    setInfo(null);
    setPendingEmail(null);
    try {
      const { needsEmailConfirmation } = await signUp({
        full_name: String(fd.get("full_name") ?? ""),
        phone,
        email,
        password: String(fd.get("password") ?? ""),
      });
      if (needsEmailConfirmation) {
        setPendingEmail(email);
        setInfo(
          `Conta criada! Enviamos um link de confirmação para ${email}. Abra o link (verifique também a caixa de spam) e depois faça login.`,
        );
        toast.success("Verifique seu email para confirmar a conta.");
      } else {
        toast.success("Conta criada! Você já está conectado.");
        navigate({ to: "/minha-conta" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível cadastrar";
      setInfo(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(email: string) {
    if (!email) {
      toast.error("Digite seu email no campo acima primeiro");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setInfo("Enviamos um link de redefinição de senha para o seu email. Verifique também a caixa de spam.");
      toast.success("Link de redefinição enviado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar o link");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await signInWithGoogle();
    if (result.error) {
      toast.error("Falha ao entrar com Google");
      setBusy(false);
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sua conta FerDog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe seus pets e agendamentos.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="sr-only">Autenticação</CardTitle>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-pass">Senha</Label>
                    <Input id="si-pass" name="password" type="password" required />
                  </div>
                  {info && (
                    <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">{info}</p>
                  )}
                  {pendingEmail && (
                    <button
                      type="button"
                      className="w-full text-xs text-primary underline"
                      disabled={busy}
                      onClick={() => handleResend(pendingEmail)}
                    >
                      Reenviar email de confirmação
                    </button>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>Entrar</Button>
                  <button
                    type="button"
                    className="w-full text-xs text-primary underline"
                    disabled={busy}
                    onClick={() =>
                      handleForgot(
                        (document.getElementById("si-email") as HTMLInputElement | null)?.value.trim() ?? "",
                      )
                    }
                  >
                    Esqueci minha senha
                  </button>
                </form>

              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Nome completo</Label>
                    <Input id="su-name" name="full_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-phone">Telefone / WhatsApp</Label>
                    <Input
                      id="su-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="(44) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                      aria-invalid={phone.length > 0 && !phoneValido}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {phone.length > 0 && !phoneValido
                        ? "Informe DDD + número (10 ou 11 dígitos)."
                        : "Use DDD + número, ex.: (44) 99999-9999"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass">Senha</Label>
                    <Input id="su-pass" name="password" type="password" minLength={6} required />
                  </div>
                  {info && (
                    <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">{info}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>Criar conta</Button>
                  {pendingEmail && (
                    <button
                      type="button"
                      className="w-full text-xs text-primary underline"
                      disabled={busy}
                      onClick={() => handleResend(pendingEmail)}
                    >
                      Não recebeu? Reenviar email de confirmação
                    </button>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
              Continuar com Google
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Prefere não criar conta?{" "}
              <Link to="/agendamento" className="text-primary underline">
                Agende como visitante
              </Link>.
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
