/* ============================================================
   sitemap.mjs — atualiza as datas do sitemap pelo mtime dos arquivos.
   Porta de sitemap.py (Python não está disponível nesta máquina).

   uso:  node scripts/sitemap.mjs
   ============================================================ */
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTexto, escreverTexto } from './_texto.mjs';

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

const txt = lerTexto('sitemap.xml');

const novo = txt.replace(/<url>.*?<\/url>/gs, (bloco) => {
  const locMatch = bloco.match(/<loc>(.*?)<\/loc>/);
  const arq = arquivoDe(locMatch[1]);
  if (!existsSync(arq)) return bloco;
  const data = isoDataLocal(statSync(arq).mtimeMs);
  return bloco.replace(/<lastmod>.*?<\/lastmod>/, () => `<lastmod>${data}</lastmod>`);
});

escreverTexto('sitemap.xml', novo);
console.log('sitemap.xml atualizado');
