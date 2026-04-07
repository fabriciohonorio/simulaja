const url = "https://pfedvdqpnpbrlhfbzjcj.supabase.co/rest/v1/leads?select=*&limit=1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": "Bearer " + key
  }
})
.then(r => r.json())
.then(data => {
    if (data.length > 0) {
        console.log("All columns in 'leads' table:");
        console.log(Object.keys(data[0]).join(", "));
    } else {
        console.log("No leads found.");
    }
})
.catch(e => console.error(e));
