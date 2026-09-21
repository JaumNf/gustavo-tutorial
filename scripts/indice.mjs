/* ============================================================
   indice.mjs — regera busca-indice.js a partir do conteúdo real.
   Porta de indice.py (Python não está disponível nesta máquina).

   uso:  node scripts/indice.mjs
   ============================================================ */
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTexto, escreverTexto } from './_texto.mjs';
import { FERRAMENTAS } from './_ferramentas.mjs';

// roda a partir da raiz do repositório, não importa de onde foi chamado
process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));

const TRILHAS = [
  ['html-puro.html', 'HTML puro'],
  ['html-puro-2.html', 'HTML puro'],
  ['fluxo.html', 'Fluxo de trabalho'],
  ['qualidade.html', 'Qualidade'],
  ['landing-pages.html', 'Landing pages'],
  ['trafego.html', 'Tráfego'],
  ['movimento.html', 'Movimento'],
  ['motion.html', 'Referência: Motion'],
  ['frameworks.html', 'Frameworks'],
  ['back-end.html', 'Back-end'],
  ['negocio.html', 'Negócio'],
  ...FERRAMENTAS.map((f) => [f.arquivo, 'Ferramentas']),
  ['ia.html', 'Trabalhando com IA'],
  ['colofao.html', 'Colofão'],
  ['patch-notes.html', 'Patch notes'],
];

function limpo(s) {
  s = s.replace(/<[^>]+>/g, '');
  s = s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#9662;/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

const itens = [];
for (const [arq, trilha] of TRILHAS) {
  if (!existsSync(arq)) continue;
  const h = lerTexto(arq);
  const corpo = h.slice(h.indexOf('<main'));

  // "parte parte--pagina" é a seção única de uma subpágina de ferramenta
  for (const sec of corpo.matchAll(/<section class="parte(?: parte--pagina)?" id="[^"]+">(.*?)\n<\/section>/gs)) {
    const txt = sec[1];
    const pn = txt.match(/(?:PARTE (\d+)|FERRAMENTA)<\/span>\s*<h[12]>(.*?)<\/h[12]>/s);
    const parte = pn ? (pn[1] ? `${pn[1]} · ${limpo(pn[2])}` : limpo(pn[2])) : '';

    if (arq.startsWith('ferramenta-')) {
      const resumo = txt.match(/<p class="parte__resumo">(.*?)<\/p>/s);
      itens.push({
        t: limpo(pn[2]),
        p: 'Ferramenta',
        u: arq,
        r: 'Ferramentas',
        d: limpo(resumo[1]).slice(0, 150),
        g: '',
      });
      continue;
    }

    const reTopico =
      /<article class="topico" id="([^"]+)"[^>]*>\s*<div class="topico__cabeca">\s*<h3>(.*?)<\/h3>(.*?)<\/div>\s*<div class="topico__corpo[^"]*">(.*?)(?=<div class="nota"|<div class="bloco-codigo"|<div class="tabela-caixa"|<\/div>)/gs;
    for (const t of txt.matchAll(reTopico)) {
      const tags = [...t[3].matchAll(/<span class="tag tag--(\w+)"/g)].map((m) => m[1]).join(' ');
      const trecho = limpo(t[4]).slice(0, 150);
      itens.push({ t: limpo(t[2]), p: parte, u: arq + '#' + t[1], r: trilha, d: trecho, g: tags });
    }
  }

  // páginas sem .parte (colofão)
  if (!/<section class="parte[" ]/.test(corpo)) {
    for (const hh of corpo.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)) {
      itens.push({ t: limpo(hh[1]), p: '', u: arq, r: trilha, d: '', g: '' });
    }
  }
}

escreverTexto(
  'busca-indice.js',
  '/* gerado automaticamente — não editar à mão */\nwindow.GT_BUSCA=' + JSON.stringify(itens) + ';\n'
);
console.log('itens indexados:', itens.length, '|', Math.floor(statSync('busca-indice.js').size / 1024), 'KB');
