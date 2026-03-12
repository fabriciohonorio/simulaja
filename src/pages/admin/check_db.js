import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfedvdqpnpbrlhfbzjcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn(col) {
    const { error } = await supabase.from('leads').select(col).limit(1);
    if (error) {
        console.log(`Column ${col} ERROR:`, error.message);
    } else {
        console.log(`Column ${col} EXISTS.`);
    }
}

async function check() {
    await checkColumn('lead_score_valor');
    await checkColumn('lead_temperatura');
    await checkColumn('origem');
    await checkColumn('propensity_score');
    await checkColumn('propensity_ranking');
}

check();
