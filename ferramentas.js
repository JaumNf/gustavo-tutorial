/* ============================================================
   ferramentas.js — tudo roda no navegador; nada sai daqui.
   Cada ferramenta é independente: se uma falhar, as outras seguem.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  /* guardar() avisa a página quando um valor muda de fato. As ligações entre
     ferramentas escutam 'gt:mudou' e se repintam; como só avisa em mudança
     real, uma ferramenta que se remonta ao ouvir o aviso não entra em laço. */
  var aviso = null;
  function avisar() {
    if (aviso) return;
    aviso = setTimeout(function () {
      aviso = null;
      document.dispatchEvent(new CustomEvent('gt:mudou'));
    }, 0);
  }
  function guardar(chave, valor) {
    try {
      var texto = JSON.stringify(valor);
      if (localStorage.getItem('gt-' + chave) === texto) return;
      localStorage.setItem('gt-' + chave, texto);
    } catch (e) {}
    avisar();
  }
  function ler(chave, padrao) {
    try { var v = localStorage.getItem('gt-' + chave); return v ? JSON.parse(v) : padrao; }
    catch (e) { return padrao; }
  }
  function copiar(texto, botao) {
    var antes = botao.textContent;
    function feito(ok) {
      botao.textContent = ok ? 'copiado' : 'falhou';
      setTimeout(function () { botao.textContent = antes; }, 1400);
    }
    if (navigator.clipboard && location.protocol !== 'file:') {
      navigator.clipboard.writeText(texto).then(function () { feito(true); }, function () { feito(false); });
    } else {
      var t = document.createElement('textarea');
      t.value = texto; t.style.position = 'fixed'; t.style.left = '-9999px';
      document.body.appendChild(t); t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t); feito(ok);
    }
  }

  /* ---------- ligação: o que outra ferramenta já sabe, com botão para usar ----------
     Nunca sobrescreve sozinha. valor() devolve { texto, aplicar } ou null
     (null = nada a oferecer, ou o campo já está igual), e a linha some. */
  function ligar(antes, de, ir, valor, rotulo) {
    if (!antes || !antes.parentNode) return;
    var p = document.createElement('p');
    p.className = 'ferr__elo';
    p.hidden = true;
    var origem = document.createElement('a');
    origem.className = 'ferr__elo-de';
    origem.href = ir;
    origem.textContent = de;
    var texto = document.createElement('span');
    texto.className = 'ferr__elo-valor';
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'acao';
    botao.textContent = rotulo || 'usar';
    p.appendChild(origem); p.appendChild(texto); p.appendChild(botao);
    antes.parentNode.insertBefore(p, antes);

    var atual = null;
    function pintar() {
      try { atual = valor(); } catch (e) { atual = null; }
      p.hidden = !atual;
      if (atual) texto.textContent = atual.texto;
    }
    botao.addEventListener('click', function () {
      if (!atual) return;
      atual.aplicar();
      botao.textContent = 'feito';
      setTimeout(function () { botao.textContent = rotulo || 'usar'; }, 1200);
    });
    document.addEventListener('gt:mudou', pintar);
    pintar();
  }
  /* preenche um campo como se a pessoa tivesse digitado: a ferramenta dona salva e se remonta */
  function preencher(el, valor) {
    if (!el) return;
    el.value = valor;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function nomeProjeto() { return String(ler('projeto', '') || '').trim(); }
  function chaveProjeto() { return nomeProjeto().toLowerCase() || 'sem-nome'; }
  function corHex(v) {
    v = String(v || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(v)) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
    return /^[0-9a-f]{6}$/i.test(v) ? '#' + v.toUpperCase() : null;
  }
  /* telefone só com DDD + número, sem o 55 */
  function foneNacional(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
    return d;
  }
  function foneBonito(d) {
    return d.length === 11 ? d.slice(0, 2) + ' ' + d.slice(2, 7) + '-' + d.slice(7)
         : d.length === 10 ? d.slice(0, 2) + ' ' + d.slice(2, 6) + '-' + d.slice(6) : d;
  }
  function brl(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }
  /* a faixa da calculadora de Preço, lida do que ela guardou */
  function faixaPreco() {
    var n = function (k) { return parseFloat(ler('pr-' + k, 0)) || 0; };
    var horasMes = n('dias') * n('horas');
    if (!horasMes || !n('projeto') || !n('margem')) return null;
    var piso = ((n('despesas') + n('retirada')) / horasMes) * n('projeto') * n('margem');
    return { piso: piso, texto: brl(piso) + ' a ' + brl(piso * 1.6) };
  }
  function escHtml(s) {
    return String(s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; });
  }

  /* ---------- cor: contas usadas pela Tipografia e pelo Design system ---------- */
  function corRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function corDeRgb(c) {
    return '#' + c.map(function (x) { return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }
  function corLum(h) {
    return corRgb(h).map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); })
      .reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function corRazao(a, b) { var x = corLum(a), y = corLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function corMistura(a, b, p) {
    var A = corRgb(a), B = corRgb(b);
    return corDeRgb([0, 1, 2].map(function (i) { return A[i] + (B[i] - A[i]) * p; }));
  }
  /* distância perceptual (ΔE 1976, no espaço Lab): abaixo de ~5, duas cores parecem a mesma */
  function corLab(h) {
    var c = corRgb(h).map(function (x) { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    var xyz = [
      (c[0] * 0.4124 + c[1] * 0.3576 + c[2] * 0.1805) / 0.95047,
      (c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722),
      (c[0] * 0.0193 + c[1] * 0.1192 + c[2] * 0.9505) / 1.08883
    ].map(function (t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; });
    return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
  }
  function corDistancia(a, b) {
    var A = corLab(a), B = corLab(b);
    return Math.sqrt(Math.pow(A[0] - B[0], 2) + Math.pow(A[1] - B[1], 2) + Math.pow(A[2] - B[2], 2));
  }
  function corHsl(h) {
    var c = corRgb(h).map(function (x) { return x / 255; });
    var max = Math.max.apply(null, c), min = Math.min.apply(null, c), l = (max + min) / 2, d = max - min;
    return { s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l: l };
  }

  /* ---------- inventário: conta os valores soltos de um CSS ---------- */
  function corNormal(hx, rg, hs, nome) {
    var r, g, b, a = 1;
    if (hx) {
      var v = hx.length === 3 || hx.length === 4 ? hx.split('').map(function (x) { return x + x; }).join('') : hx;
      if (v.length !== 6 && v.length !== 8) return null;
      r = parseInt(v.slice(0, 2), 16); g = parseInt(v.slice(2, 4), 16); b = parseInt(v.slice(4, 6), 16);
      if (v.length === 8) a = parseInt(v.slice(6, 8), 16) / 255;
    } else if (rg || hs) {
      var n = (rg || hs).split(/[\s,\/]+/).filter(Boolean);
      if (n.length < 3) return null;
      var num = function (t, max) { return /%$/.test(t) ? parseFloat(t) / 100 * max : parseFloat(t); };
      if (n[3] !== undefined) a = /%$/.test(n[3]) ? parseFloat(n[3]) / 100 : parseFloat(n[3]);
      if (rg) { r = num(n[0], 255); g = num(n[1], 255); b = num(n[2], 255); }
      else {
        var H = parseFloat(n[0]) / 360, S = parseFloat(n[1]) / 100, L = parseFloat(n[2]) / 100;
        var q = L < 0.5 ? L * (1 + S) : L + S - L * S, p = 2 * L - q;
        var canal = function (t) {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
        };
        r = canal(H + 1 / 3) * 255; g = canal(H) * 255; b = canal(H - 1 / 3) * 255;
      }
    } else if (nome) {
      r = g = b = nome.toLowerCase() === 'white' ? 255 : 0;
    } else return null;
    if ([r, g, b].some(isNaN) || a === 0) return null;
    return corDeRgb([r, g, b]) + (a < 1 ? ' ' + Math.round(a * 100) + '%' : '');
  }
  var inventarioMemo = { css: null, inv: null };
  function inventariar(css) {
    css = String(css || '');
    if (css === inventarioMemo.css) return inventarioMemo.inv;
    var inv = { cores: {}, tamanhos: {}, espacos: {}, raios: {}, sombras: {}, familias: {}, pesos: {} };
    var limpo = css.replace(/\/\*[\s\S]*?\*\//g, '');
    function soma(obj, k) { obj[k] = (obj[k] || 0) + 1; }
    function px(t) {
      var m = /^(-?[\d.]+)(px|rem|em)?$/.exec(t);
      if (!m) return null;
      var v = parseFloat(m[1]);
      if (m[2] === 'rem' || m[2] === 'em') v *= 16;   /* em conta como rem: é uma aproximação */
      return Math.round(v * 100) / 100;
    }
    var re = /([a-z-]+)\s*:\s*([^;{}]+)/gi, d;
    while ((d = re.exec(limpo))) {
      var prop = d[1].toLowerCase(), val = d[2].trim();
      val.replace(/#([0-9a-f]{3,8})\b|rgba?\(([^)]*)\)|hsla?\(([^)]*)\)|\b(white|black)\b/gi,
        function (m, hx, rg, hs, nome) { var k = corNormal(hx, rg, hs, nome); if (k) soma(inv.cores, k); return m; });
      if (prop === 'font-size') {
        var f = px(val); soma(inv.tamanhos, f !== null ? f + 'px' : val);
      } else if (/^(margin|padding)(-[a-z]+)*$|^(row-|column-)?gap$/.test(prop)) {
        val.split(/\s+/).forEach(function (t) { var v = px(t); if (v) soma(inv.espacos, Math.abs(v)); });
      } else if (/^border(-[a-z]+)*-radius$/.test(prop)) {
        val.split(/\s*\/\s*|\s+/).forEach(function (t) { if (!t) return; var v = px(t); soma(inv.raios, v !== null ? v + 'px' : t); });
      } else if (prop === 'box-shadow' && val !== 'none') {
        soma(inv.sombras, val.replace(/\s+/g, ' '));
      } else if (prop === 'font-family') {
        soma(inv.familias, val.split(',')[0].replace(/["']/g, '').trim());
      } else if (prop === 'font-weight') {
        soma(inv.pesos, val === 'bold' ? '700' : val === 'normal' ? '400' : val);
      }
    }
    inventarioMemo = { css: css, inv: inv };
    return inv;
  }
  /* junta as cores quase iguais: cada grupo guarda a mais usada como representante */
  function agruparCores(cores) {
    var grupos = [];
    Object.keys(cores).sort(function (a, b) { return cores[b] - cores[a]; }).forEach(function (k) {
      var hex = k.slice(0, 7);
      for (var i = 0; i < grupos.length; i++) {
        if (corDistancia(grupos[i].hex, hex) < 5) { grupos[i].membros.push(k); grupos[i].n += cores[k]; return; }
      }
      grupos.push({ hex: hex, n: cores[k], membros: [k] });
    });
    return grupos;
  }
  /* a cor com cara de marca mais usada: saturada e nem clara nem escura demais */
  function corDeMarca(inv) {
    var melhor = null;
    agruparCores(inv.cores).forEach(function (g) {
      var t = corHsl(g.hex);
      if (t.s >= 0.3 && t.l >= 0.15 && t.l <= 0.8 && (!melhor || g.n > melhor.n)) melhor = g;
    });
    return melhor;
  }

  /* ========== 1 · CHECKLIST ========== */
  (function () {
    var caixa = $('#fer-checklist'); if (!caixa) return;
    var ITENS = [
      'Todo CTA abre o WhatsApp no número certo',
      'A mensagem pré-preenchida chega sem acento quebrado',
      'Nenhum texto de exemplo sobrou na página',
      'Título e descrição únicos, com a cidade no título',
      'Miniatura aparece ao colar o link no WhatsApp',
      'Favicon aparece na aba',
      'Formulário envia e a mensagem chega no destino',
      'Página de erro 404 responde',
      'HTTPS com cadeado, com e sem www',
      'Lighthouse mobile acima de 90, em aba anônima',
      'Tab chega em todo link e botão, e o foco é visível',
      'Analytics registrando em tempo real',
      'sitemap.xml e robots.txt respondendo',
      'Console sem nenhum erro vermelho'
    ];
    var lista = $('#cl-lista'), contador = $('#cl-contador'), fita = $('#cl-fita'), cliente = $('#cl-cliente');
    cliente.value = ler('cl-cliente', '');

    function chave() { return 'cl-' + (cliente.value.trim().toLowerCase() || 'sem-nome'); }
    function esc(s) { return String(s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

    /* o item aponta para a ferramenta que gerou aquilo, com o valor a conferir em produção */
    function conferir(i) {
      var fone = foneNacional(ler('zp-num', ''));
      var nome = String(ler('hd-nome', '') || '').trim(), oque = String(ler('hd-oque', '') || '').trim(),
          cidade = String(ler('hd-cidade', '') || '').trim(), img = String(ler('hd-img', '') || '').trim();
      var titulo = nome ? nome + (oque ? ' — ' + oque : '') + (cidade ? ' | ' + cidade : '') : '';
      var REF = {
        0:  ['#f-zap', 'Link de WhatsApp', fone.length >= 10 ? foneBonito(fone) : ''],
        1:  ['#f-zap', 'Link de WhatsApp', ''],
        3:  ['#f-head', 'Cabeçalho', titulo],
        4:  ['#f-head', 'Cabeçalho', img ? 'og:image ' + img : ''],
        11: ['#f-utm', 'Gerador de UTM', 'abra um link marcado e veja chegar']
      };
      return REF[i] || null;
    }
    function assinatura() {
      return ITENS.map(function (_, i) { var r = conferir(i); return r ? r[2] : ''; }).join('|');
    }

    function pintar() {
      var marcados = ler(chave(), []);
      lista.innerHTML = ITENS.map(function (t, i) {
        var on = marcados.indexOf(i) !== -1, r = conferir(i);
        var ref = r ? '<small class="ferr__item-ir"><a href="' + r[0] + '">' + r[1] + '</a>' +
                      (r[2] ? ' · ' + esc(r[2]) : '') + '</small>' : '';
        return '<li><label class="ferr__item' + (on ? ' is-feito' : '') + '">' +
               '<input type="checkbox" data-i="' + i + '"' + (on ? ' checked' : '') + '><span>' + t + ref + '</span></label></li>';
      }).join('');
      var n = marcados.length;
      contador.textContent = n + ' de ' + ITENS.length;
      fita.style.width = (n / ITENS.length * 100) + '%';
      contador.classList.toggle('is-completo', n === ITENS.length);
    }

    lista.addEventListener('change', function (e) {
      if (e.target.type !== 'checkbox') return;
      var i = +e.target.dataset.i, m = ler(chave(), []), pos = m.indexOf(i);
      if (pos === -1) m.push(i); else m.splice(pos, 1);
      guardar(chave(), m); pintar();
    });
    cliente.addEventListener('input', function () { guardar('cl-cliente', cliente.value); pintar(); });
    $('#cl-zerar').addEventListener('click', function () { guardar(chave(), []); pintar(); });
    /* repinta só se o valor a conferir mudou — repintar à toa tira o foco da caixa marcada */
    var ultima = assinatura();
    document.addEventListener('gt:mudou', function () {
      var a = assinatura();
      if (a !== ultima) { ultima = a; pintar(); }
    });
    pintar();
  })();

  /* ========== 2 · LINK DE WHATSAPP ========== */
  (function () {
    var caixa = $('#fer-zap'); if (!caixa) return;
    var num = $('#zp-num'), msg = $('#zp-msg'), saida = $('#zp-saida'),
        testar = $('#zp-testar'), dica = $('#zp-dica');
    num.value = ler('zp-num', '');
    msg.value = ler('zp-msg', msg.value);

    function montar() {
      var d = num.value.replace(/\D/g, '');
      guardar('zp-num', num.value); guardar('zp-msg', msg.value);

      if (d.length < 10) {
        saida.textContent = '—';
        dica.textContent = d ? 'faltam dígitos: DDD + número, 10 ou 11 no total' : '';
        dica.className = 'ferr__dica';
        testar.removeAttribute('href');
        return;
      }
      if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
      var url = 'https://wa.me/55' + d + '?text=' + encodeURIComponent(msg.value);
      saida.textContent = url;
      testar.href = url;
      dica.textContent = 'DDD ' + d.slice(0, 2) + ' · ' +
        (d.length === 11 ? 'celular' : 'fixo ou celular antigo') + ' · ' + url.length + ' caracteres';
      dica.className = 'ferr__dica is-ok';
    }
    num.addEventListener('input', montar);
    msg.addEventListener('input', montar);
    $('#zp-copiar').addEventListener('click', function () {
      if (saida.textContent !== '—') copiar(saida.textContent, this);
    });
    /* o telefone do JSON-LD e o do botão têm de ser o mesmo número */
    ligar(caixa.querySelector('.ferr__linha'), 'Cabeçalho', '#f-head', function () {
      var d = foneNacional(ler('hd-tel', ''));
      if (d.length < 10) return null;
      var agora = foneNacional(num.value);
      if (agora === d) return null;
      return {
        texto: (agora ? 'número diferente lá: ' : 'telefone ') + foneBonito(d),
        aplicar: function () { preencher(num, d); }
      };
    });
    montar();
  })();

  /* ========== 3 · UTM ========== */
  (function () {
    var caixa = $('#fer-utm'); if (!caixa) return;
    var campos = ['url', 'source', 'medium', 'campaign', 'content'];
    var saida = $('#ut-saida'), dica = $('#ut-dica'), lista = $('#ut-lista');

    function limpa(v) {
      return v.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
              .replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    }
    function pintarHistorico() {
      var h = ler('ut-historico', []);
      lista.innerHTML = h.length
        ? h.map(function (u) { return '<li><code>' + u.replace(/[<>&]/g, '') + '</code></li>'; }).join('')
        : '<li class="ferr__dica">nenhuma ainda</li>';
    }
    function montar() {
      var v = {};
      campos.forEach(function (c) {
        var el = $('#ut-' + c); v[c] = el.value; guardar('ut-' + c, el.value);
      });
      if (!v.url.trim() || !v.source.trim() || !v.medium.trim()) {
        saida.textContent = '—';
        dica.textContent = 'endereço, source e medium são obrigatórios';
        dica.className = 'ferr__dica';
        return;
      }
      var base = v.url.trim();
      if (!/^https?:\/\//i.test(base)) base = 'https://' + base;
      if (base.indexOf('#') !== -1) base = base.slice(0, base.indexOf('#'));
      var partes = ['utm_source=' + limpa(v.source), 'utm_medium=' + limpa(v.medium)];
      if (v.campaign.trim()) partes.push('utm_campaign=' + limpa(v.campaign));
      if (v.content.trim())  partes.push('utm_content=' + limpa(v.content));
      var url = base + (base.indexOf('?') === -1 ? '?' : '&') + partes.join('&');
      saida.textContent = url;

      var mudou = [];
      ['source', 'medium', 'campaign', 'content'].forEach(function (c) {
        if (v[c].trim() && limpa(v[c]) !== v[c].trim()) mudou.push(v[c].trim() + ' → ' + limpa(v[c]));
      });
      dica.textContent = mudou.length ? 'normalizado: ' + mudou.join(' · ') : 'tudo já estava no padrão';
      dica.className = 'ferr__dica is-ok';
    }
    campos.forEach(function (c) {
      var el = $('#ut-' + c);
      el.value = ler('ut-' + c, el.value);
      el.addEventListener('input', montar);
    });
    $('#ut-copiar').addEventListener('click', function () {
      if (saida.textContent === '—') return;
      copiar(saida.textContent, this);
      var h = ler('ut-historico', []);
      if (h.indexOf(saida.textContent) === -1) { h.unshift(saida.textContent); guardar('ut-historico', h.slice(0, 12)); }
      pintarHistorico();
    });
    $('#ut-limpar').addEventListener('click', function () { guardar('ut-historico', []); pintarHistorico(); });
    /* o endereço do site já está no canonical do Cabeçalho */
    ligar(caixa.querySelector('.ferr__linha'), 'Cabeçalho', '#f-head', function () {
      var u = String(ler('hd-url', '') || '').trim().replace(/\/+$/, '');
      if (!u) return null;
      var agora = $('#ut-url').value.trim().replace(/\/+$/, '');
      if (agora === u) return null;
      return { texto: 'endereço ' + u + '/', aplicar: function () { preencher($('#ut-url'), u + '/'); } };
    });
    montar(); pintarHistorico();
  })();

  /* ========== 4 · CONTRASTE ========== */
  (function () {
    var caixa = $('#fer-contraste'); if (!caixa) return;
    var texto = $('#ct-texto'), fundo = $('#ct-fundo'),
        tp = $('#ct-texto-p'), fp = $('#ct-fundo-p'),
        razaoEl = $('#ct-razao'), ver = $('#ct-vereditos'),
        amostra = $('#ct-amostra'), dica = $('#ct-dica');

    function hex(v) {
      v = v.trim().replace(/^#/, '');
      if (v.length === 3) v = v[0]+v[0]+v[1]+v[1]+v[2]+v[2];
      return /^[0-9a-f]{6}$/i.test(v) ? '#' + v.toLowerCase() : null;
    }
    function lum(h) {
      var n = parseInt(h.slice(1), 16);
      var c = [(n>>16)&255, (n>>8)&255, n&255].map(function (x) {
        x /= 255; return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4);
      });
      return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
    }
    function calcular() {
      var a = hex(texto.value), b = hex(fundo.value);
      if (!a || !b) { razaoEl.textContent = '—'; ver.innerHTML = ''; dica.textContent = 'cor inválida — use #RGB ou #RRGGBB'; return; }
      tp.value = a; fp.value = b;
      guardar('ct-texto', a); guardar('ct-fundo', b);

      var l1 = lum(a), l2 = lum(b);
      var r = (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
      razaoEl.textContent = r.toFixed(2) + ':1';

      var niveis = [
        ['Texto normal', 'AA', 4.5], ['Texto grande', 'AA', 3],
        ['Texto normal', 'AAA', 7], ['Texto grande', 'AAA', 4.5],
        ['Borda e ícone', '—', 3]
      ];
      ver.innerHTML = niveis.map(function (n) {
        var ok = r >= n[2];
        return '<span class="ferr__veredito ' + (ok ? 'passa' : 'falha') + '">' +
               (ok ? '✓' : '✗') + ' ' + n[0] + (n[1] !== '—' ? ' ' + n[1] : '') + '</span>';
      }).join('');

      amostra.style.background = b; amostra.style.color = a;
      dica.className = 'ferr__dica is-ok';
      dica.textContent = r >= 7 ? 'passa em tudo, inclusive AAA.'
        : r >= 4.5 ? 'serve para texto de qualquer tamanho.'
        : r >= 3 ? 'só para título grande — no corpo do texto reprova.'
        : 'reprova em tudo. Escureça o texto ou clareie o fundo.';
    }
    texto.value = ler('ct-texto', texto.value);
    fundo.value = ler('ct-fundo', fundo.value);
    [texto, fundo].forEach(function (e) { e.addEventListener('input', calcular); });
    tp.addEventListener('input', function () { texto.value = tp.value; calcular(); });
    fp.addEventListener('input', function () { fundo.value = fp.value; calcular(); });
    /* testar o par que a Paleta gerou: destaque sobre o fundo */
    ligar(caixa.querySelector('.ferr__grade--cores'), 'Paleta', '#f-paleta', function () {
      var d = corHex(ler('pl-destaque', '')), f = corHex(ler('pl-fundo', ''));
      if (!d || !f) return null;
      if (corHex(texto.value) === d && corHex(fundo.value) === f) return null;
      return {
        texto: 'destaque ' + d + ' sobre o fundo ' + f,
        aplicar: function () { preencher(texto, d); preencher(fundo, f); }
      };
    }, 'testar');
    calcular();
  })();

  /* ========== 5 · BRIEFING ========== */
  (function () {
    var caixa = $('#fer-briefing'); if (!caixa) return;
    var PERGUNTAS = [
      'O que você vende, e para quem?',
      'Como seu cliente te encontra hoje?',
      'Quantos contatos você recebe por semana, e de onde vêm?',
      'O que faz alguém escolher você em vez do concorrente?',
      'Qual a pergunta que todo cliente faz antes de fechar?',
      'Qual o ticket médio, e qual serviço você QUER vender mais?',
      'Tem fotos próprias? Logo em vetor?',
      'Quem responde o WhatsApp, e em quanto tempo?',
      'O que você acha que o site precisa ter?',
      'Quando precisa estar no ar, e por quê?'
    ];
    var campos = $('#br-campos'), contador = $('#br-contador'), cliente = $('#br-cliente');
    cliente.value = ler('br-cliente', '');
    function chave() { return 'br-' + (cliente.value.trim().toLowerCase() || 'sem-nome'); }

    function contar() {
      var r = ler(chave(), {});
      var n = PERGUNTAS.filter(function (_, i) { return (r[i] || '').trim(); }).length;
      contador.textContent = n + ' de ' + PERGUNTAS.length;
      contador.classList.toggle('is-completo', n === PERGUNTAS.length);
    }
    function pintar() {
      var r = ler(chave(), {});
      campos.innerHTML = PERGUNTAS.map(function (p, i) {
        return '<div class="ferr__linha"><label for="br-' + i + '">' + (i+1) + ' · ' + p + '</label>' +
               '<textarea id="br-' + i + '" data-i="' + i + '" class="ferr__campo" rows="2">' +
               (r[i] || '').replace(/[<>&]/g, function (c) { return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]; }) +
               '</textarea></div>';
      }).join('');
      contar();
    }
    campos.addEventListener('input', function (e) {
      if (e.target.tagName !== 'TEXTAREA') return;
      var r = ler(chave(), {}); r[e.target.dataset.i] = e.target.value;
      guardar(chave(), r); contar();
    });
    cliente.addEventListener('input', function () { guardar('br-cliente', cliente.value); pintar(); });
    $('#br-zerar').addEventListener('click', function () { guardar(chave(), {}); pintar(); });
    $('#br-copiar').addEventListener('click', function () {
      var r = ler(chave(), {});
      var txt = 'BRIEFING — ' + (cliente.value.trim() || 'sem nome') + '\n' +
                new Date().toLocaleDateString('pt-BR') + '\n\n' +
                PERGUNTAS.map(function (p, i) {
                  return (i+1) + '. ' + p + '\n' + ((r[i] || '').trim() || '(não respondeu)') + '\n';
                }).join('\n');
      copiar(txt, this);
    });
    pintar();
  })();

  /* ========== 6 · PREÇO ========== */
  (function () {
    var caixa = $('#fer-preco'); if (!caixa) return;
    var ids = ['despesas', 'retirada', 'dias', 'horas', 'projeto', 'margem'];
    var hora = $('#pr-hora'), faixa = $('#pr-faixa');

    function calcular() {
      var v = {};
      ids.forEach(function (i) { var el = $('#pr-' + i); v[i] = parseFloat(el.value) || 0; guardar('pr-' + i, el.value); });
      var horasMes = v.dias * v.horas;
      if (horasMes <= 0) { hora.textContent = '—'; faixa.textContent = '—'; return; }

      var custoHora = (v.despesas + v.retirada) / horasMes;
      hora.innerHTML = '<strong>' + brl(custoHora) + '</strong> por hora ' +
        '<span>' + Math.round(horasMes) + ' horas faturáveis por mês · ' +
        brl(v.despesas + v.retirada) + ' que precisam entrar</span>';

      var horasReais = v.projeto * v.margem;
      var piso = custoHora * horasReais;
      faixa.innerHTML = '<strong>' + brl(piso) + ' a ' + brl(piso * 1.6) + '</strong> o projeto ' +
        '<span>' + v.projeto + 'h estimadas viram ' + Math.round(horasReais) + 'h com a margem · ' +
        brl(piso) + ' é o piso: abaixo disso você paga para trabalhar</span>';
    }
    ids.forEach(function (i) {
      var el = $('#pr-' + i);
      var salvo = ler('pr-' + i, null);
      if (salvo !== null) el.value = salvo;
      el.addEventListener('input', calcular);
      el.addEventListener('change', calcular);
    });
    calcular();
  })();

  /* ========== 7 · PROPOSTA QUE FECHA ========== */
  (function () {
    var caixa = $('#fer-proposta'); if (!caixa) return;
    var CAMPOS = [
      { id: 'entendi',     rotulo: 'O que eu entendi',          dica: 'devolva o problema com as palavras dele' },
      { id: 'proponho',    rotulo: 'O que eu proponho',         dica: 'a solução, em uma frase' },
      { id: 'incluido',    rotulo: 'O que está incluído',       dica: 'lista objetiva — inclua o intangível: briefing, copy, acessibilidade, SEO, LGPD' },
      { id: 'naoincluido', rotulo: 'O que não está incluído',   dica: 'evita mal-entendido depois' },
      { id: 'prazo',       rotulo: 'Prazo e etapas',            dica: 'o que depende dele: fotos, textos, aprovação' },
      { id: 'investimento',rotulo: 'Investimento',              dica: 'valor, forma de pagamento, entrada de 40 a 50%' },
      { id: 'depois',      rotulo: 'Depois da entrega',         dica: 'rodadas de ajuste, manutenção opcional' }
    ];
    var campos = $('#pp-campos'), contador = $('#pp-contador'), cliente = $('#pp-cliente'),
        modelo = $('#pp-modelo'), validade = $('#pp-validade'), dica = $('#pp-dica');
    cliente.value = ler('pp-cliente', '');
    modelo.value = ler('pp-modelo', 'Por projeto');
    validade.value = ler('pp-validade', 15);

    function chave() { return 'pp-' + (cliente.value.trim().toLowerCase() || 'sem-nome'); }
    function esc(s) { return (s || '').replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; }); }

    function contar() {
      var r = ler(chave(), {});
      var n = CAMPOS.filter(function (c) { return (r[c.id] || '').trim(); }).length;
      contador.textContent = n + ' de ' + CAMPOS.length;
      contador.classList.toggle('is-completo', n === CAMPOS.length);
    }
    function pintar() {
      var r = ler(chave(), {});
      campos.innerHTML = CAMPOS.map(function (c) {
        return '<div class="ferr__linha"><label for="pp-' + c.id + '">' + c.rotulo + ' <small>' + c.dica + '</small></label>' +
               '<textarea id="pp-' + c.id + '" data-id="' + c.id + '" class="ferr__campo" rows="2">' +
               esc(r[c.id] || '') + '</textarea></div>';
      }).join('');
      contar();
    }
    campos.addEventListener('input', function (e) {
      if (e.target.tagName !== 'TEXTAREA') return;
      var r = ler(chave(), {}); r[e.target.dataset.id] = e.target.value;
      guardar(chave(), r); contar();
    });
    cliente.addEventListener('input', function () { guardar('pp-cliente', cliente.value); pintar(); });
    modelo.addEventListener('change', function () { guardar('pp-modelo', modelo.value); });
    validade.addEventListener('input', function () { guardar('pp-validade', validade.value); });
    $('#pp-zerar').addEventListener('click', function () { guardar(chave(), {}); pintar(); });
    $('#pp-copiar').addEventListener('click', function () {
      var r = ler(chave(), {});
      var nome = cliente.value.trim() || 'sem nome';
      var dias = parseInt(validade.value, 10) || 15;
      var ateData = new Date(Date.now() + dias * 86400000).toLocaleDateString('pt-BR');
      var txt = 'PROPOSTA — ' + nome + '\n' + new Date().toLocaleDateString('pt-BR') +
        '\nModelo de preço: ' + modelo.value + '\n\n' +
        CAMPOS.map(function (c, i) {
          return (i + 1) + '. ' + c.rotulo + '\n' + ((r[c.id] || '').trim() || '(não preenchido)') + '\n';
        }).join('\n') +
        '\n8. Validade da proposta\n' + dias + ' dias — até ' + ateData;
      copiar(txt, this);
    });

    /* do Briefing do mesmo cliente: as respostas viram rascunho dos campos que estão vazios */
    var DO_BRIEFING = {
      entendi: [[0, 'Vende'], [1, 'Hoje o cliente chega por'], [2, 'Contatos'], [3, 'Diferencial']],
      incluido: [[8, 'O que ele pediu']],
      prazo: [[9, 'Precisa estar no ar'], [6, 'Fotos e logo']]
    };
    var ROTULO = {};
    CAMPOS.forEach(function (c) { ROTULO[c.id] = c.rotulo; });
    function rascunhos() {
      var br = ler('br-' + chaveProjeto(), {}), saida = {};
      Object.keys(DO_BRIEFING).forEach(function (id) {
        var campo = $('#pp-' + id);
        if (!campo || campo.value.trim()) return;
        var linhas = DO_BRIEFING[id].filter(function (p) { return (br[p[0]] || '').trim(); });
        if (!linhas.length) return;
        saida[id] = linhas.length === 1 ? br[linhas[0][0]].trim()
          : linhas.map(function (p) { return p[1] + ': ' + br[p[0]].trim(); }).join('\n');
      });
      return saida;
    }
    ligar(campos, 'Briefing', '#f-briefing', function () {
      var r = rascunhos(), ids = Object.keys(r);
      if (!ids.length) return null;
      return {
        texto: 'respostas prontas para ' + ids.map(function (id) { return ROTULO[id]; }).join(', ') +
               ' — só entram onde está vazio',
        aplicar: function () { ids.forEach(function (id) { preencher($('#pp-' + id), r[id]); }); }
      };
    }, 'trazer');

    /* da calculadora de Preço: a faixa vai para o Investimento */
    ligar(dica, 'Preço', '#f-preco', function () {
      var f = faixaPreco(), campo = $('#pp-investimento');
      if (!f || !campo || campo.value.indexOf(f.texto) !== -1) return null;
      return {
        texto: f.texto + ' pelo projeto',
        aplicar: function () {
          var antes = campo.value.trim();
          preencher(campo, (antes ? antes + '\n' : '') + f.texto);
        }
      };
    });
    pintar();
  })();

  /* ========== 8 · INVENTÁRIO DE ACESSOS ========== */
  (function () {
    var caixa = $('#fer-inventario'); if (!caixa) return;
    var PADRAO = ['Domínio', 'Hospedagem', 'Repositório do código', 'Google Analytics', 'Perfil da Empresa Google', 'E-mail profissional'];
    var tabela = $('#iv-tabela'), cliente = $('#iv-cliente');
    cliente.value = ler('iv-cliente', '');

    function chave() { return 'iv-' + (cliente.value.trim().toLowerCase() || 'sem-nome'); }
    function padrao() { return PADRAO.map(function (s) { return { servico: s, titular: '', onde: '' }; }); }
    function esc(s) { return (s || '').replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

    function pintar() {
      var linhas = ler(chave(), null) || padrao();
      Array.prototype.slice.call(tabela.querySelectorAll('.ferr__tabela-linha')).forEach(function (el) { el.remove(); });
      linhas.forEach(function (l, i) {
        var row = document.createElement('div');
        row.className = 'ferr__tabela-linha';
        row.innerHTML =
          '<input type="text" data-campo="servico" data-i="' + i + '" value="' + esc(l.servico) + '" placeholder="serviço" aria-label="Serviço">' +
          '<input type="text" data-campo="titular" data-i="' + i + '" value="' + esc(l.titular) + '" placeholder="titular" aria-label="Titular">' +
          '<input type="text" data-campo="onde" data-i="' + i + '" value="' + esc(l.onde) + '" placeholder="onde" aria-label="Onde">' +
          '<button type="button" class="ferr__remover" data-remover="' + i + '" aria-label="Remover linha">&times;</button>';
        tabela.appendChild(row);
      });
    }
    tabela.addEventListener('input', function (e) {
      if (e.target.tagName !== 'INPUT') return;
      var linhas = ler(chave(), null) || padrao();
      linhas[parseInt(e.target.dataset.i, 10)][e.target.dataset.campo] = e.target.value;
      guardar(chave(), linhas);
    });
    tabela.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-remover]');
      if (!btn) return;
      var linhas = ler(chave(), null) || padrao();
      linhas.splice(parseInt(btn.dataset.remover, 10), 1);
      guardar(chave(), linhas);
      pintar();
    });
    $('#iv-add').addEventListener('click', function () {
      var linhas = ler(chave(), null) || padrao();
      linhas.push({ servico: '', titular: '', onde: '' });
      guardar(chave(), linhas);
      pintar();
    });
    cliente.addEventListener('input', function () { guardar('iv-cliente', cliente.value); pintar(); });
    $('#iv-zerar').addEventListener('click', function () { guardar(chave(), padrao()); pintar(); });
    $('#iv-copiar').addEventListener('click', function () {
      var linhas = ler(chave(), null) || padrao();
      var nome = cliente.value.trim() || 'sem nome';
      var txt = '# Acessos — ' + nome + '\n\n' +
        '| Serviço | Titular | Onde |\n|---|---|---|\n' +
        linhas.map(function (l) { return '| ' + (l.servico || '—') + ' | ' + (l.titular || '—') + ' | ' + (l.onde || '—') + ' |'; }).join('\n') +
        '\n\nSenhas: gerenciador do cliente. Nenhuma senha neste arquivo.\n' +
        'Acesso do Gustavo: como colaborador convidado, revogável a qualquer momento.\n' +
        'Atualizado em: ' + new Date().toLocaleDateString('pt-BR');
      copiar(txt, this);
    });
    pintar();
  })();

  /* ========== 9 · CABEÇALHO DA PÁGINA ========== */
  (function () {
    var caixa = $('#fer-head'); if (!caixa) return;
    var ids = ['nome','oque','cidade','url','desc','img','cor','tel','email','area','tipo'];
    var saida = $('#hd-saida'), conta = $('#hd-conta'), picker = $('#hd-cor-picker');

    function esc(s) { return (s || '').replace(/[<>&]/g, function (c) { return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]; }); }
    function v(id) { var el = $('#hd-' + id); return el ? el.value.trim() : ''; }
    function limpaUrl(u) { return u.replace(/\/+$/, ''); }

    function montar() {
      ids.forEach(function (i) { guardar('hd-' + i, $('#hd-' + i).value); });

      var nome = v('nome') || '[nome do negócio]';
      var oque = v('oque'), cidade = v('cidade'), url = limpaUrl(v('url')), desc = v('desc');
      var img = v('img'), cor = v('cor') || '#305546';
      var tel = v('tel').replace(/\D/g, ''), email = v('email'), area = v('area'), tipo = v('tipo');

      var titulo = nome + (oque ? ' — ' + oque : '') + (cidade ? ' | ' + cidade : '');
      var n = desc.length;
      conta.textContent = n ? (n + ' caracteres' + (n > 160 ? ' — acima de 160, o Google corta' : n < 70 ? ' — curta demais, use entre 70 e 160' : ' — bom tamanho')) : '';
      conta.classList.toggle('is-ok', n >= 70 && n <= 160);

      var L = [];
      L.push('<title>' + titulo + '</title>');
      L.push('<meta name="description" content="' + (desc || '[descrição]') + '">');
      if (url) L.push('<link rel="canonical" href="' + url + '/">');
      /* as fontes escolhidas na Tipografia entram aqui, que é onde elas vão */
      var fontes = $('#fo-saida-link'), linkFontes = fontes ? fontes.textContent : '';
      if (linkFontes.indexOf('<link') === 0) {
        L.push('');
        L.push('<!-- fontes, da ferramenta Tipografia -->');
        linkFontes.split('\n').forEach(function (l) { L.push(l); });
      }
      L.push('');
      L.push('<!-- como o link aparece no WhatsApp e nas redes -->');
      L.push('<meta property="og:title" content="' + nome + (oque ? ' — ' + oque : '') + '">');
      L.push('<meta property="og:description" content="' + (desc || '[descrição]') + '">');
      if (img) L.push('<meta property="og:image" content="' + (url ? url : '') + (img.charAt(0) === '/' ? img : '/' + img) + '">');
      if (url) L.push('<meta property="og:url" content="' + url + '/">');
      L.push('<meta property="og:type" content="website">');
      L.push('<meta property="og:locale" content="pt_BR">');
      L.push('<meta name="twitter:card" content="summary_large_image">');
      L.push('');
      L.push('<meta name="theme-color" content="' + cor + '">');
      L.push('');
      if (tel || email || area || url) {
        var dados = { '@context': 'https://schema.org', '@type': tipo, name: nome };
        if (tel) dados.telephone = '+' + tel;
        if (email) dados.email = email;
        if (area) dados.areaServed = area;
        if (url) dados.url = url;
        L.push('<script type="application/ld+json">');
        L.push(JSON.stringify(dados, null, 2));
        L.push('<\/script>');
      }
      saida.innerHTML = esc(L.join('\n'));
    }

    ids.forEach(function (i) {
      var el = $('#hd-' + i);
      var salvo = ler('hd-' + i, null);
      if (salvo !== null && salvo !== '') el.value = salvo;
      el.addEventListener('input', montar);
      el.addEventListener('change', montar);
    });
    picker.addEventListener('input', function () { $('#hd-cor').value = picker.value.toUpperCase(); montar(); });
    $('#hd-cor').addEventListener('input', function () {
      if (/^#[0-9a-f]{6}$/i.test($('#hd-cor').value)) picker.value = $('#hd-cor').value;
    });
    $('#hd-copiar').addEventListener('click', function () { copiar(saida.textContent, this); });

    /* o nome do projeto, se o campo ainda está vazio */
    ligar(caixa.querySelector('.ferr__grade'), 'Projeto', '#projeto', function () {
      var n = nomeProjeto();
      if (!n || v('nome')) return null;
      return { texto: n, aplicar: function () { preencher($('#hd-nome'), n); } };
    });
    /* theme-color = a cor de destaque da Paleta */
    ligar($('#hd-img').closest('.ferr__grade'), 'Paleta', '#f-paleta', function () {
      var d = corHex(ler('pl-destaque', ''));
      if (!d || corHex(v('cor')) === d) return null;
      return {
        texto: 'destaque ' + d + ' como theme-color',
        aplicar: function () { picker.value = d; preencher($('#hd-cor'), d); }
      };
    });
    /* telefone do JSON-LD = o número do botão de WhatsApp */
    ligar($('#hd-tel').closest('.ferr__grade'), 'Link de WhatsApp', '#f-zap', function () {
      var d = foneNacional(ler('zp-num', ''));
      if (d.length < 10) return null;
      var agora = foneNacional(v('tel'));
      if (agora === d) return null;
      return {
        texto: (agora ? 'número diferente lá: ' : 'telefone ') + foneBonito(d),
        aplicar: function () { preencher($('#hd-tel'), '55' + d); }
      };
    });
    /* a Tipografia monta depois desta; quando ela muda, o bloco se refaz com o <link> novo */
    document.addEventListener('gt:mudou', montar);
    montar();
  })();

  /* ========== 10 · PALETA EM TOKENS ========== */
  (function () {
    var caixa = $('#fer-paleta'); if (!caixa) return;
    var campo = $('#pl-destaque'), picker = $('#pl-destaque-picker'), fundoSel = $('#pl-fundo');
    var saida = $('#pl-saida'), vereditos = $('#pl-vereditos'), dica = $('#pl-dica'), amostra = $('#pl-amostra');

    function hex(s) {
      s = (s || '').trim().replace(/^#/, '');
      if (/^[0-9a-f]{3}$/i.test(s)) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
      return /^[0-9a-f]{6}$/i.test(s) ? '#' + s.toUpperCase() : null;
    }
    function rgb(h) { h = h.replace('#',''); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
    function lum(h) {
      return rgb(h).map(function (c) { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); })
        .reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
    }
    function razao(a, b) { var x = lum(a), y = lum(b); return ((Math.max(x,y) + 0.05) / (Math.min(x,y) + 0.05)); }
    function mistura(a, b, p) {
      var A = rgb(a), B = rgb(b);
      return '#' + [0,1,2].map(function (i) {
        return Math.round(A[i] + (B[i] - A[i]) * p).toString(16).padStart(2, '0');
      }).join('').toUpperCase();
    }
    function escurece(h, p) { return mistura(h, '#000000', p); }

    function montar() {
      var destaque = hex(campo.value) || '#305546';
      var fundo = fundoSel.value;
      guardar('pl-destaque', campo.value); guardar('pl-fundo', fundo);

      /* os seis papéis */
      var superficie = fundo === '#FFFFFF' ? '#F7F7F5' : '#FFFFFF';
      var texto = '#3F444D';
      var textoFraco = '#6B7280';
      var linha = mistura(fundo, '#000000', 0.10);

      /* se o destaque não passa em 4.5:1 no fundo, oferece uma versão escurecida que passa */
      var r = razao(destaque, fundo);
      var destaqueTexto = destaque, ajustes = 0;
      while (razao(destaqueTexto, fundo) < 4.5 && ajustes < 20) { destaqueTexto = escurece(destaqueTexto, 0.06); ajustes++; }

      var pares = [
        ['Texto no fundo', razao(texto, fundo), 4.5],
        ['Texto fraco no fundo', razao(textoFraco, fundo), 4.5],
        ['Destaque no fundo', r, 4.5],
        ['Branco no destaque', razao('#FFFFFF', destaque), 4.5]
      ];
      vereditos.innerHTML = pares.map(function (p) {
        var ok = p[1] >= p[2];
        return '<span class="ferr__veredito ' + (ok ? 'passa' : 'falha') + '">' + p[0] + ' ' + p[1].toFixed(2) + ':1</span>';
      }).join('');

      if (r < 4.5) {
        dica.textContent = 'a cor escolhida dá ' + r.toFixed(2) + ':1 no fundo — não serve para texto. Use ' +
                           destaqueTexto + ' (' + razao(destaqueTexto, fundo).toFixed(2) + ':1) em link e texto, e guarde a original só para fundo de botão.';
        dica.classList.remove('is-ok');
      } else {
        dica.textContent = 'a cor de destaque passa em texto (' + r.toFixed(2) + ':1). Dá para usar em link, ícone e botão.';
        dica.classList.add('is-ok');
      }

      var css = [
        ':root {',
        '  --fundo:       ' + fundo + ';   /* nunca branco puro */',
        '  --superficie:  ' + superficie + ';   /* card, caixa */',
        '  --texto:       ' + texto + ';   /* nunca preto puro */',
        '  --texto-fraco: ' + textoFraco + ';   /* legenda, apoio */',
        '  --destaque:    ' + destaque + ';   /* UMA cor: botão, link, ícone */'
      ];
      if (r < 4.5) css.push('  --destaque-texto: ' + destaqueTexto + ';   /* a mesma, escurecida para texto */');
      css.push('  --linha:       ' + linha + ';   /* divisórias */');
      css.push('}');
      saida.textContent = css.join('\n');

      amostra.style.background = fundo;
      $('#pl-amostra-titulo').style.color = texto;
      $('#pl-amostra-texto').style.color = texto;
      $('#pl-amostra-fraco').style.color = textoFraco;
      var botao = $('#pl-amostra-botao');
      botao.style.background = destaque;
      var sobre = razao('#FFFFFF', destaque) >= razao(texto, destaque) ? '#FFFFFF' : texto;
      botao.style.color = sobre;

      /* os papéis, para a Tipografia e o Design system lerem sem refazer a conta */
      guardar('pl-tokens', {
        fundo: fundo, superficie: superficie, texto: texto, textoFraco: textoFraco, linha: linha,
        destaque: destaque, destaqueTexto: destaqueTexto, sobreDestaque: sobre
      });
    }

    var salvo = ler('pl-destaque', null);
    if (salvo) { campo.value = salvo; if (hex(salvo)) picker.value = hex(salvo); }
    var fundoSalvo = ler('pl-fundo', null);
    if (fundoSalvo) fundoSel.value = fundoSalvo;

    picker.addEventListener('input', function () { campo.value = picker.value.toUpperCase(); montar(); });
    campo.addEventListener('input', function () { var h = hex(campo.value); if (h) picker.value = h; montar(); });
    fundoSel.addEventListener('change', montar);
    $('#pl-copiar').addEventListener('click', function () { copiar(saida.textContent, this); });
    /* do inventário do Design system: a cor de marca que o CSS antigo já usava */
    ligar(caixa.querySelector('.ferr__grade--cores'), 'Design system', '#f-sistema', function () {
      var c = corDeMarca(inventariar(ler('ds-css', '')));
      if (!c || hex(campo.value) === c.hex) return null;
      return {
        texto: 'a cor de marca mais usada no inventário: ' + c.hex + ' (' + c.n + '×)',
        aplicar: function () { picker.value = c.hex; preencher(campo, c.hex); }
      };
    });
    montar();
  })();

  /* ========== 11 · ESCALA DE TEXTO E ESPAÇO ========== */
  (function () {
    var caixa = $('#fer-escala'); if (!caixa) return;
    var ids = ['base','razao','entrelinha','espaco'];
    var saida = $('#es-saida');

    function montar() {
      ids.forEach(function (i) { guardar('es-' + i, $('#es-' + i).value); });
      var base = parseFloat($('#es-base').value) || 17;
      var r = parseFloat($('#es-razao').value) || 1.25;
      var el = parseFloat($('#es-entrelinha').value) || 1.6;
      var e = parseFloat($('#es-espaco').value) || 8;

      var p = function (n) { return Math.round(base * Math.pow(r, n)); };
      var h1max = p(5), h1min = Math.max(32, Math.round(h1max * 0.58));
      var h2max = p(3), h2min = Math.max(24, Math.round(h2max * 0.7));

      /* a escala de 8 da trilha: meio passo, depois 1, 1.5, 2, 3, 4, 6, 8, 12, 16 */
      var esc = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16].map(function (m) { return e * m; });

      var css = [
        ':root {',
        '  /* texto — base ' + base + 'px, razão ' + r.toFixed(3) + ' */',
        '  --t-corpo:   ' + base + 'px;',
        '  --t-peq:     ' + Math.max(14, p(-1)) + 'px;   /* nada abaixo de 14 */',
        '  --t-g:       ' + p(1) + 'px;',
        '  --t-h3:      ' + p(2) + 'px;',
        '  --t-h2:      clamp(' + h2min + 'px, 3.5vw, ' + h2max + 'px);',
        '  --t-h1:      clamp(' + h1min + 'px, 6vw, ' + h1max + 'px);',
        '  --t-alt:     ' + el + ';   /* entrelinha do corpo */',
        '',
        '  /* espaço — escala de ' + e + ' */',
      ];
      esc.forEach(function (val, i) {
        var nome = '--e' + (i + 1) + ':';
        while (nome.length < 13) nome += ' ';
        css.push('  ' + nome + val + 'px;');
      });
      css.push('}');
      css.push('');
      css.push('body  { font-size: var(--t-corpo); line-height: var(--t-alt); }');
      css.push('h1    { font-size: var(--t-h1); line-height: 1.05; letter-spacing: -0.02em; }');
      css.push('h2    { font-size: var(--t-h2); line-height: 1.15; }');
      css.push('.secao { padding-block: clamp(var(--e7), 8vw, var(--e9)); }');
      css.push('/* a medida do parágrafo (max-width em ch) sai da ferramenta de Tipografia */');
      saida.textContent = css.join('\n');

      /* os valores já calculados, para a Tipografia e o Design system */
      guardar('es-tokens', {
        corpo: base, peq: Math.max(14, p(-1)), g: p(1), h3: p(2),
        h2: [h2min, h2max], h1: [h1min, h1max], alt: el, base: e, e: esc, razao: r
      });
    }

    ids.forEach(function (i) {
      var el = $('#es-' + i);
      var salvo = ler('es-' + i, null);
      if (salvo !== null && salvo !== '') el.value = salvo;
      el.addEventListener('input', montar);
      el.addEventListener('change', montar);
    });
    $('#es-copiar').addEventListener('click', function () { copiar(saida.textContent, this); });
    montar();
  })();

  /* ========== 12 · TIPOGRAFIA ========== */
  (function () {
    var caixa = $('#fer-fonte'); if (!caixa) return;

    /* c: a classe da família · w: os pesos que ela tem de verdade no Google Fonts.
       Pedir no <link> um peso que a família não tem faz o Google recusar o pedido inteiro. */
    var TODOS = [300, 400, 500, 600, 700, 800, 900];
    function ate(a, b) { return TODOS.filter(function (p) { return p >= a && p <= b; }); }
    var FAMILIAS = [
      { n: 'Sistema',             p: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', local: true, c: 'sem', w: [400, 500, 600, 700] },
      { n: 'Inter',               p: 'sans-serif', c: 'sem', w: ate(300, 900) },
      { n: 'Manrope',             p: 'sans-serif', c: 'sem', w: ate(300, 800) },
      { n: 'Outfit',              p: 'sans-serif', c: 'sem', w: ate(300, 900) },
      { n: 'Plus Jakarta Sans',   p: 'sans-serif', c: 'sem', w: ate(300, 800) },
      { n: 'Space Grotesk',       p: 'sans-serif', c: 'sem', w: ate(300, 700) },
      { n: 'Archivo',             p: 'sans-serif', c: 'sem', w: ate(300, 900) },
      { n: 'Bricolage Grotesque', p: 'sans-serif', c: 'sem', w: ate(300, 800) },
      { n: 'Figtree',             p: 'sans-serif', c: 'sem', w: ate(300, 900) },
      { n: 'Sora',                p: 'sans-serif', c: 'sem', w: ate(300, 800) },
      { n: 'Sistema serifada',    p: 'Georgia, "Times New Roman", serif', local: true, c: 'serif', w: [400, 700] },
      { n: 'Lora',                p: 'serif', c: 'serif', w: ate(400, 700) },
      { n: 'Source Serif 4',      p: 'serif', c: 'serif', w: ate(300, 900) },
      { n: 'Libre Baskerville',   p: 'serif', c: 'serif', w: [400, 700] },
      { n: 'Fraunces',            p: 'serif', c: 'serif', w: ate(300, 900) },
      { n: 'Newsreader',          p: 'serif', c: 'serif', w: ate(300, 800) },
      { n: 'Playfair Display',    p: 'serif', c: 'display', w: ate(400, 900) },
      { n: 'DM Serif Display',    p: 'serif', c: 'display', w: [400] },
      { n: 'Bebas Neue',          p: 'sans-serif', c: 'display', w: [400] },
      { n: 'Caveat',              p: 'cursive', c: 'script', w: ate(400, 700) },
      { n: 'JetBrains Mono',      p: 'monospace', c: 'mono', w: ate(300, 800) },
      { n: 'IBM Plex Mono',       p: 'monospace', c: 'mono', w: ate(300, 700) }
    ];
    var CLASSES = {
      sem:     ['Sem serifa', 'serve para interface, corpo de texto e tudo que é pequeno'],
      serif:   ['Serifada', 'serve para texto longo e marca tradicional; evite em rótulo muito pequeno'],
      display: ['Display', 'só para título grande — foi desenhada para ser vista de longe, não para o corpo'],
      script:  ['Manuscrita', 'para uma palavra ou um detalhe; em título inteiro ou parágrafo, cansa'],
      mono:    ['Monoespaçada', 'para código, número alinhado e rótulo técnico — não para corpo de texto']
    };
    var NOME_PESO = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra Bold', 900: 'Black' };

    var COMBOS = [
      { t: 'Sistema', tp: [400, 700], c: 'Sistema', cp: [400],
        r: 'Zero download. Carrega instantâneo e fica nativa em cada aparelho.' },
      { t: 'Bricolage Grotesque', tp: [800], c: 'Source Serif 4', cp: [400, 600],
        r: 'Grotesca com caráter no título, serifada no corpo — para material de leitura longa.' },
      { t: 'Playfair Display', tp: [700], c: 'Lora', cp: [400, 600],
        r: 'Serifada alta no título. Casamento, buffet, joalheria, advocacia.' },
      { t: 'Space Grotesk', tp: [500, 700], c: 'Inter', cp: [400, 600],
        r: 'Título com personalidade técnica e corpo neutro. Estúdio, agência, tecnologia.' },
      { t: 'Outfit', tp: [600, 800], c: 'Inter', cp: [400],
        r: 'Geométrica e limpa nos dois. Serviço moderno sem querer chamar atenção.' },
      { t: 'Fraunces', tp: [700], c: 'Figtree', cp: [400, 600],
        r: 'Serifada com humor no título, sem serifa amigável no corpo. Gastronomia, artesanal.' },
      { t: 'Archivo', tp: [700], c: 'Source Serif 4', cp: [400],
        r: 'Título firme e corpo sério. Consultoria, saúde, educação.' },
      { t: 'DM Serif Display', tp: [400], c: 'Inter', cp: [400, 600],
        r: 'Display serifada só no título grande, corpo neutro. Buffet, estética, eventos.' },
      { t: 'Bebas Neue', tp: [400], c: 'Figtree', cp: [400, 600],
        r: 'Condensada, só em caixa alta, para título curto e forte. Academia, oficina, esporte.' }
    ];

    var selT = $('#fo-titulo'), selC = $('#fo-corpo');
    var pesosT = $('#fo-titulo-pesos'), pesosC = $('#fo-corpo-pesos');
    var combos = $('#fo-combos'), medidaEl = $('#fo-medida'), medidaV = $('#fo-medida-v'), alinhaEl = $('#fo-alinha');
    var ACAB = ['balance', 'pretty', 'tab', 'versal'];
    var saidaLink = $('#fo-saida-link'), saidaCss = $('#fo-saida-css');
    var injetado = {}, xh = {};

    function acha(nome) {
      for (var i = 0; i < FAMILIAS.length; i++) if (FAMILIAS[i].n === nome) return FAMILIAS[i];
      return FAMILIAS[0];
    }
    function pilha(nome) { var f = acha(nome); return f.local ? f.p : "'" + f.n + "', " + f.p; }
    function perto(f, alvo) {
      return f.w.reduce(function (a, p) { return Math.abs(p - alvo) < Math.abs(a - alvo) ? p : a; }, f.w[0]);
    }
    function marcados(cx) {
      return Array.prototype.slice.call(cx.querySelectorAll('input:checked')).map(function (i) { return +i.value; })
        .sort(function (a, b) { return a - b; });
    }
    function rotuloClasse(f) { return CLASSES[f.c][0] + (f.local ? ' · sem download' : ''); }

    /* selects agrupados por classe */
    Object.keys(CLASSES).forEach(function (c) {
      [selT, selC].forEach(function (s) {
        var g = document.createElement('optgroup');
        g.label = CLASSES[c][0];
        FAMILIAS.forEach(function (f) {
          if (f.c !== c) return;
          var o = document.createElement('option');
          o.value = f.n; o.textContent = f.n + (f.local ? ' — sem download' : '');
          g.appendChild(o);
        });
        s.appendChild(g);
      });
    });

    /* os pesos de cada lado: o que a família não tem fica desligado */
    function pintarPesos(cx, lado, f, quer) {
      cx.innerHTML = TODOS.map(function (p) {
        var tem = f.w.indexOf(p) !== -1;
        return '<label class="ferr__peso' + (tem ? '' : ' is-indisponivel') + '"' + (tem ? '' : ' title="' + f.n + ' não tem este peso"') + '>' +
               '<input type="checkbox" value="' + p + '" data-lado="' + lado + '"' +
               (tem && quer.indexOf(p) !== -1 ? ' checked' : '') + (tem ? '' : ' disabled') + '>' +
               '<span>' + p + ' <small>' + NOME_PESO[p] + '</small></span></label>';
      }).join('');
    }

    combos.innerHTML = COMBOS.map(function (c, i) {
      var a = acha(c.t), b = acha(c.c);
      return '<button class="ferr__combo" type="button" data-i="' + i + '">' +
             '<strong>' + c.t + (c.t === c.c ? '' : ' + ' + c.c) + '</strong>' +
             '<em>' + CLASSES[a.c][0] + (c.t === c.c ? '' : ' + ' + CLASSES[b.c][0].toLowerCase()) + '</em>' +
             '<span>' + c.r + '</span></button>';
    }).join('');

    /* carrega a família na página para a amostra; pronto() roda quando o CSS dela chegou */
    function injetar(nome, pronto) {
      var f = acha(nome);
      if (f.local) { if (pronto) pronto(true); return; }
      var reg = injetado[nome];
      if (!reg) {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=' + nome.replace(/ /g, '+') + ':wght@' + f.w.join(';') + '&display=swap';
        reg = injetado[nome] = { estado: 'carregando', fila: [] };
        l.addEventListener('load', function () { reg.estado = 'ok'; reg.fila.forEach(function (fn) { fn(true); }); reg.fila = []; });
        l.addEventListener('error', function () { reg.estado = 'erro'; reg.fila.forEach(function (fn) { fn(false); }); reg.fila = []; });
        document.head.appendChild(l);
      }
      if (!pronto) return;
      if (reg.estado === 'carregando') reg.fila.push(pronto); else pronto(reg.estado === 'ok');
    }

    /* altura-x medida no canvas, com a fonte já carregada; null se não deu para medir */
    function medirXh(nome) {
      if (nome in xh) return;
      xh[nome] = undefined;   /* medindo */
      var f = acha(nome);
      function medir() {
        try {
          var c = document.createElement('canvas').getContext('2d');
          c.font = '400 200px ' + (f.local ? f.p : "'" + nome + "'");
          var m = c.measureText('x');
          xh[nome] = m.actualBoundingBoxAscent ? Math.round(m.actualBoundingBoxAscent / 200 * 100) / 100 : null;
        } catch (e) { xh[nome] = null; }
        montar();
      }
      injetar(nome, function (ok) {
        if (!ok) { xh[nome] = null; return; }
        if (f.local || !document.fonts || !document.fonts.load) { setTimeout(medir, 0); return; }
        document.fonts.load("400 40px '" + nome + "'").then(function (lista) {
          if (lista && lista.length) medir(); else { xh[nome] = null; montar(); }
        }, function () { xh[nome] = null; });
      });
    }

    function paleta() {
      var t = ler('pl-tokens', null);
      return t && t.fundo ? t : { fundo: '#FFFCF7', texto: '#3F444D', textoFraco: '#6B7280', destaque: '#305546', destaqueTexto: '#305546', sobreDestaque: '#FFFFFF' };
    }
    function escala() {
      var t = ler('es-tokens', null);
      return t && t.corpo ? t : { corpo: 17, peq: 14, g: 21, h3: 27, h2: [29, 41], h1: [32, 65], alt: 1.6, razao: 1.25 };
    }

    function montar() {
      var nt = selT.value, nc = selC.value, fT = acha(nt), fC = acha(nc);
      var pt = marcados(pesosT).filter(function (p) { return fT.w.indexOf(p) !== -1; });
      var pc = marcados(pesosC).filter(function (p) { return fC.w.indexOf(p) !== -1; });
      if (!pt.length) pt = [perto(fT, 700)];
      if (!pc.length) pc = [perto(fC, 400)];
      var medida = parseInt(medidaEl.value, 10) || 66, alinha = alinhaEl.value;
      var ac = {};
      ACAB.forEach(function (k) { ac[k] = $('#fo-' + k).checked; });
      medidaV.textContent = medida + 'ch';

      guardar('fo-titulo', nt); guardar('fo-corpo', nc);
      guardar('fo-pt', pt); guardar('fo-pc', pc);
      guardar('fo-pilha-t', pilha(nt)); guardar('fo-pilha-c', pilha(nc));
      guardar('fo-medida', medida); guardar('fo-alinha', alinha); guardar('fo-acab', ac);

      medirXh(nt); medirXh(nc);

      /* classe de cada lado, com o aviso quando a classe não serve para o papel */
      var dT = $('#fo-classe-t'), dC = $('#fo-classe-c');
      dT.textContent = rotuloClasse(fT) + ' — ' + CLASSES[fT.c][1] + '.';
      dT.classList.toggle('is-ok', fT.c !== 'mono');
      dC.textContent = rotuloClasse(fC) + ' — ' + CLASSES[fC.c][1] + '.' +
        (fC.c === 'display' || fC.c === 'script' || fC.c === 'mono' ? ' No corpo, não.' : '');
      dC.classList.toggle('is-ok', fC.c === 'sem' || fC.c === 'serif');

      /* <link> — só as famílias que não são do sistema, só os pesos marcados */
      var externas = [];
      if (!fT.local) externas.push({ n: nt, w: pt });
      if (!fC.local && nc !== nt) externas.push({ n: nc, w: pc });
      else if (!fC.local && nc === nt) externas[0].w = pt.concat(pc).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
      if (!externas.length) {
        saidaLink.textContent = '/* nada a carregar — a pilha do sistema já está no aparelho */';
      } else {
        var url = 'https://fonts.googleapis.com/css2?' +
          externas.map(function (f) { return 'family=' + f.n.replace(/ /g, '+') + ':wght@' + f.w.join(';'); }).join('&') +
          '&display=swap';
        saidaLink.textContent =
          '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
          '<link rel="stylesheet" href="' + url + '">';
      }

      /* CSS */
      var xC = xh[nc], xT = xh[nt];
      var css = [':root {', '  --fonte-titulo: ' + pilha(nt) + ';', '  --fonte-corpo:  ' + pilha(nc) + ';', '}', '', 'body {', '  font-family: var(--fonte-corpo);'];
      if (pc[0] !== 400) css.push('  font-weight: ' + pc[0] + ';');
      if (!fC.local && xC) css.push('  font-size-adjust: ' + xC.toFixed(2) + ';   /* altura-x da ' + nc + ', medida: a fonte de reserva ocupa o mesmo tamanho */');
      css.push('  font-synthesis-weight: none;   /* sem negrito falso: só aparecem os pesos baixados */');
      css.push('}');
      css.push('h1, h2, h3 {');
      css.push('  font-family: var(--fonte-titulo);');
      css.push('  font-weight: ' + pt[pt.length - 1] + ';');
      if (ac.balance) css.push('  text-wrap: balance;   /* linhas de tamanho parecido, sem palavra órfã */');
      css.push('}');
      css.push('p {');
      css.push('  max-width: ' + medida + 'ch;   /* medida: 45 a 75 caracteres por linha */');
      if (alinha === 'justify') { css.push('  text-align: justify;'); css.push('  hyphens: auto;   /* depende do <html lang="pt-BR"> */'); }
      else if (alinha === 'center') css.push('  text-align: center;   /* só em bloco de até três linhas */');
      if (ac.pretty) css.push('  text-wrap: pretty;   /* sem palavra sozinha na última linha */');
      css.push('}');
      if (ac.tab) css.push('.preco, td { font-variant-numeric: tabular-nums; }   /* algarismos de largura igual */');
      if (ac.versal) css.push('.sigla { font-variant-caps: all-small-caps; letter-spacing: .04em; }   /* versalete */');
      saidaCss.textContent = css.join('\n');

      /* amostra: cores da Paleta, tamanhos e entrelinha da Escala */
      var pl = paleta(), es = escala();
      var amostra = $('#fo-amostra'), txt = $('#fo-p-texto'), tit = $('#fo-p-titulo');
      amostra.style.background = pl.fundo;
      amostra.style.color = pl.texto;
      tit.style.cssText = 'font-family:' + pilha(nt) + ';font-weight:' + pt[pt.length - 1] + ';font-size:' + Math.min(es.h2[1], 44) + 'px;line-height:1.12;color:' + pl.texto;
      tit.style.setProperty('text-wrap', ac.balance ? 'balance' : 'wrap');
      $('#fo-p-olho').style.cssText = 'font-family:' + pilha(nc) + ';font-weight:' + (pc[pc.length - 1]) + ';color:' + pl.destaqueTexto;
      txt.style.cssText = 'font-family:' + pilha(nc) + ';font-weight:' + pc[0] + ';font-size:' + es.corpo + 'px;line-height:' + es.alt +
        ';max-width:' + medida + 'ch;text-align:' + alinha + ';hyphens:' + (alinha === 'justify' ? 'auto' : 'manual') + ';color:' + pl.texto;
      txt.style.setProperty('text-wrap', ac.pretty ? 'pretty' : 'wrap');
      Array.prototype.forEach.call(txt.querySelectorAll('.fo-sigla'), function (s) {
        s.style.fontVariantCaps = ac.versal ? 'all-small-caps' : 'normal';
        s.style.letterSpacing = ac.versal ? '.04em' : 'normal';
      });
      Array.prototype.forEach.call(txt.querySelectorAll('.fo-num'), function (s) {
        s.style.fontVariantNumeric = ac.tab ? 'tabular-nums' : 'normal';
      });
      var botao = $('#fo-p-botao');
      botao.style.fontFamily = pilha(nt);
      botao.style.fontWeight = pt[pt.length - 1];
      botao.style.background = pl.destaque;
      botao.style.color = pl.sobreDestaque || '#FFFFFF';

      var de = $('#fo-de');
      de.innerHTML = 'Cores da <a href="#f-paleta">Paleta</a> (' + escHtml(pl.destaque) + ' sobre ' + escHtml(pl.fundo) + ') · tamanho e entrelinha da <a href="#f-escala">Escala</a> (' +
        es.corpo + 'px, ' + es.alt + ')';

      pintarMedidas(nt, nc, fT, fC, medida, alinha);
      pintarEscada(nt, nc, pt, pc, es);

      /* peso: a regra da trilha, duas ou três por família */
      var total = externas.reduce(function (a, f) { return a + f.w.length; }, 0);
      var avisos = [];
      if (pc[0] < 400) avisos.push('corpo abaixo de 400 some em tela pequena');
      if (pt.length > 3 || pc.length > 3) avisos.push('acima de três pesos por família o olho já não distingue, e o LCP sente');
      pesoDica = !total
        ? 'nenhuma fonte externa: zero requisição, zero KB, e nada de IP registrado por terceiro.'
        : total + (total === 1 ? ' peso' : ' pesos') + ' no total, algo em torno de ' + (total * 20) + ' KB' +
          (avisos.length ? ' — ' + avisos.join('; ') + '.' : ' — dentro do razoável: dois ou três pesos por família.');
      pesoOk = !avisos.length;
      var linhaPeso = $('#fo-m-peso');
      if (linhaPeso) { linhaPeso.textContent = pesoDica; linhaPeso.classList.toggle('is-ok', pesoOk); }
    }
    var pesoDica = '', pesoOk = true;

    function pintarMedidas(nt, nc, fT, fC, medida, alinha) {
      var caixaM = $('#fo-medidas'), p = $('#fo-p-texto');
      var linhas = [];

      /* caracteres por linha: largura real do parágrafo ÷ largura média de um caractere nessa fonte */
      var cpl = null;
      try {
        var cs = getComputedStyle(p), c = document.createElement('canvas').getContext('2d');
        c.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        var t = p.textContent.replace(/\s+/g, ' ').trim();
        var media = c.measureText(t).width / t.length;
        if (media > 0) cpl = Math.round(p.getBoundingClientRect().width / media);
      } catch (e) {}
      if (cpl) {
        var ok = cpl >= 45 && cpl <= 75;
        linhas.push([ok, '≈ ' + cpl + ' caracteres por linha nesta amostra — ' +
          (ok ? 'dentro de 45 a 75.' : cpl > 75 ? 'acima de 75: o olho se perde na volta para a linha seguinte.' : 'abaixo de 45: a leitura fica picada.') +
          (medida > cpl + 4 ? ' A amostra é mais estreita que ' + medida + 'ch; na página larga a linha cresce.' : '')]);
      }
      if (alinha === 'justify') linhas.push([false, 'justificado só com hyphens: auto e o lang certo no <html> — sem isso abrem rios brancos no parágrafo.']);
      if (alinha === 'center') linhas.push([false, 'centralizado cansa depois de três linhas: cada linha começa num lugar diferente.']);

      /* altura-x: as duas perto uma da outra fazem título e corpo conversarem */
      var a = xh[nt], b = xh[nc];
      if (a === undefined || b === undefined) linhas.push([true, 'medindo a altura-x…']);
      else if (a && b) {
        var dif = Math.round(Math.abs(a - b) / Math.max(a, b) * 100);
        linhas.push([dif <= 12, 'altura-x: título ' + a.toFixed(2) + ' · corpo ' + b.toFixed(2) + ' do tamanho da fonte — ' +
          (nt === nc ? 'mesma família.' : dif <= 12 ? 'próximas (' + dif + '%): as duas conversam.' : 'distantes (' + dif + '%): lado a lado, uma vai parecer menor que a outra.') +
          (fC.local ? ' A do sistema muda de aparelho para aparelho.' : '')]);
      } else linhas.push([true, 'altura-x: não deu para medir sem a fonte carregada.']);

      caixaM.innerHTML = linhas.map(function (l) {
        return '<p class="ferr__dica' + (l[0] ? ' is-ok' : '') + '">' + escHtml(l[1]) + '</p>';
      }).join('') + '<p class="ferr__dica" id="fo-m-peso"></p>';
      var linhaPeso = $('#fo-m-peso');
      linhaPeso.textContent = pesoDica;
      linhaPeso.classList.toggle('is-ok', pesoOk);
    }

    function pintarEscada(nt, nc, pt, pc, es) {
      var DEGRAUS = [
        ['h1', es.h1[1], true], ['h2', es.h2[1], true], ['h3', es.h3, true],
        ['grande', es.g, false], ['corpo', es.corpo, false], ['pequeno', es.peq, false]
      ];
      $('#fo-escada').innerHTML =
        '<p class="ferr__dica">A escala da <a href="#f-escala">Escala</a> (base ' + es.corpo + 'px, razão ' + (+es.razao || 1.25).toFixed(3) + ') nas duas fontes:</p>' +
        DEGRAUS.map(function (d) {
          var titulo = d[2];
          return '<div class="ferr__degrau"><span class="ferr__degrau-n">' + d[0] + ' · ' + d[1] + 'px</span>' +
            '<span class="ferr__degrau-t" style="font-family:' + escHtml(pilha(titulo ? nt : nc)) + ';font-weight:' +
            (titulo ? pt[pt.length - 1] : pc[0]) + ';font-size:' + Math.min(d[1], 64) + 'px;line-height:' + (titulo ? 1.1 : es.alt) + '">' +
            (titulo ? 'Coquetelaria autoral' : 'Texto para ler de perto, sem esforço') + '</span></div>';
        }).join('');
    }

    function aplicar(nt, pt, nc, pc) {
      selT.value = nt; selC.value = nc;
      pintarPesos(pesosT, 't', acha(nt), pt);
      pintarPesos(pesosC, 'c', acha(nc), pc);
      montar();
    }
    function trocouFamilia(sel, cx, lado, padrao) {
      var f = acha(sel.value);
      var quer = marcados(cx).filter(function (p) { return f.w.indexOf(p) !== -1; });
      pintarPesos(cx, lado, f, quer.length ? quer : [perto(f, padrao)]);
      Array.prototype.forEach.call(combos.querySelectorAll('.ferr__combo'), function (x) { x.classList.remove('is-atual'); });
      montar();
    }

    combos.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-i]');
      if (!b) return;
      var c = COMBOS[+b.dataset.i];
      aplicar(c.t, c.tp, c.c, c.cp);
      Array.prototype.forEach.call(combos.querySelectorAll('.ferr__combo'), function (x) { x.classList.remove('is-atual'); });
      b.classList.add('is-atual');
    });
    selT.addEventListener('change', function () { trocouFamilia(selT, pesosT, 't', 700); });
    selC.addEventListener('change', function () { trocouFamilia(selC, pesosC, 'c', 400); });
    caixa.addEventListener('change', function (e) { if (e.target.type === 'checkbox') montar(); });
    medidaEl.addEventListener('input', montar);
    alinhaEl.addEventListener('change', montar);
    $('#fo-copiar-link').addEventListener('click', function () { copiar(saidaLink.textContent, this); });
    $('#fo-copiar-css').addEventListener('click', function () { copiar(saidaCss.textContent, this); });
    /* Paleta e Escala mudaram: a amostra acompanha */
    document.addEventListener('gt:mudou', montar);

    var m = parseInt(ler('fo-medida', 66), 10);
    if (m >= 40 && m <= 90) medidaEl.value = m;
    var al = ler('fo-alinha', 'left');
    if (['left', 'justify', 'center'].indexOf(al) !== -1) alinhaEl.value = al;
    var acSalvo = ler('fo-acab', null);
    if (acSalvo) ACAB.forEach(function (k) { if (k in acSalvo) $('#fo-' + k).checked = !!acSalvo[k]; });

    var st = ler('fo-titulo', null), sc = ler('fo-corpo', null);
    if (st && sc && acha(st).n === st && acha(sc).n === sc) aplicar(st, ler('fo-pt', [700]), sc, ler('fo-pc', [400]));
    else aplicar(COMBOS[1].t, COMBOS[1].tp, COMBOS[1].c, COMBOS[1].cp);
  })();

  /* ========== 13 · DESIGN SYSTEM ==========
     Não decide cor, fonte nem escala de novo: lê o que Paleta, Tipografia e Escala
     guardaram, soma o que falta (raio, sombra, movimento, modo escuro) e escreve
     em três camadas — primitivo, semântico, componente. */
  (function () {
    var caixa = $('#fer-sistema'); if (!caixa) return;
    var campoCss = $('#ds-css'), invEl = $('#ds-inventario'), veredito = $('#ds-veredito');
    var amostra = $('#ds-amostra'), vereditos = $('#ds-vereditos'), fontes = $('#ds-fontes');
    var IDS = ['raio', 'botao', 'sombra', 'dur'];
    var CURVA = [0.22, 1, 0.36, 1];   /* a curva da trilha de Movimento */
    var SOMBRAS = {                    /* camadas: x, y, desfoque, espalhamento, opacidade */
      nenhuma: null,
      sutil:   [[[0, 1, 2, 0, 0.06], [0, 2, 8, 0, 0.06]], [[0, 4, 12, 0, 0.08], [0, 12, 28, 0, 0.08]]],
      marcada: [[[0, 2, 4, 0, 0.08], [0, 8, 20, 0, 0.1]], [[0, 8, 16, 0, 0.1], [0, 20, 44, 0, 0.14]]]
    };
    var EXEMPLO = [
      '/* um site de verdade depois de dois anos de remendo */',
      'body { font-family: "Montserrat", sans-serif; color: #333; background: #fff; }',
      'h1 { font-size: 42px; color: #222; font-weight: 800; margin-bottom: 18px; }',
      'h2 { font-size: 2.1rem; color: #333333; font-weight: 700; margin: 30px 0 14px; }',
      'h3 { font-size: 22px; font-weight: 600; }',
      'p { font-size: 15px; color: #444; line-height: 1.5; margin-bottom: 13px; }',
      '.legenda { font-size: 13px; color: #777; }',
      '.aviso { font-size: 14px; color: #888888; padding: 10px 15px; border-radius: 3px; }',
      '.botao { background: #7a1c30; color: #fff; padding: 14px 22px; border-radius: 6px; font-weight: bold; }',
      '.botao:hover { background: #8b1f36; }',
      '.botao-grande { background: #7B1D31; padding: 18px 30px; border-radius: 8px; font-size: 17px; }',
      '.botao-secundario { border: 1px solid #7a1c30; color: #7a1c30; padding: 12px 20px; border-radius: 5px; }',
      '.card { background: #fafafa; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,.1); margin-bottom: 20px; }',
      '.card-destaque { background: #f9f9f9; padding: 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }',
      '.depoimento { font-family: "Playfair Display", serif; font-style: italic; font-size: 19px; color: #555; padding: 20px 26px; }',
      '.rodape { background: #1a1a1a; color: #ccc; padding: 40px 20px; font-size: 14px; }',
      '.rodape a { color: #c8a2ab; }',
      '.selo { background: #e8d5d9; color: #7a1c30; font-size: 12px; padding: 4px 9px; border-radius: 20px; font-weight: 600; }',
      '.formulario input { border: 1px solid #ddd; padding: 11px 14px; border-radius: 4px; font-size: 16px; }',
      '.formulario input:focus { border-color: #7a1c30; box-shadow: 0 0 0 3px rgba(122, 28, 48, .2); }',
      '.erro { color: #d33; font-size: 13px; margin-top: 6px; }',
      '.faixa { background: #7a1c30; color: white; padding: 60px 20px; gap: 22px; }'
    ].join('\n');

    /* ---------- 1 · inventário ---------- */
    function chips(obj, ordem, classe) {
      return Object.keys(obj).sort(ordem).map(function (k) {
        var fora = classe && classe(k);
        return '<span class="ds-chip' + (fora ? ' is-fora' : '') + '"' + (fora ? ' title="fora da grade de 4"' : '') + '>' +
               escHtml(k) + ' <b>×' + obj[k] + '</b></span>';
      }).join('');
    }
    function pintarInventario() {
      var css = campoCss.value;
      guardar('ds-css', css.length > 100000 ? '' : css);
      if (!css.trim()) {
        veredito.textContent = 'Cole um CSS acima para contar o que ele usa — ou use o exemplo.';
        veredito.className = 'ferr__dica';
        invEl.innerHTML = '';
        return;
      }
      var inv = inventariar(css), grupos = agruparCores(inv.cores);
      var nCores = Object.keys(inv.cores).length, nTam = Object.keys(inv.tamanhos).length,
          nEsp = Object.keys(inv.espacos).length, nRaio = Object.keys(inv.raios).length,
          nSomb = Object.keys(inv.sombras).length, nFam = Object.keys(inv.familias).length;
      var fora = Object.keys(inv.espacos).filter(function (k) { return +k % 4 !== 0; }).length;
      var porNum = function (a, b) { return parseFloat(a) - parseFloat(b); };

      var html = '';
      html += '<div class="ds-grupo"><p class="ds-grupo__t">Cores <span>' + nCores + ' distintas · ' + grupos.length + ' depois de juntar as quase iguais</span></p><div class="ds-chips">' +
        grupos.map(function (g) {
          var um = function (k) {
            return '<span class="ds-chip ds-chip--cor"><i style="background:' + k.slice(0, 7) + (k.length > 7 ? ';opacity:' + (parseInt(k.slice(8), 10) / 100) : '') + '"></i>' +
                   escHtml(k) + ' <b>×' + inv.cores[k] + '</b></span>';
          };
          return g.membros.length > 1
            ? '<span class="ds-quase" title="quase iguais: ΔE abaixo de 5">' + g.membros.map(um).join('') + '</span>'
            : um(g.membros[0]);
        }).join('') + '</div></div>';
      if (nTam) html += '<div class="ds-grupo"><p class="ds-grupo__t">Tamanhos de fonte <span>' + nTam + '</span></p><div class="ds-chips">' +
        chips(inv.tamanhos, function (a, b) { return parseFloat(b) - parseFloat(a); }) + '</div></div>';
      if (nEsp) html += '<div class="ds-grupo"><p class="ds-grupo__t">Espaçamentos <span>' + nEsp + (fora ? ' · ' + fora + ' fora da grade de 4' : '') + '</span></p><div class="ds-chips">' +
        chips(inv.espacos, porNum, function (k) { return +k % 4 !== 0; }) + '</div></div>';
      if (nRaio) html += '<div class="ds-grupo"><p class="ds-grupo__t">Raios <span>' + nRaio + '</span></p><div class="ds-chips">' + chips(inv.raios, porNum) + '</div></div>';
      if (nSomb) html += '<div class="ds-grupo"><p class="ds-grupo__t">Sombras <span>' + nSomb + '</span></p><div class="ds-chips">' + chips(inv.sombras) + '</div></div>';
      if (nFam) html += '<div class="ds-grupo"><p class="ds-grupo__t">Famílias <span>' + nFam + '</span></p><div class="ds-chips">' + chips(inv.familias) + '</div></div>';
      if (Object.keys(inv.pesos).length) html += '<div class="ds-grupo"><p class="ds-grupo__t">Pesos <span>' + Object.keys(inv.pesos).length + '</span></p><div class="ds-chips">' + chips(inv.pesos, porNum) + '</div></div>';
      invEl.innerHTML = html;

      var soltos = nCores + nTam + nEsp + nRaio + nSomb;
      if (!soltos) { veredito.textContent = 'Nenhum valor de cor, tamanho, espaço, raio ou sombra encontrado nesse texto.'; veredito.className = 'ferr__dica'; return; }
      var marca = corDeMarca(inv);
      veredito.textContent = soltos + ' valores soltos: ' + nCores + ' cores (' + grupos.length + ' de fato diferentes), ' +
        nTam + ' tamanhos de fonte, ' + nEsp + ' espaçamentos' + (fora ? ' (' + fora + ' fora da grade)' : '') + ', ' + nRaio + ' raios e ' + nSomb + ' sombras. ' +
        'O sistema abaixo resolve com 7 papéis de cor, 6 tamanhos, 10 espaços, 1 raio e 2 sombras.' +
        (marca ? ' A cor de marca que ele mais usa, ' + marca.hex + ', aparece como sugestão na Paleta.' : '');
      veredito.className = 'ferr__dica' + (soltos > 30 ? '' : ' is-ok');
    }
    var espera = null;
    campoCss.addEventListener('input', function () { clearTimeout(espera); espera = setTimeout(pintarInventario, 200); });
    $('#ds-exemplo').addEventListener('click', function () { campoCss.value = EXEMPLO; pintarInventario(); });
    $('#ds-limpar').addEventListener('click', function () { campoCss.value = ''; pintarInventario(); });

    /* ---------- 2 e 3 · os tokens ---------- */
    function passos(destaque) {
      /* o destaque em dez tons: clareia com branco, escurece com preto */
      return {
        50: corMistura(destaque, '#FFFFFF', 0.92), 100: corMistura(destaque, '#FFFFFF', 0.84),
        200: corMistura(destaque, '#FFFFFF', 0.68), 300: corMistura(destaque, '#FFFFFF', 0.5),
        400: corMistura(destaque, '#FFFFFF', 0.25), 500: destaque,
        600: corMistura(destaque, '#000000', 0.15), 700: corMistura(destaque, '#000000', 0.3),
        800: corMistura(destaque, '#000000', 0.45), 900: corMistura(destaque, '#000000', 0.6)
      };
    }
    function primeiroQuePassa(prim, grupo, ordem, fundo, alvo) {
      for (var i = 0; i < ordem.length; i++) if (corRazao(prim[grupo + '-' + ordem[i]], fundo) >= alvo) return grupo + '-' + ordem[i];
      return grupo + '-' + ordem[ordem.length - 1];
    }
    function sombraCss(camadas) {
      return camadas.map(function (c) { return c[0] + 'px ' + c[1] + 'px ' + c[2] + 'px ' + (c[3] ? c[3] + 'px ' : '') + 'rgb(0 0 0 / ' + c[4] + ')'; }).join(', ');
    }

    function calcular() {
      var pl = ler('pl-tokens', null) || {};
      var es = ler('es-tokens', null) || {};
      var d = {};
      IDS.forEach(function (i) { d[i] = $('#ds-' + i).value; guardar('ds-' + i, d[i]); });
      d.escuro = $('#ds-escuro').checked;
      guardar('ds-escuro', d.escuro);

      var destaque = corHex(pl.destaque) || '#305546';
      var prim = {};
      var p = passos(destaque);
      Object.keys(p).forEach(function (k) { prim['destaque-' + k] = p[k]; });
      prim['neutro-0'] = corHex(pl.fundo) || '#FFFCF7';
      prim['neutro-50'] = corHex(pl.superficie) || '#FFFFFF';
      prim['neutro-200'] = corHex(pl.linha) || '#E6E2DA';
      prim['neutro-500'] = corHex(pl.textoFraco) || '#6B7280';
      prim['neutro-800'] = corHex(pl.texto) || '#3F444D';
      prim['noite-0'] = '#121416'; prim['noite-50'] = '#1B1E21'; prim['noite-200'] = '#2E3236';
      prim['noite-500'] = '#A1A7AD'; prim['noite-800'] = '#E8E6E1';
      prim['branco'] = '#FFFFFF';
      prim['erro-600'] = '#B42318'; prim['erro-300'] = '#F97066';

      /* semânticos: nome do papel → primitivo */
      var claro = {
        'fundo': 'neutro-0', 'superficie': 'neutro-50', 'linha': 'neutro-200',
        'texto': 'neutro-800', 'texto-fraco': 'neutro-500',
        'destaque': 'destaque-500',
        'destaque-texto': primeiroQuePassa(prim, 'destaque', [500, 600, 700, 800, 900], prim['neutro-0'], 4.5),
        'destaque-hover': corLum(destaque) < 0.03 ? 'destaque-400' : 'destaque-600',
        'sobre-destaque': corRazao('#FFFFFF', destaque) >= corRazao(prim['neutro-800'], destaque) ? 'branco' : 'neutro-800',
        'erro': 'erro-600', 'campo-borda': 'neutro-500'
      };
      claro['foco'] = claro['destaque-texto'];
      var escuro = null;
      if (d.escuro) {
        var passaEscuro = primeiroQuePassa(prim, 'destaque', [400, 300, 200, 100, 50], prim['noite-0'], 4.5);
        var ordem = [400, 300, 200, 100, 50], iP = ordem.indexOf(+passaEscuro.split('-')[1]);
        escuro = {
          'fundo': 'noite-0', 'superficie': 'noite-50', 'linha': 'noite-200',
          'texto': 'noite-800', 'texto-fraco': 'noite-500',
          'destaque': passaEscuro, 'destaque-texto': passaEscuro,
          'destaque-hover': 'destaque-' + ordem[Math.min(iP + 1, ordem.length - 1)],
          'sobre-destaque': corRazao(prim['noite-0'], prim[passaEscuro]) >= corRazao('#FFFFFF', prim[passaEscuro]) ? 'noite-0' : 'branco',
          'erro': 'erro-300', 'campo-borda': 'noite-500'
        };
        escuro['foco'] = escuro['destaque-texto'];
      }

      var e = Array.isArray(es.e) && es.e.length ? es.e : [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];
      var pt = ler('fo-pt', [700]), pc = ler('fo-pc', [400]);
      return {
        d: d, prim: prim, claro: claro, escuro: escuro, e: e,
        tipo: {
          titulo: ler('fo-pilha-t', "'Bricolage Grotesque', sans-serif"), corpo: ler('fo-pilha-c', "'Source Serif 4', serif"),
          nomeT: ler('fo-titulo', 'Bricolage Grotesque'), nomeC: ler('fo-corpo', 'Source Serif 4'),
          pesoT: pt[pt.length - 1] || 700, pesoC: pc[0] || 400, medida: ler('fo-medida', 66)
        },
        t: {
          peq: es.peq || 14, corpo: es.corpo || 17, g: es.g || 21, h3: es.h3 || 27,
          h2: es.h2 || [29, 41], h1: es.h1 || [32, 65], alt: es.alt || 1.6, razao: es.razao || 1.25, base: es.base || 8
        },
        sombra: SOMBRAS[d.sombra] || null,
        raio: +d.raio, dur: +d.dur
      };
    }

    function tokensCss(s) {
      var L = [];
      var col = function (nome, valor, nota) {
        var n = '  ' + nome + ':';
        while (n.length < 26) n += ' ';
        L.push(n + valor + ';' + (nota ? '   /* ' + nota + ' */' : ''));
      };
      L.push('/* tokens.css — gerado na ferramenta Design system (Gustavo Tutorial) */');
      L.push(':root {');
      L.push('  /* ===== 1 · primitivos: os ingredientes. Nunca use direto na página. ===== */');
      Object.keys(s.prim).forEach(function (k) { col('--p-' + k, s.prim[k]); });
      L.push('');
      L.push('  /* ===== 2 · semânticos: o papel de cada cor ===== */');
      Object.keys(s.claro).forEach(function (k) { col('--cor-' + k, 'var(--p-' + s.claro[k] + ')'); });
      L.push('');
      L.push('  /* texto — ' + s.tipo.nomeT + ' + ' + s.tipo.nomeC + ', escala ' + (+s.t.razao).toFixed(3) + ' */');
      col('--fonte-titulo', s.tipo.titulo);
      col('--fonte-corpo', s.tipo.corpo);
      col('--peso-titulo', s.tipo.pesoT);
      col('--peso-corpo', s.tipo.pesoC);
      col('--t-peq', s.t.peq + 'px', 'nada abaixo de 14');
      col('--t-corpo', s.t.corpo + 'px');
      col('--t-g', s.t.g + 'px');
      col('--t-h3', s.t.h3 + 'px');
      col('--t-h2', 'clamp(' + s.t.h2[0] + 'px, 3.5vw, ' + s.t.h2[1] + 'px)');
      col('--t-h1', 'clamp(' + s.t.h1[0] + 'px, 6vw, ' + s.t.h1[1] + 'px)');
      col('--alt-corpo', s.t.alt);
      col('--alt-titulo', 1.1);
      col('--medida', s.tipo.medida + 'ch');
      L.push('');
      L.push('  /* espaço — escala de ' + s.t.base + ' */');
      s.e.forEach(function (v, i) { col('--e' + (i + 1), v + 'px'); });
      L.push('');
      L.push('  /* forma e movimento */');
      col('--raio', s.raio + 'px');
      col('--raio-botao', s.d.botao === 'pilula' ? '999px' : 'var(--raio)');
      col('--sombra-1', s.sombra ? sombraCss(s.sombra[0]) : 'none');
      col('--sombra-2', s.sombra ? sombraCss(s.sombra[1]) : 'none');
      col('--dur-rapida', Math.round(s.dur * 0.6) + 'ms');
      col('--dur', s.dur + 'ms', 'resposta ao gesto: até 250ms');
      col('--curva', 'cubic-bezier(' + CURVA.join(', ') + ')');
      L.push('');
      L.push('  /* ===== 3 · componentes: só o que é exceção ao semântico ===== */');
      col('--botao-fundo', 'var(--cor-destaque)');
      col('--botao-fundo-hover', 'var(--cor-destaque-hover)');
      col('--botao-texto', 'var(--cor-sobre-destaque)');
      col('--botao-raio', 'var(--raio-botao)');
      col('--campo-borda', 'var(--cor-campo-borda)', '3:1 contra o fundo — por isso não é a --cor-linha');
      col('--campo-borda-erro', 'var(--cor-erro)');
      col('--campo-raio', 'var(--raio)');
      col('--card-fundo', 'var(--cor-superficie)');
      col('--card-sombra', 'var(--sombra-1)');
      L.push('}');
      if (s.escuro) {
        var bloco = Object.keys(s.escuro).map(function (k) {
          var n = '  --cor-' + k + ':';
          while (n.length < 26) n += ' ';
          return n + 'var(--p-' + s.escuro[k] + ');';
        });
        L.push('');
        L.push('/* modo escuro: só a camada semântica muda */');
        L.push('[data-tema="escuro"] {');
        L = L.concat(bloco);
        L.push('}');
        L.push('@media (prefers-color-scheme: dark) {');
        L.push('  :root:not([data-tema="claro"]) {');
        L = L.concat(bloco.map(function (l) { return '  ' + l; }));
        L.push('  }');
        L.push('}');
      }
      return L.join('\n');
    }

    var COMPONENTES = [
      '/* componentes.css — só tokens, nenhum valor solto */',
      'body {',
      '  margin: 0;',
      '  background: var(--cor-fundo); color: var(--cor-texto);',
      '  font-family: var(--fonte-corpo); font-weight: var(--peso-corpo);',
      '  font-size: var(--t-corpo); line-height: var(--alt-corpo);',
      '}',
      'h1, h2, h3 {',
      '  font-family: var(--fonte-titulo); font-weight: var(--peso-titulo);',
      '  line-height: var(--alt-titulo); text-wrap: balance;',
      '}',
      'h1 { font-size: var(--t-h1); }',
      'h2 { font-size: var(--t-h2); }',
      'h3 { font-size: var(--t-h3); }',
      'p  { max-width: var(--medida); }',
      'a  { color: var(--cor-destaque-texto); text-underline-offset: .15em; }',
      '',
      '/* botão: normal, hover, foco, pressionado, desabilitado */',
      '.botao {',
      '  display: inline-flex; align-items: center; justify-content: center; gap: var(--e2);',
      '  min-height: 48px;   /* alvo de toque confortável */',
      '  padding: var(--e3) var(--e5);',
      '  border: 0; border-radius: var(--botao-raio);',
      '  background: var(--botao-fundo); color: var(--botao-texto);',
      '  font: inherit; font-weight: 600; cursor: pointer;',
      '  transition: background var(--dur) var(--curva), transform var(--dur-rapida) var(--curva);',
      '}',
      '.botao:hover         { background: var(--botao-fundo-hover); }',
      '.botao:focus-visible { outline: 2px solid var(--cor-foco); outline-offset: 3px; }',
      '.botao:active        { transform: translateY(1px); }',
      '.botao:disabled      { opacity: .45; cursor: not-allowed; }',
      '.botao--secundario   { background: transparent; color: var(--cor-destaque-texto); box-shadow: inset 0 0 0 1.5px currentColor; }',
      '.botao--secundario:hover { background: var(--cor-superficie); }',
      '',
      '/* campo: normal, foco, erro */',
      '.campo { display: grid; gap: var(--e1); }',
      '.campo label { font-size: var(--t-peq); font-weight: 600; }',
      '.campo input {',
      '  min-height: 48px; padding: 0 var(--e3);',
      '  border: 1px solid var(--campo-borda); border-radius: var(--campo-raio);',
      '  background: var(--cor-superficie); color: var(--cor-texto); font: inherit;',
      '}',
      '.campo input:focus-visible { outline: 2px solid var(--cor-foco); outline-offset: 1px; }',
      '.campo--erro input { border-color: var(--campo-borda-erro); }',
      '.campo--erro small { color: var(--cor-erro); font-size: var(--t-peq); }',
      '',
      '.card {',
      '  padding: var(--e5); border: 1px solid var(--cor-linha); border-radius: var(--raio);',
      '  background: var(--card-fundo); box-shadow: var(--card-sombra);',
      '}',
      '.tag {',
      '  display: inline-block; padding: 2px var(--e2); border-radius: 999px;',
      '  font-size: var(--t-peq); color: var(--cor-destaque-texto);',
      '  box-shadow: inset 0 0 0 1px var(--cor-linha);',
      '}',
      '',
      '@media (prefers-reduced-motion: reduce) {',
      '  .botao { transition: none; }',
      '}'
    ].join('\n');

    function tokensJson(s) {
      var cor = function (v) { return { $type: 'color', $value: v }; };
      var dim = function (v) { return { $type: 'dimension', $value: v + 'px' }; };
      var familia = function (p) { return p.split(',').map(function (x) { return x.trim().replace(/^["']|["']$/g, ''); }); };
      var sombra = function (camadas) {
        return { $type: 'shadow', $value: camadas.map(function (c) {
          return { color: '#000000' + Math.round(c[4] * 255).toString(16).padStart(2, '0').toUpperCase(),
                   offsetX: c[0] + 'px', offsetY: c[1] + 'px', blur: c[2] + 'px', spread: c[3] + 'px' };
        }) };
      };
      var prim = {};
      Object.keys(s.prim).forEach(function (k) {
        var partes = k.split('-'), grupo = partes[0], passo = partes[1];
        if (!passo) prim[grupo] = cor(s.prim[k]);
        else { prim[grupo] = prim[grupo] || {}; prim[grupo][passo] = cor(s.prim[k]); }
      });
      var ref = function (k) { var p = k.split('-'); return { $type: 'color', $value: '{primitivo.' + p[0] + (p[1] ? '.' + p[1] : '') + '}' }; };
      var sem = function (mapa) { var o = {}; Object.keys(mapa).forEach(function (k) { o[k] = ref(mapa[k]); }); return { cor: o }; };
      var espaco = {};
      s.e.forEach(function (v, i) { espaco[String(i + 1)] = dim(v); });
      var json = {
        primitivo: prim,
        'semantico-claro': sem(s.claro)
      };
      if (s.escuro) json['semantico-escuro'] = sem(s.escuro);
      json.tipografia = {
        fonte: { titulo: { $type: 'fontFamily', $value: familia(s.tipo.titulo) }, corpo: { $type: 'fontFamily', $value: familia(s.tipo.corpo) } },
        peso: { titulo: { $type: 'fontWeight', $value: s.tipo.pesoT }, corpo: { $type: 'fontWeight', $value: s.tipo.pesoC } },
        tamanho: {
          pequeno: dim(s.t.peq), corpo: dim(s.t.corpo), grande: dim(s.t.g), h3: dim(s.t.h3),
          h2: { $type: 'dimension', $value: s.t.h2[1] + 'px', $description: 'no CSS: clamp(' + s.t.h2[0] + 'px, 3.5vw, ' + s.t.h2[1] + 'px)' },
          h1: { $type: 'dimension', $value: s.t.h1[1] + 'px', $description: 'no CSS: clamp(' + s.t.h1[0] + 'px, 6vw, ' + s.t.h1[1] + 'px)' }
        },
        entrelinha: { corpo: { $type: 'number', $value: +s.t.alt }, titulo: { $type: 'number', $value: 1.1 } }
      };
      json.espaco = espaco;
      json.raio = { base: dim(s.raio), botao: s.d.botao === 'pilula' ? dim(999) : { $type: 'dimension', $value: '{raio.base}' } };
      if (s.sombra) json.sombra = { '1': sombra(s.sombra[0]), '2': sombra(s.sombra[1]) };
      json.movimento = {
        rapida: { $type: 'duration', $value: Math.round(s.dur * 0.6) + 'ms' },
        padrao: { $type: 'duration', $value: s.dur + 'ms' },
        curva: { $type: 'cubicBezier', $value: CURVA }
      };
      return JSON.stringify(json, null, 2);
    }

    /* ---------- 4 · a amostra viva ---------- */
    var tema = 'claro';
    function aplicarAmostra(s) {
      var mapa = tema === 'escuro' && s.escuro ? s.escuro : s.claro;
      var v = function (k) { return s.prim[mapa[k]]; };
      var props = {
        '--cor-fundo': v('fundo'), '--cor-superficie': v('superficie'), '--cor-linha': v('linha'),
        '--cor-texto': v('texto'), '--cor-texto-fraco': v('texto-fraco'), '--cor-destaque': v('destaque'),
        '--cor-destaque-texto': v('destaque-texto'), '--cor-destaque-hover': v('destaque-hover'),
        '--cor-sobre-destaque': v('sobre-destaque'), '--cor-erro': v('erro'), '--cor-campo-borda': v('campo-borda'),
        '--cor-foco': v('foco'),
        '--fonte-titulo': s.tipo.titulo, '--fonte-corpo': s.tipo.corpo,
        '--peso-titulo': s.tipo.pesoT, '--peso-corpo': s.tipo.pesoC,
        '--t-peq': s.t.peq + 'px', '--t-corpo': s.t.corpo + 'px', '--t-titulo': Math.min(s.t.h2[1], 40) + 'px',
        '--alt-corpo': s.t.alt,
        '--e1': s.e[0] + 'px', '--e2': s.e[1] + 'px', '--e3': s.e[2] + 'px', '--e4': s.e[3] + 'px', '--e5': s.e[4] + 'px',
        '--raio': s.raio + 'px', '--raio-botao': s.d.botao === 'pilula' ? '999px' : s.raio + 'px',
        '--sombra-1': s.sombra ? sombraCss(s.sombra[0]) : 'none',
        '--dur': s.dur + 'ms', '--curva': 'cubic-bezier(' + CURVA.join(',') + ')'
      };
      Object.keys(props).forEach(function (k) { amostra.style.setProperty(k, props[k]); });

      var P = [
        ['Texto', v('texto'), v('fundo'), 4.5], ['Texto fraco', v('texto-fraco'), v('fundo'), 4.5],
        ['Link', v('destaque-texto'), v('fundo'), 4.5], ['Botão', v('sobre-destaque'), v('destaque'), 4.5],
        ['Erro', v('erro'), v('superficie'), 4.5], ['Borda do campo', v('campo-borda'), v('superficie'), 3]
      ];
      vereditos.innerHTML = P.map(function (p) {
        var r = corRazao(p[1], p[2]), ok = r >= p[3];
        return '<span class="ferr__veredito ' + (ok ? 'passa' : 'falha') + '">' + (ok ? '✓ ' : '✗ ') + p[0] + ' ' + r.toFixed(2) + ':1</span>';
      }).join('');
    }
    Array.prototype.forEach.call(caixa.querySelectorAll('.ds-tema [data-tema]'), function (b) {
      b.addEventListener('click', function () {
        tema = b.getAttribute('data-tema');
        montar();
      });
    });

    function pintarFontes(s) {
      var pl = ler('pl-tokens', null) || {};
      fontes.innerHTML = [
        ['#f-paleta', 'Paleta', 'destaque ' + escHtml(s.prim['destaque-500']) + ' sobre ' + escHtml(s.prim['neutro-0']) + ' — vira os primitivos e o modo claro' +
          (pl.destaqueTexto && pl.destaqueTexto !== pl.destaque ? '; o link usa um tom mais escuro para passar em 4.5:1' : '')],
        ['#f-fonte', 'Tipografia', escHtml(s.tipo.nomeT) + ' ' + s.tipo.pesoT + ' + ' + escHtml(s.tipo.nomeC) + ' ' + s.tipo.pesoC + ', medida ' + s.tipo.medida + 'ch'],
        ['#f-escala', 'Escala', 'corpo ' + s.t.corpo + 'px, razão ' + (+s.t.razao).toFixed(3) + ', espaço de ' + s.t.base + ' em ' + s.e.length + ' degraus'],
        ['movimento.html', 'Movimento', 'a curva cubic-bezier(' + CURVA.join(', ') + ') e o teto de 250ms para resposta ao gesto']
      ].map(function (f) {
        return '<li><a href="' + f[0] + '">' + f[1] + '</a><span>' + f[2] + '</span></li>';
      }).join('');
    }

    function montar() {
      var s = calcular();
      if (!s.escuro && tema === 'escuro') tema = 'claro';
      Array.prototype.forEach.call(caixa.querySelectorAll('.ds-tema [data-tema]'), function (b) {
        var t = b.getAttribute('data-tema');
        b.setAttribute('aria-pressed', t === tema ? 'true' : 'false');
        b.disabled = t === 'escuro' && !s.escuro;
      });
      pintarFontes(s);
      aplicarAmostra(s);
      $('#ds-saida-tokens').textContent = tokensCss(s);
      $('#ds-saida-comp').textContent = COMPONENTES;
      $('#ds-saida-json').textContent = tokensJson(s);
    }

    IDS.forEach(function (i) {
      var el = $('#ds-' + i), salvo = ler('ds-' + i, null);
      if (salvo !== null && Array.prototype.some.call(el.options, function (o) { return o.value === String(salvo); })) el.value = salvo;
      el.addEventListener('change', montar);
    });
    var escSalvo = ler('ds-escuro', null);
    if (escSalvo !== null) $('#ds-escuro').checked = !!escSalvo;
    $('#ds-escuro').addEventListener('change', montar);
    $('#ds-copiar-tokens').addEventListener('click', function () { copiar($('#ds-saida-tokens').textContent, this); });
    $('#ds-copiar-comp').addEventListener('click', function () { copiar($('#ds-saida-comp').textContent, this); });
    $('#ds-copiar-json').addEventListener('click', function () { copiar($('#ds-saida-json').textContent, this); });
    /* Paleta, Tipografia ou Escala mudaram: os tokens acompanham */
    document.addEventListener('gt:mudou', montar);

    campoCss.value = ler('ds-css', '');
    pintarInventario();
    montar();
  })();

  /* ========== PROJETO · um nome para as treze ==========
     Briefing, proposta, checklist e inventário guardam por cliente, cada um
     com o próprio campo de nome. Aqui os cinco campos viram um só: mudar
     qualquer um muda todos, e cada ferramenta abre o que tinha daquele cliente. */
  (function () {
    var campo = $('#pj-nome'); if (!campo) return;
    var DONOS = ['br', 'pp', 'cl', 'iv'];
    var campos = [campo].concat(DONOS.map(function (d) { return $('#' + d + '-cliente'); }))
                        .filter(Boolean);
    var lista = $('#pj-lista');

    function conhecidos() { var l = ler('projetos', []); return Array.isArray(l) ? l : []; }
    function lembrar(nome) {
      nome = nome.trim(); if (!nome) return;
      var l = conhecidos().filter(function (n) { return n.toLowerCase() !== nome.toLowerCase(); });
      l.unshift(nome);
      guardar('projetos', l.slice(0, 20));
      pintarLista();
    }
    function pintarLista() {
      if (!lista) return;
      lista.innerHTML = '';
      conhecidos().forEach(function (n) {
        var o = document.createElement('option'); o.value = n; lista.appendChild(o);
      });
    }

    var espalhando = false;
    function espalhar(origem) {
      if (espalhando) return;
      espalhando = true;
      var nome = origem.value;
      campos.forEach(function (c) {
        if (c === origem || c.value === nome) return;
        c.value = nome;
        c.dispatchEvent(new Event('input', { bubbles: true }));
      });
      espalhando = false;
      guardar('projeto', nome);
    }

    /* primeira vez: o nome que alguma das quatro já tinha vira o do projeto */
    var inicial = ler('projeto', null);
    if (inicial === null) {
      inicial = '';
      DONOS.forEach(function (d) { if (!inicial) inicial = String(ler(d + '-cliente', '') || ''); });
      DONOS.forEach(function (d) { var n = String(ler(d + '-cliente', '') || '').trim(); if (n) lembrar(n); });
    }
    campo.value = inicial;
    espalhar(campo);
    pintarLista();

    campos.forEach(function (c) {
      c.addEventListener('input', function () { espalhar(c); });
      c.addEventListener('change', function () { lembrar(c.value); });
    });
  })();

  /* ========== PROJETO · onde cada ferramenta está ========== */
  (function () {
    var fluxo = document.querySelector('.fluxo'); if (!fluxo) return;
    function n(k) { return parseFloat(ler(k, 0)) || 0; }
    function preenchidos(obj, total) {
      var c = 0;
      for (var i = 0; i < total.length; i++) if (String(obj[total[i]] || '').trim()) c++;
      return c;
    }
    function lum(h) {
      var x = parseInt(h.slice(1), 16);
      return [(x >> 16) & 255, (x >> 8) & 255, x & 255].map(function (c) {
        c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      }).reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
    }

    /* cada função devolve [texto, completo?] */
    var ESTADO = {
      'f-briefing': function () {
        var c = preenchidos(ler('br-' + chaveProjeto(), {}), [0,1,2,3,4,5,6,7,8,9]);
        return [c + ' de 10', c === 10];
      },
      'f-preco': function () { var f = faixaPreco(); return [f ? 'piso ' + brl(f.piso) : '—', !!f]; },
      'f-proposta': function () {
        var c = preenchidos(ler('pp-' + chaveProjeto(), {}),
          ['entendi', 'proponho', 'incluido', 'naoincluido', 'prazo', 'investimento', 'depois']);
        return [c + ' de 7', c === 7];
      },
      'f-paleta': function () { var d = corHex(ler('pl-destaque', '')); return [d || '—', !!d]; },
      'f-contraste': function () {
        var a = corHex(ler('ct-texto', '')), b = corHex(ler('ct-fundo', ''));
        if (!a || !b) return ['—', false];
        var x = lum(a), y = lum(b), r = (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
        return [r.toFixed(2) + ':1', r >= 4.5];
      },
      'f-fonte': function () {
        var t = ler('fo-titulo', ''), c = ler('fo-corpo', '');
        return [t ? (t === c ? t : t + ' + ' + c) : '—', !!t];
      },
      'f-escala': function () {
        var b = ler('es-base', ''), r = ler('es-razao', '');
        return [b ? b + 'px · ' + r : '—', !!b];
      },
      'f-sistema': function () {
        var css = String(ler('ds-css', '') || '');
        if (css.trim()) return ['inventário: ' + Object.keys(inventariar(css).cores).length + ' cores', true];
        return [ler('ds-escuro', true) ? 'claro + escuro' : 'só claro', true];
      },
      'f-head': function () {
        var c = preenchidos({ a: ler('hd-nome', ''), b: ler('hd-desc', ''), c: ler('hd-url', ''), d: ler('hd-img', '') },
                            ['a', 'b', 'c', 'd']);
        return [c + ' de 4', c === 4];
      },
      'f-zap': function () {
        var d = foneNacional(ler('zp-num', ''));
        return d.length >= 10 ? [foneBonito(d), true] : ['sem número', false];
      },
      'f-utm': function () {
        var h = ler('ut-historico', []), q = Array.isArray(h) ? h.length : 0;
        return [q ? q + (q === 1 ? ' gerado' : ' gerados') : 'nenhum', q > 0];
      },
      'f-checklist': function () {
        var m = ler('cl-' + chaveProjeto(), []), c = Array.isArray(m) ? m.length : 0;
        return [c + ' de 14', c === 14];
      },
      'f-inventario': function () {
        var l = ler('iv-' + chaveProjeto(), null);
        if (!Array.isArray(l) || !l.length) return ['nenhum titular', false];
        var c = l.filter(function (x) { return String(x.titular || '').trim(); }).length;
        return [c + ' de ' + l.length + ' com titular', c === l.length];
      }
    };

    function pintar() {
      Array.prototype.forEach.call(fluxo.querySelectorAll('[data-estado]'), function (el) {
        var f = ESTADO[el.getAttribute('data-estado')];
        if (!f) return;
        var r;
        try { r = f(); } catch (e) { r = ['—', false]; }
        el.textContent = r[0];
        el.classList.toggle('is-completo', !!r[1]);
      });
    }
    document.addEventListener('gt:mudou', pintar);
    pintar();
  })();

  /* tudo montado: um aviso inicial para as ligações lerem o estado completo */
  avisar();
})();
