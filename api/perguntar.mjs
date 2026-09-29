/* ============================================================
   api/perguntar.mjs — a IA do site.
   Função da Vercel: recebe a conversa, acha os tópicos do site que
   tratam do assunto, pergunta ao Gemini (Google) e devolve a resposta
   em fluxo. Usa o plano gratuito da API: não custa nada, mas tem limite
   de perguntas por minuto e por dia, e o Google pode usar o conteúdo.

   A chave fica em GEMINI_API_KEY (variável de ambiente da Vercel,
   ou .env.local no servidor local). Nunca no JavaScript da página.
   ============================================================ */
import { readFileSync } from 'node:fs';

/* em ordem: se um estiver sem cota gratuita (429) ou sobrecarregado (500/503), o próximo tenta */
const MODELOS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const API = 'https://generativelanguage.googleapis.com/v1beta/models/';
const TENTAR_OUTRO = new Set([429, 500, 503]);
const MAX_PERGUNTA = 1200;     // caracteres da pergunta
const MAX_TURNOS = 8;          // mensagens de histórico aceitas
const MAX_TRECHOS = 7;         // tópicos do site mandados como contexto
const LIMITE = { janela: 10 * 60 * 1000, porIp: 12 };
const MAX_IMAGEM = 3_500_000;  // caracteres de base64 (~2,6 MB); a Vercel recusa corpo acima de 4,5 MB
const TIPOS_IMAGEM = new Set(['image/jpeg', 'image/png', 'image/webp']);

/* o conteúdo sai de scripts/indice.mjs; lido uma vez por instância */
const CONTEUDO = JSON.parse(readFileSync(new URL('./_conteudo.json', import.meta.url), 'utf8'));

const SISTEMA = `Você é a IA do Gustavo Tutorial, um site em português de estudo de desenvolvimento web (HTML, CSS, JavaScript, qualidade, tráfego, negócio e o trabalho com cliente), escrito por Gustavo, desenvolvedor em Campo Grande, MS. O site tem trilhas para estudar e ferramentas para usar no trabalho.

Como responder:
- Português do Brasil, direto, com exemplo prático. Sem "ótima pergunta", sem enrolação.
- Baseie a resposta nos trechos do site que vêm junto com a pergunta, entre <trechos>. Quando um trecho sustentar o que você disser, aponte para ele com um link markdown usando exatamente o endereço dado, por exemplo [Contraste](qualidade.html#t-contraste).
- Se os trechos não cobrirem o assunto, diga em uma frase que o site ainda não trata disso e responda com o que você sabe, deixando claro que isso não está no site.
- Nunca invente número, preço, estatística ou fonte. Se não tiver certeza, diga.
- Código em bloco com a linguagem marcada (\`\`\`html, \`\`\`css, \`\`\`js). Prefira HTML, CSS e JavaScript sem framework, que é o que o site ensina, a menos que a pessoa peça outra coisa.
- Respostas curtas: até uns 250 palavras, fora o código, a menos que a pessoa peça detalhe.
- A pessoa pode mandar um print: tela de erro, código, console do navegador, layout quebrado, painel de alguma ferramenta. Leia o print com atenção, diga o que ele mostra, o que provavelmente está causando o problema e o que fazer. Se o print trouxer senha, chave, e-mail ou dado de cliente, não repita esses dados na resposta e avise que é melhor não mandar esse tipo de coisa.
- Assuntos fora de desenvolvimento web, design, marketing digital ou trabalho com cliente: responda em uma frase que você é a IA do site e sugira o que pode ajudar.`;

