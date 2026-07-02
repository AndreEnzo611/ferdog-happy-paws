import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signUp, signInWithGoogle } from "@/services/auth";

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

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await signIn({
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
      });
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/minha-conta" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await signUp({
        full_name: String(fd.get("full_name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
      });
      toast.success("Conta criada! Você já pode entrar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar");
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
                  <Button type="submit" className="w-full" disabled={busy}>Entrar</Button>
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
                    <Input id="su-phone" name="phone" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass">Senha</Label>
                    <Input id="su-pass" name="password" type="password" minLength={6} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>Criar conta</Button>
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
