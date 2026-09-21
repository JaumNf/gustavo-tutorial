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

// roda a partir da raiz do repositório, não importa de onde foi chamado
process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));

// (href, label_forte, label_descricao)
const GRUPOS = [
  ['Construção', [
    ['html-puro.html', 'HTML puro', 'Do zero ao site publicado'],
    ['qualidade.html', 'Qualidade', 'Imagem, a11y, Vitals e testes'],
    ['movimento.html', 'Movimento', 'Animação com critério'],
    ['motion.html', 'Referência: Motion', 'A API inteira, em português'],
    ['frameworks.html', 'Frameworks', 'Formatos além do vanilla'],
    ['back-end.html', 'Back-end', 'Servidor, banco e login'],
  ], null],
  ['Captação e Vendas', [
    ['landing-pages.html', 'Landing pages', 'A estratégia da página'],
    ['trafego.html', 'Tráfego', 'Ser encontrado no Google'],
    ['negocio.html', 'Negócio', 'Preço, escopo e contrato'],
  ], null],
  ['Método', [
    ['fluxo.html', 'Fluxo de trabalho', 'Terminal, Git e DevTools'],
    ['ia.html', 'Trabalhando com IA', 'Brief, referência e revisão'],
    ['colofao.html', 'Colofão', 'Como este site foi feito'],
  ], null],
  ['Ferramentas', [
    ['ferramentas.html', 'Ferramentas', 'As quatorze do dia a dia'],
    ['ferramentas.html#f-checklist', 'Checklist de entrega', 'Antes de publicar'],
    ['ferramentas.html#f-proposta', 'Proposta que fecha', 'Os oito pontos'],
    ['ferramentas.html#f-briefing', 'Briefing', 'As dez perguntas'],
    ['ferramentas.html#f-zap', 'Link de WhatsApp', 'Com a mensagem pronta'],
    ['ferramentas.html#f-utm', 'Gerador de UTM', 'Rastrear a origem'],
    ['ferramentas.html#f-gerador', 'Gerador de comando', 'Onze tipos de pedido'],
  ], 'navmenu__grupo--trabalhar'],
  ['Patch notes', [
    ['patch-notes.html', 'Patch notes', 'O que mudou no site'],
  ], null],
];

// arquivo -> modo do alternador ('estudo', 'trabalho' ou undefined)
const MODO = { 'ferramentas.html': 'trabalho' };
for (const a of [
  'html-puro.html', 'html-puro-2.html', 'qualidade.html', 'movimento.html', 'motion.html',
  'frameworks.html', 'back-end.html', 'landing-pages.html', 'trafego.html', 'negocio.html',
  'fluxo.html', 'ia.html', 'estudar.html',
]) MODO[a] = 'estudo';

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
  'landing-pages.html': ['landing-pages.html', 'Landing pages'],
  'trafego.html': ['trafego.html', 'Tráfego'],
  'negocio.html': ['negocio.html', 'Negócio'],
  'fluxo.html': ['fluxo.html', 'Fluxo de trabalho'],
  'ia.html': ['ia.html', 'Trabalhando com IA'],
  'colofao.html': ['colofao.html', 'Colofão'],
  'patch-notes.html': ['patch-notes.html', 'Patch notes'],
  'ferramentas.html': ['ferramentas.html', null],
  'index.html': null,
  '404.html': null,
};

function montarNav(arquivo) {
  const atual = PAGINA[arquivo];
  const [hrefAtual, aquiTexto] = atual ? atual : [null, null];

  const partes = [
    '<nav class="navmenu" aria-label="Navegação do site">',
    '<details class="navmenu__caixa" id="navmenu">',
    '<summary class="navmenu__botao">Menu<span aria-hidden="true">&#9662;</span></summary>',
    '<div class="navmenu__painel">',
  ];
  for (const [rotulo, links, classeExtra] of GRUPOS) {
    const cls = 'navmenu__grupo' + (classeExtra ? ' ' + classeExtra : '');
    partes.push(`<div class="${cls}">`);
    partes.push(`<p class="navmenu__rotulo">${rotulo}</p>`);
    for (const [href, forte, desc] of links) {
      const atualAttr = href === hrefAtual ? ' class="is-atual"' : '';
      partes.push(`<a href="${href}"${atualAttr}><strong>${forte}</strong><span>${desc}</span></a>`);
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
  if (aquiTexto) partes.push(`<span class="navmenu__aqui">${aquiTexto}</span>`);
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

// a cor da barra do navegador acompanha a área (só o tema claro muda;
// no escuro o valor é --ground, igual em todas)
const TEMA_CLARO = { estudo: '#7A4A06', trabalho: '#A8261C' };
function aplicarThemeColor(html, arquivo) {
  const cor = TEMA_CLARO[MODO[arquivo]] || '#0D6B62';
  return html.replace(
    /<meta name="theme-color" content="#[0-9A-Fa-f]{6}" media="\(prefers-color-scheme: light\)">/,
    () => `<meta name="theme-color" content="${cor}" media="(prefers-color-scheme: light)">`
  );
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
