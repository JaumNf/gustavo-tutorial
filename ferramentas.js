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
      botao.style.color = razao('#FFFFFF', destaque) >= razao(texto, destaque) ? '#FFFFFF' : texto;
    }

    var salvo = ler('pl-destaque', null);
    if (salvo) { campo.value = salvo; if (hex(salvo)) picker.value = hex(salvo); }
    var fundoSalvo = ler('pl-fundo', null);
    if (fundoSalvo) fundoSel.value = fundoSalvo;

    picker.addEventListener('input', function () { campo.value = picker.value.toUpperCase(); montar(); });
    campo.addEventListener('input', function () { var h = hex(campo.value); if (h) picker.value = h; montar(); });
    fundoSel.addEventListener('change', montar);
    $('#pl-copiar').addEventListener('click', function () { copiar(saida.textContent, this); });
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
      css.push('p     { max-width: 68ch; }              /* medida: 60 a 75 caracteres */');
      css.push('h1    { font-size: var(--t-h1); line-height: 1.05; letter-spacing: -0.02em; }');
      css.push('h2    { font-size: var(--t-h2); line-height: 1.15; }');
      css.push('.secao { padding-block: clamp(var(--e7), 8vw, var(--e9)); }');
      saida.textContent = css.join('\n');
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

    /* famílias do Google Fonts, todas variáveis de 400 a 800 no latim */
    var FAMILIAS = [
      { n: 'Sistema',             p: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', local: true },
      { n: 'Sistema serifada',    p: 'Georgia, "Times New Roman", serif', local: true },
      { n: 'Inter',               p: 'sans-serif' },
      { n: 'Manrope',             p: 'sans-serif' },
      { n: 'Outfit',              p: 'sans-serif' },
      { n: 'Plus Jakarta Sans',   p: 'sans-serif' },
      { n: 'Space Grotesk',       p: 'sans-serif' },
      { n: 'Archivo',             p: 'sans-serif' },
      { n: 'Bricolage Grotesque', p: 'sans-serif' },
      { n: 'Figtree',             p: 'sans-serif' },
      { n: 'Sora',                p: 'sans-serif' },
      { n: 'Lora',                p: 'serif' },
      { n: 'Source Serif 4',      p: 'serif' },
      { n: 'Playfair Display',    p: 'serif' },
      { n: 'Libre Baskerville',   p: 'serif' },
      { n: 'Fraunces',            p: 'serif' },
      { n: 'Newsreader',          p: 'serif' },
      { n: 'JetBrains Mono',      p: 'monospace' },
      { n: 'IBM Plex Mono',       p: 'monospace' }
    ];

    var COMBOS = [
      { t: 'Sistema', tp: [400,700], c: 'Sistema', cp: [400],
        r: 'Zero download. Carrega instantâneo e fica nativa em cada aparelho.' },
      { t: 'Bricolage Grotesque', tp: [800], c: 'Source Serif 4', cp: [400,600],
        r: 'Grotesca com caráter no título, serifada no corpo — para material de leitura longa.' },
      { t: 'Playfair Display', tp: [700], c: 'Lora', cp: [400,600],
        r: 'Serifada alta no título. Casamento, buffet, joalheria, advocacia.' },
      { t: 'Space Grotesk', tp: [500,700], c: 'Inter', cp: [400,600],
        r: 'Título com personalidade técnica e corpo neutro. Estúdio, agência, tecnologia.' },
      { t: 'Outfit', tp: [600,800], c: 'Inter', cp: [400],
        r: 'Geométrica e limpa nos dois. Serviço moderno sem querer chamar atenção.' },
      { t: 'Fraunces', tp: [700], c: 'Figtree', cp: [400,600],
        r: 'Serifada com humor no título, sem-serifa amigável no corpo. Gastronomia, artesanal.' },
      { t: 'Archivo', tp: [700], c: 'Source Serif 4', cp: [400],
        r: 'Título firme e corpo sério. Consultoria, saúde, educação.' }
    ];

    var selT = $('#fo-titulo'), selC = $('#fo-corpo');
    var pesosT = $('#fo-titulo-pesos'), pesosC = $('#fo-corpo-pesos');
    var combos = $('#fo-combos'), dica = $('#fo-dica');
    var saidaLink = $('#fo-saida-link'), saidaCss = $('#fo-saida-css');
    var PESOS = [400, 500, 600, 700, 800];
    var injetado = {};

    function acha(nome) {
      for (var i = 0; i < FAMILIAS.length; i++) if (FAMILIAS[i].n === nome) return FAMILIAS[i];
      return FAMILIAS[0];
    }
    function pilha(nome) {
      var f = acha(nome);
      return f.local ? f.p : "'" + f.n + "', " + f.p;
    }
    function marcados(cx) {
      return Array.prototype.slice.call(cx.querySelectorAll('input:checked')).map(function (i) { return +i.value; }).sort();
    }

    FAMILIAS.forEach(function (f) {
      [selT, selC].forEach(function (s) {
        var o = document.createElement('option');
        o.value = f.n; o.textContent = f.n + (f.local ? ' — sem download' : '');
        s.appendChild(o);
      });
    });
    [[pesosT, 't'], [pesosC, 'c']].forEach(function (par) {
      par[0].innerHTML = PESOS.map(function (p) {
        return '<label class="ferr__peso"><input type="checkbox" value="' + p + '" data-lado="' + par[1] + '"><span>' + p + '</span></label>';
      }).join('');
    });

    combos.innerHTML = COMBOS.map(function (c, i) {
      return '<button class="ferr__combo" type="button" data-i="' + i + '">' +
             '<strong>' + c.t + (c.t === c.c ? '' : ' + ' + c.c) + '</strong>' +
             '<span>' + c.r + '</span></button>';
    }).join('');

    function injetar(nome) {
      var f = acha(nome);
      if (f.local || injetado[nome]) return;
      injetado[nome] = true;
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + nome.replace(/ /g, '+') +
               ':wght@400;500;600;700;800&display=swap';
      document.head.appendChild(l);
    }

    function montar() {
      var nt = selT.value, nc = selC.value;
      var pt = marcados(pesosT), pc = marcados(pesosC);
      if (!pt.length) pt = [700];
      if (!pc.length) pc = [400];

      guardar('fo-titulo', nt); guardar('fo-corpo', nc);
      guardar('fo-pt', pt); guardar('fo-pc', pc);

      var fT = acha(nt), fC = acha(nc);
      injetar(nt); injetar(nc);

      /* link do Google Fonts — só as famílias que não são do sistema */
      var externas = [];
      if (!fT.local) externas.push({ n: nt, w: pt });
      if (!fC.local && nc !== nt) externas.push({ n: nc, w: pc });
      else if (!fC.local && nc === nt) externas[0].w = pt.concat(pc).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();

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

      var css = [
        ':root {',
        '  --fonte-titulo: ' + pilha(nt) + ';',
        '  --fonte-corpo:  ' + pilha(nc) + ';',
        '}',
        '',
        'body { font-family: var(--fonte-corpo); }',
        'h1, h2, h3 {',
        '  font-family: var(--fonte-titulo);',
        '  font-weight: ' + pt[pt.length - 1] + ';',
        '  text-wrap: balance;   /* tira a palavra órfã na última linha */',
        '}'
      ];
      saidaCss.textContent = css.join('\n');

      /* aviso de peso, pela regra da trilha: duas ou três por família */
      var total = externas.reduce(function (a, f) { return a + f.w.length; }, 0);
      if (!total) {
        dica.textContent = 'nenhuma fonte externa: zero requisição, zero KB, e nada de IP registrado por terceiro.';
        dica.classList.add('is-ok');
      } else {
        var kb = total * 20;
        var demais = pt.length > 3 || pc.length > 3;
        dica.textContent = total + (total === 1 ? ' peso' : ' pesos') + ' no total, algo em torno de ' + kb + ' KB' +
          (demais ? ' — acima de três pesos por família o olho já não distingue, e o LCP sente.'
                  : ' — dentro do razoável: dois ou três pesos por família.');
        dica.classList.toggle('is-ok', !demais);
      }

      /* amostra */
      $('#fo-p-titulo').style.cssText = 'font-family:' + pilha(nt) + ';font-weight:' + pt[pt.length - 1];
      $('#fo-p-olho').style.cssText = 'font-family:' + pilha(nc) + ';font-weight:' + pc[0];
      $('#fo-p-texto').style.cssText = 'font-family:' + pilha(nc) + ';font-weight:' + pc[0];
      $('#fo-p-botao').style.fontFamily = pilha(nt);
      $('#fo-p-botao').style.fontWeight = pt[pt.length - 1];
    }

    function aplicar(nt, pt, nc, pc) {
      selT.value = nt; selC.value = nc;
      Array.prototype.forEach.call(pesosT.querySelectorAll('input'), function (i) { i.checked = pt.indexOf(+i.value) !== -1; });
      Array.prototype.forEach.call(pesosC.querySelectorAll('input'), function (i) { i.checked = pc.indexOf(+i.value) !== -1; });
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
    selT.addEventListener('change', montar);
    selC.addEventListener('change', montar);
    caixa.addEventListener('change', function (e) { if (e.target.type === 'checkbox') montar(); });
    $('#fo-copiar-link').addEventListener('click', function () { copiar(saidaLink.textContent, this); });
    $('#fo-copiar-css').addEventListener('click', function () { copiar(saidaCss.textContent, this); });

    var st = ler('fo-titulo', null), sc = ler('fo-corpo', null);
    if (st && sc) aplicar(st, ler('fo-pt', [700]), sc, ler('fo-pc', [400]));
    else aplicar(COMBOS[1].t, COMBOS[1].tp, COMBOS[1].c, COMBOS[1].cp);
  })();
})();
