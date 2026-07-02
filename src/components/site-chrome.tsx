import { Link } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/services/auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, loading } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <PawPrint className="h-5 w-5" />
          </span>
          <span>
            Fer<span className="text-primary">Dog</span> House
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" className="hover:text-primary">Início</Link>
          <a href="/#servicos" className="hover:text-primary">Serviços</a>
          <a href="/#contato" className="hover:text-primary">Contato</a>
          <Link to="/agendamento" className="hover:text-primary">Agendar</Link>
        </nav>
        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/minha-conta">Minha conta</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => signOut()}>Sair</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/agendamento">Agendar banho</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer id="contato" className="border-t border-border/60 bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <PawPrint className="h-5 w-5 text-primary" />
            FerDog House
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Banho e tosa em Maringá com carinho, técnica e cheirinho bom.
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold">Contato</h3>
          <p className="mt-2 text-muted-foreground">Maringá — PR</p>
          <p className="text-muted-foreground">WhatsApp: (44) 0000-0000</p>
          <p className="text-muted-foreground">contato@ferdoghouse.com.br</p>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold">Horário</h3>
          <p className="mt-2 text-muted-foreground">Terça a sábado — 8h às 18h</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FerDog House — Todos os direitos reservados.
      </div>
    </footer>
  );
}
