# Gustavo Tutorial

Material de estudo de desenvolvimento web em português, escrito por Gustavo (Campo Grande, MS),
mais as ferramentas que ele usa durante o trabalho de cliente.

No ar em https://gustavo-tutorial.vercel.app/ — GitHub ligado à Vercel, cada push republica.

**Plano da Vercel:** os termos da Vercel restringem o plano gratuito (Hobby) a uso pessoal e não comercial,
e contam como comercial anunciar a venda de produto ou serviço. Hoje o site é material aberto, sem venda.
Quando ele se ligar à empresa de sites do Gustavo (está nos planos), passa a ser comercial: o projeto vai
para o plano Pro, ou para uma hospedagem cujo gratuito aceite uso comercial (a Netlify diz que aceita).
Avise o Gustavo antes de fazer essa ligação.

---

## Como o site é feito — e as regras que deixaram de existir

Até 29 set 2026 o site tinha cinco regras fixas: sem framework nem build, só o Google Fonts de fora,
JavaScript defensivo, `localStorage` em try/catch e nada saindo do navegador. **O Gustavo revogou as
cinco** porque limitavam a produção. Framework, npm, etapa de build, biblioteca, CDN, API externa e
função no servidor da Vercel agora são permitidos quando fizerem sentido.

O código que existe hoje ainda foi escrito sob elas — HTML, CSS e JS direto, sem build, blocos que
começam com `if (!caixa) return;` e `localStorage` dentro de try/catch. Isso é o estado atual, não
obrigação: siga o padrão do arquivo que estiver editando, e mudar de abordagem é uma decisão a
combinar, não um acidente.

**O que continua valendo, porque é honestidade e não regra de código:** várias páginas dizem ao
visitante que as ferramentas "não enviam nada para lugar nenhum" e o Colofão descreve o site como
sem framework e sem dependência. Enquanto for verdade, fica. No mesmo pacote em que algo passar a
mandar dado para fora (um chat com IA, um formulário, um login) ou entrar uma dependência nova,
corrija cada frase que deixou de ser verdade — `grep -il "nada é enviado\|sem framework\|única dependência" *.html`
acha as candidatas (nas trilhas, parte dessas menções é conteúdo de aula e fica). E uma chave de API
nunca vai no JavaScript da página: mora numa variável de ambiente da Vercel, lida por uma função no servidor.

## A IA do site

Um botão fixo no canto inferior direito (`.ia-fab`, criado pelo `ia.js`, carregado em toda página depois
do `busca.js`) acompanha a rolagem e abre um painel de chat que chama `POST /api/perguntar` — a função
`api/perguntar.mjs`, que roda na Vercel e fala com o **Gemini, do Google, no plano gratuito da API**,
por `fetch` direto no REST (`streamGenerateContent?alt=sse`), sem pacote. O Gustavo escolheu o
Gemini por não ter custo; o Claude foi a primeira versão e saiu por ser pago. A função:

- lê `api/_conteudo.json` (texto inteiro de cada tópico e ferramenta, **gerado pelo `indice.mjs`**) e,
  a cada pergunta, pega os 7 tópicos com mais termos em comum e manda como `<trechos>` junto da pergunta.
  As palavras são comparadas pela raiz (`raiz()` tira vogal final, plural e -ar/-er/-ir), e uma ferramenta
  cujo nome aparece na pergunta ganha peso extra — o texto da página dela é curto e perdia para as trilhas;
- responde em fluxo (texto puro, sem as partes `thought` do Gemini) e devolve os tópicos usados no
  cabeçalho `X-Fontes`; o `ia.js` mostra embaixo só os que a resposta citou;
