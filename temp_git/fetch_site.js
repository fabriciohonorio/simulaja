const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

fetchUrl('https://www.oespecialistaconsorcio.com.br/').then(html => {
  // Find script src
  const scripts = html.match(/src="\/assets\/[^"]+"/g) || [];
  console.log('SCRIPTS:', scripts.join('\n'));
  
  // Find the main JS bundle
  const mainScript = scripts.find(s => s.includes('index-'));
  if (mainScript) {
    const scriptPath = mainScript.replace('src="', '').replace('"', '');
    const scriptUrl = 'https://www.oespecialistaconsorcio.com.br' + scriptPath;
    console.log('Fetching:', scriptUrl);
    return fetchUrl(scriptUrl);
  }
}).then(js => {
  if (!js) return;
  const fs = require('fs');
  fs.writeFileSync('temp_git/bundle.js', js);
  console.log('Saved bundle.js, size:', js.length);
  
  // Search for key UI text patterns
  const patterns = [
    'Consórcio Inteligente',
    'oespecialista',
    'Fabrício',
    'Especialista',
    'SimulaJá',
  ];
  patterns.forEach(p => {
    const idx = js.indexOf(p);
    if (idx > -1) {
      console.log(`Found "${p}" at ${idx}: ...${js.substring(idx-50, idx+200)}...`);
    }
  });
});
