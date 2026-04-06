const url = "https://pfedvdqpnpbrlhfbzjcj.supabase.co/rest/v1/carteira?limit=1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWR2ZHFwbnBicmxoZmJ6amNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDAwMTgsImV4cCI6MjA4NjQ3NjAxOH0.5X19fj92_I5-ovCSobX0FCiHUMOVDUJBlrUkRXvhSsE";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": "Bearer " + key
  }
})
.then(r => r.json())
.then(data => {
  if (data && data.length > 0) {
    const orgId = data[0].organizacao_id;
    console.log("ORG_ID_FOUND: " + orgId);
    
    // Now perform the update for this ORG
    const patchUrl = `https://pfedvdqpnpbrlhfbzjcj.supabase.co/rest/v1/carteira?organizacao_id=eq.${orgId}&nome=neq.Cristiano%20Gon%C3%A7alves%20Lima`;
    return fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ administradora: "MAGALU" })
    });
  } else {
    console.log("NO_DATA_FOUND");
  }
})
.then(r => r ? r.json() : null)
.then(updated => {
    if (updated) console.log("UPDATED_COUNT: " + updated.length);
})
.catch(e => console.error(e));
