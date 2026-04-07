import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
  // Check perfis
  const { data: perfis, error: errP } = await supabase.from('perfis').select('*');
  console.log("Perfis count:", perfis?.length || 0);
  if (perfis && perfis.length > 0) console.log("First profile:", perfis[0]);

  // Check leads with a different select
  const { data: allLeads, error: errL } = await supabase.from('leads').select('id, nome, organizacao_id');
  if (errL) console.log("Error querying leads:", errL.message);
  console.log("Leads found with manual select:", allLeads?.length || 0);
  
  // Check if Sueli is ANYWHERE in the response
  const sueliAny = allLeads?.find(l => l.nome?.toLowerCase().includes('sueli'));
  console.log("Sueli in memory find:", sueliAny);
}

check();
