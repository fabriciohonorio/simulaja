
-- Create storage bucket for boletos
INSERT INTO storage.buckets (id, name, public) VALUES ('boletos', 'boletos', false);

-- RLS policies for boletos bucket
CREATE POLICY "Authenticated can upload boletos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'boletos');

CREATE POLICY "Authenticated can read boletos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'boletos');

CREATE POLICY "Authenticated can delete boletos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'boletos');

-- Add boleto_url column to carteira
ALTER TABLE public.carteira ADD COLUMN boleto_url text;
