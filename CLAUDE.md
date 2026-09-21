# Gustavo Tutorial

Material de estudo de desenvolvimento web em português, escrito por Gustavo (Campo Grande, MS),
mais as ferramentas que ele usa durante o trabalho de cliente.

No ar em https://gustavo-tutorial.vercel.app/ — GitHub ligado à Vercel, cada push republica.

---

## As regras que não se quebram

Estas não são preferências de estilo: são o argumento do site. Ele ensina a não depender de
pacote que envelhece, e por isso ele próprio não depende.

1. **Sem framework e sem etapa de build.** HTML, CSS e JavaScript escritos direto. Nada de npm
   install para o site funcionar, nada de bundler, nada de transpilador.
2. **Uma única dependência externa: Google Fonts.** Motion e GSAP entram apenas em
   `movimento.html` e `motion.html`, e caem para a versão nativa se o CDN não responder.
3. **JavaScript sempre defensivo.** Cada bloco começa verificando se o elemento existe
   (`if (!caixa) return;`). Um recurso quebrado nunca derruba os outros na mesma página.
4. **`localStorage` sempre dentro de try/catch.** Aba anônima e armazenamento bloqueado não
   podem quebrar a página.
5. **Nada sai do navegador.** As ferramentas não enviam dado para lugar nenhum. Isso está escrito
   na página e precisa continuar verdade.

## Arquivos gerados — nunca editar à mão

Estes três são saída de script. Editar à mão significa perder a alteração na próxima geração:

| Arquivo            | Gerado por              | Regenerar quando                            |
|--------------------|-------------------------|---------------------------------------------|
| `busca-indice.js`  | `scripts/indice.mjs`     | qualquer tópico, parte ou página mudar       |
| `progresso.js`     | `scripts/progresso.mjs`  | tópico adicionado, removido ou com `data-desde` |
| `sitemap.xml`      | `scripts/sitemap.mjs`    | qualquer página for editada (atualiza datas) |

O cabeçalho é uma linha só, de 48px: o `.topo__interno` usa `display: contents` para marca e botões
entrarem na mesma linha do `<nav>`. Ele some ao descer e só volta depois de ~1s subindo (`SUBIDA` e
`PAUSA` no `app.js`). O filtro Tudo/Revisão/Novo das trilhas mora na abertura, não no topo.

O menu de navegação das 17 páginas que têm cabeçalho e os sumários das trilhas também são gerados
(`navmenu.mjs` e `sumario.mjs`) — veja abaixo.

## Os scripts

Todos rodam de qualquer lugar; cada um se reposiciona na raiz do repositório. São Node puro
(ESM, `.mjs`) — a máquina não tem Python instalado, por isso os antigos `scripts/*.py` foram
portados e removidos. `scripts/_texto.mjs` normaliza CRLF↔LF na leitura/escrita, equivalente ao
"universal newlines" do Python; os arquivos do repo usam CRLF.

```
node scripts/indice.mjs          # regera busca-indice.js a partir do conteúdo real
node scripts/progresso.mjs       # regera progresso.js (mapa de tópicos por trilha)
node scripts/sitemap.mjs         # atualiza as datas do sitemap pelo mtime dos arquivos
node scripts/navmenu.mjs         # menu, data-modo e theme-color nas 18 páginas
node scripts/sumario.mjs <arquivo.html>   # regera o sumário lateral de uma trilha
```

**`navmenu.mjs` é a fonte da verdade do menu e da área.** Para mudar categoria, link ou rótulo,
edite a lista `GRUPOS` dentro dele e rode — nunca edite o `<nav class="navmenu">` das páginas
diretamente, porque a próxima execução sobrescreve. O mapa `PAGINA` controla qual link fica
marcado como atual e qual o rótulo de posição em cada arquivo; `MODO` controla se a página
pertence à área de estudo ou à de trabalho, e dele saem **três** coisas geradas: o alternador no
topo, o `data-modo` do `<body>` (que troca a cor da área no CSS) e a `<meta name="theme-color">`
do tema claro. Nenhum dos três se edita à mão.

`SEM_MENU` lista as páginas sem cabeçalho — hoje só a `index.html`, que é o hub e navega pelo
hero e pelos cards. Elas continuam no `PAGINA` porque o script ainda cuida do `<body>` e do
`theme-color` delas; só o bloco do `<nav>` é pulado. O `verificar.mjs` tem a mesma lista e exige
que essas páginas tenham **zero** link de menu, para pegar um cabeçalho reintroduzido sem querer.

