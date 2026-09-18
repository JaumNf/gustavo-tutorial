(function () {
  'use strict';
  var raiz = document.documentElement;

  /* tema */
  try {
    var salvo = localStorage.getItem('gt-tema');
    if (salvo === 'dark' || salvo === 'light') raiz.setAttribute('data-theme', salvo);
  } catch (e) {}

  var btnTema = document.getElementById('btn-tema');
  if (btnTema) {
    btnTema.addEventListener('click', function () {
      var escuro = raiz.getAttribute('data-theme') === 'dark' ||
        (!raiz.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      var novo = escuro ? 'light' : 'dark';
      raiz.setAttribute('data-theme', novo);
      try { localStorage.setItem('gt-tema', novo); } catch (e) {}
    });
  }

  /* filtro revisao / novo */
  var botoes = document.querySelectorAll('.filtro');
  var partes = document.querySelectorAll('.parte');
  var vazio = document.getElementById('vazio');
  if (botoes.length && partes.length) {
    var aplicar = function (valor) {
      document.body.setAttribute('data-filtro', valor);
      botoes.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filtro === valor)); });
      var algum = false;
      partes.forEach(function (p) {
        var n = valor === 'tudo' ? p.querySelectorAll('.topico').length
                                 : p.querySelectorAll('.topico[data-marca="' + valor + '"]').length;
        p.classList.toggle('is-oculta', n === 0);
        if (n > 0) algum = true;
      });
      if (vazio) vazio.style.display = algum ? 'none' : 'block';
    };
    botoes.forEach(function (b) { b.addEventListener('click', function () { aplicar(b.dataset.filtro); }); });
    aplicar('tudo');
  }

  /* marcar como estudado */
  var estudados = {};
  try { estudados = JSON.parse(localStorage.getItem('gt-estudados') || '{}'); } catch (e) {}
  document.querySelectorAll('.topico').forEach(function (t) {
    var cabeca = t.querySelector('.topico__cabeca');
    if (!cabeca) return;
    var b = document.createElement('button');
    b.className = 'marcar'; b.type = 'button';
    b.innerHTML = '<span class="marcar__caixa" aria-hidden="true">\u2713</span><span>Estudado</span>';
    b.setAttribute('aria-pressed', 'false');
    cabeca.appendChild(b);
    if (estudados[t.id]) { t.classList.add('is-estudado'); b.setAttribute('aria-pressed', 'true'); }
    b.addEventListener('click', function () {
      var on = t.classList.toggle('is-estudado');
      b.setAttribute('aria-pressed', String(on));
      if (on) { estudados[t.id] = 1; } else { delete estudados[t.id]; }
      try { localStorage.setItem('gt-estudados', JSON.stringify(estudados)); } catch (e) {}
    });
  });

  /* copiar codigo */
  document.querySelectorAll('.copiar').forEach(function (b) {
    b.addEventListener('click', function () {
      var bloco = b.closest('.bloco-codigo');
      var cod = bloco ? bloco.querySelector('code') : null;
      if (!cod || !navigator.clipboard) return;
      navigator.clipboard.writeText(cod.textContent).then(function () {
        var antes = b.textContent; b.textContent = 'copiado';
        setTimeout(function () { b.textContent = antes; }, 1400);
      }).catch(function () {});
    });
  });

  /* sumario: destaque da secao atual */
  var links = document.querySelectorAll('.sumario a[href^="#t-"]');
  if (links.length) {
    var mapa = {};
    links.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var l = mapa[en.target.id];
        if (!l) return;
        links.forEach(function (a) { a.classList.remove('is-atual'); });
        l.classList.add('is-atual');
      });
    }, { rootMargin: '-70px 0px -70% 0px', threshold: 0 });
    document.querySelectorAll('.topico').forEach(function (t) { obs.observe(t); });
  }

  /* sumario no celular */
  var sum = document.getElementById('sumario');
  var abrir = document.getElementById('sumario-abrir');
  if (sum && abrir) {
    abrir.addEventListener('click', function () {
      var ab = sum.classList.toggle('is-aberto');
      abrir.setAttribute('aria-expanded', String(ab));
    });
    sum.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 900) {
          sum.classList.remove('is-aberto');
          abrir.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
})();
/* menu de trilhas: fecha ao clicar fora e no Esc (melhoria opcional) */
(function () {
  var menu = document.getElementById('navmenu');
  if (!menu) return;
  document.addEventListener('click', function (e) {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
})();