/* ---------- busca dos trechos: a mesma ideia da busca do site, no texto inteiro ---------- */
const PARADAS = new Set('a o e é de da do das dos em no na nos nas um uma uns umas para pra por com sem que qual quais como quando onde porque por que se eu tu ele ela você voce me te meu minha seu sua isso isto esse essa este esta ao aos à às ou mais menos muito já ja não nao sim ter tem fazer faz ser está esta são sao foi vai pode posso consigo quero preciso'.split(' '));
function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function termos(texto) {
  /* radical curto: 'calculo' acha 'calculadora', 'imagem' acha 'imagens' */
  return [...new Set(norm(texto).split(/[^a-z0-9#.+-]+/).filter((w) => w.length > 2 && !PARADAS.has(w)).map((w) => (w.length > 5 ? w.slice(0, 5) : w)))];
}
const INDICE = CONTEUDO.map((c) => ({ c, t: norm(c.t), m: norm(c.r + ' ' + c.p), x: norm(c.x) }));
function trechos(texto) {
  const ts = termos(texto);
  if (!ts.length) return [];
  return INDICE
    .map((i) => {
      let nota = 0;
      for (const q of ts) {
        if (i.t.includes(q)) nota += 8;
        if (i.m.includes(q)) nota += 3;
        const n = i.x.split(q).length - 1;
        if (n) nota += Math.min(n, 6);
      }
      return { i, nota };
    })
    .filter((r) => r.nota > 3)
    .sort((a, b) => b.nota - a.nota)
    .slice(0, MAX_TRECHOS)
    .map((r) => r.i.c);
}

/* ---------- limite por IP (por instância: segura o abuso casual, não um ataque) ---------- */
const pedidos = new Map();
function passou(ip) {
  const agora = Date.now();
  const lista = (pedidos.get(ip) || []).filter((t) => agora - t < LIMITE.janela);
  if (lista.length >= LIMITE.porIp) { pedidos.set(ip, lista); return true; }
  lista.push(agora);
  pedidos.set(ip, lista);
  if (pedidos.size > 5000) pedidos.clear();
  return false;
}

function erro(status, mensagem) {
  return Response.json({ erro: mensagem }, { status });
}

export async function POST(request) {
  if (!process.env.GEMINI_API_KEY) return erro(503, 'A IA ainda não foi configurada.');

  /* só responde ao próprio site */
  const origem = request.headers.get('origin');
  if (origem && new URL(origem).host !== request.headers.get('host')) return erro(403, 'Origem não permitida.');

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  if (passou(ip)) return erro(429, 'Muitas perguntas seguidas. Espere alguns minutos.');

  let corpo;
  try { corpo = await request.json(); } catch { return erro(400, 'Pedido inválido.'); }
  const historico = Array.isArray(corpo?.mensagens) ? corpo.mensagens.slice(-MAX_TURNOS) : [];
  const imagemOk = (i) => i && TIPOS_IMAGEM.has(i.tipo) && typeof i.dados === 'string' &&
    i.dados.length <= MAX_IMAGEM && /^[A-Za-z0-9+/]+=*$/.test(i.dados);
  const limpas = historico
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' &&
      (m.content.trim() || (m.role === 'user' && imagemOk(m.imagem))))
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, m.role === 'user' ? MAX_PERGUNTA : 4000),
      imagem: m.role === 'user' && imagemOk(m.imagem) ? m.imagem : null,
    }));
  while (limpas.length && limpas[0].role !== 'user') limpas.shift();
  const ultima = limpas[limpas.length - 1];
  if (!ultima || ultima.role !== 'user') return erro(400, 'Falta a pergunta.');
  /* no máximo um print por pedido: o mais recente */
  let viuImagem = false;
  for (let i = limpas.length - 1; i >= 0; i--) {
    if (!limpas[i].imagem) continue;
    if (viuImagem) limpas[i].imagem = null;
    viuImagem = true;
  }

  /* a pergunta anterior ajuda no "e no celular?" que vem depois */
  const anteriores = limpas.filter((m) => m.role === 'user').slice(-2).map((m) => m.content).join(' ');
  const achados = trechos(anteriores);
  const bloco = achados.length
    ? '<trechos>\n' + achados.map((c) => `<trecho endereco="${c.u}" trilha="${c.r}" parte="${c.p}" titulo="${c.t}">\n${c.x}\n</trecho>`).join('\n') + '\n</trechos>'
    : '<trechos>nenhum trecho do site encontrado para esta pergunta</trechos>';
  const textoFinal = bloco + '\n\nPergunta: ' + (ultima.content.trim() || 'Me ajude com o que aparece neste print.');
  /* no formato do Gemini: papéis "user" e "model", o print como inlineData */
  const contents = [];
  limpas.forEach((m, i) => {
    const texto = i === limpas.length - 1 ? textoFinal : (m.content.trim() || '(mandei este print)');
    const parts = [{ text: texto }];
    if (m.imagem) parts.unshift({ inlineData: { mimeType: m.imagem.tipo, data: m.imagem.dados } });
    const role = m.role === 'assistant' ? 'model' : 'user';
    /* duas perguntas seguidas (a resposta do meio deu erro) viram uma vez só */
    const antes = contents[contents.length - 1];
    if (antes && antes.role === role) antes.parts.push(...parts);
    else contents.push({ role, parts });
  });
  const pedido = JSON.stringify({
    systemInstruction: { parts: [{ text: SISTEMA }] },
    contents,
    generationConfig: { maxOutputTokens: 4000 },
  });

  /* tenta os modelos em ordem; passa para o próximo quando a cota gratuita do atual acabou (429)
     ou quando o Google diz que ele está sobrecarregado (500/503) — cada modelo tem a sua cota e a sua fila */
  let resposta = null;
  for (const modelo of MODELOS) {
    try {
      resposta = await fetch(API + modelo + ':streamGenerateContent?alt=sse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: pedido,
        signal: request.signal,
      });
    } catch (e) {
      console.error('perguntar: rede', e.message);
      return erro(502, 'Não consegui falar com a IA. Tente de novo.');
    }
    if (!TENTAR_OUTRO.has(resposta.status)) break;
    console.error('perguntar:', modelo, resposta.status, (await resposta.text()).slice(0, 200));
  }
  if (!resposta.ok) {
    if (!TENTAR_OUTRO.has(resposta.status)) console.error('perguntar:', resposta.status, (await resposta.text()).slice(0, 300));
    if (resposta.status === 429) return erro(429, 'A cota gratuita da IA acabou por agora. Tente de novo daqui a pouco ou amanhã.');
    if (resposta.status >= 500) return erro(503, 'A IA do Google está sobrecarregada agora. Tente de novo em instantes.');
    return erro(502, 'Algo deu errado do lado da IA. Tente de novo.');
  }

  /* SSE do Google: linhas "data: {json}", cada uma com um pedaço do texto */
  const codificar = new TextEncoder();
  const leitor = resposta.body.getReader();
  const saida = new ReadableStream({
    async start(ctrl) {
      const dec = new TextDecoder();
      let resto = '', escreveu = false, fim = '';
      try {
        for (;;) {
          const { done, value } = await leitor.read();
          if (done) break;
          resto += dec.decode(value, { stream: true });
          const linhas = resto.split('\n');
          resto = linhas.pop();
          for (const l of linhas) {
            if (!l.startsWith('data:')) continue;
            let j;
            try { j = JSON.parse(l.slice(5)); } catch { continue; }
            if (j.promptFeedback?.blockReason) fim = 'bloqueio';
            const cand = j.candidates?.[0];
            for (const p of cand?.content?.parts || []) {
              if (p.thought || typeof p.text !== 'string') continue;   /* o raciocínio interno não vai para a tela */
              ctrl.enqueue(codificar.encode(p.text));
              escreveu = true;
            }
            if (cand?.finishReason === 'MAX_TOKENS') fim = 'tamanho';
            if (cand?.finishReason === 'SAFETY' || cand?.finishReason === 'PROHIBITED_CONTENT') fim = 'bloqueio';
          }
        }
        if (fim === 'bloqueio' || !escreveu) ctrl.enqueue(codificar.encode('\n\nNão consigo responder a essa pergunta.'));
        if (fim === 'tamanho') ctrl.enqueue(codificar.encode('\n\n(A resposta foi cortada por tamanho.)'));
      } catch (e) {
        console.error('perguntar: fluxo', e.message);
        ctrl.enqueue(codificar.encode('\n\nA resposta foi interrompida. Tente de novo.'));
      }
      ctrl.close();
    },
    cancel() { leitor.cancel(); },
  });

  return new Response(saida, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Fontes': encodeURIComponent(JSON.stringify(achados.map((c) => ({ t: c.t, r: c.r, u: c.u })))),
    },
  });
}
