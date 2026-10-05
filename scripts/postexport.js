// Runs after `expo export --platform web`.
// Vercel does not publish any folder called "node_modules", but Expo puts the font files under assets/node_modules/...
// so on the live site the fonts 404 and the app never gets past the loading screen. This renames that folder, fixes the
// references, and re-hashes the main bundle so browsers can never keep an older copy of it.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dist = path.join(__dirname, '..', 'dist');
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'vendor');

if (fs.existsSync(from)) fs.renameSync(from, to);

const jsDir = path.join(dist, '_expo', 'static', 'js', 'web');
const indexHtml = path.join(dist, 'index.html');
let html = fs.readFileSync(indexHtml, 'utf8');

for (const file of fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
  const full = path.join(jsDir, file);
  const code = fs.readFileSync(full, 'utf8').split('assets/node_modules').join('assets/vendor');
  const hash = crypto.createHash('sha1').update(code).digest('hex').slice(0, 20);
  const next = file.replace(/-[0-9a-f]+\.js$/, `-${hash}.js`);
  fs.writeFileSync(full, code);
  if (next !== file) {
    fs.renameSync(full, path.join(jsDir, next));
    html = html.split(file).join(next);
  }
}
fs.writeFileSync(indexHtml, html);
console.log('postexport: assets/vendor ready, bundle re-hashed');
