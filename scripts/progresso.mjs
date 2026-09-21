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

const mapa = {};
for (const arq of TRILHAS) {
  const h = lerTexto(arq);
  let ids = idsDe(h);
  for (const extra of EXTRAS[arq] || []) {
    ids = ids.concat(idsDe(lerTexto(extra)));
  }
  mapa[arq] = ids;
}

escreverTexto(
  'progresso.js',
  '/* gerado automaticamente — não editar à mão. usado pela home para mostrar progresso. */\n' +
    'window.GT_PROGRESSO=' + JSON.stringify(mapa) + ';\n'
);

const total = Object.values(mapa).reduce((acc, v) => acc + v.length, 0);
console.log('trilhas:', Object.keys(mapa).length, '| topicos:', total, '|', statSync('progresso.js').size, 'bytes');