**`sumario.mjs` lê a própria página.** Ele extrai as `<section class="parte">` e os
`<article class="topico">` existentes e reconstrói o sumário e a contagem de partes/tópicos.
Rode sempre que adicionar ou remover um tópico de uma trilha.

## Estrutura do conteúdo

O site tem três áreas:

- `index.html` — a central, com a busca e as duas portas
- `estudar.html` — área de estudo: as onze trilhas por categoria
- `ferramentas.html` — área de trabalho: as quatorze ferramentas

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
e o hub avisa na porta de estudo. Passado o prazo, tudo some sozinho — não se tira o atributo
do HTML. A lista sai de `window.GT_RECENTES`, que o `progresso.mjs` gera a partir dos atributos:
rode `node scripts/progresso.mjs` depois de publicar.

Não confundir com o `data-marca="novo"` e a etiqueta "Novo": aquela quer dizer "não é revisão"
e está em quase todos os tópicos; `data-desde` quer dizer "chegou agora". Nunca invente a data
de um tópico antigo — só marque o que foi publicado de fato naquele dia.

## Ferramentas — o critério de entrada

Uma ferramenta só entra se for **algo que se redigita ou recalcula em todo projeto**. Se é uma
decisão que muda de cliente para cliente, fica como texto na trilha, para ler e pensar.

Nenhuma das quatorze foi inventada: todas saíram de conteúdo que já existia numa trilha. Antes de
propor uma nova, procure de onde ela sairia. Se não sair de lugar nenhum, provavelmente não deve
existir.

Cada ferramenta é uma IIFE independente em `ferramentas.js`, guardada pelo seu container, com
estado salvo em `localStorage` sob o prefixo `gt-`.

### Fases e ligações

A página segue a ordem do trabalho, em quatro `<div class="fase">`: antes do projeto (briefing,
preço, proposta), identidade (paleta, contraste, tipografia, escala, design system), montar a página
(gerador de comando, cabeçalho, WhatsApp, UTM) e entregar (checklist, inventário). O painel `#projeto` no topo tem o
nome do cliente — `gt-projeto` — espelhado nos campos de nome das quatro ferramentas que guardam
por cliente, e mostra o estado de cada uma. Ferramenta nova entra numa fase e ganha uma função
no objeto `ESTADO` do painel.

`guardar()` só avisa (`gt:mudou`) quando o valor muda de fato; quem escuta o aviso pode se
remontar sem entrar em laço. Uma ligação entre ferramentas se faz com `ligar(antes, de, ir,
valor, rotulo)`: mostra o valor da outra ferramenta com um botão para usar, e **nunca sobrescreve
sozinha** — `valor()` devolve `null` quando não há o que oferecer ou o campo já está igual.
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

**Figma:** o site não fala com a API do Figma e não deve falar — exigiria guardar token de acesso
e mandar dado para fora do navegador (regra 5). A ponte é por formato: o Design system exporta
tokens em JSON no padrão DTCG, que plugins de tokens do Figma importam.

## Antes de dizer que terminou

Rode a suíte. Ela abre todas as páginas em duas larguras e falha em: overflow horizontal, número
de `<h1>` diferente de 1, contagem de links do menu diferente do esperado, âncora interna
quebrada e erro de JavaScript no console.

```
node scripts/verificar.mjs
```

Depois disso, confira também:

- Os contadores em prosa (ex.: "as quatorze do dia a dia", "11 trilhas · 84 partes") espalhados pela
  home, pelo menu e pelas metas — eles não são gerados, e ficam velhos calados.
- Uma entrada nova em `patch-notes.html`, no topo, dizendo o que mudou — **em toda atualização**,
  por menor que seja. É pedido explícito do Gustavo, não opcional.
- Tópico novo leva `data-desde="AAAA-MM-DD"` com a data de publicação, e depois
  `node scripts/progresso.mjs`.

## As duas páginas sobre o site

- `patch-notes.html` — o registro seco do que mudou, mais recente primeiro. Toda entrega ganha
  uma entrada.
- `colofao.html` — o raciocínio por trás: por que o site é assim, o que a IA fez e o que não
  fez, e os erros que foram encontrados nele próprio. O site registra os próprios erros de
  propósito, e não os apaga — a distância entre o que se sabe e o que se faz é o assunto dele.

## Tom do texto

Direto, com exemplo prático, sem enrolação. Nada de "neste artigo vamos aprender". Cada tópico
traz o conceito, o código real e a decisão prática por trás dele. Nunca inventar número,
depoimento ou credencial: o que não foi verificado não entra.
