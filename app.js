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

/* cabecalho flutuante: some ao descer, reaparece depois de ~0,3s subindo.
   Uma subida curta — voltar um paragrafo para reler — nao traz o topo de
   volta; so a intencao clara de subir traz. O hub nao tem cabecalho — a
   guarda cobre isso. */
(function () {
  var topo = document.querySelector('.topo');
  if (!topo) return;

  var menu = document.getElementById('navmenu');
  var ultimo = window.pageYOffset || 0;
  var agendado = false;
  var ate = 0, tempo = null;   /* trava temporaria durante pulo de ancora */
  var LIMIAR = 6;              /* ignora tremor de trackpad */
  var SOLTO = 120;             /* acima disto o topo aparece sempre */
  var SUBIDA = 300;            /* quanto tempo subindo ate o topo voltar */
  var PAUSA = 300;             /* intervalo maior que isto entre dois giros da roda recomeca a conta */
  var inicioSubida = 0, ultimaSubida = 0;

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
    if (d > LIMIAR) { esconder(); ultimo = y; inicioSubida = 0; }
    else if (d < -LIMIAR) {
      var agora = Date.now();
      /* a roda do mouse gira aos trancos: entre trancos da mesma subida o
         intervalo e curto; uma pausa maior quer dizer que a subida acabou */
      if (!inicioSubida || agora - ultimaSubida > PAUSA) inicioSubida = agora;
      ultimaSubida = agora;
      ultimo = y;
      if (agora - inicioSubida >= SUBIDA) mostrar();
    }
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
    inicioSubida = 0;
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
      /* o nome sai antes do selo "novo" entrar no link — senão vira "HTML puronovo" */
      if (!nomes[r.a]) nomes[r.a] = link.textContent;
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
    /* abaixo do mapa: primeiro o que o estudo tem, depois o que chegou agora */
    mapa.parentNode.insertBefore(caixa, mapa.nextSibling);
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

/* exemplos ao lado do texto: em tela larga (1280px+), cada grupo de exemplos
   seguidos — código ou vitrine — sobe até a altura do texto que vem logo antes
   dele e ganha uma seta apontando para esse texto. Em tela menor, o grupo
   volta para a ordem original, no meio da leitura. Só nas trilhas. */
(function () {
  var corpos = document.querySelectorAll('.palco:not(.palco--ref) .topico__corpo');
  if (!corpos.length || !window.matchMedia) return;
  var largo = window.matchMedia('(min-width: 1280px)');
  var grupos = [];

  function ehExemplo(el) {
    return el && (el.classList.contains('bloco-codigo') || el.classList.contains('vitrine'));
  }

  Array.prototype.forEach.call(corpos, function (corpo) {
    var filhos = Array.prototype.slice.call(corpo.children);
    for (var i = 0; i < filhos.length; i++) {
      if (!ehExemplo(filhos[i])) continue;
      var par = filhos[i].previousElementSibling;
      var caixa = document.createElement('div');
      caixa.className = 'exemplos';
      var seta = document.createElement('span');
      seta.className = 'exemplos__seta';
      seta.setAttribute('aria-hidden', 'true');
      corpo.insertBefore(caixa, filhos[i]);
      caixa.appendChild(seta);
      while (i < filhos.length && ehExemplo(filhos[i])) { caixa.appendChild(filhos[i]); i++; }
      /* exemplo que abre o tópico não tem texto antes: fica onde está, sem seta,
         mas entra na conta dos buracos como qualquer outro */
      if (!par) caixa.classList.add('exemplos--sem-par');
      grupos.push({ caixa: caixa, par: par });
    }
  });

  function arrumar() {
    grupos.forEach(function (g) {
      if (!g.par) return;
      if (largo.matches) {
        if (g.caixa.nextElementSibling !== g.par) g.par.parentNode.insertBefore(g.caixa, g.par);
      } else if (g.par.nextElementSibling !== g.caixa) {
        g.par.parentNode.insertBefore(g.caixa, g.par.nextSibling);
      }
      g.par.classList.remove('is-par-ativo');
    });
    encaixar();
  }

  /* ---------- sem buracos: exemplo que passa muito do texto vira cartão ----------
     Quando a coluna de exemplos de um tópico desce além do fim do texto, o tópico
     inteiro espera por ela e abre um buraco. Então, do maior para o menor, cada
     grupo vira um cartão "abrir exemplo" ao lado do texto par, até a coluna caber. */
  var FOLGA = 140;   /* até isto de sobra não é buraco: não vale esconder exemplo por pouco */
  function fimDo(corpo, ehGrupo) {
    var fim = 0;
    Array.prototype.forEach.call(corpo.children, function (el) {
      if (el.classList.contains('exemplos') !== ehGrupo) return;
      fim = Math.max(fim, el.getBoundingClientRect().bottom);
    });
    return fim;
  }
  function rotulos(caixa) {
    return Array.prototype.map.call(caixa.querySelectorAll(':scope > .bloco-codigo, :scope > .vitrine'), function (el) {
      if (el.classList.contains('vitrine')) return 'exemplo vivo';
      var l = el.querySelector('.bloco-codigo__ling');
      return l ? l.textContent.trim().toLowerCase() : 'código';
    });
  }
  /* dois níveis: "só o código" recolhe o código e deixa a vitrine à mostra;
     "tudo" vira o cartão. O visual é a última coisa a sumir. */
  function temVitrine(g) { return !!g.caixa.querySelector(':scope > .vitrine'); }
  function alturaCodigo(g) {
    return Array.prototype.reduce.call(g.caixa.querySelectorAll(':scope > .bloco-codigo'), function (s, el) { return s + el.offsetHeight; }, 0);
  }
  function fechar(g, tudo) {
    if (!g.botao) {
      g.botao = document.createElement('button');
      g.botao.type = 'button';
      g.botao.className = 'exemplos__abrir';
      g.botao.innerHTML = '<span class="exemplos__abrir-t"></span><span class="exemplos__abrir-tipos"></span><span class="exemplos__abrir-seta" aria-hidden="true">›</span>';
      g.botao.addEventListener('click', function () { abrirModal(g); });
      g.caixa.appendChild(g.botao);
    }
    var soCodigo = !tudo && temVitrine(g);
    g.botao.querySelector('.exemplos__abrir-t').textContent = soCodigo ? 'Ver o código' : 'Abrir exemplo';
    g.botao.querySelector('.exemplos__abrir-tipos').textContent = rotulos(g.caixa)
      .filter(function (r) { return !soCodigo || r !== 'exemplo vivo'; }).join(' · ');
    g.caixa.classList.toggle('is-sem-codigo', soCodigo);
    g.caixa.classList.toggle('is-fechado', !soCodigo);
  }
  function encaixar() {
    if (aberto) return;   /* com a janela aberta, o conteúdo de um grupo está lá dentro */
    var porCorpo = new Map();
    grupos.forEach(function (g) {
      g.caixa.classList.remove('is-fechado', 'is-sem-codigo');
      var c = g.caixa.parentNode;
      if (!porCorpo.has(c)) porCorpo.set(c, []);
      porCorpo.get(c).push(g);
    });
    if (!largo.matches) return;
    porCorpo.forEach(function (lista, corpo) {
      function cabe() { return fimDo(corpo, true) <= fimDo(corpo, false) + FOLGA; }
      /* 1º o código, do mais alto para o mais baixo */
      var porCodigo = lista.filter(function (g) { return alturaCodigo(g) > 0; })
        .sort(function (a, b) { return alturaCodigo(b) - alturaCodigo(a); });
      for (var i = 0; i < porCodigo.length && !cabe(); i++) fechar(porCodigo[i], false);
      /* 2º, se ainda não coube, os grupos com vitrine viram cartão */
      var porAltura = lista.filter(temVitrine).sort(function (a, b) { return b.caixa.offsetHeight - a.caixa.offsetHeight; });
      for (var j = 0; j < porAltura.length && !cabe(); j++) fechar(porAltura[j], true);
    });
  }

  /* ---------- a janela do exemplo ---------- */
  var modal = null, aberto = null;
  function abrirModal(g) {
    if (!modal) {
      modal = document.createElement('dialog');
      modal.className = 'exemplo-modal';
      modal.setAttribute('aria-labelledby', 'exemplo-modal-titulo');
      modal.innerHTML = '<div class="exemplo-modal__barra"><p class="exemplo-modal__titulo" id="exemplo-modal-titulo"></p>' +
        '<button class="exemplo-modal__fechar" type="button" aria-label="Fechar o exemplo">×</button></div>' +
        '<div class="exemplo-modal__corpo"></div>';
      document.body.appendChild(modal);
      modal.querySelector('.exemplo-modal__fechar').addEventListener('click', function () { modal.close(); });
      /* clique no fundo escuro fecha */
      modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
      /* ao fechar, o conteúdo volta para o lugar dele no tópico */
      modal.addEventListener('close', function () {
        if (!aberto) return;
        var corpo = modal.querySelector('.exemplo-modal__corpo');
        while (corpo.firstChild) aberto.caixa.insertBefore(corpo.firstChild, aberto.botao);
        aberto = null;
      });
    }
    if (!modal.showModal) return;
    aberto = g;
    var fonte = g.par || g.caixa.closest('.topico').querySelector('h3');
    var titulo = fonte ? fonte.textContent.replace(/\s+/g, ' ').trim() : 'Exemplo';
    modal.querySelector('.exemplo-modal__titulo').textContent = titulo.length > 90 ? titulo.slice(0, 88) + '…' : titulo;
    var corpo = modal.querySelector('.exemplo-modal__corpo');
    Array.prototype.forEach.call(g.caixa.querySelectorAll(':scope > .bloco-codigo, :scope > .vitrine'), function (el) { corpo.appendChild(el); });
    modal.showModal();
  }

  arrumar();
  if (largo.addEventListener) largo.addEventListener('change', arrumar);
  else if (largo.addListener) largo.addListener(arrumar);
  /* a fonte da web muda a altura do texto: mede de novo quando ela chega, e ao redimensionar */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(encaixar);
  window.addEventListener('load', encaixar);
  var espera = null;
  window.addEventListener('resize', function () { clearTimeout(espera); espera = setTimeout(encaixar, 150); });

  /* passar o mouse (ou o foco) no exemplo acende o texto a que ele pertence */
  grupos.forEach(function (g) {
    if (!g.par) return;
    function acender() { if (largo.matches) g.par.classList.add('is-par-ativo'); }
    function apagar() { g.par.classList.remove('is-par-ativo'); }
    g.caixa.addEventListener('mouseenter', acender);
    g.caixa.addEventListener('mouseleave', apagar);
    /* foco só acende quando vem do teclado — clique num controle da vitrine não deixa o texto preso aceso */
    g.caixa.addEventListener('focusin', function (e) {
      try { if (e.target.matches(':focus-visible')) acender(); } catch (x) { acender(); }
    });
    g.caixa.addEventListener('focusout', apagar);
  });
})();

/* vitrine: exemplo vivo num palco, com os controles no canto */
(function () {
  var vitrines = document.querySelectorAll('.vitrine');
  if (!vitrines.length) return;
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(vitrines, function (v) {
    var codigo = v.querySelector('.vitrine__codigo');
    var palco = v.querySelector('.vitrine__palco');

    /* ver código */
    var bCod = v.querySelector('[data-acao="codigo"]');
    if (bCod && codigo) bCod.addEventListener('click', function () {
      var abrir = codigo.hidden;
      codigo.hidden = !abrir;
      bCod.setAttribute('aria-expanded', String(abrir));
      bCod.textContent = abrir ? 'esconder código' : 'ver código';
    });

    /* pausar / continuar */
    var bPausa = v.querySelector('[data-acao="pausar"]');
    function pausar(sim) {
      v.classList.toggle('is-pausada', sim);
      if (bPausa) { bPausa.setAttribute('aria-pressed', String(sim)); bPausa.textContent = sim ? 'continuar' : 'pausar'; }
    }
    if (bPausa) bPausa.addEventListener('click', function () {
      var cubo = v.querySelector('.vx-cubo');
      if (cubo && cubo.style.transform) { cubo.style.transform = ''; cubo.style.animation = ''; pausar(false); return; }
      pausar(!v.classList.contains('is-pausada'));
    });

    /* cubo: arrastar gira na mão; soltar deixa parado onde ficou */
    var cubo = v.querySelector('.vx-cubo');
    if (cubo && palco) {
      var arrastando = false, x0 = 0, y0 = 0, rx = -22, ry = 38;
      palco.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        arrastando = true; x0 = e.clientX; y0 = e.clientY;
        var m = /rotateX\((-?[\d.]+)deg\) rotateY\((-?[\d.]+)deg\)/.exec(cubo.style.transform || '');
        if (m) { rx = +m[1]; ry = +m[2]; }
        else {
          /* pega o ângulo em que a animação estava, para não pular */
          var a = cubo.getAnimations ? cubo.getAnimations()[0] : null;
          if (a && a.effect && a.effect.getComputedTiming) ry = (a.effect.getComputedTiming().progress || 0) * 360;
        }
        cubo.style.animation = 'none';
        cubo.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        palco.setPointerCapture(e.pointerId);
        pausar(true);
      });
      palco.addEventListener('pointermove', function (e) {
        if (!arrastando) return;
        var nx = Math.max(-80, Math.min(80, rx - (e.clientY - y0) * 0.4)), ny = ry + (e.clientX - x0) * 0.5;
        cubo.style.transform = 'rotateX(' + nx + 'deg) rotateY(' + ny + 'deg)';
      });
      function soltar(e) {
        if (!arrastando) return;
        arrastando = false;
        var m = /rotateX\((-?[\d.]+)deg\) rotateY\((-?[\d.]+)deg\)/.exec(cubo.style.transform || '');
        if (m) { rx = +m[1]; ry = +m[2]; }
        if (palco.hasPointerCapture && palco.hasPointerCapture(e.pointerId)) palco.releasePointerCapture(e.pointerId);
      }
      palco.addEventListener('pointerup', soltar);
      palco.addEventListener('pointercancel', soltar);
    }

    /* flexbox: troca o justify-content e anima a mudança (FLIP: mede antes, mede depois, desliza a diferença) */
    var linha = v.querySelector('.vx-flex');
    if (linha) Array.prototype.forEach.call(v.querySelectorAll('[data-flex]'), function (b) {
      b.addEventListener('click', function () {
        var itens = Array.prototype.slice.call(linha.children);
        var antes = itens.map(function (el) { return el.getBoundingClientRect().left; });
        linha.style.justifyContent = b.getAttribute('data-flex');
        v.querySelectorAll('[data-flex]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        if (calmo || !itens[0].animate) return;
        itens.forEach(function (el, i) {
          var dx = antes[i] - el.getBoundingClientRect().left;
          if (dx) el.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }],
            { duration: 240, easing: 'cubic-bezier(.23, 1, .32, 1)' });
        });
      });
    });

    /* grid: quantas colunas couberam na largura atual da caixa */
    var grade = v.querySelector('.vx-grade'), leitura = v.querySelector('.vitrine__leitura');
    if (grade && leitura) {
      var contar = function () {
        var n = getComputedStyle(grade).gridTemplateColumns.split(' ').filter(Boolean).length;
        leitura.textContent = n + (n === 1 ? ' coluna' : ' colunas') + ' em ' + Math.round(grade.getBoundingClientRect().width) + 'px — arraste o canto ↘';
      };
      contar();
      if (window.ResizeObserver) new ResizeObserver(contar).observe(grade);
    }

    /* modo escuro: o mesmo CSS, só o color-scheme muda */
    var tema = v.querySelector('.vx-tema');
    if (tema) Array.prototype.forEach.call(v.querySelectorAll('[data-esquema]'), function (b) {
      b.addEventListener('click', function () {
        tema.style.colorScheme = b.getAttribute('data-esquema');
        v.querySelectorAll('[data-esquema]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      });
    });

    var bCorrer = v.querySelector('[data-acao="correr"]');
    var bDeNovo = v.querySelector('[data-acao="denovo"]');
    var bDesenhar = v.querySelector('[data-acao="desenhar"]');

    /* pistas: a bola vai e volta com a curva e a duração de cada pista */
    var pistasEl = v.querySelectorAll('.vx-pista');
    if (pistasEl.length && bCorrer) {
      var foi = false;
      bCorrer.addEventListener('click', function () {
        foi = !foi;
        bCorrer.textContent = foi ? 'voltar' : 'correr';
        Array.prototype.forEach.call(pistasEl, function (p) {
          var bola = p.querySelector('.vx-bola'), trilho = p.querySelector('.vx-pista__trilho');
          var fim = trilho.clientWidth - bola.offsetWidth;
          var de = foi ? 0 : fim, para = foi ? fim : 0;
          if (calmo || !bola.animate) { bola.style.transform = 'translateX(' + para + 'px)'; return; }
          bola.animate([{ transform: 'translateX(' + de + 'px)' }, { transform: 'translateX(' + para + 'px)' }],
            { duration: +p.getAttribute('data-dur') || 900, easing: p.getAttribute('data-easing') || 'linear', fill: 'forwards' });
        });
      });
    }

    /* encadeamento: o atraso de cada ponto vem da distância até a origem escolhida */
    var pontos = v.querySelector('.vx-pontos');
    if (pontos) {
      var tocar = function () {
        var itens = Array.prototype.slice.call(pontos.children), n = itens.length, cols = 7;
        var origem = pontos.getAttribute('data-origem');
        itens.forEach(function (el, i) {
          var ordem = i;
          if (origem === 'fim') ordem = n - 1 - i;
          if (origem === 'centro') {
            var x = i % cols - (cols - 1) / 2, y = Math.floor(i / cols) - (n / cols - 1) / 2;
            ordem = Math.sqrt(x * x + y * y) * 2;
          }
          if (calmo || !el.animate) return;
          el.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }],
            { duration: 420, delay: ordem * 40, easing: 'cubic-bezier(.22, .61, .36, 1)', fill: 'backwards' });
        });
      };
      Array.prototype.forEach.call(v.querySelectorAll('[data-origem]'), function (b) {
        if (b === pontos) return;
        b.addEventListener('click', function () {
          pontos.setAttribute('data-origem', b.getAttribute('data-origem'));
          v.querySelectorAll('.vitrine__chip[data-origem]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          tocar();
        });
      });
      if (bDeNovo) bDeNovo.addEventListener('click', tocar);
      aoAparecer(v, tocar);
    }

    /* paralaxe e barra de leitura: tudo mede a rolagem de dentro do palco */
    var rolagem = v.querySelector('.vx-rolagem');
    var barra = v.querySelector('.vx-barra'), progresso = v.querySelector('.vx-progresso');
    if (rolagem && (barra || progresso || v.querySelector('.vx-quadro'))) {
      var quadros = Array.prototype.slice.call(rolagem.querySelectorAll('.vx-quadro'));
      var medir = function () {
        var max = rolagem.scrollHeight - rolagem.clientHeight;
        var p = max > 0 ? rolagem.scrollTop / max : 0;
        if (barra) barra.style.transform = 'scaleX(' + p + ')';
        if (progresso) progresso.style.transform = 'scaleX(' + p + ')';
        if (calmo) return;
        var meio = rolagem.getBoundingClientRect().top + rolagem.clientHeight / 2;
        quadros.forEach(function (q) {
          var r = q.getBoundingClientRect();
          var d = (r.top + r.height / 2 - meio) / rolagem.clientHeight;   /* -1 … 1 */
          var num = q.querySelector('.vx-num'), foto = q.querySelector('.vx-foto');
          if (num) num.style.transform = 'translateY(' + (d * -70) + 'px)';
          if (foto) foto.style.transform = 'translateY(' + (d * 18) + 'px) scale(' + (1.06 - Math.abs(d) * .06) + ')';
        });
      };
      rolagem.addEventListener('scroll', medir, { passive: true });
      medir();
    }

    /* reveal: o observador olha a rolagem do palco, não a da página */
    var revela = v.querySelector('.vx-revela');
    if (revela && window.IntersectionObserver) {
      var cartoes = revela.querySelectorAll('[data-vx-reveal]');
      v.classList.add('is-js');
      var obs = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          obs.unobserve(e.target);
        });
      }, { root: revela, threshold: .15 });
      var observar = function () { Array.prototype.forEach.call(cartoes, function (c) { obs.observe(c); }); };
      observar();
      if (bDeNovo) bDeNovo.addEventListener('click', function () {
        revela.scrollTop = 0;
        Array.prototype.forEach.call(cartoes, function (c) { c.classList.remove('is-in'); });
        setTimeout(observar, 30);
      });
    }

    /* altura automática: grid 0fr → 1fr */
    Array.prototype.forEach.call(v.querySelectorAll('.vx-item__cab'), function (cab) {
      cab.addEventListener('click', function () {
        var painel = cab.nextElementSibling, abrir = !painel.classList.contains('is-aberto');
        painel.classList.toggle('is-aberto', abrir);
        cab.setAttribute('aria-expanded', String(abrir));
      });
    });

    /* contador: conta do zero até o alvo, desacelerando no fim */
    var num = v.querySelector('.vx-contador__num');
    if (num) {
      var contar = function () {
        var alvo = Number(num.getAttribute('data-num')), inicio = performance.now(), dur = 1400;
        if (calmo) { num.textContent = alvo.toLocaleString('pt-BR'); return; }
        (function passo(agora) {
          var t = Math.min((agora - inicio) / dur, 1);
          num.textContent = Math.round(alvo * (1 - Math.pow(1 - t, 3))).toLocaleString('pt-BR');
          if (t < 1) requestAnimationFrame(passo);
        })(inicio);
      };
      if (bDeNovo) bDeNovo.addEventListener('click', contar);
      aoAparecer(v, contar);
    }

    /* traço: tira a classe, força o recálculo e põe de novo — a transição recomeça */
    var traco = v.querySelector('.vx-traco__linha');
    if (traco) {
      var desenhar = function () {
        traco.classList.remove('is-desenhado');
        void traco.getBoundingClientRect();
        traco.classList.add('is-desenhado');
      };
      if (bDesenhar) bDesenhar.addEventListener('click', desenhar);
      aoAparecer(v, desenhar);
    }

    /* arrastar: segue o dedo com resistência, e volta com mola ao soltar */
    var cartao = v.querySelector('.vx-arrastavel');
    if (cartao) {
      var LIM = 120, ativo = null, sx = 0, sy = 0, dx = 0, dy = 0;
      var resistir = function (d) { var a = Math.abs(d); return a <= LIM ? d : Math.sign(d) * (LIM + (a - LIM) * 0.3); };
      cartao.addEventListener('pointerdown', function (e) {
        if (ativo !== null) return;                     /* um dedo só */
        ativo = e.pointerId; sx = e.clientX; sy = e.clientY;
        cartao.setPointerCapture(e.pointerId);
        cartao.classList.add('is-arrastando');
        if (cartao.getAnimations) cartao.getAnimations().forEach(function (a) { a.cancel(); });
      });
      cartao.addEventListener('pointermove', function (e) {
        if (e.pointerId !== ativo) return;
        dx = resistir(e.clientX - sx); dy = resistir(e.clientY - sy);
        cartao.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) rotate(' + (dx / 20) + 'deg)';
      });
      var soltar = function (e) {
        if (e.pointerId !== ativo) return;
        ativo = null;
        cartao.classList.remove('is-arrastando');
        var atual = cartao.style.transform || 'none';
        cartao.style.transform = '';
        if (!calmo && cartao.animate && atual !== 'none') {
          cartao.animate([{ transform: atual }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.34, 1.56, .64, 1)' });
        }
        dx = dy = 0;
      };
      cartao.addEventListener('pointerup', soltar);
      cartao.addEventListener('pointercancel', soltar);
    }
  });

  /* toca a demo uma vez quando ela aparece na tela */
  function aoAparecer(el, fn) {
    if (!window.IntersectionObserver) { fn(); return; }
    var o = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) return;
      o.disconnect();
      fn();
    }, { threshold: .4 });
    o.observe(el);
  }
})();
