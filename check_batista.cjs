const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkBatista() {
  const { data: cData, error: cError } = await supabase.from('carteira').select('*').limit(10);
  console.log('ALL_CARTEIRA_SAMPLE', cData?.map(i => i.nome));

  const { data: bData } = await supabase.from('leads').select('*').ilike('nome', '%JOO%');
  console.log('JOO_LEADS', bData?.map(i => i.nome));
  
  const { data: bData2 } = await supabase.from('leads').select('*').ilike('nome', '%BATISTA%');
  console.log('BATISTA_LEADS', bData2?.map(i => ({nome: i.nome, status: i.status, data_adesao: i.data_adesao, status_updated_at: i.status_updated_at})));
}

checkBatista();
