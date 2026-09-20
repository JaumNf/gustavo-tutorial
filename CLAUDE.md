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
| `busca-indice.js`  | `scripts/indice.py`     | qualquer tópico, parte ou página mudar       |
| `progresso.js`     | `scripts/progresso.py`  | tópicos forem adicionados ou removidos       |
| `sitemap.xml`      | `scripts/sitemap.py`    | qualquer página for editada (atualiza datas) |

O menu de navegação das 19 páginas e os sumários das trilhas também são gerados
(`navmenu.py` e `sumario.py`) — veja abaixo.

## Os scripts

Todos rodam de qualquer lugar; cada um se reposiciona na raiz do repositório.

```
python3 scripts/indice.py        # regera busca-indice.js a partir do conteúdo real
python3 scripts/progresso.py     # regera progresso.js (mapa de tópicos por trilha)
python3 scripts/sitemap.py       # atualiza as datas do sitemap pelo mtime dos arquivos
python3 scripts/navmenu.py       # reescreve o menu nas 19 páginas de uma vez
python3 scripts/sumario.py <arquivo.html>   # regera o sumário lateral de uma trilha
```

**`navmenu.py` é a fonte da verdade do menu.** Para mudar categoria, link ou rótulo, edite a
lista `GRUPOS` dentro dele e rode — nunca edite o `<nav class="navmenu">` das páginas
diretamente, porque a próxima execução sobrescreve. O mapa `PAGINA` controla qual link fica
marcado como atual e qual o rótulo de posição em cada arquivo; `MODO` controla se a página
pertence à área de estudo ou à de trabalho (o alternador no topo).

**`sumario.py` lê a própria página.** Ele extrai as `<section class="parte">` e os
`<article class="topico">` existentes e reconstrói o sumário e a contagem de partes/tópicos.
Rode sempre que adicionar ou remover um tópico de uma trilha.

## Estrutura do conteúdo

O site tem três áreas:

- `index.html` — a central, com a busca e as duas portas
- `estudar.html` — área de estudo: as onze trilhas por categoria
- `ferramentas.html` — área de trabalho: as doze ferramentas

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

## Ferramentas — o critério de entrada

Uma ferramenta só entra se for **algo que se redigita ou recalcula em todo projeto**. Se é uma
decisão que muda de cliente para cliente, fica como texto na trilha, para ler e pensar.

Nenhuma das doze foi inventada: todas saíram de conteúdo que já existia numa trilha. Antes de
propor uma nova, procure de onde ela sairia. Se não sair de lugar nenhum, provavelmente não deve
existir.

Cada ferramenta é uma IIFE independente em `ferramentas.js`, guardada pelo seu container, com
estado salvo em `localStorage` sob o prefixo `gt-`.

## Antes de dizer que terminou

Rode a suíte. Ela abre todas as páginas em duas larguras e falha em: overflow horizontal, número
de `<h1>` diferente de 1, contagem de links do menu diferente do esperado, âncora interna
quebrada e erro de JavaScript no console.

```
node scripts/verificar.mjs
```

Depois disso, confira também:

- Os contadores em prosa (ex.: "as doze do dia a dia", "11 trilhas · 84 partes") espalhados pela
  home, pelo menu e pelas metas — eles não são gerados, e ficam velhos calados.
- Uma entrada nova em `patch-notes.html`, no topo, dizendo o que mudou.

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
