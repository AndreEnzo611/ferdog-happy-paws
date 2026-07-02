import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMyAppointments } from "@/services/appointments";
import { formatBRL, formatDuration } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [{ title: "Minha conta — FerDog House" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn: listMyAppointments,
  });

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

        <Card>
          <CardHeader>
            <CardTitle>Meus agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : appointments && appointments.length > 0 ? (
              <ul className="divide-y divide-border">
                {appointments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between py-4">
                    <div>
                      <div className="font-medium">{a.service?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(a.scheduled_at).toLocaleString("pt-BR")} ·{" "}
                        {a.service && `${formatDuration(a.service.duration_minutes)} · ${formatBRL(a.service.price_cents)}`}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {String(a.status).replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não tem agendamentos. Que tal marcar o próximo banho?
              </p>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
