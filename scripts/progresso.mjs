/* ============================================================
   progresso.mjs — regera progresso.js (mapa de tópicos por trilha),
   usado pela home para mostrar o progresso de estudo.
   Porta de progresso.py (Python não está disponível nesta máquina).

   uso:  node scripts/progresso.mjs
   ============================================================ */
import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTexto, escreverTexto } from './_texto.mjs';

// roda a partir da raiz do repositório, não importa de onde foi chamado
process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));

const TRILHAS = [
  'html-puro.html', 'fluxo.html', 'qualidade.html', 'landing-pages.html',
  'trafego.html', 'movimento.html', 'motion.html', 'frameworks.html',
  'back-end.html', 'negocio.html', 'ia.html',
];
// paginas extras cujos topicos contam para a trilha-base indicada
// (trilha longa dividida em mais de um arquivo, mas um so card na home)
const EXTRAS = { 'html-puro.html': ['html-puro-2.html'] };

function idsDe(h) {
  return [...h.matchAll(/<article class="topico" id="([^"]+)"/g)].map((m) => m[1]);
}

// tópicos com data-desde="AAAA-MM-DD": alimentam a marca de conteúdo recente
function limpo(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
function recentesDe(h, arquivo, trilha) {
  const re = /<article class="topico" id="([^"]+)"([^>]*)>\s*<div class="topico__cabeca">\s*<h3>(.*?)<\/h3>/gs;
  const out = [];
  for (const m of h.matchAll(re)) {
    const d = (m[2].match(/data-desde="(\d{4}-\d{2}-\d{2})"/) || [])[1];
    if (d) out.push({ u: arquivo + '#' + m[1], a: trilha, t: limpo(m[3]), d });
  }
  return out;
}

const mapa = {};
let recentes = [];
for (const arq of TRILHAS) {
  const h = lerTexto(arq);
  let ids = idsDe(h);
  recentes = recentes.concat(recentesDe(h, arq, arq));
  for (const extra of EXTRAS[arq] || []) {
    const he = lerTexto(extra);
    ids = ids.concat(idsDe(he));
    recentes = recentes.concat(recentesDe(he, extra, arq));
  }
  mapa[arq] = ids;
}
// mais recente primeiro; quem decide o que ainda conta como recente é o navegador (app.js)
recentes.sort((x, y) => (x.d < y.d ? 1 : x.d > y.d ? -1 : 0));

escreverTexto(
  'progresso.js',
  '/* gerado automaticamente — não editar à mão. tópicos por trilha e a lista de conteúdo recente. */\n' +
    'window.GT_PROGRESSO=' + JSON.stringify(mapa) + ';\n' +
    'window.GT_RECENTES=' + JSON.stringify(recentes) + ';\n'
);

const total = Object.values(mapa).reduce((acc, v) => acc + v.length, 0);
console.log('trilhas:', Object.keys(mapa).length, '| topicos:', total, '| com data-desde:', recentes.length, '|', statSync('progresso.js').size, 'bytes');
