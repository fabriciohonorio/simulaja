import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
  // Find organizations
  const { data: orgs } = await supabase.from('organizacoes').select('*');
  console.log("Organizations:", orgs);

  // Find Sueli with broad search
  const { data: suelis } = await supabase.from('leads').select('*').ilike('nome', '%SUELI%');
  console.log("Sueli Records Found:", suelis);

  // Find Fabricio's profile
  const { data: fabricio } = await supabase.from('perfis').select('*').ilike('nome_completo', '%Fabricio%');
  console.log("Fabricio Profile:", fabricio);
}

check();
