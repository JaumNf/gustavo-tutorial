/* ============================================================
   ref.js — comportamento da página de referência:
   filtro do índice, "nesta página" e marcação do item atual.
   ============================================================ */
(function () {
  'use strict';

  var indice = document.getElementById('indice');
  var nesta  = document.getElementById('nesta');
  if (!indice) return;

  /* ---------- abrir/fechar no celular ---------- */
  var abrir = document.getElementById('indice-abrir');
  if (abrir) {
    abrir.addEventListener('click', function () {
      var aberto = indice.classList.toggle('is-aberto');
      abrir.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  /* ---------- filtro ---------- */
  var busca  = document.getElementById('indice-busca');
  var grupos = Array.prototype.slice.call(indice.querySelectorAll('.indice__grupo'));
  var vazio  = indice.querySelector('.indice__vazio');

  function normalizar(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  if (busca) {
    busca.addEventListener('input', function () {
      var termo = normalizar(busca.value.trim());
      var achou = 0;

      grupos.forEach(function (g) {
        var rotulo = normalizar(g.querySelector('.indice__rotulo').textContent);
        var visiveis = 0;

        Array.prototype.forEach.call(g.querySelectorAll('a'), function (a) {
          var bate = !termo ||
                     normalizar(a.textContent).indexOf(termo) !== -1 ||
                     rotulo.indexOf(termo) !== -1;
          a.hidden = !bate;
          if (bate) visiveis++;
        });

        g.hidden = visiveis === 0;
        achou += visiveis;
      });

      vazio.hidden = achou > 0;
    });

    /* Esc limpa */
    busca.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && busca.value) {
        busca.value = '';
        busca.dispatchEvent(new Event('input'));
      }
    });
  }

  /* ---------- "nesta página": mostra os tópicos da parte em que você está ---------- */
  var secoes = Array.prototype.slice.call(document.querySelectorAll('.parte'));
  if (!nesta || !secoes.length) return;

  var parteAtual = null;

  function montarNesta(secao) {
    if (secao === parteAtual) return;
    parteAtual = secao;

    var titulo = secao.querySelector('h2');
    var itens  = Array.prototype.slice.call(secao.querySelectorAll('.topico'));

    var html = '<p class="nesta__titulo">Nesta parte</p>' +
               '<p class="nesta__parte">' + (titulo ? titulo.textContent : '') + '</p>';

    itens.forEach(function (t) {
      var h3 = t.querySelector('h3');
      if (h3 && t.id) html += '<a href="#' + t.id + '">' + h3.textContent + '</a>';
    });

    nesta.innerHTML = html;
  }

  /* acompanha a rolagem: qual parte ocupa a tela, e qual tópico está à vista */
  function acompanhar() {
    var meio = window.innerHeight * 0.35;

    var visivel = secoes[0];
    for (var i = 0; i < secoes.length; i++) {
      if (secoes[i].getBoundingClientRect().top <= meio) visivel = secoes[i];
    }
    montarNesta(visivel);

    var topicos = Array.prototype.slice.call(visivel.querySelectorAll('.topico'));
    var ativo = null;
    topicos.forEach(function (t) {
      if (t.getBoundingClientRect().top <= meio) ativo = t;
    });

    Array.prototype.forEach.call(nesta.querySelectorAll('a'), function (a) {
      a.classList.toggle('is-atual', !!ativo && a.getAttribute('href') === '#' + ativo.id);
    });

    if (ativo) {
      Array.prototype.forEach.call(indice.querySelectorAll('a'), function (a) {
        a.classList.toggle('is-atual', a.getAttribute('href') === '#' + ativo.id);
      });
    }
  }

  var agendado = false;
  window.addEventListener('scroll', function () {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () { acompanhar(); agendado = false; });
  }, { passive: true });

  acompanhar();
})();
