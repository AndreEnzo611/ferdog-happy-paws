import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CalendarDays, Clock, PawPrint, Phone, User } from "lucide-react";
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
import { formatBRL, formatDuration, formatPhoneBR, todayISODate } from "@/lib/format";

const searchSchema = z.object({
  service: z.string().optional(),
});

export const Route = createFileRoute("/agendamento")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Agendar Banho e Tosa — FerDog House" },
      { name: "description", content: "Reserve online um horário para o banho e tosa do seu pet no FerDog House em Maringá." },
    ],
  }),
  component: BookingPage,
});

// Horário de funcionamento: Terça a Sábado, 8h às 18h — slots de 30 min
const OPEN_HOUR = 8;
const CLOSE_HOUR = 18;
const SLOT_MINUTES = 30;

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

function isBusinessDay(dateStr: string): boolean {
  if (!dateStr) return false;
  // dateStr = YYYY-MM-DD, interpretar como data local
  const [y, mo, d] = dateStr.split("-").map(Number);
  const day = new Date(y, mo - 1, d).getDay(); // 0=Dom, 1=Seg ... 6=Sáb
  return day >= 2 && day <= 6;
}

function BookingPage() {
  const { service: preselected } = Route.useSearch();
  const { data: services, isLoading } = useQuery({
    queryKey: ["services", "active"],
    queryFn: listActiveServices,
  });

  const [serviceId, setServiceId] = useState<string>(preselected ?? "");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [petSize, setPetSize] = useState<"pequeno" | "medio" | "grande" | "gigante">("medio");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const timeSlots = useMemo(buildTimeSlots, []);
  const selectedService = services?.find((s) => s.id === serviceId);
  const dayValid = date ? isBusinessDay(date) : true;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!serviceId) return toast.error("Escolha um serviço");
    if (!date || !time) return toast.error("Escolha data e horário");
    if (!isBusinessDay(date))
      return toast.error("Atendemos de terça a sábado");

    const scheduled_at = new Date(`${date}T${time}:00`).toISOString();

    setBusy(true);
    try {
      const parsed = guestAppointmentSchema.parse({
        guest_name: fd.get("guest_name"),
        guest_phone: phone,
        guest_pet_name: fd.get("guest_pet_name"),
        guest_pet_size: petSize,
        service_id: serviceId,
        scheduled_at,
        notes: fd.get("notes") ?? "",
      });
      await createGuestAppointment(parsed);
      toast.success("Agendamento recebido! Entraremos em contato pelo WhatsApp para confirmar.");
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
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Agendar banho e tosa</h1>
          <p className="mt-1 text-muted-foreground">
            Preencha os dados abaixo — sem precisar criar conta. Confirmamos pelo WhatsApp.
          </p>
        </div>

        {success ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-primary" /> Pedido recebido!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Recebemos seu agendamento. Nossa equipe entrará em contato pelo
                WhatsApp para confirmar o horário.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild><Link to="/">Voltar ao início</Link></Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setServiceId("");
                    setPhone("");
                    setDate("");
                    setTime("");
                  }}
                >
                  Novo agendamento
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader>
                <CardTitle>Dados do agendamento</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
                  {/* Serviço */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-1.5">
                      <PawPrint className="h-3.5 w-3.5" /> Serviço
                    </Label>
                    <Select value={serviceId} onValueChange={setServiceId} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoading ? "Carregando..." : "Escolha o serviço"} />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} — {formatBRL(s.price_cents)} · {formatDuration(s.duration_minutes)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="guest_name" className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Seu nome
                    </Label>
                    <Input id="guest_name" name="guest_name" placeholder="Nome completo" required />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label htmlFor="guest_phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> WhatsApp
                    </Label>
                    <Input
                      id="guest_phone"
                      name="guest_phone"
                      inputMode="tel"
                      placeholder="(44) 99999-0000"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                      required
                    />
                  </div>

                  {/* Nome do pet */}
                  <div className="space-y-2">
                    <Label htmlFor="guest_pet_name">Nome do pet</Label>
                    <Input id="guest_pet_name" name="guest_pet_name" placeholder="Ex.: Thor" required />
                  </div>

                  {/* Porte */}
                  <div className="space-y-2">
                    <Label>Porte do pet</Label>
                    <Select value={petSize} onValueChange={(v) => setPetSize(v as typeof petSize)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pequeno">Pequeno (até 10kg)</SelectItem>
                        <SelectItem value="medio">Médio (10–20kg)</SelectItem>
                        <SelectItem value="grande">Grande (20–40kg)</SelectItem>
                        <SelectItem value="gigante">Gigante (40kg+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" /> Data
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      min={todayISODate()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                    {date && !dayValid && (
                      <p className="text-xs text-destructive">
                        Atendemos de terça a sábado. Escolha outra data.
                      </p>
                    )}
                  </div>

                  {/* Horário */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Horário
                    </Label>
                    <Select value={time} onValueChange={setTime} disabled={!date || !dayValid}>
                      <SelectTrigger>
                        <SelectValue placeholder={!date ? "Escolha a data primeiro" : "Selecione o horário"} />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Alergias, comportamento, preferências de tosa..."
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={busy || !serviceId || !date || !time || !dayValid}
                    >
                      {busy ? "Enviando..." : "Confirmar agendamento"}
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Ao confirmar, autorizamos o contato pelo WhatsApp informado.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Resumo lateral */}
            <div className="space-y-4">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Resumo do pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {selectedService ? (
                    <>
                      <div>
                        <div className="font-semibold">{selectedService.name}</div>
                        {selectedService.description && (
                          <p className="text-xs text-muted-foreground">
                            {selectedService.description}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between border-t border-border/60 pt-3">
                        <span className="text-muted-foreground">Duração</span>
                        <span>{formatDuration(selectedService.duration_minutes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-bold text-primary">
                          {formatBRL(selectedService.price_cents)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Escolha um serviço para ver o resumo.
                    </p>
                  )}
                  {date && time && dayValid && (
                    <div className="flex justify-between border-t border-border/60 pt-3">
                      <span className="text-muted-foreground">Quando</span>
                      <span className="font-medium">
                        {new Date(`${date}T${time}:00`).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        · {time}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Funcionamento</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Terça a sábado</p>
                  <p>8h às 18h</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
