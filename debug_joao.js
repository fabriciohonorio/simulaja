const url = "https://pfedvdqpnpbrlhfbzjcj.supabase.co/rest/v1/carteira?nome=ilike.*JOAO BATISTA PEREIRA*&select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": "Bearer " + key
  }
})
.then(r => r.json())
.then(data => {
    console.log("Found " + data.length + " matching records in 'carteira':");
    data.forEach((r, i) => {
        console.log(`Record ${i+1}: ID=${r.id}, LeadID=${r.lead_id}, Grupo=${r.grupo}, Cota=${r.cota}, Status=${r.status}`);
    });
})
.catch(e => console.error(e));