- tenta os modelos da lista `MODELOS` em ordem (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`):
  passa para o próximo quando o atual devolve 429 (cota gratuita acabou) ou 500/503 (o Google diz que o
  modelo está sobrecarregado — aconteceu logo no primeiro teste em produção), porque cada modelo tem a
  própria cota e a própria fila.
  Com as duas esgotadas, o painel diz que a cota acabou. Os limites exatos só aparecem no AI Studio;
  os nomes de modelo do Google mudam com frequência — confira em ai.google.dev/gemini-api/docs/models
  antes de trocar;
- recusa origem de outro site e limita 12 perguntas por IP a cada 10 minutos (por instância);
- aceita **um print** por pedido (`imagem: { tipo, dados }` na mensagem do usuário, base64, até 3,5 milhões
  de caracteres — a Vercel recusa corpo acima de 4,5 MB), mandado ao Gemini como `inlineData`. O `ia.js`
  reduz o print no navegador para no máximo 1568px e JPEG antes de enviar, e reenvia o último print preso
  à pergunta em que foi mandado, para a IA ainda enxergá-lo nas perguntas seguintes. O print inteiro fica
  só na memória; o `sessionStorage` guarda uma miniatura.

A chave é `GEMINI_API_KEY`, criada no Google AI Studio (sem cartão): na Vercel, em Settings → Environment
Variables; no computador, num `.env.local` na raiz (está no `.gitignore`). **Nunca no JavaScript da
página.** Sem chave, a função responde 503 e o painel diz "A IA ainda não foi configurada". Não ative
faturamento no projeto do Google sem o Gustavo pedir: é o que mantém o custo em zero.

Para testar a IA localmente, o servidor é `node scripts/servidor.mjs` (porta 8000, entrada do
`launch.json`): serve os arquivos e roda a função como a Vercel. Um servidor estático comum não roda
`/api`. A busca também tem a linha "Pergunte à IA do site", que leva o termo digitado para o chat.

**O aviso do painel é promessa.** Ele diz que a pergunta e o print vão para o Gemini, do Google, no plano
gratuito, e que o Google pode usar esse conteúdo para melhorar os produtos dele — é o que a página de
preços do Google diz do plano gratuito. Trocou de provedor, de plano ou passou a guardar conversa no
servidor: o aviso muda no mesmo pacote.

## Arquivos gerados — nunca editar à mão

Estes três são saída de script. Editar à mão significa perder a alteração na próxima geração:

| Arquivo            | Gerado por              | Regenerar quando                            |
|--------------------|-------------------------|---------------------------------------------|
| `busca-indice.js`  | `scripts/indice.mjs`     | qualquer tópico, parte ou página mudar       |
| `api/_conteudo.json` | `scripts/indice.mjs`   | junto com o `busca-indice.js` (é o que a IA lê) |
| `progresso.js`     | `scripts/progresso.mjs`  | tópico adicionado, removido ou com `data-desde` |
| `sitemap.xml`      | `scripts/sitemap.mjs`    | qualquer página for editada (atualiza datas) |

O cabeçalho é uma linha só, de 48px, igual em toda página: marca à esquerda, menu e alternador no
centro exato (absoluto a partir de 561px), busca e tema à direita. O `.topo__interno` usa
`display: contents` para marca e botões entrarem na mesma linha do `<nav>`. Não tem rótulo de posição
nem cor de área: o site tem **um acento só** (`--accent`, teal), e a área em que se está aparece
apenas na pílula ativa do alternador (`.modo.is-atual`). O topo some ao descer e volta depois de ~0,3s
subindo (`SUBIDA` e `PAUSA` no `app.js`). O filtro Tudo/Revisão/Novo das trilhas mora na abertura, não no topo.

O painel do menu (`.navmenu__painel`) é `position: fixed`, mas o bloco que o contém é o `.topo`
(por causa do `backdrop-filter`); ele se centraliza com `left: 0; right: 0; margin-inline: auto;
width: fit-content`, sem `transform`. Não troque por `left: 50%` + translate: foi assim que ele
vazava para fora da tela.

O menu de navegação das 37 páginas que têm cabeçalho, o rodapé, a migalha das trilhas, os sumários e a
navegação das páginas de ferramenta também são gerados (`navmenu.mjs`, `sumario.mjs` e
`ferramentas.mjs`) — veja abaixo. O sistema visual (cores, fontes, grades de fio) está em `DESIGN.md`.

## Os scripts

Todos rodam de qualquer lugar; cada um se reposiciona na raiz do repositório. São Node puro
(ESM, `.mjs`) — a máquina não tem Python instalado, por isso os antigos `scripts/*.py` foram
portados e removidos. `scripts/_texto.mjs` normaliza CRLF↔LF na leitura/escrita, equivalente ao
"universal newlines" do Python; os arquivos do repo usam CRLF.

```
node scripts/indice.mjs          # regera busca-indice.js a partir do conteúdo real
node scripts/progresso.mjs       # regera progresso.js (mapa de tópicos por trilha)
node scripts/sitemap.mjs         # atualiza as datas do sitemap pelo mtime dos arquivos
node scripts/navmenu.mjs         # menu, rodapé, migalha, ícone do tema, data-modo e theme-color nas 38 páginas
node scripts/sumario.mjs <arquivo.html>   # regera o sumário lateral de uma trilha
node scripts/ferramentas.mjs     # índice, "você está em" e anterior/próxima das ferramentas
```

**`navmenu.mjs` é a fonte da verdade do menu e da área.** Para mudar categoria, link ou rótulo,
edite a lista `GRUPOS` dentro dele e rode — nunca edite o `<nav class="navmenu">` das páginas
diretamente, porque a próxima execução sobrescreve. O mapa `PAGINA` controla qual link fica
marcado como atual em cada arquivo (o segundo valor, o antigo rótulo de posição, não aparece mais); `MODO` controla se a página
pertence à área de estudo ou à de trabalho, e dele saem **três** coisas geradas: o alternador no
topo, o `data-modo` do `<body>` e a `<meta name="theme-color">` (`#0B1211` no hub, `#F4F6F4` no resto).
Nenhum dos três se edita à mão.

Os grupos do menu são cinco — Construção, Captação e Vendas, Método, Trabalhar e Sobre o site — e o
Trabalhar lista as quinze ferramentas lidas de `_ferramentas.mjs`, em links compactos (`desc` `null`
vira `.navmenu__compacto`). São **34 links** (`LINKS_DO_MENU` no `verificar.mjs`): mudou o menu, mude
o número. O mesmo script gera ainda o rodapé (`aplicarRodape`), a migalha "Estudar › Grupo" logo depois
da `<section class="abertura">` das trilhas (`aplicarMigalha`, pelo `GRUPOS_DE_ESTUDO`), a mesma migalha em
JSON-LD `BreadcrumbList` no `<head>` das trilhas, ferramentas e Modelos (`aplicarMigalhaJsonLd`, bloco
`id="gt-migalha"`: Início › Estudar › trilha, ou Início › Ferramentas › ferramenta) e o ícone SVG
do botão de tema (`aplicarIconeTema`).

O link para a página inicial é sempre `href="./"`, nunca `index.html`: `index.html` é outra URL para a mesma
página, que o Google precisa consolidar pelo canonical. Na `404.html` é `href="/"`, porque ela aparece em
qualquer endereço.

`SEM_MENU` lista as páginas sem cabeçalho — hoje só a `index.html`, que é o hub e navega pelo
hero e pelos cards. Elas continuam no `PAGINA` porque o script ainda cuida do `<body>` e do
`theme-color` delas; só o bloco do `<nav>` é pulado. O `verificar.mjs` tem a mesma lista e exige
que essas páginas tenham **zero** link de menu, para pegar um cabeçalho reintroduzido sem querer.

**`sumario.mjs` lê a própria página.** Ele extrai as `<section class="parte">` e os
`<article class="topico">` existentes e reconstrói o sumário e a contagem de partes/tópicos.
Rode sempre que adicionar ou remover um tópico de uma trilha.

## Estrutura do conteúdo

O site tem três níveis: **hub → páginas → subpáginas**.

- `index.html` — o hub: um palco escuro (`.hub`, `#0B1211` nos dois temas) com o título grande, a busca
  como barra principal e as duas portas embaixo. Não tem o cabeçalho comum; tem o próprio `.hub__topo`
- `estudar.html` — área de estudo: o topo `.area` (título, lead, contagem, botões) e o `.percurso`, as
  trilhas numeradas 01–14 em três grupos, numa grade de fios; o `app.js` põe "N de M estudados" em cada
  item. As subpáginas são as catorze trilhas (`montar-o-site.html`, a mais nova, vem depois de HTML puro e junta
  as peças num site inteiro — pastas, head, molde de seção, CSS em `@layer`, layout, ícones em SVG, vídeo e mapa sem peso, o CSS que poupa JavaScript e o
  projeto-base, com os
  mesmos nomes de token que o Design system exporta; `depois-do-ar.html` fica depois de Back-end e faz
  par com a ferramenta Depois de publicar: a trilha é o porquê, a ferramenta o roteiro com datas; `vibecoding.html`
  fica ao lado de `ia.html`: uma ensina como pedir, a outra com o quê trabalhar e onde buscar)
- `ferramentas.html` — área de trabalho, com o mesmo topo `.area` da `estudar.html`; embaixo, o projeto
  em andamento e cada fase num `.fase-grupo` (título à esquerda, cartões à direita). As subpáginas são as quinze `ferramenta-*.html` e a `modelos.html`
- `modelos.html` — a galeria de modelos para copiar. Tudo sai de `modelos.js`: cada modelo é um objeto
  com `html`, `css` e `js` (uma função de verdade — a página mostra o fonte dela com `toString()`,
  sem eval), e o que a prévia roda é exatamente o texto que se copia. Modelo novo = um objeto a mais
  na lista, com classes prefixadas `.m-<id>` e a cor em `var(--m-destaque, #F5C542)`. A busca
  (`indice.mjs`) lê os modelos direto do `modelos.js`, e o contador "39 modelos" do hub, da
  `ferramentas.html` e da `modelos.html` é prosa: atualize à mão.
  **Seções** (`secao: true`, id `secao-<nome>`, classes `.s-<nome>`) são pedaços de site inteiros que usam o
  projeto-base da trilha Montar o site — tokens e as classes `.secao`, `.container`, `.pilha`, `.fila`,
  `.grade`, `.botao`. Como o CSS delas estiliza tags, elas nunca entram no `<style>` da galeria: rodam num
  `<iframe srcdoc>` com o arquivo completo (`arquivo()`), em miniatura escalada na grade e em tamanho real
  na janela, com o botão Celular/Tela grande. `GT_BASE_SECAO` no topo do `modelos.js` é cópia do
  projeto-base de `montar-o-site.html#t-ms-projeto-base`: mudou um, mude o outro

Em tela de 1280px ou mais, a trilha usa três colunas: o sumário discreto no canto esquerdo, o texto
no meio e os blocos de código na coluna da direita. O código não muda de lugar no HTML — o CSS o
faz flutuar para a margem (float com margem negativa, a técnica da nota de margem), na altura do
texto que vem logo depois dele. Abaixo disso, tudo volta a ser uma coluna só. O sumário só abre a
lista de tópicos da parte que está sendo lida.

O app.js embrulha cada grupo de exemplos seguidos (`.bloco-codigo` ou `.vitrine`) numa caixa `.exemplos`
e, em tela larga, a sobe para antes do texto que vem logo antes dela — é o texto "par", que a seta
aponta e que acende quando o mouse passa no exemplo. Em tela menor, a caixa volta para depois do par.
Exemplo que é o primeiro filho do `.topico__corpo` não tem par: fica onde está, sem seta.

**Sem buracos:** o tópico espera a coluna de exemplos terminar, então exemplo mais alto que o texto
abre vazio. A função `encaixar()` do app.js mede cada tópico e, enquanto a coluna passar do texto
em mais que `FOLGA` (140px), recolhe: primeiro o código dos grupos (do mais alto para o mais
baixo), deixando a vitrine à mostra com um "Ver o código"; depois, se ainda não couber, o grupo
inteiro vira o cartão "Abrir exemplo", que abre tudo num `<dialog>` e devolve ao fechar. Refaz a
conta quando a fonte chega e ao redimensionar.

A **vitrine** (`<figure class="vitrine">`) é o exemplo vivo: palco escuro, botões `data-acao`
(`pausar`, `codigo`) no canto, controles no rodapé do palco, e o código dentro de
`.vitrine__codigo`. O comportamento de cada demo fica no último bloco do `app.js`, guardado pela
classe da própria demo (`.vx-cubo`, `.vx-pistas`, `.vx-pontos`, `.vx-paralaxe`, `.vx-revela`…). As
"fotos" são as classes `.vx-foto--1` a `--5`, gradientes em CSS — nada de imagem de fora.

**Rolagem:** a página cujo `<main>` tem `data-revelar` (hoje `estudar.html` e `modelos.html`) ganha as
entradas do último bloco do `app.js`: título palavra por palavra, números contando, blocos subindo em
escada ao entrar na tela (a lista `SELETOR`). Só esconde com a classe `js-revela` no `<html>`, que o JS
só põe sem "reduzir movimento". Usa `translate`/`opacity`, nunca `transform`, para não brigar com hover.

Cada trilha é uma página com esta estrutura, que os scripts dependem:

```html
<section class="parte" id="s1">
  <div class="parte__cabeca"><span class="parte__num">PARTE 1</span><h2>Nome da parte</h2></div>
  <article class="topico" id="t-alguma-coisa" data-marca="novo">
    <div class="topico__cabeca"><h3>Título do tópico</h3><span class="tag tag--novo">Novo</span></div>
    <div class="topico__corpo"> ... </div>
  </article>
</section>
```

`data-marca` aceita `novo` ou `revisao` e alimenta o filtro do topo. Os ids de tópico precisam
ser únicos no site inteiro, porque o marcador de "Estudado" guarda por id em `localStorage`.

### Conteúdo recém-chegado — `data-desde`

Todo tópico **novo** entra com a data em que foi publicado:

```html
<article class="topico" id="t-alguma-coisa" data-marca="novo" data-desde="2026-09-21">
```

Com isso, por 30 dias, o `app.js` põe o selo "Chegou 21 set" no tópico e um ponto no sumário
lateral; `estudar.html` ganha a caixa "Chegou nos últimos 30 dias" e a marca "novo" na trilha;
e o percurso da `estudar.html` marca a trilha com "Novo". Passado o prazo, tudo some sozinho — não se tira o atributo
do HTML. A lista sai de `window.GT_RECENTES`, que o `progresso.mjs` gera a partir dos atributos:
rode `node scripts/progresso.mjs` depois de publicar.

Não confundir com o `data-marca="novo"` e a etiqueta "Novo": aquela quer dizer "não é revisão"
e está em quase todos os tópicos; `data-desde` quer dizer "chegou agora". Nunca invente a data
de um tópico antigo — só marque o que foi publicado de fato naquele dia.

## Ferramentas — o critério de entrada

Uma ferramenta só entra se for **algo que se redigita ou recalcula em todo projeto**. Se é uma
decisão que muda de cliente para cliente, fica como texto na trilha, para ler e pensar.

Nenhuma das quinze foi inventada: todas saíram de conteúdo que já existia numa trilha. Antes de
propor uma nova, procure de onde ela sairia. Se não sair de lugar nenhum, provavelmente não deve
existir.

Cada ferramenta é uma IIFE independente em `ferramentas.js`, guardada pelo seu container, com
estado salvo em `localStorage` sob o prefixo `gt-`. Cada uma mora na sua página (`ferramenta-*.html`),
e todas carregam o mesmo `ferramentas.js` — as que não estão na página saem pelo `if (!caixa) return`.

A lista das ferramentas é uma só: `scripts/_ferramentas.mjs` (id, arquivo, nome, fase), lida por
`navmenu`, `verificar`, `indice`, `sitemap` e `ferramentas.mjs`. O `ferramentas.js` tem o mesmo mapa
id → arquivo (`PAGINA_DE`) e monta todo link entre ferramentas com `ir(id)`; nunca escreva `#f-...`
num link, porque a âncora não existe na página da outra. Ferramenta nova: entra na lista, no
`PAGINA_DE`, ganha a subpágina e um cartão na `ferramentas.html`, e depois `node scripts/ferramentas.mjs`.

### Fases e ligações

A página segue a ordem do trabalho, em cinco `<div class="fase">`: antes do projeto (briefing,
preço, proposta), identidade (paleta, contraste, tipografia, escala, design system), montar a página
(gerador de comando, cabeçalho, WhatsApp, UTM), entregar (checklist, inventário) e acompanhar (depois de publicar). O painel `#projeto` da `ferramentas.html` tem o
nome do cliente — `gt-projeto` — espelhado nos campos de nome das cinco ferramentas que guardam
por cliente (`DONOS`), e os cartões mostram o estado de cada uma. Ferramenta nova entra numa fase e ganha uma função
no objeto `ESTADO`. Nas subpáginas, o nome vem guardado e entra no campo de cliente da ferramenta.

**Depois de publicar** (`ferramenta-depois-de-publicar.html`, bloco 15 do `ferramentas.js`) é o roteiro
`trafego.html#t-tr-90dias` em datas: cinco blocos com prazo em dias (`de`/`ate`) contados da data de
publicação, e um bloco mensal que guarda só o mês corrente. Os itens têm id estável (`bloco.item`), não
índice — reordenar não desmarca nada. O contador "29" do `ESTADO` é o total da lista: item novo, atualize.
Os lembretes saem num `.ics` montado no navegador (Blob), sem servidor.

`guardar()` só avisa (`gt:mudou`) quando o valor muda de fato; quem escuta o aviso pode se
remontar sem entrar em laço. Uma ligação entre ferramentas se faz com `ligar(antes, de, ir,
valor, rotulo)`: mostra o valor da outra ferramenta com um botão para usar, e **nunca sobrescreve
sozinha** — `valor()` devolve `null` quando não há o que oferecer ou o campo já está igual.
Como as ferramentas moram em páginas diferentes, uma só enxerga a outra pelo que ela guardou —
nunca pelo DOM (o Cabeçalho lê o `<link>` das fontes de `gt-fo-link`, não da página da Tipografia).
Só ligue o que é o mesmo dado de verdade (o telefone do JSON-LD e o do botão, a cor da paleta e a
theme-color); ferramenta sem dado em comum com as outras fica avulsa, como o inventário.

Paleta, Escala e Tipografia guardam o resultado já calculado (`gt-pl-tokens`, `gt-es-tokens`,
`gt-fo-pilha-t`/`-c`, `gt-fo-medida`) para o **Design system** ler sem refazer conta; ele é a
última da fase 2 e não decide cor, fonte nem escala de novo. Na Tipografia, cada família da lista
`FAMILIAS` declara em `w` os pesos que existem no Google Fonts: pedir um peso que a família não
tem faz o Google recusar o `<link>` inteiro.

**Gerador de comando** fica em `gerador.js` (não em `ferramentas.js`) e guarda sob `gt-gerador-<tipo>`,
sem passar por `guardar()`; a ligação com as outras ferramentas é o bloco 14 do `ferramentas.js`, que
avisa `gt:mudou` quando o formulário do gerador muda. Tipo novo entra no objeto `TIPOS`, com `sobre`
e `ref` apontando o tópico da trilha de onde saiu, e no mapa `FONTES` se puder puxar dado de outra
ferramenta. O tópico `ia.html#t-ia-gerador` continua existindo como ponte para a ferramenta.

**Figma:** o site não fala com a API do Figma. Falar exigiria guardar token de acesso num servidor e
mandar dado para fora do navegador — possível agora, mas com as ressalvas da seção de regras. A ponte atual é por formato: o Design system exporta
tokens em JSON no padrão DTCG, que plugins de tokens do Figma importam.

## Antes de dizer que terminou

Rode a suíte. Ela abre todas as páginas em duas larguras e falha em: overflow horizontal, número
de `<h1>` diferente de 1, contagem de links do menu diferente do esperado, âncora interna
quebrada, id repetido na página e erro de JavaScript no console. Id repetido quase sempre é um
script que colou um bloco duas vezes.

```
node scripts/verificar.mjs
```

Depois disso, confira também:

- Os contadores em prosa (ex.: "as quinze do dia a dia", "14 trilhas · 106 partes · 519 tópicos") espalhados pela
  home, pelo menu e pelas metas — eles não são gerados, e ficam velhos calados.
- Uma entrada nova em `patch-notes.html`, no topo, dizendo o que mudou — **em toda atualização**,
  por menor que seja. É pedido explícito do Gustavo, não opcional.
- **Todo texto de conteúdo que saiu ou foi reescrito** entra em `saiu-e-entrou.html`, no topo (logo abaixo
  do comentário `entrada nova sempre no topo`): data, link para o tópico, o motivo, e o texto antigo em
  `<del>` ao lado do novo em `<ins>`, copiados literalmente (HTML escapado). Acréscimo puro não entra;
  contador em prosa e metadado também não. Pedido explícito do Gustavo, para poder comparar sempre. Antes de
  commitar, rode `git diff --word-diff=plain` nas páginas de conteúdo e procure `[-` — cada trecho removido
  que não seja contador precisa estar na página.
- Tópico novo leva `data-desde="AAAA-MM-DD"` com a data de publicação, e depois
  `node scripts/progresso.mjs`.

## As três páginas sobre o site

- `patch-notes.html` — o registro seco do que mudou, mais recente primeiro. Toda entrega ganha
  uma entrada.
- `saiu-e-entrou.html` — o texto que foi tirado ou reescrito, com a versão antiga ao lado da nova.
  Começa em 29 set 2026; o que mudou antes está no histórico do git.
- `colofao.html` — o raciocínio por trás: por que o site é assim, o que a IA fez e o que não
  fez, e os erros que foram encontrados nele próprio. O site registra os próprios erros de
  propósito, e não os apaga — a distância entre o que se sabe e o que se faz é o assunto dele.

## Tom do texto

Direto, com exemplo prático, sem enrolação. Nada de "neste artigo vamos aprender". Cada tópico
traz o conceito, o código real e a decisão prática por trás dele. Nunca inventar número,
depoimento ou credencial: o que não foi verificado não entra.
