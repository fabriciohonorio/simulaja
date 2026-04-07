import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .is('organizacao_id', null);
  
  if (error) console.error("Error:", error);
  else console.log("Leads with NULL organizacao_id:", count);

  const { data: samples } = await supabase
    .from('leads')
    .select('nome, created_at')
    .is('organizacao_id', null)
    .limit(5);
  
  console.log("Sample orphaned leads:", samples);
}

check();
