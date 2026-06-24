// Basit statik sunucu — Bebek Takip testleri için
const http = require('http');
const path = require('path');
const fs   = require('fs');
const ROOT = __dirname;

const MIME = {
  '.html':'text/html;charset=utf-8', '.css':'text/css;charset=utf-8', '.js':'application/javascript;charset=utf-8',
  '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.webp':'image/webp', '.woff2':'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url === '/' ? '/index.html' : decodeURI(req.url.split('?')[0]);
  // Path traversal koruması
  let resolved = path.resolve(ROOT, '.' + reqPath);
  if (!resolved.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (!path.extname(resolved)) resolved += '.html';

  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(200, {'Content-Type':'text/html;charset=utf-8'});
      fs.readFile(path.join(ROOT, 'index.html'), (e2, d2) => res.end(e2 ? '404' : d2));
      return;
    }
    const ext = path.extname(resolved);
    res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream'});
    res.end(data);
  });
});

server.listen(5000, '127.0.0.1', () => console.log('🧪 Test sunucusu: http://localhost:5000'));
