/* ============================================================
   ferramentas.js — tudo roda no navegador; nada sai daqui.
   Cada ferramenta é independente: se uma falhar, as outras seguem.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  function guardar(chave, valor) {
    try { localStorage.setItem('gt-' + chave, JSON.stringify(valor)); } catch (e) {}
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

    function pintar() {
      var marcados = ler(chave(), []);
      lista.innerHTML = ITENS.map(function (t, i) {
        var on = marcados.indexOf(i) !== -1;
        return '<li><label class="ferr__item' + (on ? ' is-feito' : '') + '">' +
               '<input type="checkbox" data-i="' + i + '"' + (on ? ' checked' : '') + '><span>' + t + '</span></label></li>';
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

    function brl(v) {
      return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    }
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
    function brl(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }); }

    function contar() {
      var r = ler(chave(), {});
      var n = CAMPOS.filter(function (c) { return (r[c.id] || '').trim(); }).length;
      contador.textContent = n + ' de ' + CAMPOS.length;
      contador.classList.toggle('is-completo', n === CAMPOS.length);
    }
    function pintarDica() {
      var despesas = parseFloat(ler('pr-despesas', 0)) || 0, retirada = parseFloat(ler('pr-retirada', 0)) || 0,
          dias = parseFloat(ler('pr-dias', 0)) || 0, horas = parseFloat(ler('pr-horas', 0)) || 0,
          projeto = parseFloat(ler('pr-projeto', 0)) || 0, margem = parseFloat(ler('pr-margem', 0)) || 0;
      var horasMes = dias * horas;
      if (!horasMes || !projeto || !margem) { dica.textContent = ''; return; }
      var piso = ((despesas + retirada) / horasMes) * projeto * margem;
      dica.textContent = 'sugestão da calculadora de Preço: ' + brl(piso) + ' a ' + brl(piso * 1.6) + ' pelo projeto';
    }
    function pintar() {
      var r = ler(chave(), {});
      campos.innerHTML = CAMPOS.map(function (c) {
        return '<div class="ferr__linha"><label for="pp-' + c.id + '">' + c.rotulo + ' <small>' + c.dica + '</small></label>' +
               '<textarea id="pp-' + c.id + '" data-id="' + c.id + '" class="ferr__campo" rows="2">' +
               esc(r[c.id] || '') + '</textarea></div>';
      }).join('');
      contar();
      pintarDica();
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
})();
