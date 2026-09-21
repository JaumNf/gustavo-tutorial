/* ============================================================
   verificar.mjs — a suíte que roda antes de dizer que terminou.
   Abre toda página em duas larguras e falha em:
   overflow horizontal, h1 fora de um, contagem de links do menu
   errada, âncora interna quebrada, erro de JavaScript.

   uso:  node scripts/verificar.mjs
   (sobe um servidor local sozinho, na porta 8899)
   ============================================================ */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARQUIVOS as FERRAMENTAS } from './_ferramentas.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = 8899;

const PAGINAS = [
  'index.html', 'estudar.html', 'ferramentas.html', 'patch-notes.html', 'colofao.html',
  'html-puro.html', 'html-puro-2.html', 'fluxo.html', 'qualidade.html', 'landing-pages.html',
  'trafego.html', 'movimento.html', 'motion.html', 'frameworks.html', 'back-end.html',
  'negocio.html', 'ia.html', '404.html',
  ...FERRAMENTAS,
];

/* quantos links o painel do menu deve ter — ajuste junto com GRUPOS em navmenu.mjs */
const LINKS_DO_MENU = 20;

/* páginas sem cabeçalho: exigir exatamente zero pega uma reintrodução acidental */
const SEM_MENU = new Set(['index.html']);

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8'
};

const servidor = createServer(async (req, res) => {
  try {
    const caminho = join(RAIZ, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    const corpo = await readFile(caminho);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(caminho)] || 'application/octet-stream' });
    res.end(corpo);
  } catch {
    res.writeHead(404); res.end('nao encontrado');
  }
});
await new Promise(r => servidor.listen(PORTA, r));

const navegador = await chromium.launch();
const resultados = [];

for (const tela of [{ l: 1400, a: 900 }, { l: 390, a: 844 }]) {
  const ctx = await navegador.newContext({ viewport: { width: tela.l, height: tela.a } });
  for (const p of PAGINAS) {
    const pagina = await ctx.newPage();
    const erros = [];
    pagina.on('pageerror', e => erros.push('pageerror: ' + e.message));
    pagina.on('console', m => {
      /* fonte externa pode falhar em rede restrita — não é erro do site */
      if (m.type() === 'error' && !/fonts\.google|ERR_TUNNEL|ERR_NAME/.test(m.text())) {
        erros.push('console: ' + m.text());
      }
    });

    await pagina.goto(`http://localhost:${PORTA}/${p}`, { waitUntil: 'networkidle' });

    const r = await pagina.evaluate(() => {
      const ids = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        h1: document.querySelectorAll('h1').length,
        menu: document.querySelectorAll('.navmenu__painel a').length,
        quebradas: [...document.querySelectorAll('a[href^="#"]')]
          .map(a => a.getAttribute('href'))
          .filter(h => h.length > 1 && !ids.has(h.slice(1)))
      };
    });

    resultados.push({ pagina: p, tela: tela.l, ...r, erros });
    await pagina.close();
  }
  await ctx.close();
}

await navegador.close();
servidor.close();

const problemas = resultados.filter(r =>
  r.overflow || r.h1 !== 1 || r.erros.length || r.quebradas.length ||
  (SEM_MENU.has(r.pagina) ? r.menu !== 0 : r.menu !== LINKS_DO_MENU)
);

console.log(`${resultados.length} verificações (${PAGINAS.length} páginas × 2 telas)`);
if (problemas.length) {
  console.log('\nPROBLEMAS:\n' + JSON.stringify(problemas, null, 2));
  process.exit(1);
}
console.log('nenhum problema');
