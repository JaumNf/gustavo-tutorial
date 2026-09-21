/* ============================================================
   ferramentas.mjs — regera a navegação das páginas de ferramenta.

   Em cada subpágina: o índice lateral (com a atual marcada), o "você está
   em" acima do título e o anterior/próxima no fim. Na ferramentas.html,
   só o índice. A lista vem de _ferramentas.mjs.

   uso:  node scripts/ferramentas.mjs
   ============================================================ */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTexto, escreverTexto } from './_texto.mjs';
import { FASES, FERRAMENTAS } from './_ferramentas.mjs';

process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));

const HUB = 'ferramentas.html';

function indice(atual) {
  const L = [
    '<nav class="indice" id="indice" aria-label="Ferramentas">',
    '<button class="indice__abrir" id="indice-abrir" aria-expanded="false" aria-controls="indice-lista"><span>Ferramentas</span><span aria-hidden="true">&#9662;</span></button>',
    '<div class="indice__lista" id="indice-lista">',
    '<div class="indice__grupo">',
    '<p class="indice__rotulo">Visão geral</p>',
    `<a href="${HUB}"${atual === HUB ? ' class="is-atual" aria-current="page"' : ''}>Todas as ferramentas</a>`,
    '<a href="modelos.html">Modelos para copiar</a>',
    '</div>',
  ];
  for (const fase of FASES) {
    L.push('<div class="indice__grupo">');
    L.push(`<p class="indice__rotulo">${fase.n} · ${fase.nome}</p>`);
    for (const f of FERRAMENTAS.filter((x) => x.fase === fase.n)) {
      const marca = f.arquivo === atual ? ' class="is-atual" aria-current="page"' : '';
      L.push(`<a href="${f.arquivo}"${marca}>${f.nome}</a>`);
    }
    L.push('</div>');
  }
  L.push('<div class="indice__grupo">');
  L.push('<p class="indice__rotulo">O raciocínio</p>');
  L.push('<a href="estudar.html">As trilhas de onde elas saíram</a>');
  L.push('</div>');
  L.push('</div>');
  L.push('</nav>');
  return L.join('\n');
}

function migalha(f) {
  const fase = FASES.find((x) => x.n === f.fase);
  return '<nav class="migalha" aria-label="Você está em">' +
    `<a href="${HUB}">Ferramentas</a><span aria-hidden="true">›</span>` +
    `<a href="${HUB}#${fase.id}">Fase ${fase.n} · ${fase.nome}</a></nav>`;
}

function passo(i) {
  const ant = FERRAMENTAS[i - 1], prox = FERRAMENTAS[i + 1];
  const a = ant
    ? `<a class="passo__item passo__item--ant" href="${ant.arquivo}"><span>Anterior</span><strong>${ant.nome}</strong></a>`
    : `<a class="passo__item passo__item--ant" href="${HUB}"><span>Voltar para</span><strong>Todas as ferramentas</strong></a>`;
  const b = prox
    ? `<a class="passo__item passo__item--prox" href="${prox.arquivo}"><span>Próxima</span><strong>${prox.nome}</strong></a>`
    : `<a class="passo__item passo__item--prox" href="${HUB}"><span>Fim da fase 4</span><strong>Todas as ferramentas</strong></a>`;
  return `<nav class="passo" aria-label="Navegar">\n${a}\n${b}\n</nav>`;
}

/* troca o bloco que começa em `inicio` até o primeiro `</nav>` depois dele */
function trocarBloco(html, inicio, novo, arquivo) {
  const i = html.indexOf(inicio);
  if (i < 0) throw new Error(`${arquivo}: não achei ${inicio}`);
  const f = html.indexOf('</nav>', i);
  return html.slice(0, i) + novo + html.slice(f + '</nav>'.length);
}

let mudou = 0, iguais = 0;
function gravar(arquivo, antes, depois) {
  if (antes === depois) { iguais++; return; }
  escreverTexto(arquivo, depois);
  mudou++;
  console.log('  atualizado: ' + arquivo);
}

{
  // a ferramentas.html tem o formato da área (sem barra lateral): só as subpáginas têm índice
  const h = lerTexto(HUB);
  if (h.includes('<nav class="indice"')) gravar(HUB, h, trocarBloco(h, '<nav class="indice"', indice(HUB), HUB));
}
FERRAMENTAS.forEach((f, i) => {
  if (!existsSync(f.arquivo)) throw new Error('falta a subpágina ' + f.arquivo);
  const h = lerTexto(f.arquivo);
  let n = trocarBloco(h, '<nav class="indice"', indice(f.arquivo), f.arquivo);
  n = trocarBloco(n, '<nav class="migalha"', migalha(f), f.arquivo);
  n = trocarBloco(n, '<nav class="passo"', passo(i), f.arquivo);
  gravar(f.arquivo, h, n);
});
console.log(`atualizados: ${mudou} | já estavam certos: ${iguais}`);
