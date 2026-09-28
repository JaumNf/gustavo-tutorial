/* ============================================================
   navmenu.mjs — reescreve o <nav class="navmenu"> nas páginas de
   uma vez só. Fonte da verdade do menu: para mudar categoria, link
   ou rótulo, edite GRUPOS aqui e rode — nunca edite o <nav> das
   páginas diretamente, a próxima execução sobrescreve.
   Porta de navmenu.py (Python não está disponível nesta máquina).

   uso:  node scripts/navmenu.mjs
   ============================================================ */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTexto, escreverTexto } from './_texto.mjs';
import { FERRAMENTAS } from './_ferramentas.mjs';

// roda a partir da raiz do repositório, não importa de onde foi chamado
process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));

// ícones do topo em SVG, no traço do resto do site (nada de caractere Unicode)
const ICONE = {
  seta: '<svg class="ico ico--seta" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>',
  tema: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25"/><path d="M12 3.75a8.25 8.25 0 0 1 0 16.5z" fill="currentColor" stroke="none"/></svg>',
};

// (href, label_forte, label_descricao) — descrição null = item compacto, só o nome
// id do grupo: vira a âncora do percurso na estudar.html e o link da "migalha" das trilhas
const GRUPOS = [
  ['Construção', 'g-construcao', [
    ['html-puro.html', 'HTML puro', 'Do zero ao site publicado'],
    ['montar-o-site.html', 'Montar o site', 'O esqueleto de todo projeto'],
    ['qualidade.html', 'Qualidade', 'Imagem, a11y, Vitals e testes'],
    ['movimento.html', 'Movimento', 'Animação com critério'],
    ['motion.html', 'Referência: Motion', 'A API inteira, em português'],
    ['frameworks.html', 'Frameworks', 'Formatos além do vanilla'],
    ['back-end.html', 'Back-end', 'Servidor, banco e login'],
    ['depois-do-ar.html', 'Depois do ar', 'Publicar, medir, manter'],
  ], null],
  ['Captação e Vendas', 'g-captacao', [
    ['landing-pages.html', 'Landing pages', 'A estratégia da página'],
    ['trafego.html', 'Tráfego', 'Ser encontrado no Google'],
    ['negocio.html', 'Negócio', 'Preço, escopo e contrato'],
  ], null],
  ['Método', 'g-metodo', [
    ['fluxo.html', 'Fluxo de trabalho', 'Terminal, Git e DevTools'],
    ['ia.html', 'Trabalhando com IA', 'Brief, referência e revisão'],
    ['vibecoding.html', 'Vibecoding', 'Ferramentas, referências e riscos'],
  ], null],
  // as quinze, todas: quem volta todo dia chega a qualquer uma em dois cliques
  ['Trabalhar', 'g-trabalhar', [
    ['ferramentas.html', 'Todas as ferramentas', 'Em cinco fases, ligadas entre si'],
    ['modelos.html', 'Modelos para copiar', 'Seções e efeitos prontos'],
    ...FERRAMENTAS.map((f) => [f.arquivo, f.nome, null]),
  ], 'navmenu__grupo--trabalhar'],
  ['Sobre o site', 'g-sobre', [
    ['patch-notes.html', 'Patch notes', 'O que mudou no site'],
    ['colofao.html', 'Colofão', 'Como este site foi feito'],
  ], 'navmenu__grupo--sobre'],
];
const GRUPOS_DE_ESTUDO = new Set(['g-construcao', 'g-captacao', 'g-metodo']);

// arquivo -> modo do alternador ('estudo', 'trabalho' ou undefined)
const MODO = { 'ferramentas.html': 'trabalho', 'modelos.html': 'trabalho' };
for (const a of [
  'html-puro.html', 'html-puro-2.html', 'montar-o-site.html', 'qualidade.html', 'movimento.html', 'motion.html',
  'frameworks.html', 'back-end.html', 'depois-do-ar.html', 'landing-pages.html', 'trafego.html', 'negocio.html',
  'fluxo.html', 'ia.html', 'vibecoding.html', 'estudar.html',
]) MODO[a] = 'estudo';
// cada ferramenta tem página própria, na área de trabalho
for (const f of FERRAMENTAS) MODO[f.arquivo] = 'trabalho';

// páginas sem cabeçalho: o hub navega pelo hero e pelos cards. Continua no
// PAGINA abaixo porque o script ainda cuida do <body> e do theme-color dele.
const SEM_MENU = new Set(['index.html']);

