const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkCristiano() {
  console.log('Searching for Cristiano in leads...');
  const { data: leads, error: leadError } = await supabase.from('leads').select('id, nome, administradora').ilike('nome', '%Cristiano%');
  if (leadError) console.error('Lead error:', leadError);
  else console.log('Leads found:', leads);

  console.log('\nSearching for Cristiano in carteira...');
  const { data: carteira, error: cartError } = await supabase.from('carteira').select('id, nome, administradora, lead_id').ilike('nome', '%Cristiano%');
  if (cartError) console.error('Carteira error:', cartError);
  else console.log('Carteira found:', carteira);
}

checkCristiano();
