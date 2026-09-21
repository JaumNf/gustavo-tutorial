/* Gerador de comando — Gustavo Tutorial
   Monta o texto do pedido a partir dos campos e aponta o que está fraco.
   Cada tipo sai de um tópico da trilha "Trabalhando com IA" (ou de Movimento),
   e o link "de onde vem" leva até ele.
   Roda inteiramente no navegador: nada é enviado a lugar nenhum. */
(function () {
  'use strict';

  var form = document.getElementById('ger-form');
  if (!form) return;

  var saida = document.getElementById('ger-saida');
  var diag = document.getElementById('ger-diag');
  var tiposBox = document.getElementById('ger-tipos');
  var sobre = document.getElementById('ger-sobre');
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

  var ENTREGAS = ['HTML único autocontido, CSS e JS inline, sem build',
                  'arquivos separados (HTML, CSS e JS)',
                  'componentes para um projeto existente'];

  /* ---------- definição dos tipos ---------- */
  var TIPOS = {
    lp: {
      sobre: 'O brief inteiro de uma landing page, na ordem que decide o resultado: ação, público, diferencial e o mundo concreto do ofício.',
      ref: ['ia.html#t-ia-modelo-brief', 'Modelo de brief'],
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
        { id: 'fotos', rot: 'Fotos reais', ph: 'verticais, de celular, sem sobra nas bordas',
          dica: 'Como são as fotos que existem. Projetar para foto profissional e receber foto de celular é retrabalho.' },
        { id: 'refs', rot: 'Referências', tipo: 'area',
          ph: 'cardápio impresso do anexo — quero a gramática visual\nsite X — só o ritmo de rolagem',
          dica: 'Uma por linha, sempre com o motivo. Máximo três ou quatro.' },
        { id: 'proibido', rot: 'O que não quero', tipo: 'area', forte: true,
          ph: 'sem gradiente, sem foto de banco de imagem, sem ícone genérico',
          dica: 'Corta o espaço de possibilidades mais rápido que qualquer instrução positiva.' },
        { id: 'medo', rot: 'Meu medo', ph: 'ficar com cara de template de arquiteta',
          dica: 'O erro específico que você teme. Muda o comportamento mais que "faça bonito".' },
        { id: 'entrega', rot: 'Entrega', tipo: 'select', opcoes: ENTREGAS },
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
        if (v.paleta || v.tipografia || v.entrega || v.fotos) {
          p += 'DECIDIDO:\n';
          if (v.paleta) p += linhas(v.paleta, '- paleta: ', '           ');
          if (v.tipografia) p += '- tipografia: ' + v.tipografia + '\n';
          if (v.fotos) p += '- fotos: ' + v.fotos + ' — projete para elas, não para foto de banco\n';
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

    direcoes: {
      sobre: 'Antes de construir, peça opções. Três frases custam segundos e evitam construir a direção errada inteira.',
      ref: ['ia.html#t-ia-opcoes', 'Peça opções, não uma resposta'],
      campos: [
        { id: 'parte', rot: 'Para qual parte', forte: true, ph: 'a hero da landing page da Vanessa' },
        { id: 'quantas', rot: 'Quantas direções', tipo: 'select', opcoes: ['três', 'duas', 'quatro'] },
        { id: 'fixo', rot: 'O que já está decidido', tipo: 'area',
          ph: 'paleta vinho e areia, CTA no WhatsApp, foto real da obra',
          dica: 'As direções variam dentro disso, não fora.' },
        { id: 'eixo', rot: 'Onde quer variedade', tipo: 'area', forte: true,
          ph: 'o layout da hero e o tom do título',
          dica: 'Direções que mudam tudo ao mesmo tempo não dá para comparar.' },
        { id: 'criterio', rot: 'Como você vai escolher', ph: 'a que mostra o cronograma sem precisar rolar' }
      ],
      montar: function (v) {
        var n = v.quantas || 'três';
        var p = 'Me dê ' + n + ' direções possíveis para ' + (v.parte || '[PARTE]') + ', uma frase cada.\n' +
                'Não escreva código ainda.\n\n';
        if (v.fixo) p += 'JÁ DECIDIDO (vale para todas): ' + juntar(v.fixo) + '.\n';
        if (v.eixo) p += 'VARIE SÓ: ' + juntar(v.eixo) + '.\n';
        if (v.fixo || v.eixo) p += '\n';
        p += 'Para cada direção, diga em uma linha o que ela prioriza e qual é o risco dela.\n';
        if (v.criterio) p += 'Vou escolher por este critério: ' + v.criterio + '. Diga qual você escolheria por ele, e por quê.\n';
        p += '\nDepois que eu escolher, antes de qualquer código, me diga o plano em cinco linhas:\n' +
             'o que muda, o que fica, e o que você vai assumir onde eu não decidi.';
        return p;
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.parte) a.push({ t: '<strong>Sem a parte.</strong> Direções para "o site" saem genéricas; para "a hero", saem comparáveis.' });
        if (!v.eixo) a.push({ t: '<strong>Sem onde variar</strong>, as direções mudam tudo ao mesmo tempo — e aí não dá para saber o que você preferiu em cada uma.' });
        if (!v.criterio) a.push({ leve: true, t: 'Sem critério de escolha, você escolhe pelo gosto do dia. Um critério objetivo deixa a escolha defensável para o cliente.' });
        return a;
      },
      pesos: ['parte', 'fixo', 'eixo', 'criterio']
    },

    contexto: {
      sobre: 'Vira o CLAUDE.md na raiz do projeto: é lido sozinho em toda sessão e mantém as decisões de uma conversa para a outra.',
      ref: ['ia.html#t-ia-arquivo-estado', 'O resumo vira arquivo'],
      campos: [
        { id: 'nome', rot: 'Nome do projeto', forte: true, ph: 'LP Vanessa Carvalho Arquitetura' },
        { id: 'oque', rot: 'O que é, e para quem', tipo: 'area', forte: true,
          ph: 'landing page de uma arquiteta em Campo Grande, para quem quer reformar um ambiente' },
        { id: 'entrega', rot: 'Entrega', tipo: 'select', opcoes: ENTREGAS },
        { id: 'sistema', rot: 'Cores', tipo: 'area', forte: true,
          ph: '#305546 destaque — botão, link\n#FFFCF7 fundo\n#3F444D texto',
          dica: 'Uma por linha, com o papel. Nenhuma cor fora desta lista.' },
        { id: 'tipografia', rot: 'Tipografia', ph: 'Bricolage Grotesque no título, Source Serif 4 no corpo' },
        { id: 'espaco', rot: 'Escala de espaço', ph: '4 / 8 / 16 / 24 / 40 / 64' },
        { id: 'secoes', rot: 'Nomes das seções', ph: 'hero · prova · serviços · processo · conversão · rodapé',
          dica: 'O mesmo nome nos pedidos e no código evita "a segunda seção" virar a seção errada.' },
        { id: 'aprovado', rot: 'Aprovado, não mexer', tipo: 'area', ph: 'hero e serviços' },
        { id: 'regras', rot: 'Regras deste projeto', tipo: 'area', ph: 'sem animação de entrada; fotos só do cliente' }
      ],
      montar: function (v) {
        var p = '# ' + (v.nome || '[Nome do projeto]') + '\n\n';
        if (v.oque) p += v.oque.trim() + '\n\n';
        p += '## Entrega\n' + cap(v.entrega || ENTREGAS[0]) + '.\n' +
             'Único externo permitido: Google Fonts.\n' +
             'A página funciona com JavaScript desligado.\n\n';
        p += '## Sistema\nTokens no :root. Nenhuma cor ou medida fora da escala.\n';
        if (v.sistema) p += 'Cores:\n' + linhas(v.sistema, '- ', '  ');
        if (v.tipografia) p += 'Tipografia: ' + v.tipografia + '.\n';
        if (v.espaco) p += 'Espaçamento: ' + v.espaco + '.\n';
        p += '\n## Regras\n' +
             'Nada inventado — lacuna vira [PREENCHER] e entra na lista de pendências.\n' +
             'Seção que não responde a uma objeção não entra.\n' +
             'Sem depoimento, a seção de depoimentos não vai ao ar.\n';
        if (v.regras) p += linhas(v.regras, '', '');
        if (v.secoes) p += '\n## Nomes das seções\n' + v.secoes.trim() + '\n';
        p += '\n## Aprovado, não mexer\n' + (v.aprovado ? linhas(v.aprovado, '- ', '  ') : '[ainda nada]\n');
        return p.trim();
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.oque) a.push({ t: '<strong>Sem o que é e para quem.</strong> É a primeira coisa que uma sessão nova precisa saber.' });
        if (!v.sistema) a.push({ t: '<strong>Sem as cores.</strong> Sem a lista fechada, cada sessão inventa um tom a mais.' });
        if (!v.aprovado) a.push({ leve: true, t: 'Sem "aprovado, não mexer", a próxima sessão pode refazer o que já estava bom.' });
        return a;
      },
      pesos: ['nome', 'oque', 'entrega', 'sistema', 'tipografia', 'espaco', 'secoes']
    },

    recomecar: {
      sobre: 'Quando a conversa ficou longa e o resultado começou a derivar: o resumo que abre uma conversa nova sem perder o que foi decidido.',
      ref: ['ia.html#t-ia-modelo-contexto', 'Recomeçar conversa'],
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
    },

    secao: {
      sobre: 'Uma seção nova num arquivo que já existe, sem reescrever o resto: posição, objeção e os tokens de sempre.',
      ref: ['ia.html#t-ia-modelo-secao', 'Modelo de seção'],
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

    texto: {
      sobre: 'O texto de uma seção a partir dos fatos reais. Com os fatos na mão, a IA escreve; sem eles, preenche com o texto médio da categoria.',
      ref: ['ia.html#t-ia-conteudo', 'Referências de conteúdo'],
      campos: [
        { id: 'secao', rot: 'Seção', forte: true, ph: 'serviços' },
        { id: 'objecao', rot: 'Pergunta que ela responde', tipo: 'area', forte: true,
          ph: 'quanto tempo leva uma reforma de cozinha?' },
        { id: 'fatos', rot: 'Fatos', tipo: 'area', forte: true,
          ph: 'cronograma semanal enviado por WhatsApp\nvisita técnica antes do orçamento\natende Campo Grande e região',
          dica: 'Um por linha. Só o que é verdade e dá para provar — é daqui que o texto sai.' },
        { id: 'tom', rot: 'Tom', tipo: 'select',
          opcoes: ['direto e caloroso', 'técnico e preciso', 'sóbrio e formal', 'leve, com humor contido'] },
        { id: 'limite', rot: 'Tamanho', ph: 'título com até 8 palavras; parágrafo de até 40',
          dica: 'Um título de quatro palavras e um de dezoito pedem layouts diferentes.' },
        { id: 'proibido', rot: 'Palavras proibidas', tipo: 'area', ph: 'qualidade, compromisso, excelência; nada de ponto de exclamação' }
      ],
      montar: function (v) {
        var p = 'Escreva o texto da seção ' + (v.secao || '[SEÇÃO]') + '.\n\n';
        if (v.objecao) p += 'Ela precisa responder: "' + v.objecao.trim() + '"\n\n';
        if (v.fatos) p += 'FATOS — use só estes:\n' + linhas(v.fatos, '- ', '  ') + '\n';
        if (v.tom) p += 'TOM: ' + v.tom + '.\n';
        if (v.limite) p += 'TAMANHO: ' + v.limite + '.\n';
        if (v.proibido) p += 'NÃO USE: ' + juntar(v.proibido) + '.\n';
        if (v.tom || v.limite || v.proibido) p += '\n';
        p += 'Não invente número, prazo, preço, depoimento, prêmio nem credencial.\n' +
             'O que faltar vira [PREENCHER].\n\n' +
             'Me dê duas versões do título e uma do texto. Só o texto — não mexa no HTML.';
        return p;
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.fatos) a.push({ t: '<strong>Sem fatos.</strong> É daí que sai "qualidade e compromisso": sem matéria-prima, a IA escreve a média da categoria.' });
        else if (v.fatos.split('\n').filter(nv).some(temAdjetivoVazio))
          a.push({ t: 'Algum <strong>fato</strong> está em adjetivo. "Atendimento de qualidade" não é fato; "responde em até duas horas" é.' });
        if (!v.objecao) a.push({ leve: true, t: 'Sem a pergunta, o texto descreve em vez de convencer.' });
        if (!v.limite) a.push({ leve: true, t: 'Sem tamanho, o texto vem do tamanho que a IA acha médio — e o layout foi pensado para outro.' });
        return a;
      },
      pesos: ['secao', 'objecao', 'fatos', 'tom', 'limite', 'proibido']
    },

    animacao: {
      sobre: 'Movimento com critério: propósito, tempo e curva decididos antes, só transform e opacity, e a versão para quem pediu menos movimento.',
      ref: ['movimento.html#t-mv-porque', 'Trilha de Movimento'],
      campos: [
        { id: 'elemento', rot: 'O que anima', forte: true, ph: 'os cards de serviço' },
        { id: 'gatilho', rot: 'Quando', tipo: 'select',
          opcoes: ['ao entrar na tela, uma vez', 'ao passar o mouse', 'ao clicar ou tocar', 'ao carregar a página', 'acompanhando a rolagem'] },
        { id: 'proposito', rot: 'Para quê', tipo: 'select', forte: true,
          opcoes: ['feedback — confirmar que o toque foi ouvido', 'estado — mostrar que algo mudou',
                   'orientação — de onde veio e para onde foi', 'explicação — mostrar como funciona', 'decoração — só estética'],
          dica: 'Se a resposta for "fica bonito" e a pessoa vê isso toda hora, não anime.' },
        { id: 'frequencia', rot: 'Quantas vezes a pessoa vê', tipo: 'select',
          opcoes: ['várias vezes por visita', 'uma vez por visita', 'raramente'] },
        { id: 'movimento', rot: 'Como é o movimento', tipo: 'area',
          ph: 'sobem 12px e aparecem, um depois do outro, com 60ms entre eles',
          dica: 'Descreva o quanto, não só o quê: "quase imperceptível" direciona mais que "suave".' },
        { id: 'duracao', rot: 'Duração', tipo: 'select', opcoes: ['150ms', '200ms', '250ms', '400ms', '600ms'] },
        { id: 'curva', rot: 'Curva', tipo: 'select',
          opcoes: ['saída forte — cubic-bezier(.22, 1, .36, 1)', 'entrada e saída — cubic-bezier(.77, 0, .175, 1)', 'linear — só para progresso contínuo'] },
        { id: 'ref', rot: 'Referência de movimento', ph: 'gravação de tela do site X, os cinco primeiros segundos',
          dica: 'Imagem parada não comunica movimento. Gravação de tela ou GIF, sim.' }
      ],
      montar: function (v) {
        var p = 'Anime ' + (v.elemento || '[ELEMENTO]') + (v.gatilho ? ', ' + v.gatilho : '') + '.\n\n';
        if (v.proposito) p += 'PARA QUÊ: ' + v.proposito + '.\n';
        if (v.frequencia) p += 'A PESSOA VÊ: ' + v.frequencia + '.\n';
        if (v.movimento) p += 'MOVIMENTO: ' + v.movimento.trim() + '\n';
        if (v.duracao || v.curva) p += 'TEMPO: ' + (v.duracao || '200ms') + (v.curva ? ', ' + v.curva : '') + '.\n';
        if (v.ref) p += 'REFERÊNCIA: ' + v.ref + ' (anexo)\n';
        p += '\nREGRAS\n' +
             '- anime só transform e opacity — nada de width, height, top ou margin\n' +
             '- nada surge de scale(0): comece de scale(.95) com opacity 0\n' +
             '- se puder ser interrompida no meio, use transition, não @keyframes\n' +
             '- prefers-reduced-motion: sem deslocamento, no máximo um fade curto\n';
        if (v.gatilho === 'ao passar o mouse') p += '- hover só dentro de @media (hover: hover) and (pointer: fine): no celular o toque dispara hover falso\n';
        if (v.gatilho === 'ao entrar na tela, uma vez') p += '- IntersectionObserver, e parar de observar depois da primeira vez\n';
        p += '- sem biblioteca: CSS e, se precisar, Web Animations API\n\n' +
             'Antes de escrever, me diga em duas linhas o que vai fazer.';
        return p;
      },
      diagnosticar: function (v) {
        var a = [], ms = parseInt(v.duracao, 10) || 0;
        var gesto = v.gatilho === 'ao passar o mouse' || v.gatilho === 'ao clicar ou tocar';
        if (!v.proposito) a.push({ t: '<strong>Sem propósito.</strong> Animação sem motivo é a primeira que a pessoa aprende a ignorar — e a que deixa a página lenta.' });
        if (/^decoração/.test(v.proposito || '') && v.frequencia === 'várias vezes por visita')
          a.push({ t: '<strong>Decoração vista várias vezes por visita</strong> cansa na terceira. Considere não animar.' });
        if (gesto && ms > 250) a.push({ t: '<strong>Resposta ao gesto acima de 250ms</strong> parece preguiçosa: a mão já terminou e a interface ainda está indo.' });
        if (/^linear/.test(v.curva || '') && v.gatilho !== 'acompanhando a rolagem')
          a.push({ leve: true, t: 'Curva linear parece mecânica em interface. Ela serve para barra de progresso e para o que acompanha a rolagem.' });
        if (!v.movimento) a.push({ leve: true, t: 'Sem descrever o movimento, vem o reveal padrão que sobe cinquenta pixels — o mesmo de todo template.' });
        return a;
      },
      pesos: ['elemento', 'gatilho', 'proposito', 'movimento', 'duracao', 'curva']
    },

    feedback: {
      sobre: 'Uma correção sobre o que a IA acabou de fazer: o que manter, a mudança única e o porquê.',
      ref: ['ia.html#t-ia-modelo-feedback', 'Modelo de feedback'],
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

    correcao: {
      sobre: 'Um defeito, uma correção. Primeiro a causa em uma frase, depois a menor mudança possível — sem reescrever o arquivo.',
      ref: ['ia.html#t-ia-cirurgico', 'O fraseado que evita reescrita'],
      campos: [
        { id: 'onde', rot: 'Onde', forte: true, ph: 'o menu do celular' },
        { id: 'sintoma', rot: 'O que acontece', tipo: 'area', forte: true, ph: 'o menu abre por trás da hero' },
        { id: 'esperado', rot: 'O que deveria acontecer', tipo: 'area', forte: true, ph: 'abrir por cima de tudo' },
        { id: 'reproduzir', rot: 'Como reproduzir', forte: true, ph: 'iPhone, Safari, 390px: rolar um pouco e tocar em Menu',
          dica: 'Aparelho, navegador, largura e o passo a passo. Sem isso, a correção é chute.' },
        { id: 'tentado', rot: 'Já tentei', tipo: 'area', ph: 'z-index 999 no menu — não resolveu' },
        { id: 'naotocar', rot: 'Não pode mudar', ph: 'o menu do desktop' }
      ],
      montar: function (v) {
        var p = 'Corrija um problema. Um só.\n\n';
        if (v.onde) p += 'ONDE: ' + v.onde + '\n';
        if (v.sintoma) p += 'ACONTECE: ' + v.sintoma.trim() + '\n';
        if (v.esperado) p += 'DEVERIA: ' + v.esperado.trim() + '\n';
        if (v.reproduzir) p += 'COMO REPRODUZIR: ' + v.reproduzir + '\n';
        if (v.tentado) p += 'JÁ TENTEI: ' + v.tentado.trim() + '\n';
        p += '\nAntes de mexer, me diga em uma frase qual é a causa.\n' +
             'Depois faça a menor mudança que resolve — sem reescrever o arquivo\n' +
             'e sem aproveitar para melhorar outra coisa.\n';
        if (v.naotocar) p += 'Não toque em ' + v.naotocar + '.\n';
        p += '\nNo fim, me diga como eu confirmo que foi resolvido.';
        return p;
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.reproduzir) a.push({ t: '<strong>Sem como reproduzir.</strong> Defeito que só aparece no Safari do celular não aparece para quem testa no Chrome do computador.' });
        if (!v.esperado) a.push({ t: '<strong>Sem o esperado</strong>, a IA decide sozinha o que é "certo" — e pode consertar para o lado errado.' });
        if (!v.tentado) a.push({ leve: true, t: 'Contar o que já foi tentado evita receber a mesma tentativa de volta.' });
        return a;
      },
      pesos: ['onde', 'sintoma', 'esperado', 'reproduzir']
    },

    critica: {
      sobre: 'Criticar é mais fácil que acertar de primeira. A lista de problemas vem antes; a correção, uma de cada vez, depois.',
      ref: ['ia.html#t-ia-critica', 'Criticar é mais fácil que acertar'],
      campos: [
        { id: 'alvo', rot: 'O que avaliar', forte: true, ph: 'a hero que você acabou de escrever' },
        { id: 'quantos', rot: 'Quantos problemas', tipo: 'select', opcoes: ['três', 'cinco'] },
        { id: 'criterios', rot: 'Considerando', tipo: 'area',
          ph: 'hierarquia visual, legibilidade, coerência com os tokens, e se alguma seção não responde a nenhuma objeção real',
          dica: 'Vazio, usa o padrão do modelo da trilha.' },
        { id: 'medir', rot: 'Como avaliar', tipo: 'select',
          opcoes: ['medindo o que der: contraste, 390px, tamanho de fonte', 'só a leitura da IA'] }
      ],
      montar: function (v) {
        var crit = (v.criterios && v.criterios.trim()) ||
          'hierarquia visual, legibilidade, coerência com o sistema de tokens, e se alguma seção não está respondendo a nenhuma objeção real';
        var p = 'Não corrija nada ainda.\n' +
                'Liste os ' + (v.quantos || 'três') + ' maiores problemas de ' + (v.alvo || 'o que você acabou de escrever') + ',\n' +
                'do mais grave ao menos grave, considerando:\n' + crit.replace(/\n+/g, ', ') + '.\n' +
                'Para cada um, diga o que você faria.';
        if (!v.medir || /^medindo/.test(v.medir))
          p += '\n\nOnde der para medir, meça em vez de opinar: contraste em número,\n' +
               'o que estoura na horizontal em 390px, tamanho de fonte em px.';
        return p;
      },
      diagnosticar: function (v) {
        var a = [];
        if (!v.alvo) a.push({ leve: true, t: 'Sem alvo, a crítica vale para tudo o que foi escrito — e fica rasa em tudo.' });
        return a;
      },
      pesos: ['alvo', 'criterios']
    },

    revisao: {
      sobre: 'A última passada antes de entregar: só lista, não corrige. Técnico, conteúdo e consistência.',
      ref: ['ia.html#t-ia-modelo-revisao', 'Modelo de revisão'],
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
    try { valores = JSON.parse(localStorage.getItem(chave()) || '{}') || {}; } catch (e) {}
  }
  function salvar() {
    try { localStorage.setItem(chave(), JSON.stringify(valores)); } catch (e) {}
  }

  /* ---------- render ---------- */
  function renderSobre() {
    if (!sobre) return;
    var t = TIPOS[tipoAtual];
    sobre.textContent = t.sobre + ' ';
    var a = document.createElement('a');
    a.href = t.ref[0];
    a.textContent = 'De onde vem: ' + t.ref[1] + ' →';
    sobre.appendChild(a);
  }

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

  function trocar(tipo) {
    if (!TIPOS[tipo]) return;
    tipoAtual = tipo;
    tiposBox.querySelectorAll('.ger__tipo').forEach(function (o) {
      o.setAttribute('aria-pressed', String(o.dataset.tipo === tipo));
    });
    try { localStorage.setItem('gt-gerador-tipo', tipo); } catch (e) {}
    carregar();
    renderSobre();
    renderForm();
    atualizar();
  }

  /* ---------- eventos ---------- */
  tiposBox.querySelectorAll('.ger__tipo').forEach(function (b) {
    b.addEventListener('click', function () { trocar(b.dataset.tipo); });
  });

  btnCopiar.addEventListener('click', function () {
    var texto = saida.textContent;
    function feito(ok) {
      btnCopiar.textContent = ok ? 'copiado' : 'falhou';
      setTimeout(function () { btnCopiar.textContent = 'copiar'; }, 1400);
    }
    if (navigator.clipboard && location.protocol !== 'file:') {
      navigator.clipboard.writeText(texto).then(function () { feito(true); }, function () { feito(false); });
      return;
    }
    var t = document.createElement('textarea');
    t.value = texto; t.style.position = 'fixed'; t.style.left = '-9999px';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
    feito(ok);
  });

  btnLimpar.addEventListener('click', function () {
    valores = {};
    salvar();
    renderForm();
    atualizar();
  });

  var salvo = null;
  try { salvo = localStorage.getItem('gt-gerador-tipo'); } catch (e) {}
  trocar(TIPOS[salvo] ? salvo : 'lp');
})();
