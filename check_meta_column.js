const url = "https://pfedvdqpnpbrlhfbzjcj.supabase.co/rest/v1/meta?organizacao_id=eq.test";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": "Bearer " + key
  }
})
.then(r => {
    console.log("STATUS: " + r.status);
    return r.json();
})
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(e => console.error(e));
