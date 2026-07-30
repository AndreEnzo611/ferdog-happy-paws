import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMyRoles,
  listAllAppointments,
  updateAppointmentStatus,
  type AdminAppointment,
} from "@/services/admin";
import { formatBRL, formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — FerDog House" },
      {
        name: "description",
        content: "Painel de controle de agendamentos do FerDog House.",
      },
      { property: "og:title", content: "Painel administrativo — FerDog House" },
      {
        property: "og:description",
        content: "Gerencie os agendamentos de banho e tosa do FerDog House.",
      },
    ],
  }),
  component: AdminPage,
});

const STATUS = ["pendente", "confirmado", "em_andamento", "concluido", "cancelado"] as const;

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function AdminPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("todos");

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: getMyRoles,
  });
  const isStaff = !!roles?.some((r) => r === "admin" || r === "staff");

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", "all"],
    queryFn: listAllAppointments,
    enabled: isStaff,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar"),
  });

  const list = useMemo(
    () =>
      (appointments ?? []).filter((a) => filter === "todos" || a.status === filter),
    [appointments, filter]
  );

  const stats = useMemo(() => {
    const all = appointments ?? [];
    const today = new Date().toDateString();
    return {
      total: all.length,
      hoje: all.filter((a) => new Date(a.scheduled_at).toDateString() === today).length,
      pendentes: all.filter((a) => a.status === "pendente").length,
      receita: all
        .filter((a) => a.status === "concluido")
        .reduce((s, a) => s + (a.service?.price_cents ?? 0), 0),
    };
  }, [appointments]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold">Painel administrativo</h1>
        <p className="text-muted-foreground">Gerencie os agendamentos do FerDog House.</p>

        {loadingRoles ? (
          <p className="mt-8 text-sm text-muted-foreground">Verificando permissões...</p>
        ) : !isStaff ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sua conta não tem permissão de administrador ou equipe. Peça ao admin master
              para liberar seu acesso.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Agendamentos" value={String(stats.total)} />
              <StatCard label="Hoje" value={String(stats.hoje)} />
              <StatCard label="Pendentes" value={String(stats.pendentes)} />
              <StatCard label="Receita concluída" value={formatBRL(stats.receita)} />
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="text-sm font-medium">Filtrar:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["appointments", "all"] })
                }
              >
                Atualizar
              </Button>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum agendamento aqui.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {list.map((a) => (
                      <Row
                        key={a.id}
                        appointment={a}
                        onStatus={(status) => mutation.mutate({ id: a.id, status })}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({
  appointment: a,
  onStatus,
}: {
  appointment: AdminAppointment;
  onStatus: (status: string) => void;
}) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="font-medium">
          {a.service?.name ?? "Serviço"}{" "}
          <Badge variant="outline" className="ml-2">
            {STATUS_LABEL[a.status] ?? a.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date(a.scheduled_at).toLocaleString("pt-BR")}
          {a.service &&
            ` · ${formatDuration(a.service.duration_minutes)} · ${formatBRL(a.service.price_cents)}`}
        </div>
        <div className="text-sm text-muted-foreground">
          {a.guest_name ? `${a.guest_name} · ${a.guest_phone ?? ""}` : "Cliente cadastrado"}
          {a.guest_pet_name ? ` · Pet: ${a.guest_pet_name} (${a.guest_pet_size})` : ""}
        </div>
        {a.notes && <div className="text-sm text-muted-foreground">Obs.: {a.notes}</div>}
      </div>
      <div className="flex items-center gap-2">
        {a.guest_phone && (
          <Button asChild size="sm" variant="outline">
            <a
              href={`https://wa.me/55${a.guest_phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </Button>
        )}
        <Select value={a.status} onValueChange={onStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </li>
  );
}
