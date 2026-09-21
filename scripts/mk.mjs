/* ============================================================
   mk.mjs new <arq> <titulo> <desc> <lead> <link-antes> <rotulo>
   mk.mjs add <arq>
   Porta de mk.py (Python não está disponível nesta máquina).

   Monta uma trilha nova (ou adiciona partes a uma existente) a
   partir dos blocos em scripts/blocos/p*.html e do molde em
   scripts/blocos/molde.html — nenhum dos dois está neste repositório
   no momento, então "new" e "add" só funcionam se essa pasta existir.
   ============================================================ */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTexto, escreverTexto } from './_texto.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SITE = join(AQUI, '..');
const BLOCO = join(AQUI, 'blocos');
process.chdir(SITE);

function topicosToc(partes) {
  const out = [];
  for (const sec of partes.matchAll(/<section class="parte" id="(s\d+)">(.*?)\n<\/section>/gs)) {
    const [, sid, corpo] = sec;
    const num = corpo.match(/PARTE (\d+)<\/span><h2>(.*?)<\/h2>/);
    if (!num) continue;
    out.push(`<a class="sumario__parte" href="#${sid}">${num[1]} · ${num[2]}</a>`);
    out.push('<ol>');
    for (const t of corpo.matchAll(
      /<article class="topico" id="([^"]+)"[^>]*>\s*<div class="topico__cabeca"><h3>(.*?)<\/h3>/gs
    )) {
      out.push(`<li><a href="#${t[1]}">${t[2]}</a></li>`);
    }
    out.push('</ol>');
  }
  return out.join('\n');
}

function novasPartes() {
  let entradas;
  try {
    entradas = readdirSync(BLOCO, { withFileTypes: true });
  } catch {
    return ''; // pasta scripts/blocos/ não existe — mesmo resultado que glob.glob teria
  }
  const arquivos = entradas
    .filter((e) => e.isFile() && /^p\d+\.html$/.test(e.name))
    .map((e) => join(BLOCO, e.name))
    .sort((a, b) => Number(a.match(/p(\d+)/)[1]) - Number(b.match(/p(\d+)/)[1]));
  return arquivos.map((f) => lerTexto(f)).join('');
}

const args = process.argv.slice(2);
const modo = args[0];
const partes0 = novasPartes();

if (modo === 'new') {
  const [arq, titulo, desc, lead, antes] = args.slice(1, 6);
  const rotulo = args[6];
  const link = `<a href="${arq}"><strong>${titulo}</strong><span>${rotulo}</span></a>`;

  const modelo = lerTexto('movimento.html');
  let menu = modelo.match(/<nav class="navmenu".*?<\/nav>/s)[0];
  menu = menu.replaceAll(' class="is-atual"', '');
  menu = menu.replace(/<span class="navmenu__aqui">.*?<\/span>/s, '');
  menu = menu.replaceAll(`<a href="${antes}">`, `${link}\n<a href="${antes}">`);

  const htmlFiles = readdirSync('.', { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => e.name);
  for (const f of htmlFiles) {
    if (f === arq || f === 'artifact-index.html') continue;
    let h = lerTexto(f);
    if (h.includes(arq)) continue;
    const re = new RegExp(`(<a href="${antes}"(?: class="is-atual")?><strong>)`);
    h = h.replace(re, (m, g1) => `${link}\n${g1}`);
    escreverTexto(f, h);
  }

  let mp = menu.replaceAll(`<a href="${arq}">`, `<a href="${arq}" class="is-atual">`);
  mp = mp.trimEnd().slice(0, -6) + `<span class="navmenu__aqui">${titulo}</span>\n</nav>`;
  const np_ = (partes0.match(/class="parte"/g) || []).length;
  const nt = (partes0.match(/class="topico"/g) || []).length;

  let pag = lerTexto(join(BLOCO, 'molde.html'));
  pag = pag.replaceAll('{{T}}', titulo).replaceAll('{{D}}', desc).replaceAll('{{LEAD}}', lead);
  pag = pag
    .replaceAll('{{MENU}}', mp)
    .replaceAll('{{SUM}}', `<p class="sumario__titulo">${titulo}</p>\n` + topicosToc(partes0));
  pag = pag.replaceAll('{{NP}}', String(np_)).replaceAll('{{NT}}', String(nt)).replaceAll('{{PARTES}}', partes0);
  escreverTexto(arq, pag);
  console.log(`${arq}: ${np_} partes, ${nt} topicos`);
} else if (modo === 'add') {
  const arq = args[1];
  let h = lerTexto(arq);
  let partes = partes0;

  const ultimo = Math.max(...[...h.matchAll(/<section class="parte" id="s(\d+)">/g)].map((m) => Number(m[1])));
  const ultimoNum = Math.max(...[...h.matchAll(/PARTE (\d+)<\/span>/g)].map((m) => Number(m[1])));

  const secIds = [...partes.matchAll(/<section class="parte" id="s(\d+)">/g)].map((m) => m[1]);
  secIds.forEach((sec, i) => {
    partes = partes.replace(`id="s${sec}">`, `id="s@${ultimo + i + 1}">`);
  });
  const numeros = [...partes.matchAll(/PARTE (\d+)<\/span>/g)].map((m) => m[1]);
  numeros.forEach((n, i) => {
    partes = partes.replace(`PARTE ${n}</span>`, `PARTE @${ultimoNum + i + 1}</span>`);
  });
  partes = partes.replaceAll('id="s@', 'id="s').replaceAll('PARTE @', 'PARTE ');

  h = h.replaceAll('\n</main>', '\n\n' + partes + '\n</main>');
  const novoToc = topicosToc(partes);
  h = h.replaceAll('</div>\n</nav>\n<main class="leitura">', novoToc + '\n</div>\n</nav>\n<main class="leitura">');
  const np_ = (h.match(/class="parte"/g) || []).length;
  const nt = (h.match(/class="topico"/g) || []).length;
  h = h.replace(/<span>\d+ partes? · \d+ tópicos<\/span>/g, () => `<span>${np_} partes · ${nt} tópicos</span>`);
  escreverTexto(arq, h);
  console.log(`${arq}: agora ${np_} partes, ${nt} topicos`);
} else {
  console.error('uso: node scripts/mk.mjs new <arq> <titulo> <desc> <lead> <link-antes> <rotulo>   |   node scripts/mk.mjs add <arq>');
  process.exit(1);
}
