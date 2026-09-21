/* ============================================================
   sitemap.mjs — atualiza as datas do sitemap pelo mtime dos arquivos.
   Porta de sitemap.py (Python não está disponível nesta máquina).

   uso:  node scripts/sitemap.mjs
   ============================================================ */
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTexto, escreverTexto } from './_texto.mjs';
import { ARQUIVOS as FERRAMENTAS } from './_ferramentas.mjs';

// roda a partir da raiz do repositório, não importa de onde foi chamado
process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));

function arquivoDe(loc) {
  if (loc.endsWith('/')) return 'index.html';
  return loc.split('/').pop();
}

// equivalente a datetime.date.fromtimestamp(...).isoformat() — data local, não UTC
function isoDataLocal(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

let txt = lerTexto('sitemap.xml');

// página de ferramenta que ainda não está no sitemap entra antes do fim
const BASE = 'https://gustavo-tutorial.vercel.app/';
for (const arq of ['modelos.html', 'vibecoding.html', ...FERRAMENTAS]) {
  if (txt.includes(`<loc>${BASE}${arq}</loc>`)) continue;
  txt = txt.replace('</urlset>', () =>
    `  <url>\n    <loc>${BASE}${arq}</loc>\n    <lastmod>2000-01-01</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>`);
}

const novo = txt.replace(/<url>.*?<\/url>/gs, (bloco) => {
  const locMatch = bloco.match(/<loc>(.*?)<\/loc>/);
  const arq = arquivoDe(locMatch[1]);
  if (!existsSync(arq)) return bloco;
  const data = isoDataLocal(statSync(arq).mtimeMs);
  return bloco.replace(/<lastmod>.*?<\/lastmod>/, () => `<lastmod>${data}</lastmod>`);
});

escreverTexto('sitemap.xml', novo);
console.log('sitemap.xml atualizado');
