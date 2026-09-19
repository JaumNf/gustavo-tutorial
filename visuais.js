/* ============================================================
   visuais.js — demonstrações visuais das trilhas Qualidade e Negócio.
   Cada bloco é independente: se um falhar, os outros seguem.
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- contraste (WCAG) ---------- */
  function luminancia(hex) {
    var n = parseInt(hex.slice(1), 16);
    var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function razao(a, b) {
    var l1 = luminancia(a), l2 = luminancia(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function cinza(v) {
    var h = Math.round(v).toString(16).padStart(2, '0');
    return '#' + h + h + h;
  }

  var bloco = $('#v-contraste');
  if (bloco) {
    var faixa = $('input', bloco), texto = $('.amostra-texto', bloco);
    var saida = $('.valor', bloco), vered = $('.veredito', bloco);
    var atualiza = function () {
      var cor = cinza(+faixa.value);
      texto.style.color = cor;
      var r = razao(cor, '#ffffff');
      saida.textContent = r.toFixed(2) + ':1';
      var passa = r >= 4.5;
      vered.textContent = passa ? 'passa AA' : (r >= 3 ? 'só texto grande' : 'reprova');
      vered.className = 'veredito ' + (passa ? 'passa' : 'falha');
    };
    faixa.addEventListener('input', atualiza);
    atualiza();
  }

  /* ---------- simulação de daltonismo ---------- */
  var dalt = $('#v-daltonismo');
  if (dalt) {
    var alvo = $('.swatch-linha', dalt);
    $$('button', dalt).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', dalt).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        alvo.style.filter = b.dataset.filtro === 'nenhum' ? '' : 'url(#' + b.dataset.filtro + ')';
      });
    });
  }

  /* ---------- foco visível ---------- */
  var foco = $('#v-foco');
  if (foco) {
    $('button.acao', foco).addEventListener('click', function () {
      $$('.confronto__palco button', foco).forEach(function (b, i) {
        setTimeout(function () { b.focus(); }, i * 900);
      });
    });
  }

  /* ---------- CLS: com e sem espaço reservado ---------- */
  var cls = $('#v-cls');
  if (cls) {
    $('button.acao', cls).addEventListener('click', function () {
      $$('.v-cls-img', cls).forEach(function (el) { el.classList.remove('carregou'); });
      setTimeout(function () {
        $$('.v-cls-img', cls).forEach(function (el) { el.classList.add('carregou'); });
      }, 700);
    });
  }

  /* ---------- peso de imagem × tempo no 4G ---------- */
  var peso = $('#v-peso');
  if (peso) {
    var f2 = $('input', peso), val = $('.valor', peso);
    var MB_S = 1.2;   /* 4G brasileiro em condição real, em MB/s */
    var calc = function () {
      var kb = +f2.value;
      var maior = 4000;
      $('.v-peso-fita').style.width = Math.min(100, (kb / maior) * 100) + '%';
      var seg = (kb / 1024) / MB_S;
      val.textContent = (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');
      $('.v-peso-tempo').textContent = seg < 1 ? (seg * 1000).toFixed(0) + ' ms' : seg.toFixed(1) + ' s';
      var v = $('.veredito', peso);
      v.textContent = seg <= 1 ? 'ótimo' : (seg <= 2 ? 'aceitável' : 'perde visitante');
      v.className = 'veredito ' + (seg <= 2 ? 'passa' : 'falha');
    };
    f2.addEventListener('input', calc);
    calc();
  }

  /* ---------- máscara de telefone ao vivo ---------- */
  var masc = $('#v-mascara');
  if (masc) {
    var campo = $('input[type="tel"]', masc), cru = $('.v-cru', masc);
    campo.addEventListener('input', function (e) {
      var v = e.target.value.replace(/\D/g, '').slice(0, 11);
      cru.textContent = v || '(vazio)';
      e.target.value = v.length <= 10
        ? v.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, function (_, a, b, c) {
            return (a ? '(' + a : '') + (b ? ') ' + b : '') + (c ? '-' + c : '');
          })
        : v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    });
  }

  /* ---------- erro de formulário: visual × acessível ---------- */
  var erro = $('#v-erro');
  if (erro) {
    $('button.acao', erro).addEventListener('click', function () {
      $('.v-erro-ruim', erro).textContent = 'Campo inválido';
      var bom = $('.v-erro-bom', erro);
      bom.textContent = 'Informe um WhatsApp com DDD, ex.: (67) 99999-8888';
      $$('input', erro).forEach(function (i) { i.classList.add('invalido'); });
      $('input', $('.confronto__lado--bom', erro)).setAttribute('aria-invalid', 'true');
    });
  }

  /* ---------- zoom 200% ---------- */
  var zoom = $('#v-zoom');
  if (zoom) {
    $('button.acao', zoom).addEventListener('click', function () {
      zoom.classList.toggle('ampliado');
      this.textContent = zoom.classList.contains('ampliado') ? 'voltar a 100%' : 'ampliar para 200%';
    });
  }

  /* ---------- o que o leitor de tela ouve ---------- */
  var leitor = $('#v-alt');
  if (leitor) {
    $('button.acao', leitor).addEventListener('click', function () {
      leitor.classList.toggle('ouvindo');
      this.textContent = leitor.classList.contains('ouvindo') ? 'ver as imagens' : 'ouvir como leitor de tela';
    });
  }

  /* ---------- escala de espaçamento ---------- */
  var esp = $('#v-espaco');
  if (esp) {
    var f3 = $('input', esp);
    var ap = function () {
      var e = +f3.value;
      $('.v-esp-bom', esp).style.setProperty('--g', e + 'px');
      $('.valor', esp).textContent = e + 'px';
    };
    f3.addEventListener('input', ap); ap();
  }

  /* ---------- medida de linha ---------- */
  var med = $('#v-medida');
  if (med) {
    var f4 = $('input', med), alvo4 = $('.amostra-texto', med);
    var am = function () {
      var ch = +f4.value;
      alvo4.style.maxWidth = ch + 'ch';
      $('.valor', med).textContent = ch + 'ch';
      var v = $('.veredito', med);
      var ok = ch >= 55 && ch <= 78;
      v.textContent = ok ? 'confortável' : (ch < 55 ? 'curta demais' : 'longa demais');
      v.className = 'veredito ' + (ok ? 'passa' : 'falha');
    };
    f4.addEventListener('input', am); am();
  }
})();
