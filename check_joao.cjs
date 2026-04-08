const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkJoao() {
  const { data, error } = await supabase.from('leads').select('id, nome, status, data_adesao, status_updated_at').ilike('nome', '%JOÃO BATISTA%');
  if (error) {
    console.log('ERROR', error);
  } else {
    console.log('LEADS', data);
  }

  const { data: cData, error: cError } = await supabase.from('carteira').select('id, lead_id, nome, data_adesao').ilike('nome', '%JOÃO BATISTA%');
  if (cError) {
    console.log('ERROR_CARTEIRA', cError);
  } else {
    console.log('CARTEIRA', cData);
  }
}

checkJoao();