// arquivo -> [href que fica 'is-atual', texto do navmenu__aqui] — null = nenhum dos dois (home/404)
const PAGINA = {
  'estudar.html': null,
  'html-puro.html': ['html-puro.html', 'HTML puro'],
  'html-puro-2.html': ['html-puro.html', 'HTML puro · parte 2'],
  'qualidade.html': ['qualidade.html', 'Qualidade'],
  'movimento.html': ['movimento.html', 'Movimento'],
  'motion.html': ['motion.html', 'Referência: Motion'],
  'frameworks.html': ['frameworks.html', 'Frameworks'],
  'back-end.html': ['back-end.html', 'Back-end'],
  'depois-do-ar.html': ['depois-do-ar.html', 'Depois do ar'],
  'montar-o-site.html': ['montar-o-site.html', 'Montar o site'],
  'landing-pages.html': ['landing-pages.html', 'Landing pages'],
  'trafego.html': ['trafego.html', 'Tráfego'],
  'negocio.html': ['negocio.html', 'Negócio'],
  'fluxo.html': ['fluxo.html', 'Fluxo de trabalho'],
  'ia.html': ['ia.html', 'Trabalhando com IA'],
  'vibecoding.html': ['vibecoding.html', 'Vibecoding'],
  'colofao.html': ['colofao.html', 'Colofão'],
  'patch-notes.html': ['patch-notes.html', 'Patch notes'],
  'ferramentas.html': ['ferramentas.html', null],
  'modelos.html': ['modelos.html', null],
  'index.html': null,
  '404.html': null,
};
// subpáginas de ferramenta: o menu marca a própria ferramenta, na coluna Trabalhar
for (const f of FERRAMENTAS) PAGINA[f.arquivo] = [f.arquivo, 'Ferramentas · ' + f.nome];

function montarNav(arquivo) {
  const atual = PAGINA[arquivo];
  const [hrefAtual, aquiTexto] = atual ? atual : [null, null];

  const partes = [
    '<nav class="navmenu" aria-label="Navegação do site">',
    '<details class="navmenu__caixa" id="navmenu">',
    '<summary class="navmenu__botao">Menu' + ICONE.seta + '</summary>',
    '<div class="navmenu__painel">',
  ];
  for (const [rotulo, , links, classeExtra] of GRUPOS) {
    const cls = 'navmenu__grupo' + (classeExtra ? ' ' + classeExtra : '');
    partes.push(`<div class="${cls}">`);
    partes.push(`<p class="navmenu__rotulo">${rotulo}</p>`);
    for (const [href, forte, desc] of links) {
      const atual = href === hrefAtual;
      if (desc === null) {
        /* item compacto: só o nome — as quinze ferramentas cabem numa coluna */
        const c = 'navmenu__compacto' + (atual ? ' is-atual' : '');
        partes.push(`<a href="${href}" class="${c}"${atual ? ' aria-current="page"' : ''}>${forte}</a>`);
      } else {
        const atualAttr = atual ? ' class="is-atual" aria-current="page"' : '';
        partes.push(`<a href="${href}"${atualAttr}><strong>${forte}</strong><span>${desc}</span></a>`);
      }
    }
    partes.push('</div>');
  }
  partes.push('</div>');
  partes.push('</details>');
  const modo = MODO[arquivo];
  partes.push('<div class="modos">');
  partes.push(`<a class="modo${modo === 'estudo' ? ' is-atual' : ''}" href="estudar.html">Estudar</a>`);
  partes.push(
    `<a class="modo modo--trabalho${modo === 'trabalho' ? ' is-atual' : ''}" href="ferramentas.html">Trabalhar</a>`
  );
  partes.push('</div>');
  // sem rótulo de posição: o cabeçalho é o mesmo em toda página (o texto segue no PAGINA, sem uso no topo)
  partes.push('</nav>');
  return partes.join('\n');
}

// o modo da área no <body> alimenta a troca de --accent por área no CSS.
// Remove antes de adicionar: roda idempotente e limpa página tirada do MODO.
function aplicarModo(html, arquivo) {
  const re = /<body([^>]*)>/;
  const m = html.match(re);
  if (!m) return html;
  const modo = MODO[arquivo];
  let attrs = m[1].replace(/\s*data-modo="[^"]*"/, '');
  if (modo) attrs += ` data-modo="${modo}"`;
  return html.replace(re, () => `<body${attrs}>`);
}

