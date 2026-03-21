-- Create metas_vendedor table
CREATE TABLE IF NOT EXISTS public.metas_vendedor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendedor_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
    ano INTEGER NOT NULL,
    meta_anual NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(vendedor_id, ano)
);

-- Note: In Supabase, if RLS is enabled on this table in the dashboard,
-- you will need to add policies for SELECT/INSERT/UPDATE for admins and owners.
