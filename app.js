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

  /* progresso nos cards da home (usa o mesmo gt-estudados acima) */
  var celulas = document.querySelectorAll('.grade .celula[href]');
  if (celulas.length && window.GT_PROGRESSO) {
    celulas.forEach(function (cel) {
      var ids = window.GT_PROGRESSO[cel.getAttribute('href')];
      if (!ids || !ids.length) return;
      var feitos = ids.filter(function (id) { return estudados[id]; }).length;
      if (!feitos) return;
      var pe = cel.querySelector('.celula__pe');
      if (!pe) return;
      var badge = document.createElement('span');
      badge.className = 'celula__progresso' + (feitos === ids.length ? ' is-completo' : '');
      badge.textContent = feitos === ids.length ? 'completo' : feitos + ' de ' + ids.length;
      pe.insertBefore(badge, pe.querySelector('.seta'));
    });
  }

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

/* cabecalho flutuante: some ao descer, reaparece ao subir.
   O hub nao tem cabecalho — a guarda cobre isso. */
(function () {
  var topo = document.querySelector('.topo');
  if (!topo) return;

  var menu = document.getElementById('navmenu');
  var ultimo = window.pageYOffset || 0;
  var agendado = false;
  var ate = 0, tempo = null;   /* trava temporaria durante pulo de ancora */
  var LIMIAR = 6;              /* ignora tremor de trackpad */
  var SOLTO = 120;             /* acima disto o topo aparece sempre */

  function mostrar() { topo.classList.remove('topo--escondido'); }
  function esconder() { topo.classList.add('topo--escondido'); }

  /* menu aberto ou foco de teclado dentro do topo: proibido esconder */
  function preso() {
    if (menu && menu.open) return true;
    return topo.contains(document.activeElement || document.body);
  }

  function avaliar() {
    var y = window.pageYOffset;
    if (y < 0) y = 0;                                 /* overscroll do iOS */
    if (preso()) { ultimo = y; mostrar(); return; }
    if (Date.now() < ate) { ultimo = y; return; }     /* durante o pulo, nao mexe */
    if (y <= SOLTO) { ultimo = y; mostrar(); return; }

    var d = y - ultimo;
    if (d > LIMIAR) { esconder(); ultimo = y; }
    else if (d < -LIMIAR) { mostrar(); ultimo = y; }
  }

  window.addEventListener('scroll', function () {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () { avaliar(); agendado = false; });
  }, { passive: true });

  /* aba em segundo plano nao roda rAF: se o quadro agendado for descartado,
     a trava ficaria presa e o cabecalho congelaria. Destrava ao voltar. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    agendado = false;
    ultimo = window.pageYOffset;
    avaliar();
  });

  topo.addEventListener('focusin', mostrar);
  if (menu) menu.addEventListener('toggle', function () {
    if (menu.open) mostrar(); else ultimo = window.pageYOffset;
  });

  /* pulo de ancora: subir ate o alvo conta como rolagem para cima, e o topo
     reapareceria bem em cima dele. Esconde e congela ate a rolagem terminar. */
  function travarPulo() {
    esconder();
    ate = Date.now() + 900;
    clearTimeout(tempo);
    tempo = setTimeout(function () {
      ultimo = window.pageYOffset;
      avaliar();
    }, 950);
  }

  document.addEventListener('click', function (e) {
    var alvo = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (alvo && alvo.getAttribute('href').length > 1) travarPulo();
  }, true);
  window.addEventListener('hashchange', travarPulo);
})();
