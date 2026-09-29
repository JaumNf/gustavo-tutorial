# DESIGN.md — Gustavo Tutorial

O sistema visual do site depois do redesenho de setembro de 2026. As referências foram motion.dev e
gsap.com: tipografia grande fazendo o papel da imagem, uma cor só, grades de fio fino e movimento que
explica em vez de enfeitar. Tudo mora em `estilo.css`; os valores abaixo são os tokens de lá.

## Princípios

1. **O título é o desenho.** Página de área e hub não têm ilustração, glifo nem rótulo acima do
   título: o `<h1>` grande, em Bricolage 800, é a peça visual.
2. **Um acento só.** O teal (`--accent`) é a única cor de destaque do site inteiro, galeria de Modelos
   inclusive (`--m-destaque`). A área (Estudar/Trabalhar) aparece só na pílula ativa do topo.
   As cores de linguagem (`--html`, `--css`, `--js`) existem apenas para marcar código.
3. **Fio, não caixa.** Listas de itens são grades de fio de 1px (motion.dev), sem sombra, sem cartão
   flutuante, sem faixa colorida na lateral.
4. **Mono é dado.** JetBrains Mono só para código, números de percurso, contagens e metadados.
5. **Movimento com motivo.** Entrada ao rolar, varredura no botão, seta que anda — nada em loop.

## Cor

| Token           | Claro     | Escuro    | Uso                                   |
|-----------------|-----------|-----------|---------------------------------------|
| `--ground`      | `#F4F6F4` | `#0D1514` | fundo da página                       |
| `--surface`     | `#FFFFFF` | —         | campos, painéis                       |
| `--ink`         | `#131E1D` | `#E7EDEB` | texto e títulos                       |
| `--ink-soft`    | `#3B4B49` | `#C0CCC9` | texto corrido secundário              |
| `--muted`       | `#5F6E6B` | —         | metadados, números                    |
| `--line`        | `#D5DBD8` | `#293937` | fios das grades                       |
| `--line-soft`   | `#E4E8E5` | `#1F2C2B` | divisórias leves                      |
| `--accent`      | `#0D6B62` | `#45C8BA` | a cor de destaque, links, foco        |
| `--accent-soft` | `#E0EFEC` | `#10312E` | fundo de realce                       |
| `--code-bg`     | `#14201F` | —         | blocos de código e palcos de vitrine  |

O **hub** é um palco escuro nos dois temas: `--hub-fundo #0B1211`, `--hub-tinta #EEF3F1`,
`--hub-fraco #9DAEAA`, `--hub-teal #45C8BA`, fio `rgb(238 243 241 / .14)`. A `theme-color` segue:
`#0B1211` no hub, `#F4F6F4` no resto (gerada pelo `navmenu.mjs`).

O tema escuro vem de `prefers-color-scheme` e do `data-theme` no `<html>`, que o botão de tema grava.

## Tipografia

| Papel        | Família               | Onde                                             |
|--------------|-----------------------|--------------------------------------------------|
| Display      | Bricolage Grotesque   | títulos, nomes de trilha, botões, menu           |
| Leitura      | Source Serif 4        | corpo, leads (`.area__lead`, `.hub__lead`)        |
| Dado/código  | JetBrains Mono        | código, `.percurso__num`, `.area__meta`, contagens |

Escala dos títulos grandes, sempre `font-weight: 800`, `letter-spacing: -.04em` (o piso — nunca mais
fechado que isso):

- `.hub__titulo` — `clamp(60px, 12.4vw, 188px)`, `line-height: .88`, `max-width: 11ch`
- `.area__titulo` — `clamp(58px, 9.6vw, 124px)`, `line-height: .9`
- `.parte` h2 nas trilhas — `clamp(42px, 7vw, 76px)`
- `.percurso__nome` — 21px, 700, `-.02em`

## Forma

- `--radius: 3px` para campos e blocos de código. Botões (`.cta`) são retos.
- Fios de 1px em `--line`. Grade de fio se faz com borda, não com `gap` sobre fundo: `border-top`
  e `border-left` na lista, `border-right` e `border-bottom` em cada item — assim linha incompleta
  não vira bloco cinza.

## Componentes

- **`.cta`** — Bricolage 700 16px, reto, com a cor em `--cta-cor`. O fundo é um `::before` que varre
  com `scaleX`; `.cta--cheio` começa cheio e esvazia no hover. A seta (`.cta__seta`, SVG) anda.
- **`.area`** — topo das páginas de área: `h1.area__titulo`, `p.area__lead` (serif),
  `p.area__meta` (mono, "14 trilhas · 106 partes · 510 tópicos"), `.area__acoes` com um `.cta` e um
  `.area__link`.
- **`.percurso`** — grupos (`.percurso__grupo`, cabeça à esquerda) e `ol.percurso__lista` em grade de
  fio `auto-fill, minmax(250px, 1fr)`. Cada `.percurso__item`: número mono, nome, descrição, meta;
  o `app.js` acrescenta `.percurso__progresso` com `--feito` (0–1).
- **`.fase-grupo` / `.ferr-card`** — o mesmo desenho do percurso para as ferramentas, por fase.
- **Hub** — `.hub__topo` (marca, `.hub__nav`, tema), `.hub__palco` (título e lead) e `.hub__base`
  (busca como barra principal + as duas `.hub__porta`).
- **Topo** — 48px, vidro (`backdrop-filter`), some ao descer. Painel do menu fixo, centralizado com
  `margin-inline: auto` e `width: fit-content`, em três colunas.
- **Sumário no celular** (≤900px) — barra fixa que diz "Parte N" e tem `.sumario__lido`, uma linha
  que enche com `scaleX` conforme a rolagem.
- **Ícones** — SVG em linha, traço `currentColor`, classe `.ico`. Nunca caractere Unicode no lugar de
  ícone.
- **Rodapé** — `.rodape__marca` e `.rodape__nav` (Estudar, Trabalhar, Modelos, Patch notes, Colofão),
  gerado em toda página.

## Movimento

- Curvas: `cubic-bezier(.23, 1, .32, 1)` para resposta a interação e `cubic-bezier(.22, 1, .36, 1)`
  para aparecer. Hover de cor em `.15s ease`.
- Só `transform`/`translate`/`opacity`. A entrada ao rolar (`main[data-revelar]`) usa `translate` e
  `opacity`, nunca `transform`, para não brigar com hover; o título entra palavra por palavra em
  `.rv-mascara`.
- Tudo desliga com `prefers-reduced-motion`: a classe `js-revela` só entra sem ela.

## O que não fazer

- Rótulo/"olho" acima do título, linha de números em destaque no hero.
- Segunda cor de destaque, ou pintar o cabeçalho pela área.
- Borda lateral colorida com mais de 1px como enfeite.
- Mono em texto corrido.
- `transition: width` ou `height` em coisa nova — use `scaleX`/`scaleY`.
