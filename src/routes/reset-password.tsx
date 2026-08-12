import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/services/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — FerDog House" },
      { name: "description", content: "Defina uma nova senha para acessar sua conta FerDog House." },
      { property: "og:title", content: "Redefinir senha — FerDog House" },
      { property: "og:description", content: "Crie uma nova senha da sua conta FerDog House." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pass = String(fd.get("password") ?? "");
    if (pass !== String(fd.get("confirm") ?? "")) {
      toast.error("As senhas não conferem");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(pass);
      toast.success("Senha atualizada! Você já está conectado.");
      navigate({ to: "/minha-conta" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar a senha");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Definir nova senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rp-pass">Nova senha</Label>
                <Input id="rp-pass" name="password" type="password" minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rp-conf">Confirmar senha</Label>
                <Input id="rp-conf" name="confirm" type="password" minLength={6} required />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                Salvar senha
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Abra esta página pelo link enviado no seu email para poder alterar a senha. Se não encontrar o email, verifique a caixa de spam.
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
