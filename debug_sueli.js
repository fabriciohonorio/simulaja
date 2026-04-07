const url = "https://pfedvdqpnpbrlhfbzjcj.supabase.co/rest/v1/leads?nome=ilike.*SUELI CARDOSO GARCIA*&select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": "Bearer " + key
  }
})
.then(r => r.json())
.then(data => {
    console.log("Found " + data.length + " matching records in 'leads':");
    if (data.length > 0) {
        console.log("Sample lead record for Sueli:");
        console.log(data[0]);
    }
})
.catch(e => console.error(e));
