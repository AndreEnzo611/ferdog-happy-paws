import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listMyAppointments } from "@/services/appointments";
import { listActiveServices } from "@/services/services";
import {
  getMyProfile,
  updateMyProfile,
  updateMyAppointment,
  EDITABLE_STATUS,
  type MyProfileInput,
} from "@/services/account";
import { formatBRL, formatDuration, formatPhoneBR } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — FerDog House" },
      {
        name: "description",
        content:
          "Veja seus agendamentos, atualize seu WhatsApp e troque o serviço escolhido no FerDog House.",
      },
      { property: "og:title", content: "Minha conta — FerDog House" },
      {
        property: "og:description",
        content: "Gerencie seus dados e agendamentos de banho e tosa no FerDog House.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn: listMyAppointments,
  });
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile });
  const { data: services } = useQuery({ queryKey: ["services", "active"], queryFn: listActiveServices });

  /* ----- dados pessoais ----- */
  const [profileForm, setProfileForm] = useState<MyProfileInput>({
    full_name: "",
    phone: "",
    address: "",
  });
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name,
        phone: profile.phone ?? "",
        address: profile.address ?? "",
      });
    }
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: () => updateMyProfile(profileForm),
    onSuccess: () => {
      toast.success("Dados atualizados");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar"),
  });

  /* ----- agendamento ----- */
  const [editing, setEditing] = useState<any | null>(null);
  const [apptForm, setApptForm] = useState({ service_id: "", guest_phone: "" });

  const saveAppt = useMutation({
    mutationFn: () => updateMyAppointment(editing.id, apptForm),
    onSuccess: () => {
      toast.success("Agendamento atualizado");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar"),
  });

  function openEdit(a: any) {
    setEditing(a);
    setApptForm({
      service_id: a.service_id ?? "",
      guest_phone: a.guest_phone ?? profile?.phone ?? "",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Olá 👋</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button asChild>
            <Link to="/agendamento">Novo agendamento</Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Meus dados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="me-name">Nome completo</Label>
              <Input
                id="me-name"
                value={profileForm.full_name}
                maxLength={120}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, full_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="me-phone">WhatsApp</Label>
              <Input
                id="me-phone"
                inputMode="tel"
                placeholder="(44) 99999-9999"
                value={formatPhoneBR(profileForm.phone)}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="me-addr">Endereço</Label>
              <Input
                id="me-addr"
                value={profileForm.address ?? ""}
                maxLength={200}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                {saveProfile.isPending ? "Salvando..." : "Salvar meus dados"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meus agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : appointments && appointments.length > 0 ? (
              <ul className="divide-y divide-border">
                {appointments.map((a: any) => {
                  const canEdit = (EDITABLE_STATUS as readonly string[]).includes(a.status);
                  return (
                    <li
                      key={a.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{a.service?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(a.scheduled_at).toLocaleString("pt-BR")}
                          {a.service &&
                            ` · ${formatDuration(a.service.duration_minutes)} · ${formatBRL(a.service.price_cents)}`}
                        </div>
                        {a.guest_phone && (
                          <div className="text-sm text-muted-foreground">
                            WhatsApp: {formatPhoneBR(a.guest_phone)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {String(a.status).replace("_", " ")}
                        </Badge>
                        {canEdit && (
                          <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                            <Pencil className="mr-1 h-4 w-4" /> Editar
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não tem agendamentos. Que tal marcar o próximo banho?
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select
                value={apptForm.service_id}
                onValueChange={(v) => setApptForm({ ...apptForm, service_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {(services ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {formatBRL(s.price_cents)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap-phone">WhatsApp de contato</Label>
              <Input
                id="ap-phone"
                inputMode="tel"
                value={formatPhoneBR(apptForm.guest_phone)}
                onChange={(e) => setApptForm({ ...apptForm, guest_phone: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Para mudar data e hora, fale com a equipe pelo WhatsApp.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={() => saveAppt.mutate()} disabled={saveAppt.isPending}>
              {saveAppt.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
