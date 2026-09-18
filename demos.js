/* ============================================================
   demos.js — roda as demonstrações ao vivo da Parte 10.
   Cada demo é independente: se uma falhar, as outras seguem.
   ============================================================ */
(function () {
  'use strict';

  var temMotion = function () { return typeof window.Motion !== 'undefined'; };
  var temGsap   = function () { return typeof window.gsap !== 'undefined'; };
  var calmo     = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function aviso(palco, texto) {
    if (palco.querySelector('.demo__aviso')) return;
    var d = document.createElement('div');
    d.className = 'demo__aviso';
    d.textContent = texto;
    palco.appendChild(d);
  }

  /* ---------- registro de demos ---------- */
  var demos = {

    /* 1 · entrada em cascata — CSS puro, delay calculado por --i */
    cascata: function (palco) {
      var lista = palco.querySelector('.d-cascata');
      lista.classList.remove('roda');
      void lista.offsetWidth;          /* força o navegador a reiniciar a animação */
      lista.classList.add('roda');
    },

    /* 2 · mola no botão — Motion; sem ele, Web Animations */
    mola: function (palco) {
      var alvo = palco.querySelector('.pc-cta');
      if (temMotion()) {
        window.Motion.animate(alvo, { scale: [0.6, 1] },
          { type: 'spring', stiffness: 260, damping: 12, mass: 1 });
      } else {
        aviso(palco, 'Motion não carregou aqui — rodando a versão nativa equivalente.');
        alvo.animate(
          [{ transform: 'scale(.6)' }, { transform: 'scale(1.12)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }],
          { duration: 620, easing: 'cubic-bezier(.22,1,.36,1)' }
        );
      }
    },

    /* 3 · revelar ao rolar — IntersectionObserver dentro da própria caixa */
    rolagem: function (palco) {
      var caixa = palco.querySelector('.d-rolagem');
      var itens = palco.querySelectorAll('.d-rolagem .pc');
      itens.forEach(function (el) { el.classList.remove('visivel'); });
      caixa.scrollTop = 0;
      if (caixa.dataset.ligado) return;
      caixa.dataset.ligado = '1';
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          var jaPassou = e.rootBounds && e.boundingClientRect.top < e.rootBounds.top;
          if (e.isIntersecting || jaPassou) e.target.classList.add('visivel');
        });
      }, { root: caixa, threshold: 0.35 });
      itens.forEach(function (el) { obs.observe(el); });
    },

    /* 4 · barra ligada à rolagem — progresso = quanto já rolou */
    barra: function (palco) {
      var caixa = palco.querySelector('.d-barra__caixa');
      var fita  = palco.querySelector('.d-barra__fita');
      function medir() {
        var max = caixa.scrollHeight - caixa.clientHeight;
        fita.style.width = (max > 0 ? (caixa.scrollTop / max) * 100 : 0) + '%';
      }
      if (!caixa.dataset.ligado) {
        caixa.dataset.ligado = '1';
        caixa.addEventListener('scroll', medir, { passive: true });
      }
      caixa.scrollTop = 0;
      medir();
    },

    /* 5 · contador — requestAnimationFrame + curva de saída */
    contador: function (palco) {
      var el = palco.querySelector('.d-contador__num');
      var alvo = 248, dur = 1400, ini = null;
      if (calmo()) { el.textContent = alvo; return; }
      function passo(t) {
        if (ini === null) ini = t;
        var p = Math.min((t - ini) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);            /* easeOutCubic */
        el.textContent = Math.round(alvo * e);
        if (p < 1) requestAnimationFrame(passo);
      }
      el.textContent = '0';
      requestAnimationFrame(passo);
    },

    /* 7 · sequência de hero — GSAP timeline; sem ele, Web Animations em cadeia */
    timeline: function (palco) {
      var itens = palco.querySelectorAll('.d-timeline > *');
      itens.forEach(function (el) { el.style.opacity = 0; el.style.transform = ''; });
      if (temGsap()) {
        window.gsap.timeline()
          .from(itens[0], { y: 22, opacity: 0, duration: .5, ease: 'power3.out' })
          .from(itens[1], { y: 16, opacity: 0, duration: .45, ease: 'power3.out' }, '-=0.25')
          .from(itens[2], { scale: .85, opacity: 0, duration: .45, ease: 'back.out(1.7)' }, '-=0.2')
          .set(itens, { opacity: 1, clearProps: 'transform' });
      } else {
        aviso(palco, 'GSAP não carregou aqui — rodando a versão nativa equivalente.');
        itens.forEach(function (el, i) {
          el.animate(
            [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
            { duration: 450, delay: i * 200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }
          );
        });
      }
    },

    /* 9 · tilt 3D — a única conta é normalizar a posição do ponteiro */
    tilt: function (palco) {
      var carta = palco.querySelector('.d-tilt__carta');
      if (carta.dataset.ligado) return;
      carta.dataset.ligado = '1';
      palco.addEventListener('pointermove', function (e) {
        var r = palco.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width  - .5;
        var y = (e.clientY - r.top)  / r.height - .5;
        carta.style.transform = 'rotateY(' + (x * 22) + 'deg) rotateX(' + (-y * 22) + 'deg)';
      });
      palco.addEventListener('pointerleave', function () { carta.style.transform = ''; });
    },

    /* 10 · acordeão — 0fr para 1fr, sem medir altura nenhuma */
    acordeao: function (palco) {
      palco.querySelectorAll('.d-acordeao__item').forEach(function (item) {
        if (item.dataset.ligado) return;
        item.dataset.ligado = '1';
        item.querySelector('.d-acordeao__cab').addEventListener('click', function () {
          item.classList.toggle('aberto');
        });
      });
    },

    /* 11 · esqueleto — troca o placeholder pelo conteúdo real */
    esqueleto: function (palco) {
      var bloco = palco.querySelector('.d-esqueleto');
      bloco.classList.remove('pronto');
      clearTimeout(bloco._t);
      bloco._t = setTimeout(function () { bloco.classList.add('pronto'); }, 1200);
    }
  };

  /* os que dependem de gesto (clique, ponteiro, rolagem) ligam de imediato;
     os que animam sozinhos esperam entrar na tela */
  var ligarJa = ['rolagem', 'barra', 'tilt', 'acordeao'];

  /* ---------- liga tudo ---------- */
  document.querySelectorAll('[data-demo]').forEach(function (card) {
    var nome  = card.dataset.demo;
    var rodar = demos[nome];
    if (!rodar) return;
    var palco = card.querySelector('.demo__palco');
    var botao = card.querySelector('.demo__rodar');

    function executar() {
      try { rodar(palco); } catch (err) { aviso(palco, 'Este exemplo não rodou: ' + err.message); }
    }
    if (botao) botao.addEventListener('click', executar);

    /* os que só instalam ouvintes precisam estar prontos antes de entrar na tela */
    if (ligarJa.indexOf(nome) !== -1) executar();

    /* só roda quando o card aparece na tela — nada anima fora de vista */
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { executar(); obs.unobserve(e.target); }
        });
      }, { threshold: 0.35 });
      obs.observe(card);
    } else {
      executar();
    }
  });
})();
