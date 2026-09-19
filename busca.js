/* ============================================================
   busca.js — busca global do site.
   O índice (busca-indice.js) só é carregado na primeira abertura.
   ============================================================ */
(function () {
  'use strict';

  var carregado = false, carregando = false;

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* ---------- botão no cabeçalho ---------- */
  var topo = document.querySelector('.topo__interno');
  if (!topo) return;

  var botao = document.createElement('button');
  botao.className = 'btn-icone btn-busca';
  botao.type = 'button';
  botao.setAttribute('aria-label', 'Buscar no site');
  botao.title = 'Buscar  (/)';
  botao.innerHTML = '<span aria-hidden="true">&#9906;</span>';
  var tema = document.getElementById('btn-tema');
  if (tema) topo.insertBefore(botao, tema); else topo.appendChild(botao);

  /* ---------- painel ---------- */
  var painel = document.createElement('div');
  painel.className = 'busca';
  painel.hidden = true;
  painel.innerHTML =
    '<div class="busca__fundo" data-fechar></div>' +
    '<div class="busca__caixa" role="dialog" aria-modal="true" aria-label="Buscar no site">' +
      '<input type="search" class="busca__campo" id="busca-campo" autocomplete="off" ' +
             'placeholder="buscar em tudo… ex.: contraste, git, preço" aria-label="Termo de busca">' +
      '<div class="busca__resultados" id="busca-resultados" role="listbox"></div>' +
      '<p class="busca__rodape"><span><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> abrir · <kbd>Esc</kbd> fechar</span></p>' +
    '</div>';
  document.body.appendChild(painel);

  var campo  = painel.querySelector('#busca-campo');
  var saida  = painel.querySelector('#busca-resultados');
  var indice = 0, atuais = [];

  /* ---------- abrir / fechar ---------- */
  function abrir() {
    painel.hidden = false;
    document.body.style.overflow = 'hidden';
    campo.focus();
    campo.select();
    garantirIndice();
  }
  function fechar() {
    painel.hidden = true;
    document.body.style.overflow = '';
    botao.focus();
  }

  botao.addEventListener('click', abrir);
  painel.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-fechar')) fechar();
  });

  document.addEventListener('keydown', function (e) {
    var digitando = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (!painel.hidden && e.key === 'Escape') { e.preventDefault(); fechar(); return; }
    if (!painel.hidden && e.key === 'Tab') {
      /* prende o foco dentro do modal: campo + itens de resultado */
      var focaveis = [campo].concat(Array.prototype.slice.call(saida.querySelectorAll('a')));
      var pos = focaveis.indexOf(document.activeElement);
      if (e.shiftKey) {
        if (pos <= 0) { e.preventDefault(); focaveis[focaveis.length - 1].focus(); }
      } else {
        if (pos === focaveis.length - 1) { e.preventDefault(); focaveis[0].focus(); }
      }
      return;
    }
    if (painel.hidden && !digitando && (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)))) {
      e.preventDefault(); abrir();
    }
  });

  /* ---------- carrega o índice sob demanda ---------- */
  function garantirIndice() {
    if (carregado || carregando) return;
    carregando = true;
    saida.innerHTML = '<p class="busca__aviso">carregando o índice…</p>';
    var s = document.createElement('script');
    s.src = 'busca-indice.js';
    s.onload = function () {
      carregado = true; carregando = false;
      if (window.GT_BUSCA && campo.value) procurar(); else saida.innerHTML = dica();
    };
    s.onerror = function () {
      carregando = false;
      saida.innerHTML = '<p class="busca__aviso">não consegui carregar o índice da busca.</p>';
    };
    document.head.appendChild(s);
  }

  function dica() {
    return '<p class="busca__aviso">Digite para buscar em todas as trilhas — título de tópico, ' +
           'nome da parte ou trilha.</p>';
  }

  /* ---------- busca ---------- */
  function pontuar(item, termos) {
    var t = norm(item.t), p = norm(item.p), r = norm(item.r), d = norm(item.d || '');
    var total = 0;
    for (var i = 0; i < termos.length; i++) {
      var q = termos[i], nota = 0;
      if (t === q) nota = 100;
      else if (t.indexOf(q) === 0) nota = 60;
      else if (t.indexOf(q) !== -1) nota = 40;
      else if (r.indexOf(q) !== -1) nota = 18;
      else if (p.indexOf(q) !== -1) nota = 14;
      else if (d.indexOf(q) !== -1) nota = 8;
      if (!nota) return 0;              /* todos os termos precisam bater */
      total += nota;
    }
    return total;
  }

  function realcar(texto, termos) {
    var esc = texto.replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
    termos.forEach(function (q) {
      if (q.length < 2) return;
      var alvo = norm(esc), pos = alvo.indexOf(q);
      if (pos === -1) return;
      esc = esc.slice(0, pos) + '<mark>' + esc.slice(pos, pos + q.length) + '</mark>' + esc.slice(pos + q.length);
    });
    return esc;
  }

  function procurar() {
    var termo = campo.value.trim();
    if (!termo) { saida.innerHTML = dica(); atuais = []; return; }
    if (!window.GT_BUSCA) return;

    var termos = norm(termo).split(/\s+/).filter(Boolean);
    atuais = window.GT_BUSCA
      .map(function (i) { return { i: i, n: pontuar(i, termos) }; })
      .filter(function (x) { return x.n > 0; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 24)
      .map(function (x) { return x.i; });

    if (!atuais.length) {
      saida.innerHTML = '<p class="busca__aviso">nada encontrado para “' +
        termo.replace(/[<>&]/g, '') + '”.</p>';
      return;
    }

    indice = 0;
    saida.innerHTML = atuais.map(function (r, n) {
      return '<a class="busca__item' + (n === 0 ? ' is-atual' : '') + '" href="' + r.u + '" role="option">' +
             '<span class="busca__trilha">' + r.r + (r.p ? ' · ' + r.p : '') + '</span>' +
             '<strong>' + realcar(r.t, termos) + '</strong>' +
             (r.d ? '<span class="busca__trecho">' + realcar(r.d, termos) + '</span>' : '') +
             '</a>';
    }).join('');
  }

  var atraso;
  campo.addEventListener('input', function () {
    clearTimeout(atraso);
    atraso = setTimeout(procurar, 90);
  });

  campo.addEventListener('keydown', function (e) {
    var itens = saida.querySelectorAll('.busca__item');
    if (!itens.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      itens[indice].classList.remove('is-atual');
      indice = e.key === 'ArrowDown'
        ? (indice + 1) % itens.length
        : (indice - 1 + itens.length) % itens.length;
      itens[indice].classList.add('is-atual');
      itens[indice].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      itens[indice].click();
    }
  });
})();
