import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createService,
  deleteService,
  listAllServices,
  updateService,
  type ManagedService,
  type ServiceInput,
} from "@/services/manage";
import { formatBRL, formatDuration } from "@/lib/format";

type FormState = {
  name: string;
  description: string;
  price: string;
  duration: string;
  active: boolean;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  price: "",
  duration: "60",
  active: true,
};

function toInput(f: FormState): ServiceInput {
  const price = Math.round(Number(f.price.replace(",", ".")) * 100);
  return {
    name: f.name,
    description: f.description,
    price_cents: Number.isFinite(price) ? price : -1,
    duration_minutes: Number(f.duration) || 0,
    active: f.active,
  };
}

export function ServicesEditor() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedService | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", "all"],
    queryFn: listAllServices,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["services"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const input = toInput(form);
      if (editing) await updateService(editing.id, input);
      else await createService(input);
    },
    onSuccess: () => {
      toast.success(editing ? "Serviço atualizado" : "Serviço criado");
      setOpen(false);
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("Serviço removido");
      invalidate();
    },
    onError: () =>
      toast.error("Não foi possível remover (pode haver agendamentos vinculados)"),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(s: ManagedService) {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      price: (s.price_cents / 100).toFixed(2).replace(".", ","),
      duration: String(s.duration_minutes),
      active: s.active,
    });
    setOpen(true);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Serviços</CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Novo serviço
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (services?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {services!.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {s.name}
                    {!s.active && (
                      <Badge variant="outline" className="ml-2">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatBRL(s.price_cents)} · {formatDuration(s.duration_minutes)}
                  </div>
                  {s.description && (
                    <div className="text-sm text-muted-foreground">{s.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                    <Pencil className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove.mutate(s.id)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Nome</Label>
              <Input
                id="svc-name"
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-desc">Descrição</Label>
              <Textarea
                id="svc-desc"
                value={form.description}
                maxLength={300}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-price">Preço (R$)</Label>
                <Input
                  id="svc-price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-dur">Duração (min)</Label>
                <Input
                  id="svc-dur"
                  inputMode="numeric"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="svc-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label htmlFor="svc-active">Serviço ativo (visível no agendamento)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
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
