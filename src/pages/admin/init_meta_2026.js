import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfedvdqpnpbrlhfbzjcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function initMeta() {
    const { data: existing } = await supabase.from('meta').select('*').eq('ano', 2026).maybeSingle();
    
    const metaData = {
        ano: 2026,
        meta_imoveis: 500000,
        meta_veiculos: 100000,
        meta_motos: 100000,
        meta_pesados: 180000,
        meta_investimentos: 120000,
        meta_anual: (500000 + 100000 + 100000 + 180000 + 120000) * 12
    };

    if (existing) {
        console.log('Updating existing meta 2026...');
        const { error } = await supabase.from('meta').update(metaData).eq('ano', 2026);
        if (error) console.error('Error updating:', error.message);
        else console.log('Update successful.');
    } else {
        console.log('Inserting new meta 2026...');
        const { error } = await supabase.from('meta').insert(metaData);
        if (error) console.error('Error inserting:', error.message);
        else console.log('Insert successful.');
    }
}

initMeta();
