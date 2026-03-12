import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfedvdqpnpbrlhfbzjcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('leads').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Columns in leads table:');
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            // If no data, we can't get columns this way. Let's try inserting a dummy and rolling back, or just calling an rpc if exists.
            // Easiest is to select via PostgREST with a header to get schema, but JS client does not expose this easily.
            // Let's insert a dummy lead and see what errors we get about missing columns, or just use another table.
            console.log("No data to infer columns from.");
        }
    }
}

checkSchema();
