import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listClients,
  updateClient,
  type ManagedClient,
  type ClientInput,
} from "@/services/manage";
import { formatPhoneBR } from "@/lib/format";

export function ClientsEditor() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ManagedClient | null>(null);
  const [form, setForm] = useState<ClientInput>({
    full_name: "",
    phone: "",
    address: "",
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await updateClient(editing.id, form);
    },
    onSuccess: () => {
      toast.success("Cliente atualizado");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar"),
  });

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (clients ?? []).filter(
      (c) =>
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
    );
  }, [clients, search]);

  function openEdit(c: ManagedClient) {
    setEditing(c);
    setForm({
      full_name: c.full_name,
      phone: c.phone ?? "",
      address: c.address ?? "",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Buscar por nome ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 max-w-sm"
        />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium">{c.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.phone ? formatPhoneBR(c.phone) : "Sem telefone"}
                    {c.address ? ` · ${c.address}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cliente desde {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.phone && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                    <Pencil className="mr-1 h-4 w-4" /> Editar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cli-name">Nome completo</Label>
              <Input
                id="cli-name"
                value={form.full_name}
                maxLength={120}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-phone">WhatsApp</Label>
              <Input
                id="cli-phone"
                inputMode="tel"
                value={formatPhoneBR(form.phone ?? "")}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cli-addr">Endereço</Label>
              <Input
                id="cli-addr"
                value={form.address ?? ""}
                maxLength={200}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
