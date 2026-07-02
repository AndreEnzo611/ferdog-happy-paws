import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PawPrint, Sparkles, Clock, HeartHandshake } from "lucide-react";
import heroImage from "@/assets/hero-ferdog.jpg";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listActiveServices } from "@/services/services";
import { formatBRL, formatDuration } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FerDog House — Banho e Tosa em Maringá" },
      {
        name: "description",
        content:
          "Banho, tosa e hidratação em Maringá com carinho profissional. Agende online em minutos no FerDog House.",
      },
      { property: "og:title", content: "FerDog House — Banho e Tosa em Maringá" },
      {
        property: "og:description",
        content: "Agende banho e tosa online no FerDog House, em Maringá.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: services } = useQuery({
    queryKey: ["services", "active"],
    queryFn: listActiveServices,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground">
                <PawPrint className="h-3.5 w-3.5" /> Banho & Tosa em Maringá
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                O melhor dia do seu pet começa no{" "}
                <span className="text-primary">FerDog House</span>.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Cuidado profissional, produtos de qualidade e muito carinho.
                Agende online, escolha o horário e deixe o resto com a gente.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/agendamento">Agendar agora</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#servicos">Ver serviços</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/25 via-accent/40 to-secondary/20 blur-2xl" />
              <img
                src={heroImage}
                alt="Cachorro feliz tomando banho no FerDog House"
                width={1024}
                height={1024}
                className="rounded-[2rem] shadow-2xl"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Sparkles, title: "Produtos premium", text: "Shampoos e cosméticos de qualidade profissional." },
              { icon: Clock, title: "Agilidade real", text: "Agendamento online e horários que respeitam sua rotina." },
              { icon: HeartHandshake, title: "Cuidado de verdade", text: "Equipe apaixonada por bichos, com manejo gentil." },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} className="border-border/60">
                <CardHeader className="flex flex-row items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="servicos" className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Nossos serviços</h2>
              <p className="mt-1 text-muted-foreground">
                Escolha o cuidado ideal e agende em poucos cliques.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link to="/agendamento">Agendar →</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services?.map((s) => (
              <Card key={s.id} className="border-border/60 transition hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{s.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {formatBRL(s.price_cents)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(s.duration_minutes)}
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/agendamento" search={{ service: s.id } as never}>
                      Agendar
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
