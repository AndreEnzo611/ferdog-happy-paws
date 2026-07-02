import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listActiveServices } from "@/services/services";
import {
  createGuestAppointment,
  guestAppointmentSchema,
} from "@/services/appointments";
import { formatBRL, formatDuration } from "@/lib/format";

const searchSchema = z.object({
  service: z.string().optional(),
});

export const Route = createFileRoute("/agendamento")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Agendar Banho e Tosa — FerDog House" },
      { name: "description", content: "Reserve um horário para o banho e tosa do seu pet no FerDog House." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const { service: preselected } = Route.useSearch();
  const { data: services, isLoading } = useQuery({
    queryKey: ["services", "active"],
    queryFn: listActiveServices,
  });
  const [serviceId, setServiceId] = useState<string>(preselected ?? "");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const parsed = guestAppointmentSchema.parse({
        guest_name: fd.get("guest_name"),
        guest_phone: fd.get("guest_phone"),
        guest_pet_name: fd.get("guest_pet_name"),
        guest_pet_size: fd.get("guest_pet_size"),
        service_id: serviceId,
        scheduled_at: fd.get("scheduled_at"),
        notes: fd.get("notes") ?? "",
      });
      await createGuestAppointment(parsed);
      toast.success("Agendamento recebido! Entraremos em contato para confirmar.");
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : (err as Error).message;
      toast.error(msg ?? "Erro ao agendar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Agendar banho e tosa</h1>
          <p className="mt-1 text-muted-foreground">
            Preencha os dados abaixo — sem precisar criar conta.
          </p>
        </div>

        {success ? (
          <Card>
            <CardHeader>
              <CardTitle>Pedido recebido 🐾</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Recebemos seu agendamento. Nossa equipe entrará em contato pelo
                WhatsApp para confirmar o horário.
              </p>
              <div className="flex gap-2">
                <Button asChild><Link to="/">Voltar ao início</Link></Button>
                <Button variant="outline" onClick={() => setSuccess(false)}>
                  Novo agendamento
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dados do agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Serviço</Label>
                  <Select value={serviceId} onValueChange={setServiceId} disabled={isLoading}>
                    <SelectTrigger><SelectValue placeholder="Escolha o serviço" /></SelectTrigger>
                    <SelectContent>
                      {services?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — {formatBRL(s.price_cents)} · {formatDuration(s.duration_minutes)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_name">Seu nome</Label>
                  <Input id="guest_name" name="guest_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest_phone">WhatsApp</Label>
                  <Input id="guest_phone" name="guest_phone" placeholder="(44) 90000-0000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest_pet_name">Nome do pet</Label>
                  <Input id="guest_pet_name" name="guest_pet_name" required />
                </div>
                <div className="space-y-2">
                  <Label>Porte do pet</Label>
                  <Select name="guest_pet_size" defaultValue="medio">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequeno">Pequeno (até 10kg)</SelectItem>
                      <SelectItem value="medio">Médio (10–20kg)</SelectItem>
                      <SelectItem value="grande">Grande (20–40kg)</SelectItem>
                      <SelectItem value="gigante">Gigante (40kg+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="scheduled_at">Data e hora</Label>
                  <Input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea id="notes" name="notes" placeholder="Alergias, comportamento, preferências..." rows={3} />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" size="lg" className="w-full" disabled={busy || !serviceId}>
                    {busy ? "Enviando..." : "Confirmar agendamento"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
