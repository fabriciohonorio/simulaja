CREATE POLICY "Authenticated can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (true);