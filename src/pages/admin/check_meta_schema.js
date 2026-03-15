import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfedvdqpnpbrlhfbzjcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetaSchema() {
    const { data, error } = await supabase.from('meta').select('*').limit(1);
    if (error) {
        console.error('Error fetching meta:', error.message);
    } else {
        console.log('Columns in meta table:', data && data.length > 0 ? Object.keys(data[0]) : 'No data found');
    }
}

checkMetaSchema();
