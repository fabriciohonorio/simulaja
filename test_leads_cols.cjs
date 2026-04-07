const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://pfedvdqpnpbrlhfbzjcj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCols() {
  console.log("Testing columns 'grupo' and 'cota' in 'leads' table...");
  const { error } = await supabase.from("leads").insert({
    nome: "TEST_DELETE_ME",
    grupo: "TEST_GROUP",
    cota: "TEST_COTA"
  });

  if (error) {
    if (error.code === 'P0001' || error.message.includes('column "grupo" of relation "leads" does not exist')) {
        console.log("❌ Result: Columns DO NOT exist in 'leads' table.");
        console.log("Error details:", error.message);
    } else {
        console.log("⚠️ Result: Other error occurred (likely RLS), but columns might exist.");
        console.log("Error details:", error.message);
    }
  } else {
    console.log("✅ Result: Columns EXIST in 'leads' table!");
    // Clean up
    await supabase.from("leads").delete().eq("nome", "TEST_DELETE_ME");
  }
}

testCols();
