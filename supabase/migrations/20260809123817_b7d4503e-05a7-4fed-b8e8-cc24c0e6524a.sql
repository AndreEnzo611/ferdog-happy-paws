CREATE TYPE public.appointment_change_type AS ENUM ('criado','adiado','cancelado','servico_alterado','status_alterado','contato_alterado');

CREATE TABLE public.appointment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  change_type public.appointment_change_type NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name text,
  old_scheduled_at timestamptz,
  new_scheduled_at timestamptz,
  old_status public.appointment_status,
  new_status public.appointment_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointment_history_appointment ON public.appointment_history(appointment_id, created_at DESC);

GRANT SELECT, INSERT ON public.appointment_history TO authenticated;
GRANT ALL ON public.appointment_history TO service_role;

ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own appointment history"
ON public.appointment_history FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.appointments a
  WHERE a.id = appointment_history.appointment_id AND a.customer_id = auth.uid()
));

CREATE POLICY "Staff view all appointment history"
ON public.appointment_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Customers log own appointment changes"
ON public.appointment_history FOR INSERT TO authenticated
WITH CHECK (
  changed_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_history.appointment_id AND a.customer_id = auth.uid()
  )
);

CREATE POLICY "Staff log appointment changes"
ON public.appointment_history FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));