// a barra do navegador é a cor do fundo da página: neutra em todas, porque
// o site tem um acento só. O hub é um palco escuro nos dois temas.
function aplicarThemeColor(html, arquivo) {
  const cor = arquivo === 'index.html' ? '#0B1211' : '#F4F6F4';
  return html.replace(
    /<meta name="theme-color" content="#[0-9A-Fa-f]{6}" media="\(prefers-color-scheme: light\)">/,
    () => `<meta name="theme-color" content="${cor}" media="(prefers-color-scheme: light)">`
  );
}

// "você está em" acima do título de cada trilha: Estudar › grupo (› HTML puro, na parte 2)
function aplicarMigalha(html, arquivo) {
  if (!html.includes('<section class="abertura">')) return html;
  const alvo = (PAGINA[arquivo] || [])[0];
  const grupo = GRUPOS.find(([, id, links]) => GRUPOS_DE_ESTUDO.has(id) && links.some(([h]) => h === alvo));
  if (!grupo) return html;
  const extra = arquivo === 'html-puro-2.html'
    ? '<span aria-hidden="true">›</span><a href="html-puro.html">HTML puro</a>' : '';
  const nav = `<nav class="migalha" aria-label="Você está em"><a href="estudar.html">Estudar</a>` +
    `<span aria-hidden="true">›</span><a href="estudar.html#${grupo[1]}">${grupo[0]}</a>${extra}</nav>`;
  html = html.replace(/(<section class="abertura">\n)<nav class="migalha"[^>]*>.*?<\/nav>\n/s, '$1');
  return html.replace('<section class="abertura">\n', () => '<section class="abertura">\n' + nav + '\n');
}

// o rodapé é o mesmo em toda página, e é um mapa curto do site
const RODAPE = [
  '<footer class="rodape">',
  '<div class="rodape__interno">',
  '<p class="rodape__marca"><a href="index.html">Gustavo Tutorial</a><span>Material de estudo aberto, em português. Feito em HTML, CSS e JavaScript puros.</span></p>',
  '<nav class="rodape__nav" aria-label="Rodapé">',
  '<a href="estudar.html">Estudar</a>',
  '<a href="ferramentas.html">Trabalhar</a>',
  '<a href="modelos.html">Modelos</a>',
  '<a href="patch-notes.html">Patch notes</a>',
  '<a href="colofao.html">Colofão</a>',
  '</nav>',
  '</div>',
  '</footer>',
].join('\n');
function aplicarRodape(html) {
  return html.replace(/<footer class="rodape">.*?<\/footer>/s, () => RODAPE);
}

// o botão de tema em toda página (o hub tem o dele) usa o ícone em SVG
function aplicarIconeTema(html) {
  return html.replace(/(<button class="btn-icone[^"]*" id="btn-tema"[^>]*>).*?(<\/button>)/s, (_, a, b) => a + ICONE.tema + b);
}

const alterados = [];
const iguais = [];
const problemas = [];
for (const arq of Object.keys(PAGINA)) {
  if (!existsSync(arq)) {
    console.log('AVISO: nao existe ->', arq);
    continue;
  }
  const h = lerTexto(arq);
  let h2 = aplicarModo(h, arq);
  h2 = aplicarThemeColor(h2, arq);
  h2 = aplicarMigalha(h2, arq);
  h2 = aplicarRodape(h2);
  h2 = aplicarIconeTema(h2);

  if (!SEM_MENU.has(arq)) {
    if (!/<nav class="navmenu" aria-label="[^"]*">.*?<\/nav>/s.test(h2)) {
      console.log('ERRO: nao achei o <nav class="navmenu"> em', arq);
      problemas.push(arq);
      continue;
    }
    const novoBloco = montarNav(arq);
    h2 = h2.replace(/<nav class="navmenu" aria-label="[^"]*">.*?<\/nav>/s, () => novoBloco);
  }

  if (h2 === h) {
    iguais.push(arq);
    continue;
  }
  escreverTexto(arq, h2);
  alterados.push(arq);
}

console.log('atualizados:', alterados.length, '| ja estavam certos:', iguais.length, '| com problema:', problemas.length);
for (const a of alterados) console.log('  atualizado:', a);
for (const a of problemas) console.log('  PROBLEMA:', a);
