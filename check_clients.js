import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const names = ['SUELI CARDOSO GARCIA', 'EMILY OLIVEIRA DA LUZ', 'VICTOR HENRIQUE MAZZETTI', 'JOÃO BATISTA PEREIRA'];
  
  console.log("Checking leads table...");
  for (const name of names) {
    const { data } = await supabase.from('leads').select('*').ilike('nome', `%${name}%`);
    console.log(`Lead ${name}:`, data?.map(d => ({ id: d.id, status: d.status, status_updated_at: d.status_updated_at })));
  }

  console.log("\nChecking carteira table...");
  for (const name of names) {
    const { data } = await supabase.from('carteira').select('*').ilike('nome', `%${name}%`);
    console.log(`Carteira ${name}:`, data?.map(d => ({ id: d.id, lead_id: d.lead_id, grupo: d.grupo, cota: d.cota, data_adesao: d.data_adesao })));
  }
}

check();
