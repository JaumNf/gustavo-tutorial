/* ============================================================
   servidor.mjs — o site local com a IA funcionando.
   Serve os arquivos estáticos e roda api/perguntar.mjs como a Vercel
   rodaria. A chave vem de .env.local (fora do git):

     GEMINI_API_KEY=a-chave-do-google-ai-studio

   uso:  node scripts/servidor.mjs        (http://localhost:8000)
   ============================================================ */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Readable } from 'node:stream';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.env.PORT) || 8000;

/* .env.local: KEY=valor por linha; não sobrescreve o que já está no ambiente */
const env = join(RAIZ, '.env.local');
if (existsSync(env)) {
  for (const l of readFileSync(env, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp',
};

const api = await import(pathToFileURL(join(RAIZ, 'api/perguntar.mjs')).href);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/perguntar') {
    if (req.method !== 'POST') { res.writeHead(405).end(); return; }
    const partes = [];
    for await (const p of req) partes.push(p);
    const pedido = new Request(url, { method: 'POST', headers: req.headers, body: Buffer.concat(partes) });
    const resposta = await api.POST(pedido);
    res.writeHead(resposta.status, Object.fromEntries(resposta.headers));
    if (resposta.body) Readable.fromWeb(resposta.body).pipe(res); else res.end();
    return;
  }

  let caminho = normalize(decodeURIComponent(url.pathname)).replace(/^([\\/])+/, '');
  if (!caminho || caminho.endsWith('/') || caminho.endsWith('\\')) caminho += 'index.html';
  const arquivo = join(RAIZ, caminho);
  /* nada fora da raiz, nada de api/ nem de arquivo escondido */
  if (!arquivo.startsWith(RAIZ) || /^(api|node_modules|scripts)[\\/]|(^|[\\/])\./.test(caminho) ||
      !existsSync(arquivo) || !statSync(arquivo).isFile()) {
    res.writeHead(404, { 'Content-Type': TIPOS['.html'] }).end(readFileSync(join(RAIZ, '404.html')));
    return;
  }
  res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(readFileSync(arquivo));
}).listen(PORTA, () => {
  console.log(`site em http://localhost:${PORTA}` + (process.env.GEMINI_API_KEY ? '' : '  (sem GEMINI_API_KEY: a IA responde "não configurada")'));
});
