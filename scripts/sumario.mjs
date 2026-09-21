/* ============================================================
   sumario.mjs — regera o sumário lateral de uma trilha, extraindo
   as <section class="parte"> e <article class="topico"> existentes.
   Porta de sumario.py (Python não está disponível nesta máquina).

   uso:  node scripts/sumario.mjs <arquivo.html>
   ============================================================ */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerTexto, escreverTexto } from './_texto.mjs';

// roda a partir da raiz do repositório, não importa de onde foi chamado
process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));

const arq = process.argv[2];
if (!arq) {
  console.error('uso: node scripts/sumario.mjs <arquivo.html>');
  process.exit(1);
}

let h = lerTexto(arq);
const titulo = h.match(/<p class="sumario__titulo">(.*?)<\/p>/)[1];
const corpo = h.slice(h.indexOf('<main class="leitura'));

const linhas = [`<p class="sumario__titulo">${titulo}</p>`];
for (const sec of corpo.matchAll(/<section class="parte" id="(s\d+)">(.*?)\n<\/section>/gs)) {
  const [, sid, txt] = sec;
  const num = txt.match(/PARTE (\d+)<\/span>\s*<h2>(.*?)<\/h2>/s);
  if (!num) continue;
  linhas.push(`<a class="sumario__parte" href="#${sid}">${num[1]} · ${num[2]}</a>`);
  linhas.push('<ol>');
  for (const t of txt.matchAll(
    /<article class="topico" id="([^"]+)"[^>]*>\s*<div class="topico__cabeca">\s*<h3>(.*?)<\/h3>/gs
  )) {
    linhas.push(`<li><a href="#${t[1]}">${t[2]}</a></li>`);
  }
  linhas.push('</ol>');
}
const novo = linhas.join('\n');

const ini = h.indexOf('<p class="sumario__titulo">');
// procura o fim DEPOIS do começo: o menu do cabeçalho também termina em </div></nav>
const fim = h.indexOf('</div>\n</nav>', ini);
h = h.slice(0, ini) + novo + '\n' + h.slice(fim);

const contar = (str, sub) => str.split(sub).length - 1;
const np_ = contar(h, 'class="parte"');
const nt = contar(h, 'class="topico"');
h = h.replace(/<span>\d+ partes? · \d+ tópicos<\/span>/g, () => `<span>${np_} partes · ${nt} tópicos</span>`);

escreverTexto(arq, h);
console.log(`${arq}: ${np_} partes, ${nt} topicos, ${(novo.match(/<li>/g) || []).length} itens`);
