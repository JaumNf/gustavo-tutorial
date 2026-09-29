/* ============================================================
   indice.mjs — regera busca-indice.js a partir do conteúdo real.
   Porta de indice.py (Python não está disponível nesta máquina).

   uso:  node scripts/indice.mjs
   ============================================================ */
import { existsSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
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
  ['depois-do-ar.html', 'Depois do ar'],
  ['montar-o-site.html', 'Montar o site'],
  ['negocio.html', 'Negócio'],
  ...FERRAMENTAS.map((f) => [f.arquivo, 'Ferramentas']),
  ['ia.html', 'Trabalhando com IA'],
  ['vibecoding.html', 'Vibecoding'],
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
// o texto inteiro de cada tópico, para a IA do site (api/perguntar.mjs) ler — não vai para o navegador
const conteudo = [];
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
      // a página inteira da ferramenta (rótulos, exemplo, nota), não só o resumo: com texto curto ela perdia para as trilhas
      const tudo = txt.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<button[^>]*>.*?<\/button>/gs, ' ');
      conteudo.push({ t: limpo(pn[2]), p: 'Ferramenta', r: 'Ferramentas', u: arq, x: limpo(tudo).replace(/^FERRAMENTA\s+/, '').slice(0, 3000) });
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
    for (const a of txt.matchAll(/<article class="topico" id="([^"]+)"[^>]*>\s*<div class="topico__cabeca">\s*<h3>(.*?)<\/h3>.*?<\/div>(.*?)<\/article>/gs)) {
      // os botões das vitrines e o "marcar como estudado" não são conteúdo
      const corpoT = a[3].replace(/<button[^>]*>.*?<\/button>/gs, ' ');
      conteudo.push({ t: limpo(a[2]), p: parte, r: trilha, u: arq + '#' + a[1], x: limpo(corpoT).slice(0, 6000) });
    }
  }

  // páginas sem .parte (colofão)
  if (!/<section class="parte[" ]/.test(corpo)) {
    for (const hh of corpo.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)) {
      itens.push({ t: limpo(hh[1]), p: '', u: arq, r: trilha, d: '', g: '' });
    }
  }
}

// modelos.html é montada pelo modelos.js: os modelos saem dos dados, não do HTML
if (existsSync('modelos.js')) {
  const caixa = { window: {}, document: { getElementById: () => null } };
  vm.runInNewContext(readFileSync('modelos.js', 'utf8'), caixa);
  for (const m of caixa.window.GT_MODELOS || []) {
    itens.push({ t: m.nome, p: 'Modelo · ' + m.cat, u: 'modelos.html#m-' + m.id, r: 'Modelos', d: m.desc.slice(0, 150), g: '' });
  }
}

escreverTexto(
  'busca-indice.js',
  '/* gerado automaticamente — não editar à mão */\nwindow.GT_BUSCA=' + JSON.stringify(itens) + ';\n'
);
console.log('itens indexados:', itens.length, '|', Math.floor(statSync('busca-indice.js').size / 1024), 'KB');

mkdirSync('api', { recursive: true });
writeFileSync('api/_conteudo.json', JSON.stringify(conteudo));
console.log('tópicos para a IA:', conteudo.length, '|', Math.floor(statSync('api/_conteudo.json').size / 1024), 'KB');
