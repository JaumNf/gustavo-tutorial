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

/* conteudo recente: topico com data-desde="AAAA-MM-DD" ganha selo por 30 dias.
   Some sozinho depois do prazo, sem ninguem precisar tirar do HTML.
   Em estudar.html e no hub, a lista vem de window.GT_RECENTES (progresso.js). */
(function () {
  var DIAS = 30;
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  function lerData(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function recente(s) {
    var d = lerData(s);
    if (!d) return false;
    var dias = Math.round((hoje - d) / 864e5);
    return dias >= 0 && dias <= DIAS;
  }
  function rotulo(s) {
    var d = lerData(s);
    return d.getDate() + ' ' + MESES[d.getMonth()];
  }

  /* 1. nas trilhas: selo no topico e ponto no sumario lateral */
  document.querySelectorAll('.topico[data-desde]').forEach(function (t) {
    var d = t.getAttribute('data-desde');
    if (!recente(d)) return;
    t.classList.add('is-recente');
    var h3 = t.querySelector('.topico__cabeca h3');
    if (h3) {
      var selo = document.createElement('span');
      selo.className = 'selo-recente';
      selo.textContent = 'Chegou ' + rotulo(d);
      h3.parentNode.insertBefore(selo, h3.nextSibling);
    }
    var item = document.querySelector('.sumario a[href="#' + t.id + '"]');
    if (item) {
      item.classList.add('is-recente');
      item.setAttribute('title', 'Chegou ' + rotulo(d));
    }
  });

  var lista = window.GT_RECENTES;
  if (!lista || !lista.length) return;
  var atuais = lista.filter(function (r) { return recente(r.d); });
  if (!atuais.length) return;

  /* 2. estudar.html: lista do que chegou e marca nas trilhas */
  var mapa = document.querySelector('.home__mapa');
  if (mapa) {
    var nomes = {};
    atuais.forEach(function (r) {
      var link = mapa.querySelector('.home__links a[href="' + r.a + '"]');
      if (!link) return;
      nomes[r.a] = link.textContent;
      if (link.querySelector('.novidade')) return;
      var pino = document.createElement('span');
      pino.className = 'novidade';
      pino.textContent = 'novo';
      link.appendChild(pino);
    });

    var caixa = document.createElement('section');
    caixa.className = 'recentes';
    caixa.setAttribute('aria-labelledby', 'recentes-titulo');
    var titulo = document.createElement('p');
    titulo.className = 'home__titulo';
    titulo.id = 'recentes-titulo';
    titulo.textContent = 'Chegou nos últimos ' + DIAS + ' dias';
    var ul = document.createElement('ul');
    ul.className = 'recentes__lista';
    atuais.slice(0, 6).forEach(function (r) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = r.u;
      var data = document.createElement('span');
      data.className = 'recentes__data';
      data.textContent = rotulo(r.d);
      var nome = document.createElement('strong');
      nome.textContent = r.t;
      var onde = document.createElement('span');
      onde.className = 'recentes__trilha';
      onde.textContent = nomes[r.a] || '';
      a.appendChild(data); a.appendChild(nome); a.appendChild(onde);
      li.appendChild(a);
      ul.appendChild(li);
    });
    caixa.appendChild(titulo);
    caixa.appendChild(ul);
    mapa.parentNode.insertBefore(caixa, mapa);
  }

  /* 3. hub: aviso na porta de estudo */
  var porta = document.querySelector('.porta--estudo');
  if (porta) {
    var pe = porta.querySelector('.porta__pe');
    var aviso = document.createElement('span');
    aviso.className = 'porta__novo';
    aviso.textContent = atuais.length === 1
      ? '1 tópico novo nos últimos ' + DIAS + ' dias'
      : atuais.length + ' tópicos novos nos últimos ' + DIAS + ' dias';
    porta.insertBefore(aviso, pe || null);
  }
})();
