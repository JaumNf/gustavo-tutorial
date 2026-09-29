/* ============================================================
   ia.js — o chat com a IA do site.
   Um botão fixo no canto (acompanha a rolagem, como o do WhatsApp)
   abre o painel. A pergunta — e o print, se houver — vai para
   /api/perguntar (função da Vercel), que lê os tópicos do site e
   responde pelo Gemini (Google). A conversa fica só nesta aba.
   ============================================================ */
(function () {
  'use strict';

  var CHAVE = 'gt-ia-conversa';
  var LADO_MAX = 1568;          /* lado maior do print enviado: lê texto de tela e mantém o envio leve */
  var ICONE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H10l-4 3.5v-3.5H5z"/></svg>';
  var SUGESTOES = [
    'Como deixo uma imagem leve sem perder qualidade?',
    'O que fazer nas primeiras 24 horas depois de publicar?',
    'Como calculo o preço de uma landing page?'
  ];

  /* ---------- a conversa, guardada só na aba (sessionStorage) ---------- */
  var conversa = [];
  try { conversa = JSON.parse(sessionStorage.getItem(CHAVE)) || []; } catch (e) { conversa = []; }
  function guardar() {
    try { sessionStorage.setItem(CHAVE, JSON.stringify(conversa.slice(-20))); } catch (e) { /* aba sem armazenamento: a conversa só não sobrevive ao recarregar */ }
  }
  /* o print em tamanho de envio fica só na memória: some ao recarregar, a miniatura fica */
  var printEnviado = null;      /* { indice, tipo, dados } — reenviado nas perguntas seguintes */
  var anexo = null;             /* { tipo, dados, miniatura } — escolhido e ainda não enviado */

  /* ---------- o botão que acompanha a página ---------- */
  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'ia-fab';
  fab.setAttribute('aria-label', 'Perguntar à IA do site');
  fab.title = 'Perguntar à IA do site';
  fab.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5h15v11h-9l-4.5 3.8V16H4.5z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>';
  fab.addEventListener('click', abrir);
  document.body.appendChild(fab);

  /* na busca: "não achou?" leva junto o que já foi digitado */
  var caixaBusca = document.querySelector('.busca__caixa');
  if (caixaBusca) {
    var ponte = document.createElement('button');
    ponte.type = 'button';
    ponte.className = 'busca__ia';
    ponte.innerHTML = ICONE + '<span>Não achou? <strong>Pergunte à IA do site</strong></span>';
    ponte.addEventListener('click', function () {
      var termo = (document.getElementById('busca-campo') || {}).value || '';
      var fundo = document.querySelector('.busca__fundo');
      if (fundo) fundo.click();
      abrir();
      if (termo.trim()) { campo.value = termo.trim(); perguntar(); }
    });
    caixaBusca.appendChild(ponte);
  }

  /* ---------- painel ---------- */
  var painel = document.createElement('div');
  painel.className = 'ia';
  painel.hidden = true;
  painel.innerHTML =
    '<div class="ia__fundo" data-fechar></div>' +
    '<section class="ia__painel" role="dialog" aria-modal="true" aria-labelledby="ia-titulo">' +
      '<header class="ia__topo">' +
        '<h2 id="ia-titulo" class="ia__titulo">Perguntar ao site</h2>' +
        '<button type="button" class="ia__acao" data-limpar hidden>Nova conversa</button>' +
        '<button type="button" class="btn-icone ia__fechar" data-fechar aria-label="Fechar">' +
          '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '</header>' +
      '<div class="ia__rolo" aria-live="polite"></div>' +
      '<form class="ia__form">' +
        '<div class="ia__anexo" hidden></div>' +
        '<div class="ia__linha">' +
          '<label class="ia__clipe" title="Anexar print">' +
            '<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="visualmente-oculto" aria-label="Anexar print">' +
            '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="m4 16 4.5-4.5 3.5 3.5 2.5-2.5L20 18"/><circle cx="15.5" cy="9.5" r="1.4"/></svg></label>' +
          '<label class="visualmente-oculto" for="ia-campo">Sua pergunta</label>' +
          '<textarea id="ia-campo" class="ia__campo" rows="2" maxlength="1200" placeholder="Pergunte ou cole um print (Ctrl+V)…"></textarea>' +
          '<button type="submit" class="ia__enviar" aria-label="Enviar pergunta">' +
            '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
        '</div>' +
        '<p class="ia__aviso">A pergunta e o print vão para o Gemini, a IA do Google, no plano gratuito — e o Google pode usar esse conteúdo para melhorar os produtos dele. Não mande senha, dado de cliente nem documento pessoal. A IA pode errar: confira no tópico indicado.</p>' +
      '</form>' +
      '<div class="ia__soltar" aria-hidden="true">Solte o print aqui</div>' +
    '</section>';
  document.body.appendChild(painel);

  var caixa = painel.querySelector('.ia__painel');
  var rolo = painel.querySelector('.ia__rolo');
  var form = painel.querySelector('.ia__form');
  var campo = painel.querySelector('#ia-campo');
  var enviar = painel.querySelector('.ia__enviar');
  var limpar = painel.querySelector('[data-limpar]');
  var seletor = painel.querySelector('input[type=file]');
  var caixaAnexo = painel.querySelector('.ia__anexo');
  var anterior = null, ocupado = false;

  function abrir() {
    anterior = document.activeElement;
    painel.hidden = false;
    fab.classList.add('is-escondido');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { painel.classList.add('is-aberto'); });
    desenhar();
    campo.focus();
  }
  function fechar() {
    painel.classList.remove('is-aberto');
    document.body.style.overflow = '';
    painel.hidden = true;
    fab.classList.remove('is-escondido');
    if (anterior && anterior.focus) anterior.focus();
  }
  painel.addEventListener('click', function (e) {
    if (e.target.closest('[data-fechar]')) fechar();
    if (e.target.closest('[data-tirar]')) { anexo = null; desenharAnexo(); campo.focus(); }
    var sug = e.target.closest('[data-sugestao]');
    if (sug) { campo.value = sug.textContent; perguntar(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!painel.hidden && e.key === 'Escape') { e.preventDefault(); fechar(); }
  });
  limpar.addEventListener('click', function () {
    if (ocupado) return;
    conversa = []; printEnviado = null; anexo = null;
    guardar(); desenharAnexo(); desenhar(); campo.focus();
  });

  /* Enter envia; Shift+Enter quebra a linha */
  campo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); perguntar(); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); perguntar(); });

  /* ---------- o print: botão, colar ou arrastar ---------- */
  function carregarImagem(arquivo) {
    if (!arquivo || !/^image\//.test(arquivo.type)) return;
    var url = URL.createObjectURL(arquivo);
    var img = new Image();
    img.onload = function () {
      /* reduz no navegador: o envio fica em centenas de KB, não em MB */
      var escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * escala);
      c.height = Math.round(img.naturalHeight * escala);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';                 /* PNG transparente não vira fundo preto no JPEG */
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      var dados = c.toDataURL('image/jpeg', 0.88);
      var m = document.createElement('canvas');
      var em = Math.min(1, 240 / Math.max(c.width, c.height));
      m.width = Math.round(c.width * em); m.height = Math.round(c.height * em);
      m.getContext('2d').drawImage(c, 0, 0, m.width, m.height);
      anexo = { tipo: 'image/jpeg', dados: dados.split(',')[1], miniatura: m.toDataURL('image/jpeg', 0.7) };
      URL.revokeObjectURL(url);
      desenharAnexo();
      campo.focus();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      caixaAnexo.hidden = false;
      caixaAnexo.innerHTML = '<span class="ia__anexo-erro">Não consegui abrir essa imagem.</span>';
    };
    img.src = url;
  }
  function desenharAnexo() {
    caixaAnexo.hidden = !anexo;
    caixaAnexo.innerHTML = anexo
      ? '<img src="' + anexo.miniatura + '" alt="Print anexado"><span>Print anexado</span>' +
        '<button type="button" class="ia__acao" data-tirar>Tirar</button>'
      : '';
  }
  seletor.addEventListener('change', function () {
    carregarImagem(seletor.files && seletor.files[0]);
    seletor.value = '';
  });
  campo.addEventListener('paste', function (e) {
    var itens = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < itens.length; i++) {
      if (itens[i].kind === 'file' && /^image\//.test(itens[i].type)) {
        e.preventDefault();
        carregarImagem(itens[i].getAsFile());
        return;
      }
    }
  });
  caixa.addEventListener('dragover', function (e) {
    if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) {
      e.preventDefault();
      caixa.classList.add('is-soltando');
    }
  });
  caixa.addEventListener('dragleave', function (e) {
    if (!caixa.contains(e.relatedTarget)) caixa.classList.remove('is-soltando');
  });
  caixa.addEventListener('drop', function (e) {
    e.preventDefault();
    caixa.classList.remove('is-soltando');
    carregarImagem(e.dataTransfer.files && e.dataTransfer.files[0]);
  });

  /* ---------- markdown mínimo e seguro: escapa tudo, depois liga o que é conhecido ---------- */
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function linha(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    /* só links para páginas do próprio site ou https */
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, texto, url) {
      var ok = /^[a-z0-9-]+\.html(#[\w-]+)?$/i.test(url) || /^https:\/\//.test(url);
      return ok ? '<a href="' + url + '"' + (/^https/.test(url) ? ' target="_blank" rel="noopener"' : '') + '>' + texto + '</a>' : texto;
    });
    return s;
  }
  function md(texto) {
    var partes = texto.split(/```/), html = '';
    partes.forEach(function (p, i) {
      if (i % 2) {
        var nl = p.indexOf('\n');
        var cod = nl >= 0 ? p.slice(nl + 1) : p;
        html += '<pre class="ia__codigo"><code>' + esc(cod.replace(/\n$/, '')) + '</code></pre>';
        return;
      }
      p.split(/\n{2,}/).forEach(function (bloco) {
        bloco = bloco.trim();
        if (!bloco) return;
        var linhas = bloco.split('\n');
        if (linhas.every(function (l) { return /^\s*([-*]|\d+\.)\s/.test(l); })) {
          var ord = /^\s*\d+\./.test(linhas[0]);
          html += (ord ? '<ol>' : '<ul>') + linhas.map(function (l) {
            return '<li>' + linha(l.replace(/^\s*([-*]|\d+\.)\s+/, '')) + '</li>';
          }).join('') + (ord ? '</ol>' : '</ul>');
        } else if (/^#{1,4}\s/.test(bloco)) {
          html += '<p><strong>' + linha(bloco.replace(/^#{1,4}\s+/, '')) + '</strong></p>';
        } else {
          html += '<p>' + linhas.map(linha).join('<br>') + '</p>';
        }
      });
    });
    return html;
  }

  /* ---------- desenho da conversa ---------- */
  /* mostra os tópicos que a resposta citou; se ela não citou nenhum, os três mais próximos */
  function fontes(lista, texto) {
    if (!lista || !lista.length) return '';
    var citadas = lista.filter(function (f) { return texto.indexOf('(' + f.u + ')') >= 0; });
    lista = citadas.length ? citadas : lista.slice(0, 3);
    return '<div class="ia__fontes"><span>No site</span>' + lista.map(function (f) {
      return '<a href="' + esc(f.u) + '">' + esc(f.t) + '<small>' + esc(f.r) + '</small></a>';
    }).join('') + '</div>';
  }
  function desenhar() {
    limpar.hidden = !conversa.length;
    if (!conversa.length) {
      rolo.innerHTML =
        '<div class="ia__vazio"><p>Pergunte sobre qualquer coisa das trilhas e ferramentas, ou mande um print de um erro, de um código ou de uma tela. A resposta aponta o tópico do site onde o assunto está explicado.</p>' +
        '<div class="ia__sugestoes">' + SUGESTOES.map(function (s) {
          return '<button type="button" class="ia__sugestao" data-sugestao>' + esc(s) + '</button>';
        }).join('') + '</div></div>';
      return;
    }
    rolo.innerHTML = conversa.map(function (m) {
      if (m.role === 'user') {
        return '<div class="ia__pergunta">' +
          (m.img ? '<img class="ia__print" src="' + m.img + '" alt="Print enviado">' : '') +
          (m.content ? '<p>' + esc(m.content) + '</p>' : '') + '</div>';
      }
      return '<div class="ia__resposta' + (m.erro ? ' is-erro' : '') + '">' + md(m.content || '') + fontes(m.fontes, m.content || '') + '</div>';
    }).join('');
    rolo.scrollTop = rolo.scrollHeight;
  }

  /* ---------- a pergunta ---------- */
  function perguntar() {
    var texto = campo.value.trim();
    if ((!texto && !anexo) || ocupado) return;
    ocupado = true;
    enviar.disabled = true;
    campo.value = '';
    var pergunta = { role: 'user', content: texto };
    if (anexo) {
      pergunta.img = anexo.miniatura;
      printEnviado = { indice: conversa.length, tipo: anexo.tipo, dados: anexo.dados };
      anexo = null;
      desenharAnexo();
    }
    conversa.push(pergunta);
    var resposta = { role: 'assistant', content: '' };
    conversa.push(resposta);
    desenhar();
    var bolha = rolo.lastElementChild;
    bolha.classList.add('is-escrevendo');

    /* só o último print vai junto, preso à pergunta em que foi mandado — o bastante para "e isso aqui?" */
    var envio = [];
    conversa.slice(0, -1).forEach(function (m, i) {
      if (m.erro) return;
      var item = { role: m.role, content: m.content };
      if (printEnviado && printEnviado.indice === i) item.imagem = { tipo: printEnviado.tipo, dados: printEnviado.dados };
      envio.push(item);
    });

    fetch('/api/perguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagens: envio })
    }).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(j.erro || (r.status === 404 ? 'A IA só funciona no site publicado ou no servidor local do projeto.'
            : r.status === 413 ? 'O print é grande demais. Tente um recorte menor.' : 'Não consegui falar com a IA.'));
        });
      }
      try { resposta.fontes = JSON.parse(decodeURIComponent(r.headers.get('X-Fontes') || '[]')); } catch (e) { resposta.fontes = []; }
      var leitor = r.body.getReader(), dec = new TextDecoder(), agendado = false;
      function pintar() {
        agendado = false;
        bolha.innerHTML = md(resposta.content);
        rolo.scrollTop = rolo.scrollHeight;
      }
      function ler() {
        return leitor.read().then(function (p) {
          if (p.done) return;
          resposta.content += dec.decode(p.value, { stream: true });
          if (!agendado) { agendado = true; requestAnimationFrame(pintar); }
          return ler();
        });
      }
      return ler();
    }).catch(function (e) {
      resposta.erro = true;
      resposta.content = e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'Não consegui falar com a IA. Confira a conexão e tente de novo.';
    }).then(function () {
      ocupado = false;
      enviar.disabled = false;
      guardar();
      desenhar();
      campo.focus();
    });
  }
})();
