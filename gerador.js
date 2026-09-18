/* Gerador de comando — Gustavo Tutorial
   Monta o texto do pedido a partir dos campos e aponta o que está fraco.
   Roda inteiramente no navegador: nada é enviado a lugar nenhum. */
(function () {
  'use strict';

  var form = document.getElementById('ger-form');
  if (!form) return;

  var saida = document.getElementById('ger-saida');
  var diag = document.getElementById('ger-diag');
  var tiposBox = document.getElementById('ger-tipos');
  var btnCopiar = document.getElementById('ger-copiar');
  var btnLimpar = document.getElementById('ger-limpar');

  var ADJETIVOS = ['moderno', 'moderna', 'elegante', 'clean', 'sofisticado', 'sofisticada',
    'inovador', 'inovadora', 'criativo', 'criativa', 'profissional', 'diferenciado',
    'exclusivo', 'premium', 'arrojado', 'dinamico', 'dinâmico', 'bonito', 'bonita',
    'qualidade', 'excelencia', 'excelência', 'dedicacao', 'dedicação', 'compromisso',
    'top', 'incrivel', 'incrível', 'unico', 'único'];

  function temAdjetivoVazio(txt) {
    if (!txt) return false;
    var t = txt.toLowerCase();
    var achou = ADJETIVOS.some(function (a) { return t.indexOf(a) !== -1; });
    return achou && txt.trim().split(/\s+/).length < 12;
  }

  /* ---------- definição dos tipos ---------- */
  var TIPOS = {
    lp: {
      campos: [
        { id: 'cliente', rot: 'Cliente', ph: 'Vanessa Carvalho' },
        { id: 'oficio', rot: 'Ofício', ph: 'arquiteta' },
        { id: 'cidade', rot: 'Cidade', ph: 'Campo Grande' },
        { id: 'acao', rot: 'Ação única', forte: true, ph: 'pedir orçamento pelo WhatsApp',
          dica: 'Uma só. Se houver duas, escolha a principal.' },
        { id: 'excluir', rot: 'O que excluir', ph: 'sem formulário, sem telefone' },
        { id: 'publico', rot: 'Público', tipo: 'area', forte: true,
          ph: 'adultos querendo reformar um ambiente; querem confiança antes de chamar alguém',
          dica: 'Quem é e o estado mental — o que teme, o que quer resolver.' },
        { id: 'origem', rot: 'Origem do tráfego', ph: 'Instagram e indicação' },
        { id: 'diferencial', rot: 'Diferencial', tipo: 'area', forte: true,
          ph: 'acompanha a obra semanalmente e entrega cronograma fechado',
          dica: 'Concreto e verificável. Adjetivo aqui não informa nada.' },
        { id: 'mundo', rot: 'Mundo concreto', tipo: 'area', forte: true,
          ph: 'planta baixa, escala, cronograma por semana, amostra de material, medida em centímetro',
          dica: 'Os objetos e termos do ofício. É daqui que sai identidade em vez de template.' },
        { id: 'paleta', rot: 'Paleta', tipo: 'area',
          ph: '#305546 primária — botões, títulos\n#FFFCF7 fundo — não usar branco puro',
          dica: 'Uma cor por linha, com o papel dela.' },
        { id: 'tipografia', rot: 'Tipografia', ph: 'Bricolage Grotesque no título, Source Serif no corpo' },
        { id: 'refs', rot: 'Referências', tipo: 'area',
          ph: 'cardápio impresso do anexo — quero a gramática visual\nsite X — só o ritmo de rolagem',
          dica: 'Uma por linha, sempre com o motivo. Máximo três ou quatro.' },
        { id: 'proibido', rot: 'O que não quero', tipo: 'area', forte: true,
          ph: 'sem gradiente, sem foto de banco de imagem, sem ícone genérico',
          dica: 'Corta o espaço de possibilidades mais rápido que qualquer instrução positiva.' },
        { id: 'medo', rot: 'Meu medo', ph: 'ficar com cara de template de arquiteta',
          dica: 'O erro específico que você teme. Muda o comportamento mais que "faça bonito".' },
        { id: 'entrega', rot: 'Entrega', tipo: 'select',
          opcoes: ['HTML único autocontido, CSS e JS inline, sem build',
                   'arquivos separados (HTML, CSS e JS)',
                   'componentes para um projeto existente'] },
        { id: 'inicio', rot: 'Começar por', tipo: 'select',
          opcoes: ['o sistema visual completo no :root mais a hero',
                   'a página inteira em rascunho estrutural, para eu julgar a arquitetura',
                   'só o sistema visual, sem nenhuma seção'] }
      ],
      montar: function (v) {
        var p = '';
        p += 'Crie uma landing page' +
             (v.cliente ? ' para ' + v.cliente : '') +
             (v.oficio ? ', ' + v.oficio : '') +
             (v.cidade ? ' em ' + v.cidade : '') + '.\n\n';
        if (v.acao) p += 'AÇÃO ÚNICA: ' + v.acao + '.' + (v.excluir ? ' ' + cap(v.excluir) + '.' : '') + '\n\n';
        if (v.publico) p += 'PÚBLICO: ' + v.publico + (v.origem ? ' Chega por ' + v.origem + '.' : '') + '\n\n';
        if (v.diferencial) p += 'DIFERENCIAL: ' + v.diferencial + '\n\n';
        if (v.mundo) p += 'MUNDO CONCRETO: os objetos e termos do ofício são ' + v.mundo +
                          '. Pode usar isso como gramática visual.\n\n';
        if (v.paleta || v.tipografia || v.entrega) {
          p += 'DECIDIDO:\n';
          if (v.paleta) p += linhas(v.paleta, '- paleta: ', '           ');
          if (v.tipografia) p += '- tipografia: ' + v.tipografia + '\n';
          if (v.entrega) p += '- entrega: ' + v.entrega + '\n';
          p += '\n';
        }
        if (v.refs) p += 'REFERÊNCIAS:\n' + linhas(v.refs, '- ', '  ') + '\n';
        if (v.proibido) p += 'NÃO QUERO: ' + juntar(v.proibido) + '.\n\n';
        if (v.medo) p += 'MEU MEDO: ' + v.medo + '.\n\n';
        p += 'Não invente nenhum dado. Todo número, depoimento, nome ou credencial\n' +
             'que eu não tiver fornecido deve aparecer como [PREENCHER] no código\n' +
             'e ser listado no final como pendência.\n\n';
        p += 'Comece por ' + (v.inicio || 'o sistema visual completo no :root mais a hero') + '.\n' +
             'Antes de escrever qualquer código, me diga o plano em cinco linhas.';
        return p;
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.acao) a.push({ t: '<strong>Sem ação única.</strong> É o campo que decide a página inteira — sem ele, tudo o resto fica solto.' });
        if (!v.mundo) a.push({ t: '<strong>Falta o mundo concreto.</strong> Sem os objetos do ofício, sai uma boa página da categoria, não a página deste cliente.' });
        if (!v.proibido) a.push({ t: '<strong>Falta o que não quer.</strong> Instrução negativa corta o genérico mais rápido que qualquer outra coisa.' });
        if (temAdjetivoVazio(v.diferencial)) a.push({ t: 'O <strong>diferencial</strong> está em adjetivo. Troque por algo verificável: o que exatamente ela faz que os outros não fazem?' });
        if (!v.medo) a.push({ leve: true, t: 'Sem "meu medo". Nomear o erro que você teme muda o resultado mais que um pedido positivo.' });
        if (v.refs && v.refs.split('\n').filter(nv).length > 4) a.push({ leve: true, t: 'Mais de quatro referências tendem a se contradizer e produzir a média delas.' });
        if (v.refs && v.refs.split('\n').filter(nv).some(function (l) { return l.indexOf('—') === -1 && l.indexOf('-') === -1; }))
          a.push({ leve: true, t: 'Alguma referência está sem o motivo. Referência sem motivo vira ordem de cópia.' });
        return a;
      },
      pesos: ['acao', 'publico', 'diferencial', 'mundo', 'paleta', 'tipografia', 'refs', 'proibido', 'medo', 'entrega']
    },

    secao: {
      campos: [
        { id: 'nome', rot: 'Nome da seção', forte: true, ph: 'cronograma' },
        { id: 'depois', rot: 'Vem depois de', forte: true, ph: 'a hero' },
        { id: 'objecao', rot: 'Objeção que ela resolve', tipo: 'area', forte: true,
          ph: 'como eu sei que a obra não vai atrasar?',
          dica: 'Seção que não responde a nada não deveria existir.' },
        { id: 'conteudo', rot: 'Conteúdo', tipo: 'area',
          ph: 'linha do tempo com as semanas, o que acontece em cada uma' },
        { id: 'obs', rot: 'Observações', tipo: 'area', ph: 'fundo claro, para alternar com a seção anterior' }
      ],
      montar: function (v) {
        var p = 'Adicione a seção ' + (v.nome || '[NOME]') +
                (v.depois ? ' logo depois de ' + v.depois : '') + '.\n\n';
        if (v.objecao) p += 'Ela existe para responder: "' + v.objecao + '"\n\n';
        if (v.conteudo) p += 'Conteúdo: ' + v.conteudo + '\n\n';
        if (v.obs) p += v.obs + '\n\n';
        p += 'Use os tokens que já estão no :root — não crie cor, medida nem\n' +
             'tamanho de fonte novo. Mantenha a alternância de fundo em relação\n' +
             'à seção anterior.\n\n' +
             'Não toque em nenhuma outra parte do arquivo.';
        return p;
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.objecao) a.push({ t: '<strong>Sem objeção.</strong> Se você não souber que pergunta essa seção responde, provavelmente ela não precisa existir.' });
        if (!v.depois) a.push({ leve: true, t: 'Sem posição definida, a seção pode entrar em qualquer lugar do arquivo.' });
        return a;
      },
      pesos: ['nome', 'depois', 'objecao', 'conteudo']
    },

    feedback: {
      campos: [
        { id: 'manter', rot: 'O que manter', tipo: 'area', forte: true,
          ph: 'a estrutura e a paleta estão certas',
          dica: 'Seja específico. "O resto" não protege nada.' },
        { id: 'mudar', rot: 'O que mudar', tipo: 'area', forte: true,
          ph: 'o título está grande demais em relação ao subtítulo',
          dica: 'Uma coisa só. Três críticas = três comandos separados.' },
        { id: 'porque', rot: 'Por quê', tipo: 'area', forte: true,
          ph: 'a hierarquia ficou desequilibrada e o subtítulo some' },
        { id: 'intocavel', rot: 'Não pode mudar', ph: 'a hero, já está aprovada' }
      ],
      montar: function (v) {
        var p = '';
        if (v.manter) p += 'MANTENHA: ' + v.manter + '\n\n';
        if (v.mudar) p += 'MUDE: ' + v.mudar + '\n';
        if (v.porque) p += 'POR QUÊ: ' + v.porque + '\n';
        p += '\n';
        if (v.intocavel) p += 'Não toque em ' + v.intocavel + '.\n';
        p += 'Não mexa em mais nada.';
        return p;
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.manter) a.push({ t: '<strong>Sem "manter".</strong> É isso que impede o resultado de oscilar e desfazer o que já estava certo.' });
        if (!v.porque) a.push({ t: 'Sem o <strong>porquê</strong>, a correção vira palpite — e o próximo resultado pode errar de outro jeito.' });
        if (v.mudar && v.mudar.split(/[.;\n]/).filter(nv).length > 2)
          a.push({ leve: true, t: 'Parece mais de uma mudança. Mande uma por vez, ou não dá para saber qual causou o quê.' });
        return a;
      },
      pesos: ['manter', 'mudar', 'porque']
    },

    revisao: {
      campos: [
        { id: 'largura', rot: 'Largura de teste', tipo: 'select', opcoes: ['390px', '360px', '414px'] },
        { id: 'extra', rot: 'Checagens extras', tipo: 'area',
          ph: 'conferir se os links de WhatsApp abrem com a mensagem certa' }
      ],
      montar: function (v) {
        var p = 'Não escreva nada novo. Só revise e me diga o que encontrar.\n\n';
        p += 'TÉCNICO\n';
        p += '- estoura na horizontal em ' + (v.largura || '390px') + '?\n';
        p += '- todo texto atinge contraste 4.5:1?\n';
        p += '- toda imagem tem alt descritivo?\n';
        p += '- title, description e og:image preenchidos?\n';
        p += '- prefers-reduced-motion respeitado?\n';
        p += '- funciona com JavaScript desligado?\n\n';
        p += 'CONTEÚDO\n';
        p += '- tem algum dado, número ou depoimento que eu não forneci?\n';
        p += '- todos os [PREENCHER] estão listados?\n';
        p += '- tem chave, token ou senha no arquivo?\n\n';
        p += 'CONSISTÊNCIA\n';
        p += '- algum valor de espaçamento fora da escala?\n';
        p += '- alguma cor fora da paleta?\n';
        if (v.extra) p += '\nTAMBÉM\n' + linhas(v.extra, '- ', '  ');
        p += '\nListe os problemas numerados. Não corrija.';
        return p;
      },
      diagnosticar: function () { return []; },
      pesos: []
    },

    recomecar: {
      campos: [
        { id: 'projeto', rot: 'Projeto', forte: true, ph: 'LP da Vanessa Carvalho, arquiteta, Campo Grande' },
        { id: 'travado', rot: 'Travado', tipo: 'area', forte: true,
          ph: 'paleta, fontes, CTA único no WhatsApp, entrega em arquivo único' },
        { id: 'pronto', rot: 'Pronto e aprovado', tipo: 'area', ph: 'hero e serviços' },
        { id: 'falta', rot: 'Falta', tipo: 'area', ph: 'cronograma, prova, conversão, rodapé' },
        { id: 'agora', rot: 'Agora', forte: true, ph: 'a seção de cronograma, usando os tokens existentes' }
      ],
      montar: function (v) {
        var p = '';
        if (v.projeto) p += 'PROJETO: ' + v.projeto + '\n';
        if (v.travado) p += 'TRAVADO: ' + v.travado.replace(/\n/g, '\n         ') + '\n';
        if (v.pronto) p += 'PRONTO:  ' + v.pronto.replace(/\n/g, '\n         ') + ' — não mexer\n';
        if (v.falta) p += 'FALTA:   ' + v.falta.replace(/\n/g, '\n         ') + '\n';
        if (v.agora) p += 'AGORA:   ' + v.agora + '\n';
        return p.trim();
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.travado) a.push({ t: '<strong>Sem o que está travado</strong>, as decisões já tomadas vão ser tomadas de novo — e diferente.' });
        if (!v.agora) a.push({ leve: true, t: 'Sem um próximo passo único, o recomeço vira conversa aberta em vez de trabalho.' });
        return a;
      },
      pesos: ['projeto', 'travado', 'pronto', 'falta', 'agora']
    }
  };

  /* ---------- utilidades ---------- */
  function nv(s) { return s.trim() !== ''; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function juntar(s) {
    return s.split('\n').filter(nv).map(function (l) { return l.trim().replace(/[.;,]$/, ''); }).join(', ');
  }
  function linhas(txt, pre, ident) {
    return txt.split('\n').filter(nv).map(function (l, i) {
      return (i === 0 ? pre : ident.slice(0, pre.length)) + l.trim();
    }).join('\n') + '\n';
  }

  var tipoAtual = 'lp';
  var valores = {};

  function chave() { return 'gt-gerador-' + tipoAtual; }

  function carregar() {
    valores = {};
    try { valores = JSON.parse(localStorage.getItem(chave()) || '{}'); } catch (e) {}
  }
  function salvar() {
    try { localStorage.setItem(chave(), JSON.stringify(valores)); } catch (e) {}
  }

  /* ---------- render ---------- */
  function renderForm() {
    form.innerHTML = '';
    TIPOS[tipoAtual].campos.forEach(function (c) {
      var wrap = document.createElement('div');
      wrap.className = 'ger__campo' + (c.forte ? ' ger__campo--forte' : '');

      var id = 'ger-' + tipoAtual + '-' + c.id;
      var lab = document.createElement('label');
      lab.setAttribute('for', id);
      lab.textContent = c.rot;
      if (c.dica) {
        var d = document.createElement('span');
        d.className = 'dica';
        d.textContent = c.dica;
        lab.appendChild(d);
      }
      wrap.appendChild(lab);

      var el;
      if (c.tipo === 'area') {
        el = document.createElement('textarea');
        el.rows = 3;
      } else if (c.tipo === 'select') {
        el = document.createElement('select');
        var vazio = document.createElement('option');
        vazio.value = ''; vazio.textContent = '—';
        el.appendChild(vazio);
        c.opcoes.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o; op.textContent = o;
          el.appendChild(op);
        });
      } else {
        el = document.createElement('input');
        el.type = 'text';
      }
      el.id = id;
      if (c.ph && c.tipo !== 'select') el.placeholder = c.ph;
      el.value = valores[c.id] || '';
      el.addEventListener('input', function () {
        valores[c.id] = el.value;
        salvar();
        atualizar();
      });
      wrap.appendChild(el);
      form.appendChild(wrap);
    });
  }

  function atualizar() {
    var t = TIPOS[tipoAtual];
    saida.textContent = t.montar(valores);

    diag.innerHTML = '';

    if (t.pesos.length) {
      var preenchidos = t.pesos.filter(function (k) { return valores[k] && valores[k].trim(); }).length;
      var pct = Math.round(preenchidos / t.pesos.length * 100);
      var box = document.createElement('div');
      box.className = 'ger__forca';
      box.innerHTML = '<span>' + preenchidos + ' de ' + t.pesos.length + ' decisões fechadas</span>' +
                      '<span class="ger__barra"><span style="width:' + pct + '%"></span></span>';
      diag.appendChild(box);
    }

    t.diagnosticar(valores).forEach(function (a) {
      var el = document.createElement('div');
      el.className = 'ger__aviso' + (a.leve ? ' ger__aviso--leve' : '');
      el.innerHTML = a.t;
      diag.appendChild(el);
    });
  }

  /* ---------- eventos ---------- */
  tiposBox.querySelectorAll('.ger__tipo').forEach(function (b) {
    b.addEventListener('click', function () {
      tipoAtual = b.dataset.tipo;
      tiposBox.querySelectorAll('.ger__tipo').forEach(function (o) {
        o.setAttribute('aria-pressed', String(o === b));
      });
      carregar();
      renderForm();
      atualizar();
    });
  });

  btnCopiar.addEventListener('click', function () {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(saida.textContent).then(function () {
      btnCopiar.textContent = 'copiado';
      setTimeout(function () { btnCopiar.textContent = 'copiar'; }, 1400);
    }).catch(function () {});
  });

  btnLimpar.addEventListener('click', function () {
    valores = {};
    salvar();
    renderForm();
    atualizar();
  });

  carregar();
  renderForm();
  atualizar();
})();
