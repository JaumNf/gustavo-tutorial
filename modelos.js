/* ============================================================
   modelos.js — os modelos visuais para copiar e colar.

   Cada modelo tem o HTML, o CSS e o JS que rodam na página — e é
   exatamente esse texto que o botão copia. O JS é uma função de
   verdade: a página mostra o fonte dela (sem eval), embrulhado em
   "document.querySelectorAll(raiz).forEach(...)".

   Regras de todos: HTML, CSS e JS puros; só transform e opacity no
   movimento; curva forte de saída; aperto de .97 no clique; nada de
   hover sem mouse; e respeito a prefers-reduced-motion.
   A cor de destaque vem de --m-destaque, com um padrão no próprio CSS.
   ============================================================ */
window.GT_MODELOS = [

/* ================= MOVIMENTO ================= */
{
  id: 'reveal', cat: 'Movimento', nome: 'Reveal ao rolar',
  desc: 'Os itens entram em sequência quando chegam na tela. Clique para ver de novo.',
  assina: 'transition-delay: calc(var(--i) * 70ms)',
  ref: 'movimento.html#t-mv-receitas',
  raiz: '.m-reveal',
  html:
`<div class="m-reveal">
  <div class="m-reveal__item"></div>
  <div class="m-reveal__item"></div>
  <div class="m-reveal__item"></div>
  <div class="m-reveal__item"></div>
</div>`,
  css:
`.m-reveal { display: grid; gap: 10px; width: min(240px, 80%); cursor: pointer; }
.m-reveal__item {
  height: 14px; border-radius: 7px;
  background: var(--m-destaque, #F5C542);
  opacity: 0; transform: translateY(12px);
  transition: opacity .5s cubic-bezier(.22, .61, .36, 1),
              transform .5s cubic-bezier(.22, .61, .36, 1);
  transition-delay: calc(var(--i, 0) * 70ms);
}
.m-reveal__item:nth-child(2) { --i: 1; width: 86%; }
.m-reveal__item:nth-child(3) { --i: 2; width: 70%; }
.m-reveal__item:nth-child(4) { --i: 3; width: 52%; }
.m-reveal.is-in .m-reveal__item { opacity: 1; transform: none; }
.m-reveal.is-zerando .m-reveal__item { transition: none; }
@media (prefers-reduced-motion: reduce) {
  .m-reveal__item { transition: none; opacity: 1; transform: none; }
}`,
  js: function (raiz) {
    var obs = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) return;
      raiz.classList.add('is-in');
      obs.disconnect();
    }, { threshold: .4 });
    obs.observe(raiz);

    /* clicar mostra de novo: zera sem transição, depois entra */
    raiz.addEventListener('click', function () {
      raiz.classList.add('is-zerando');
      raiz.classList.remove('is-in');
      void raiz.offsetWidth;
      raiz.classList.remove('is-zerando');
      raiz.classList.add('is-in');
    });
  }
},
{
  id: 'contador', cat: 'Movimento', nome: 'Contador animado',
  desc: 'Conta do zero ao número quando aparece, desacelerando no fim. Clique para contar de novo.',
  assina: '1 - Math.pow(1 - t, 3)',
  ref: 'movimento.html#t-mv-receitas',
  raiz: '.m-contador',
  html:
`<p class="m-contador">
  <strong data-num="1250">0</strong>
  <span>número de exemplo</span>
</p>`,
  css:
`.m-contador { display: grid; justify-items: center; gap: 4px; margin: 0; cursor: pointer; }
.m-contador strong {
  font-size: 56px; font-weight: 800; letter-spacing: -.03em; line-height: 1;
  color: var(--m-destaque, #F5C542); font-variant-numeric: tabular-nums;
}
.m-contador span { font-size: 12px; opacity: .6; }`,
  js: function (raiz) {
    var el = raiz.querySelector('strong');
    var calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function contar() {
      var alvo = Number(el.dataset.num), inicio = performance.now(), dur = 1400;
      if (calmo) { el.textContent = alvo.toLocaleString('pt-BR'); return; }
      (function passo(agora) {
        var t = Math.min((agora - inicio) / dur, 1);
        el.textContent = Math.round(alvo * (1 - Math.pow(1 - t, 3))).toLocaleString('pt-BR');
        if (t < 1) requestAnimationFrame(passo);
      })(inicio);
    }
    var obs = new IntersectionObserver(function (ents) {
      if (ents[0].isIntersecting) { contar(); obs.disconnect(); }
    }, { threshold: .5 });
    obs.observe(raiz);
    raiz.addEventListener('click', contar);
  }
},
{
  id: 'palavras', cat: 'Movimento', nome: 'Título palavra por palavra',
  desc: 'Cada palavra sai do desfoque para o nítido, uma depois da outra. Clique para repetir.',
  assina: 'filter: blur(6px) → blur(0)',
  raiz: '.m-palavras',
  html:
`<p class="m-palavras">Drinks que viram experiência</p>`,
  css:
`.m-palavras {
  margin: 0; max-width: 260px; text-align: center; cursor: pointer;
  font-size: 28px; font-weight: 800; line-height: 1.15; letter-spacing: -.02em;
}
.m-palavras span {
  display: inline-block;
  opacity: 0; filter: blur(6px); transform: translateY(8px);
  animation: m-palavra .6s cubic-bezier(.22, .61, .36, 1) forwards;
  animation-delay: calc(var(--i) * 70ms);
}
@keyframes m-palavra { to { opacity: 1; filter: blur(0); transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .m-palavras span { animation: none; opacity: 1; filter: none; transform: none; }
}`,
  js: function (raiz) {
    var texto = raiz.textContent.trim();
    function montar() {
      raiz.textContent = '';
      texto.split(' ').forEach(function (p, i) {
        var s = document.createElement('span');
        s.textContent = p;
        s.style.setProperty('--i', i);
        raiz.appendChild(s);
        raiz.appendChild(document.createTextNode(' '));
      });
    }
    montar();
    raiz.setAttribute('aria-label', texto);
    raiz.addEventListener('click', montar);
  }
},
{
  id: 'marquee', cat: 'Movimento', nome: 'Faixa infinita de logos',
  desc: 'Anda sozinha, sem emenda, e para quando o mouse passa por cima.',
  assina: 'translateX(-50%) linear infinite',
  raiz: '.m-marquee',
  html:
`<div class="m-marquee" aria-label="Clientes">
  <div class="m-marquee__faixa">
    <span>Casa Nova</span><span>Buffet Aurora</span><span>Studio 12</span>
    <span>Arq. Vanessa</span><span>Café Ipê</span><span>Clínica Sol</span>
  </div>
</div>`,
  css:
`.m-marquee {
  width: 100%; overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
}
.m-marquee__faixa {
  display: flex; gap: 36px; width: max-content;
  animation: m-marquee 18s linear infinite;   /* movimento constante: linear */
}
.m-marquee__faixa span { font-size: 20px; font-weight: 800; opacity: .75; white-space: nowrap; }
.m-marquee:hover .m-marquee__faixa { animation-play-state: paused; }
@keyframes m-marquee { to { transform: translateX(calc(-50% - 18px)); } }
@media (prefers-reduced-motion: reduce) {
  .m-marquee { overflow-x: auto; }
  .m-marquee__faixa { animation: none; }
}`,
  js: function (raiz) {
    /* a faixa repete o próprio conteúdo: quando a primeira metade sai, a segunda está no lugar */
    var faixa = raiz.querySelector('.m-marquee__faixa');
    Array.prototype.slice.call(faixa.children).forEach(function (el) {
      var copia = el.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      faixa.appendChild(copia);
    });
  }
},
{
  id: 'leitura', cat: 'Movimento', nome: 'Barra de progresso de leitura',
  desc: 'A barra acompanha a rolagem. Role o texto dentro da caixa.',
  assina: 'scaleX(rolado / total)',
  ref: 'movimento.html#t-mv-receitas',
  raiz: '.m-leitura',
  html:
`<div class="m-leitura">
  <div class="m-leitura__barra" aria-hidden="true"></div>
  <div class="m-leitura__texto" tabindex="0">
    <p>Quase ninguém lê uma página até o fim.</p>
    <p>A barra diz quanto falta — e quem vê que falta pouco, continua.</p>
    <p>Aqui ela acompanha esta caixa; na página, acompanhe o documento.</p>
    <p>É o tipo de detalhe que ninguém elogia e todo mundo sente.</p>
    <p>Role até o fim para encher a barra.</p>
  </div>
</div>`,
  css:
`.m-leitura {
  position: relative; width: min(280px, 90%); height: 170px; overflow: hidden;
  border: 1px solid rgb(255 255 255 / .12); border-radius: 8px;
}
.m-leitura__barra {
  position: absolute; top: 0; left: 0; right: 0; height: 4px; z-index: 1;
  background: var(--m-destaque, #F5C542);
  transform-origin: left; transform: scaleX(0);
}
.m-leitura__texto { height: 100%; overflow-y: auto; padding: 16px 16px 60px; }
.m-leitura__texto p { margin: 0 0 14px; font-size: 14px; line-height: 1.55; }`,
  js: function (raiz) {
    var barra = raiz.querySelector('.m-leitura__barra');
    var texto = raiz.querySelector('.m-leitura__texto');
    texto.addEventListener('scroll', function () {
      var total = texto.scrollHeight - texto.clientHeight;
      barra.style.transform = 'scaleX(' + (total > 0 ? texto.scrollTop / total : 0) + ')';
    }, { passive: true });
  }
},

/* ================= BOTÕES ================= */
{
  id: 'toque', cat: 'Botões', nome: 'Botão com retorno ao toque',
  desc: 'Afunda um pouco ao apertar — a interface avisa que ouviu. Clique e segure.',
  assina: ':active { transform: scale(.97) }',
  ref: 'movimento.html#t-mv-receitas',
  raiz: '.m-toque',
  html:
`<button class="m-toque" type="button">Pedir orçamento</button>`,
  css:
`.m-toque {
  font: 700 15px/1 system-ui, sans-serif;
  padding: 14px 24px; border: 0; border-radius: 8px; cursor: pointer;
  background: var(--m-destaque, #F5C542); color: #111;
  transition: transform .16s cubic-bezier(.23, 1, .32, 1), box-shadow .2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .m-toque:hover { transform: translateY(-2px); box-shadow: 0 10px 24px -10px rgb(0 0 0 / .6); }
}
.m-toque:active { transform: scale(.97); transition-duration: .06s; }
.m-toque:focus-visible { outline: 2px solid var(--m-destaque, #F5C542); outline-offset: 3px; }`,
  js: null
},
{
  id: 'varre', cat: 'Botões', nome: 'Botão que varre a cor',
  desc: 'O fundo entra pela esquerda e sai pela direita — a saída continua o movimento.',
  assina: 'transform-origin: left → right',
  raiz: '.m-varre',
  html:
`<button class="m-varre" type="button"><span>Ver cardápio</span> ›</button>`,
  css:
`.m-varre {
  position: relative; overflow: hidden; isolation: isolate;
  font: 700 13px/1 ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase;
  padding: 16px 22px; cursor: pointer; border-radius: 0;
  color: var(--m-destaque, #F5C542); background: transparent;
  border: 1px solid var(--m-destaque, #F5C542);
  transition: color .3s cubic-bezier(.23, 1, .32, 1), transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-varre::before {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: var(--m-destaque, #F5C542);
  transform: scaleX(0); transform-origin: right;
  transition: transform .4s cubic-bezier(.23, 1, .32, 1);
}
@media (hover: hover) and (pointer: fine) {
  .m-varre:hover { color: #111; }
  .m-varre:hover::before { transform: scaleX(1); transform-origin: left; }
}
.m-varre:focus-visible { color: #111; outline: none; }
.m-varre:focus-visible::before { transform: scaleX(1); transform-origin: left; }
.m-varre:active { transform: scale(.97); }`,
  js: null
},
{
  id: 'segurar', cat: 'Botões', nome: 'Segurar para confirmar',
  desc: 'Para ação perigosa: enche devagar enquanto você segura, volta rápido se soltar.',
  assina: 'clip-path: inset(0 100% 0 0) → inset(0)',
  raiz: '.m-segurar',
  html:
`<button class="m-segurar" type="button">
  <span class="m-segurar__texto">Segure para apagar</span>
  <span class="m-segurar__cheio" aria-hidden="true">Segure para apagar</span>
</button>`,
  css:
`.m-segurar {
  position: relative; font: 700 14px/1 system-ui, sans-serif; cursor: pointer;
  padding: 14px 22px; border-radius: 8px; border: 1px solid #E5484D;
  background: transparent; color: #FF8589; user-select: none;
  transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-segurar__cheio {
  position: absolute; inset: 0; display: grid; place-items: center; border-radius: 7px;
  background: #E5484D; color: #fff;
  clip-path: inset(0 100% 0 0);
  transition: clip-path .2s cubic-bezier(.23, 1, .32, 1);      /* soltar: rápido */
}
.m-segurar:active { transform: scale(.97); }
.m-segurar:active .m-segurar__cheio {
  clip-path: inset(0 0 0 0);
  transition: clip-path 1.2s linear;                           /* segurar: devagar e constante */
}
.m-segurar.is-feito .m-segurar__cheio { clip-path: inset(0 0 0 0); transition: none; }`,
  js: function (raiz) {
    var cheio = raiz.querySelector('.m-segurar__cheio');
    var original = cheio.textContent;
    /* a transição só termina se a pessoa segurou até o fim */
    cheio.addEventListener('transitionend', function () {
      if (!raiz.matches(':active')) return;
      raiz.classList.add('is-feito');
      cheio.textContent = 'Apagado ✓';
      setTimeout(function () {
        raiz.classList.remove('is-feito');
        cheio.textContent = original;
      }, 1400);
    });
  }
},
{
  id: 'copiar', cat: 'Botões', nome: 'Copiar com troca de ícone',
  desc: 'O ícone vira um ✓ com um leve desfoque na troca, e volta sozinho.',
  assina: 'filter: blur(2px) na troca',
  raiz: '.m-copiar',
  html:
`<button class="m-copiar" type="button" data-texto="npm create site-sem-framework">
  <span class="m-copiar__icones" aria-hidden="true"><i>⧉</i><i>✓</i></span>
  <span class="m-copiar__rotulo">copiar comando</span>
</button>`,
  css:
`.m-copiar {
  display: inline-flex; align-items: center; gap: 10px; cursor: pointer;
  font: 600 14px/1 system-ui, sans-serif; color: inherit;
  padding: 12px 16px; border-radius: 8px;
  background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .14);
  transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-copiar:active { transform: scale(.97); }
.m-copiar__icones { position: relative; width: 18px; height: 18px; }
.m-copiar__icones i {
  position: absolute; inset: 0; display: grid; place-items: center; font-style: normal;
  transition: opacity .2s ease, filter .2s ease, transform .2s cubic-bezier(.23, 1, .32, 1);
}
.m-copiar__icones i:last-child { opacity: 0; filter: blur(2px); transform: scale(.6); color: var(--m-destaque, #F5C542); }
.m-copiar.is-ok .m-copiar__icones i:first-child { opacity: 0; filter: blur(2px); transform: scale(.6); }
.m-copiar.is-ok .m-copiar__icones i:last-child { opacity: 1; filter: none; transform: none; }`,
  js: function (raiz) {
    var rotulo = raiz.querySelector('.m-copiar__rotulo'), antes = rotulo.textContent, espera = null;
    raiz.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(raiz.dataset.texto).catch(function () {});
      raiz.classList.add('is-ok');
      rotulo.textContent = 'copiado';
      clearTimeout(espera);
      espera = setTimeout(function () { raiz.classList.remove('is-ok'); rotulo.textContent = antes; }, 1400);
    });
  }
},

/* ================= CARDS ================= */
{
  id: 'zoom', cat: 'Cards', nome: 'Foto que cresce sem estourar',
  desc: 'A moldura segura o zoom: a foto cresce por dentro, o card não sai do lugar.',
  assina: 'overflow: hidden + scale(1.06)',
  ref: 'movimento.html#t-mv-receitas',
  raiz: '.m-zoom',
  html:
`<figure class="m-zoom" tabindex="0">
  <div class="m-zoom__moldura"><div class="m-zoom__foto"></div></div>
  <figcaption>Casamento no campo</figcaption>
</figure>`,
  css:
`.m-zoom { margin: 0; width: 200px; outline: none; }
.m-zoom__moldura { overflow: hidden; border-radius: 10px; }
.m-zoom__foto {
  height: 130px;
  background: radial-gradient(circle at 72% 30%, #F4D9A8 0 11%, transparent 12%),
              linear-gradient(to top, #1B2A3A 0 22%, transparent 22%),
              linear-gradient(to top, #6B4B5E, #D98E6B 70%, #F1B98C);
  transition: transform .5s cubic-bezier(.22, .61, .36, 1);
}
.m-zoom figcaption { margin-top: 10px; font-weight: 700; font-size: 14px; }
@media (hover: hover) and (pointer: fine) {
  .m-zoom:hover .m-zoom__foto { transform: scale(1.06); }
}
.m-zoom:focus-visible .m-zoom__foto { transform: scale(1.06); }
.m-zoom:focus-visible figcaption { color: var(--m-destaque, #F5C542); }`,
  js: null
},
{
  id: 'tilt', cat: 'Cards', nome: 'Card que inclina com o mouse',
  desc: 'Segue o ponteiro com atraso, como se tivesse peso. Passe o mouse por cima.',
  assina: 'atual += (alvo - atual) * .12',
  raiz: '.m-tilt',
  html:
`<div class="m-tilt">
  <div class="m-tilt__card">
    <span class="m-tilt__selo">Pacote completo</span>
    <strong>Bar para 150 convidados</strong>
    <small>estrutura, equipe e drinks</small>
  </div>
</div>`,
  css:
`.m-tilt { perspective: 700px; }
.m-tilt__card {
  width: 220px; padding: 22px; border-radius: 14px;
  display: grid; gap: 8px;
  background: linear-gradient(145deg, #1D2927, #111918);
  border: 1px solid rgb(255 255 255 / .1);
  box-shadow: 0 20px 40px -20px rgb(0 0 0 / .7);
  transform-style: preserve-3d; will-change: transform;
}
.m-tilt__selo { font: 700 11px/1 ui-monospace, monospace; text-transform: uppercase; letter-spacing: .1em; color: var(--m-destaque, #F5C542); }
.m-tilt__card strong { font-size: 19px; line-height: 1.2; }
.m-tilt__card small { opacity: .6; }`,
  js: function (raiz) {
    var card = raiz.querySelector('.m-tilt__card');
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var alvo = { x: 0, y: 0 }, atual = { x: 0, y: 0 }, rodando = false;
    function passo() {
      /* aproxima 12% por quadro: o card chega devagar, como mola sem biblioteca */
      atual.x += (alvo.x - atual.x) * .12;
      atual.y += (alvo.y - atual.y) * .12;
      card.style.transform = 'rotateX(' + atual.y + 'deg) rotateY(' + atual.x + 'deg)';
      if (Math.abs(alvo.x - atual.x) > .01 || Math.abs(alvo.y - atual.y) > .01) requestAnimationFrame(passo);
      else rodando = false;
    }
    function mover(x, y) { alvo.x = x; alvo.y = y; if (!rodando) { rodando = true; requestAnimationFrame(passo); } }
    raiz.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      mover(((e.clientX - r.left) / r.width - .5) * 16, -((e.clientY - r.top) / r.height - .5) * 16);
    });
    raiz.addEventListener('pointerleave', function () { mover(0, 0); });
  }
},
{
  id: 'flip', cat: 'Cards', nome: 'Card que vira',
  desc: 'Frente e verso no mesmo lugar. Clique para virar.',
  assina: 'backface-visibility: hidden',
  raiz: '.m-flip',
  html:
`<button class="m-flip" type="button" aria-pressed="false">
  <span class="m-flip__lado m-flip__frente">Quanto custa?</span>
  <span class="m-flip__lado m-flip__verso">A partir do número de convidados — orçamento em 24h.</span>
</button>`,
  css:
`.m-flip {
  position: relative; width: 220px; height: 130px; padding: 0; border: 0;
  background: none; color: inherit; cursor: pointer; font: inherit;
  transform-style: preserve-3d;
  transition: transform .6s cubic-bezier(.77, 0, .175, 1);   /* movimento na tela: entra e sai */
}
.m-flip[aria-pressed="true"] { transform: rotateY(180deg); }
.m-flip__lado {
  position: absolute; inset: 0; display: grid; place-items: center; padding: 18px;
  border-radius: 12px; backface-visibility: hidden; text-align: center; line-height: 1.35;
}
.m-flip__frente { background: var(--m-destaque, #F5C542); color: #111; font-weight: 800; font-size: 20px; }
.m-flip__verso { background: #1A2422; border: 1px solid rgb(255 255 255 / .12); transform: rotateY(180deg); font-size: 14px; }
@media (prefers-reduced-motion: reduce) { .m-flip { transition: none; } }`,
  js: function (raiz) {
    raiz.addEventListener('click', function () {
      raiz.setAttribute('aria-pressed', String(raiz.getAttribute('aria-pressed') !== 'true'));
    });
  }
},

/* ================= NAVEGAÇÃO ================= */
{
  id: 'abas', cat: 'Navegação', nome: 'Abas com fundo que desliza',
  desc: 'Uma cópia das abas, recortada na aba ativa: a cor troca sem piscar.',
  assina: 'clip-path: inset(0 R 0 L round 99px)',
  raiz: '.m-abas',
  html:
`<div class="m-abas">
  <div class="m-abas__lista" role="tablist">
    <button role="tab" aria-selected="true">Casamento</button>
    <button role="tab" aria-selected="false">Corporativo</button>
    <button role="tab" aria-selected="false">Festa</button>
  </div>
  <div class="m-abas__lista m-abas__ativa" aria-hidden="true">
    <span>Casamento</span><span>Corporativo</span><span>Festa</span>
  </div>
</div>`,
  css:
`.m-abas { position: relative; }
.m-abas__lista {
  display: flex; gap: 4px; padding: 4px; border-radius: 99px;
  background: rgb(255 255 255 / .06);
}
.m-abas__lista > * {
  font: 600 14px/1 system-ui, sans-serif; padding: 10px 16px; border-radius: 99px;
  border: 0; background: none; color: inherit; cursor: pointer;
}
/* a cópia pintada fica por cima, recortada só na aba ativa */
.m-abas__ativa {
  position: absolute; inset: 0; pointer-events: none;
  background: var(--m-destaque, #F5C542); color: #111;
  clip-path: inset(0 100% 0 0 round 99px);
  transition: clip-path .3s cubic-bezier(.23, 1, .32, 1);
}
@media (prefers-reduced-motion: reduce) { .m-abas__ativa { transition: none; } }`,
  js: function (raiz) {
    var abas = raiz.querySelectorAll('[role="tab"]');
    var ativa = raiz.querySelector('.m-abas__ativa');
    function marcar(aba) {
      abas.forEach(function (a) { a.setAttribute('aria-selected', String(a === aba)); });
      var l = aba.offsetLeft, r = ativa.offsetWidth - l - aba.offsetWidth;
      ativa.style.clipPath = 'inset(4px ' + r + 'px 4px ' + l + 'px round 99px)';
    }
    abas.forEach(function (a) { a.addEventListener('click', function () { marcar(a); }); });
    marcar(abas[0]);
  }
},
{
  id: 'acordeao', cat: 'Navegação', nome: 'Acordeão com altura automática',
  desc: 'Abre na altura exata do conteúdo, sem medir nada em JavaScript.',
  assina: 'grid-template-rows: 0fr → 1fr',
  ref: 'movimento.html#t-mv-receitas',
  raiz: '.m-acordeao',
  html:
`<div class="m-acordeao">
  <div class="m-acordeao__item">
    <button aria-expanded="true">O que está incluído? <span aria-hidden="true">+</span></button>
    <div class="m-acordeao__painel is-aberto"><div><p>Estrutura, equipe e insumos. O cardápio é montado com você.</p></div></div>
  </div>
  <div class="m-acordeao__item">
    <button aria-expanded="false">Atende fora da cidade? <span aria-hidden="true">+</span></button>
    <div class="m-acordeao__painel"><div><p>Sim — o deslocamento entra separado no orçamento.</p></div></div>
  </div>
</div>`,
  css:
`.m-acordeao { width: min(300px, 92%); display: grid; gap: 8px; }
.m-acordeao__item { border: 1px solid rgb(255 255 255 / .12); border-radius: 8px; }
.m-acordeao__item button {
  width: 100%; display: flex; justify-content: space-between; gap: 10px;
  padding: 12px 14px; border: 0; background: none; color: inherit; cursor: pointer;
  font: 700 14px/1.2 system-ui, sans-serif; text-align: left;
}
.m-acordeao__item button span { color: var(--m-destaque, #F5C542); transition: transform .3s cubic-bezier(.4, 0, .2, 1); }
.m-acordeao__item button[aria-expanded="true"] span { transform: rotate(45deg); }
.m-acordeao__painel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s cubic-bezier(.4, 0, .2, 1); }
.m-acordeao__painel.is-aberto { grid-template-rows: 1fr; }
.m-acordeao__painel > div { overflow: hidden; }
.m-acordeao__painel p { margin: 0; padding: 0 14px 12px; font-size: 13.5px; line-height: 1.5; opacity: .75; }`,
  js: function (raiz) {
    raiz.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var painel = b.nextElementSibling, abrir = !painel.classList.contains('is-aberto');
        painel.classList.toggle('is-aberto', abrir);
        b.setAttribute('aria-expanded', String(abrir));
      });
    });
  }
},
{
  id: 'hamburguer', cat: 'Navegação', nome: 'Menu que vira X',
  desc: 'As três linhas viram um X — o ícone mostra o que o próximo toque faz.',
  assina: 'rotate(45deg) + translateY',
  raiz: '.m-hamb',
  html:
`<button class="m-hamb" type="button" aria-expanded="false" aria-label="Abrir menu">
  <span></span><span></span><span></span>
</button>`,
  css:
`.m-hamb {
  width: 52px; height: 52px; display: grid; place-content: center; gap: 6px;
  border-radius: 12px; border: 1px solid rgb(255 255 255 / .14);
  background: rgb(255 255 255 / .05); cursor: pointer;
  transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-hamb:active { transform: scale(.94); }
.m-hamb span {
  display: block; width: 22px; height: 2px; border-radius: 2px;
  background: var(--m-destaque, #F5C542);
  transition: transform .3s cubic-bezier(.23, 1, .32, 1), opacity .2s ease;
}
.m-hamb[aria-expanded="true"] span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
.m-hamb[aria-expanded="true"] span:nth-child(2) { opacity: 0; transform: scaleX(.2); }
.m-hamb[aria-expanded="true"] span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }`,
  js: function (raiz) {
    raiz.addEventListener('click', function () {
      var aberto = raiz.getAttribute('aria-expanded') !== 'true';
      raiz.setAttribute('aria-expanded', String(aberto));
      raiz.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
  }
},

/* ================= FORMULÁRIO ================= */
{
  id: 'flutua', cat: 'Formulário', nome: 'Rótulo que flutua',
  desc: 'O rótulo sobe quando o campo ganha foco ou texto — sem sumir como placeholder.',
  assina: ':placeholder-shown',
  raiz: '.m-flutua',
  html:
`<label class="m-flutua">
  <input type="text" placeholder=" " autocomplete="name">
  <span>Seu nome</span>
</label>`,
  css:
`.m-flutua { position: relative; display: block; width: min(260px, 90%); }
.m-flutua input {
  width: 100%; box-sizing: border-box; padding: 22px 14px 8px;
  font: 16px/1.2 system-ui, sans-serif; color: inherit;
  background: rgb(255 255 255 / .05); border: 1px solid rgb(255 255 255 / .18); border-radius: 8px;
}
.m-flutua input:focus { outline: none; border-color: var(--m-destaque, #F5C542); }
.m-flutua span {
  position: absolute; left: 14px; top: 16px; pointer-events: none; opacity: .65;
  transform-origin: left top;
  transition: transform .2s cubic-bezier(.23, 1, .32, 1), color .2s ease, opacity .2s ease;
}
.m-flutua input:focus + span,
.m-flutua input:not(:placeholder-shown) + span {
  transform: translateY(-9px) scale(.78); opacity: 1;
}
.m-flutua input:focus + span { color: var(--m-destaque, #F5C542); }`,
  js: null
},
{
  id: 'chave', cat: 'Formulário', nome: 'Interruptor',
  desc: 'Um checkbox de verdade por baixo. Ao apertar, a bolinha estica — detalhe de física.',
  assina: 'input[role="switch"]',
  raiz: '.m-chave',
  html:
`<label class="m-chave">
  <input type="checkbox" role="switch" checked>
  <span class="m-chave__trilho" aria-hidden="true"></span>
  Avisos pelo WhatsApp
</label>`,
  css:
`.m-chave { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; font: 600 14px/1 system-ui, sans-serif; }
.m-chave input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.m-chave__trilho {
  position: relative; width: 48px; height: 28px; border-radius: 99px;
  background: rgb(255 255 255 / .16); transition: background-color .2s ease;
}
.m-chave__trilho::after {
  content: ""; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 99px;
  background: #fff; box-shadow: 0 2px 6px rgb(0 0 0 / .3);
  transition: transform .25s cubic-bezier(.23, 1, .32, 1), width .15s ease;
}
.m-chave:active .m-chave__trilho::after { width: 28px; }   /* estica ao apertar */
.m-chave input:checked + .m-chave__trilho { background: var(--m-destaque, #F5C542); }
.m-chave input:checked + .m-chave__trilho::after { transform: translateX(20px); }
.m-chave:active input:checked + .m-chave__trilho::after { transform: translateX(14px); }
.m-chave input:focus-visible + .m-chave__trilho { outline: 2px solid var(--m-destaque, #F5C542); outline-offset: 3px; }`,
  js: null
},
{
  id: 'valida', cat: 'Formulário', nome: 'Erro que treme',
  desc: 'Tente enviar vazio ou com um e-mail errado: o campo balança e diz o que falta.',
  assina: 'animate([0, -6, 6, -4, 4, 0])',
  raiz: '.m-valida',
  html:
`<form class="m-valida" novalidate>
  <div class="m-valida__linha">
    <input type="email" placeholder="seu@email.com" required aria-describedby="m-valida-msg">
    <button type="submit">Enviar</button>
  </div>
  <p class="m-valida__msg" id="m-valida-msg" aria-live="polite"></p>
</form>`,
  css:
`.m-valida { width: min(300px, 92%); }
.m-valida__linha { display: flex; gap: 6px; }
.m-valida input {
  flex: 1; min-width: 0; padding: 12px; font: 15px system-ui, sans-serif; color: inherit;
  background: rgb(255 255 255 / .05); border: 1px solid rgb(255 255 255 / .18); border-radius: 8px;
}
.m-valida input[aria-invalid="true"] { border-color: #E5484D; }
.m-valida button {
  padding: 0 16px; border: 0; border-radius: 8px; cursor: pointer; font: 700 14px system-ui, sans-serif;
  background: var(--m-destaque, #F5C542); color: #111;
  transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-valida button:active { transform: scale(.97); }
.m-valida__msg { min-height: 1.2em; margin: 8px 0 0; font-size: 13px; }
.m-valida__msg.is-erro { color: #FF8589; }`,
  js: function (raiz) {
    var campo = raiz.querySelector('input'), msg = raiz.querySelector('.m-valida__msg');
    raiz.addEventListener('submit', function (e) {
      e.preventDefault();
      if (campo.checkValidity()) {
        campo.removeAttribute('aria-invalid');
        msg.className = 'm-valida__msg';
        msg.textContent = 'Recebido ✓';
        return;
      }
      campo.setAttribute('aria-invalid', 'true');
      msg.className = 'm-valida__msg is-erro';
      msg.textContent = campo.value ? 'Esse e-mail parece incompleto.' : 'Falta o e-mail.';
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        campo.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' },
          { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 320 });
      }
      campo.focus();
    });
  }
},

/* ================= FEEDBACK ================= */
{
  id: 'toast', cat: 'Feedback', nome: 'Aviso que empilha',
  desc: 'Entra de baixo, some sozinho, e os mais antigos ficam por trás. Clique várias vezes.',
  assina: 'scale(1 - i * .05) translateY(-i * 10px)',
  raiz: '.m-toast',
  html:
`<div class="m-toast">
  <button class="m-toast__botao" type="button">Salvar rascunho</button>
  <ol class="m-toast__lista" aria-live="polite"></ol>
</div>`,
  css:
`.m-toast { position: relative; width: 100%; height: 100%; display: grid; place-items: start center; padding-top: 34px; box-sizing: border-box; }
.m-toast__botao {
  font: 700 14px system-ui, sans-serif; padding: 12px 18px; border-radius: 8px; border: 0; cursor: pointer;
  background: var(--m-destaque, #F5C542); color: #111; transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-toast__botao:active { transform: scale(.97); }
.m-toast__lista { position: absolute; left: 50%; bottom: 16px; width: min(260px, 88%); margin: 0; padding: 0; list-style: none; transform: translateX(-50%); }
.m-toast__lista li {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 14px; border-radius: 10px;
  background: #1D2927; border: 1px solid rgb(255 255 255 / .12); font-size: 14px;
  box-shadow: 0 10px 30px -10px rgb(0 0 0 / .6);
  transform: translateY(calc(var(--i) * -10px)) scale(calc(1 - var(--i) * .05));
  transition: transform .4s cubic-bezier(.23, 1, .32, 1), opacity .4s ease;
}
.m-toast__lista li.is-entrando { transform: translateY(100%); opacity: 0; }
.m-toast__lista li.is-saindo { opacity: 0; transform: translateY(8px) scale(.96); transition-duration: .2s; }`,
  js: function (raiz) {
    var lista = raiz.querySelector('.m-toast__lista'), n = 0;
    function ordenar() {
      Array.prototype.slice.call(lista.children).reverse().forEach(function (li, i) {
        li.style.setProperty('--i', i);
        li.style.zIndex = 10 - i;
        li.style.opacity = i > 2 ? 0 : '';
      });
    }
    raiz.querySelector('.m-toast__botao').addEventListener('click', function () {
      var li = document.createElement('li');
      li.textContent = 'Rascunho salvo · versão ' + (++n);
      li.className = 'is-entrando';
      lista.appendChild(li);
      ordenar();
      requestAnimationFrame(function () { requestAnimationFrame(function () { li.classList.remove('is-entrando'); }); });
      setTimeout(function () {
        li.classList.add('is-saindo');
        setTimeout(function () { li.remove(); ordenar(); }, 200);
      }, 3000);
    });
  }
},
{
  id: 'dica', cat: 'Feedback', nome: 'Dica que espera na primeira',
  desc: 'A primeira espera meio segundo; passando para a vizinha, aparece na hora.',
  assina: 'atraso só na primeira',
  raiz: '.m-dicas',
  html:
`<div class="m-dicas">
  <button type="button" aria-label="Copiar">⧉</button>
  <button type="button" aria-label="Compartilhar">↗</button>
  <button type="button" aria-label="Apagar">✕</button>
  <span class="m-dicas__balao" role="tooltip"></span>
</div>`,
  css:
`.m-dicas { position: relative; display: flex; gap: 6px; }
.m-dicas button {
  width: 42px; height: 42px; border-radius: 10px; cursor: pointer; font-size: 17px; color: inherit;
  background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .14);
  transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-dicas button:active { transform: scale(.94); }
.m-dicas__balao {
  position: absolute; top: -40px; left: 0; padding: 7px 10px; border-radius: 7px; white-space: nowrap;
  font: 600 12px system-ui, sans-serif; background: #F2F2F2; color: #111; pointer-events: none;
  opacity: 0; transform: translateY(4px) scale(.97); transform-origin: bottom center;
  transition: opacity .15s ease, transform .15s cubic-bezier(.23, 1, .32, 1);
}
.m-dicas__balao.is-visivel { opacity: 1; transform: none; }
.m-dicas__balao.is-instante { transition-duration: 0s; }`,
  js: function (raiz) {
    var balao = raiz.querySelector('.m-dicas__balao'), espera = null, saiu = 0;
    function mostrar(b) {
      var r = b.getBoundingClientRect(), base = raiz.getBoundingClientRect();
      balao.textContent = b.getAttribute('aria-label');
      balao.style.left = (r.left - base.left + r.width / 2) + 'px';
      balao.style.translate = '-50% 0';
      balao.classList.add('is-visivel');
    }
    raiz.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('pointerenter', function () {
        clearTimeout(espera);
        /* saiu de outra há pouco: sem espera e sem animação */
        var rapido = Date.now() - saiu < 400 || balao.classList.contains('is-visivel');
        balao.classList.toggle('is-instante', rapido);
        if (rapido) mostrar(b); else espera = setTimeout(function () { mostrar(b); }, 500);
      });
      b.addEventListener('pointerleave', function () {
        clearTimeout(espera);
        if (balao.classList.contains('is-visivel')) saiu = Date.now();
        balao.classList.remove('is-visivel');
      });
      b.addEventListener('focus', function () { balao.classList.add('is-instante'); mostrar(b); });
      b.addEventListener('blur', function () { balao.classList.remove('is-visivel'); });
    });
  }
},
{
  id: 'esqueleto', cat: 'Feedback', nome: 'Esqueleto de carregamento',
  desc: 'O formato do conteúdo antes dele chegar, com um brilho que atravessa.',
  assina: 'background-position: 200% → -200%',
  raiz: '.m-esqueleto',
  html:
`<div class="m-esqueleto" aria-busy="true" aria-label="Carregando">
  <span class="m-esqueleto__foto"></span>
  <span class="m-esqueleto__linha"></span>
  <span class="m-esqueleto__linha m-esqueleto__linha--curta"></span>
</div>`,
  css:
`.m-esqueleto { width: 230px; display: grid; gap: 10px; }
.m-esqueleto span {
  display: block; border-radius: 8px;
  background: linear-gradient(90deg, rgb(255 255 255 / .06) 30%, rgb(255 255 255 / .16) 50%, rgb(255 255 255 / .06) 70%);
  background-size: 300% 100%;
  animation: m-brilho 1.4s linear infinite;
}
.m-esqueleto__foto { height: 110px; }
.m-esqueleto__linha { height: 14px; }
.m-esqueleto__linha--curta { width: 60%; }
@keyframes m-brilho { from { background-position: 100% 0; } to { background-position: -100% 0; } }
@media (prefers-reduced-motion: reduce) { .m-esqueleto span { animation: none; } }`,
  js: null
},
{
  id: 'carregando', cat: 'Feedback', nome: 'Carregando',
  desc: 'Um anel que gira rápido parece carregar mais rápido — e três pontos para texto.',
  assina: 'rotate(360deg) .8s linear',
  raiz: '.m-carrega',
  html:
`<div class="m-carrega" role="status" aria-label="Carregando">
  <span class="m-carrega__anel"></span>
  <span class="m-carrega__pontos"><i></i><i></i><i></i></span>
</div>`,
  css:
`.m-carrega { display: flex; align-items: center; gap: 34px; }
.m-carrega__anel {
  width: 38px; height: 38px; border-radius: 50%;
  border: 3px solid rgb(255 255 255 / .12); border-top-color: var(--m-destaque, #F5C542);
  animation: m-gira .8s linear infinite;
}
.m-carrega__pontos { display: flex; gap: 6px; }
.m-carrega__pontos i {
  width: 9px; height: 9px; border-radius: 50%; background: var(--m-destaque, #F5C542);
  animation: m-pula 1s cubic-bezier(.45, 0, .55, 1) infinite;
}
.m-carrega__pontos i:nth-child(2) { animation-delay: .15s; }
.m-carrega__pontos i:nth-child(3) { animation-delay: .3s; }
@keyframes m-gira { to { transform: rotate(360deg); } }
@keyframes m-pula { 0%, 60%, 100% { transform: none; opacity: .5; } 30% { transform: translateY(-8px); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .m-carrega__anel { animation-duration: 2.4s; }
  .m-carrega__pontos i { animation: none; }
}`,
  js: null
},
{
  id: 'janela', cat: 'Feedback', nome: 'Janela com dialog nativo',
  desc: 'O <dialog> do próprio HTML: trava o fundo, fecha no Esc e devolve o foco.',
  assina: 'dialog.showModal()',
  raiz: '.m-janela',
  html:
`<div class="m-janela">
  <button class="m-janela__abrir" type="button">Ver política de cancelamento</button>
  <dialog class="m-janela__dialogo" aria-labelledby="m-janela-titulo">
    <h2 id="m-janela-titulo">Cancelamento</h2>
    <p>Até 30 dias antes, a entrada volta inteira. Depois disso, vira crédito para outra data.</p>
    <button class="m-janela__fechar" type="button">Entendi</button>
  </dialog>
</div>`,
  css:
`.m-janela__abrir, .m-janela__fechar {
  font: 700 14px system-ui, sans-serif; padding: 12px 18px; border-radius: 8px; border: 0; cursor: pointer;
  background: var(--m-destaque, #F5C542); color: #111; transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-janela__abrir:active, .m-janela__fechar:active { transform: scale(.97); }
.m-janela__dialogo {
  width: min(360px, 90vw); padding: 22px; border: 0; border-radius: 14px;
  background: #1A2422; color: #E7EDEB; box-shadow: 0 30px 80px -20px rgb(0 0 0 / .7);
}
.m-janela__dialogo[open] { animation: m-janela .22s cubic-bezier(.23, 1, .32, 1); }
.m-janela__dialogo::backdrop { background: rgb(0 0 0 / .5); }
.m-janela__dialogo h2 { margin: 0 0 8px; font-size: 19px; }
.m-janela__dialogo p { margin: 0 0 18px; font-size: 14px; line-height: 1.5; opacity: .8; }
@keyframes m-janela { from { opacity: 0; transform: scale(.96); } }   /* janela: do centro, sem sair do nada */`,
  js: function (raiz) {
    var dialogo = raiz.querySelector('dialog');
    raiz.querySelector('.m-janela__abrir').addEventListener('click', function () { dialogo.showModal(); });
    raiz.querySelector('.m-janela__fechar').addEventListener('click', function () { dialogo.close(); });
    dialogo.addEventListener('click', function (e) { if (e.target === dialogo) dialogo.close(); });   /* fundo fecha */
  }
},

/* ================= VISUAL ================= */
{
  id: 'compara', cat: 'Visual', nome: 'Antes e depois',
  desc: 'Arraste a barra: uma imagem recortada por cima da outra, sem elemento a mais.',
  assina: 'clip-path: inset(0 0 0 var(--p))',
  raiz: '.m-compara',
  html:
`<div class="m-compara" style="--p: 50%">
  <div class="m-compara__antes"><span>antes</span></div>
  <div class="m-compara__depois"><span>depois</span></div>
  <input type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois">
</div>`,
  css:
`.m-compara { position: relative; width: min(280px, 92%); height: 170px; border-radius: 10px; overflow: hidden; }
.m-compara__antes, .m-compara__depois { position: absolute; inset: 0; display: flex; align-items: flex-end; padding: 10px; }
.m-compara span { font: 700 11px ui-monospace, monospace; text-transform: uppercase; letter-spacing: .1em; background: rgb(0 0 0 / .45); color: #fff; padding: 4px 7px; border-radius: 4px; }
.m-compara__antes { background: linear-gradient(160deg, #4A4F55, #2A2D31); }
.m-compara__depois {
  justify-content: flex-end;
  background: radial-gradient(circle at 72% 30%, #F4D9A8 0 11%, transparent 12%), linear-gradient(to top, #6B4B5E, #D98E6B 70%, #F1B98C);
  clip-path: inset(0 0 0 var(--p));
}
.m-compara::after {
  content: ""; position: absolute; top: 0; bottom: 0; left: var(--p); width: 2px; margin-left: -1px;
  background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / .2); pointer-events: none;
}
.m-compara input {
  position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: ew-resize;
}
.m-compara input:focus-visible ~ * { outline: none; }
.m-compara:has(input:focus-visible) { outline: 2px solid var(--m-destaque, #F5C542); outline-offset: 3px; }`,
  js: function (raiz) {
    var faixa = raiz.querySelector('input');
    faixa.addEventListener('input', function () { raiz.style.setProperty('--p', faixa.value + '%'); });
  }
},
{
  id: 'camadas', cat: 'Visual', nome: 'Profundidade no mouse',
  desc: 'Três camadas andando em velocidades diferentes seguem o ponteiro. Passe o mouse.',
  assina: 'translate(x * profundidade)',
  raiz: '.m-camadas',
  html:
`<div class="m-camadas" aria-hidden="true">
  <span class="m-camadas__c" data-p="6"></span>
  <span class="m-camadas__b" data-p="14"></span>
  <span class="m-camadas__a" data-p="26"></span>
</div>`,
  css:
`.m-camadas { position: relative; width: 240px; height: 170px; }
.m-camadas span { position: absolute; border-radius: 16px; will-change: transform; }
.m-camadas__c { inset: 10px 30px 30px 10px; background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .1); }
.m-camadas__b { inset: 36px 60px 50px 44px; background: color-mix(in srgb, var(--m-destaque, #F5C542) 35%, #1A2422); }
.m-camadas__a { width: 70px; height: 70px; right: 34px; bottom: 26px; border-radius: 50%; background: var(--m-destaque, #F5C542); box-shadow: 0 16px 30px -10px rgb(0 0 0 / .6); }`,
  js: function (raiz) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var camadas = raiz.querySelectorAll('[data-p]'), alvo = { x: 0, y: 0 }, atual = { x: 0, y: 0 }, rodando = false;
    function passo() {
      atual.x += (alvo.x - atual.x) * .1; atual.y += (alvo.y - atual.y) * .1;
      camadas.forEach(function (c) {
        var p = +c.dataset.p;
        c.style.transform = 'translate(' + atual.x * p + 'px, ' + atual.y * p + 'px)';
      });
      if (Math.abs(alvo.x - atual.x) > .001 || Math.abs(alvo.y - atual.y) > .001) requestAnimationFrame(passo); else rodando = false;
    }
    function mover(x, y) { alvo.x = x; alvo.y = y; if (!rodando) { rodando = true; requestAnimationFrame(passo); } }
    var palco = raiz.parentElement || raiz;
    palco.addEventListener('pointermove', function (e) {
      var r = palco.getBoundingClientRect();
      mover((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5);
    });
    palco.addEventListener('pointerleave', function () { mover(0, 0); });
  }
},
{
  id: 'filtro', cat: 'Visual', nome: 'Grade que se reorganiza',
  desc: 'Ao filtrar, cada item desliza do lugar antigo para o novo. Use os botões.',
  assina: 'FLIP: mede, muda, desliza a diferença',
  raiz: '.m-filtro',
  html:
`<div class="m-filtro">
  <div class="m-filtro__botoes">
    <button type="button" data-f="todos" aria-pressed="true">todos</button>
    <button type="button" data-f="drink" aria-pressed="false">drinks</button>
    <button type="button" data-f="prato" aria-pressed="false">pratos</button>
  </div>
  <ul class="m-filtro__grade">
    <li data-t="drink">Gin tônica</li><li data-t="prato">Risoto</li>
    <li data-t="drink">Moscow mule</li><li data-t="drink">Negroni</li>
    <li data-t="prato">Ceviche</li><li data-t="prato">Bruschetta</li>
  </ul>
</div>`,
  css:
`.m-filtro { width: min(300px, 94%); }
.m-filtro__botoes { display: flex; gap: 6px; margin-bottom: 12px; }
.m-filtro__botoes button {
  font: 600 12px system-ui, sans-serif; padding: 7px 11px; border-radius: 99px; cursor: pointer; color: inherit;
  background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .14);
  transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-filtro__botoes button:active { transform: scale(.96); }
.m-filtro__botoes button[aria-pressed="true"] { background: var(--m-destaque, #F5C542); color: #111; border-color: transparent; }
.m-filtro__grade { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 0; padding: 0; list-style: none; }
.m-filtro__grade li {
  padding: 12px 8px; border-radius: 8px; text-align: center; font-size: 12.5px; font-weight: 600;
  background: #1A2422; border: 1px solid rgb(255 255 255 / .1);
}
.m-filtro__grade li[data-t="prato"] { border-color: color-mix(in srgb, var(--m-destaque, #F5C542) 50%, transparent); }
.m-filtro__grade li[hidden] { display: none; }`,
  js: function (raiz) {
    var itens = Array.prototype.slice.call(raiz.querySelectorAll('li'));
    var calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
    raiz.querySelectorAll('[data-f]').forEach(function (b) {
      b.addEventListener('click', function () {
        raiz.querySelectorAll('[data-f]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        var antes = itens.map(function (li) { return li.hidden ? null : li.getBoundingClientRect(); });   /* F: primeiro */
        itens.forEach(function (li) { li.hidden = b.dataset.f !== 'todos' && li.dataset.t !== b.dataset.f; });   /* L: último */
        if (calmo) return;
        itens.forEach(function (li, i) {
          if (li.hidden) return;
          var r = li.getBoundingClientRect(), a = antes[i];
          if (!a) { li.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: 'cubic-bezier(.23, 1, .32, 1)' }); return; }
          li.animate([{ transform: 'translate(' + (a.left - r.left) + 'px, ' + (a.top - r.top) + 'px)' }, { transform: 'none' }],   /* I + P */
            { duration: 300, easing: 'cubic-bezier(.23, 1, .32, 1)' });
        });
      });
    });
  }
},
{
  id: 'carrossel', cat: 'Visual', nome: 'Carrossel sem biblioteca',
  desc: 'Rolagem com encaixe do próprio CSS; os pontos acompanham e levam ao slide.',
  assina: 'scroll-snap-type: x mandatory',
  raiz: '.m-carrossel',
  html:
`<div class="m-carrossel">
  <div class="m-carrossel__trilho" tabindex="0" aria-label="Eventos">
    <div class="m-carrossel__slide">Casamento</div>
    <div class="m-carrossel__slide">Formatura</div>
    <div class="m-carrossel__slide">Corporativo</div>
    <div class="m-carrossel__slide">Aniversário</div>
  </div>
  <div class="m-carrossel__pontos"></div>
</div>`,
  css:
`.m-carrossel { width: min(280px, 92%); }
.m-carrossel__trilho {
  display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory;
  scroll-behavior: smooth; scrollbar-width: none; border-radius: 12px;
}
.m-carrossel__trilho::-webkit-scrollbar { display: none; }
.m-carrossel__slide {
  flex: 0 0 100%; height: 130px; scroll-snap-align: center; border-radius: 12px;
  display: grid; place-items: end start; padding: 14px; box-sizing: border-box;
  font-weight: 800; font-size: 18px; color: #fff;
  background: linear-gradient(to top, rgb(0 0 0 / .5), transparent 60%), linear-gradient(135deg, #6B4B5E, #D98E6B);
}
.m-carrossel__slide:nth-child(2) { background: linear-gradient(to top, rgb(0 0 0 / .5), transparent 60%), linear-gradient(135deg, #1F5F73, #A9CBD6); }
.m-carrossel__slide:nth-child(3) { background: linear-gradient(to top, rgb(0 0 0 / .5), transparent 60%), linear-gradient(135deg, #0E1516, #3B5057); }
.m-carrossel__slide:nth-child(4) { background: linear-gradient(to top, rgb(0 0 0 / .5), transparent 60%), linear-gradient(135deg, #9A6431, #F3D6A2); }
.m-carrossel__pontos { display: flex; justify-content: center; gap: 6px; margin-top: 10px; }
.m-carrossel__pontos button {
  width: 8px; height: 8px; padding: 0; border: 0; border-radius: 99px; cursor: pointer;
  background: rgb(255 255 255 / .25); transition: width .25s cubic-bezier(.23, 1, .32, 1), background-color .2s ease;
}
.m-carrossel__pontos button[aria-current="true"] { width: 22px; background: var(--m-destaque, #F5C542); }
@media (prefers-reduced-motion: reduce) { .m-carrossel__trilho { scroll-behavior: auto; } }`,
  js: function (raiz) {
    var trilho = raiz.querySelector('.m-carrossel__trilho'), slides = trilho.children, pontos = raiz.querySelector('.m-carrossel__pontos');
    Array.prototype.forEach.call(slides, function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      b.addEventListener('click', function () { trilho.scrollTo({ left: s.offsetLeft - trilho.offsetLeft }); });
      pontos.appendChild(b);
    });
    function marcar() {
      var i = Math.round(trilho.scrollLeft / trilho.clientWidth);
      Array.prototype.forEach.call(pontos.children, function (b, j) { b.setAttribute('aria-current', String(i === j)); });
    }
    trilho.addEventListener('scroll', marcar, { passive: true });
    marcar();
  }
},
{
  id: 'zap', cat: 'Visual', nome: 'Botão flutuante de WhatsApp',
  desc: 'Fica no canto, pulsa de leve para ser notado e para de pulsar quando o mouse chega.',
  assina: 'position: fixed + anel que pulsa',
  raiz: '.m-zap',
  html:
`<a class="m-zap" href="https://wa.me/5567999999999?text=Ol%C3%A1!%20Vim%20pelo%20site." target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm0 16.4c-1.4 0-2.8-.4-4-1.1l-.3-.2-2.7.7.7-2.6-.2-.3A7.4 7.4 0 1 1 12 19.4Zm4-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6 6 0 0 1-3-2.6c-.2-.4.2-.4.7-1.2.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.5 1.5.6 2 .7 2.7.6.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1l-.5-.3Z"/></svg>
</a>`,
  css:
`.m-zap {
  position: fixed; right: 20px; bottom: 20px; z-index: 50;
  width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center;
  background: #25D366; color: #fff; box-shadow: 0 12px 28px -8px rgb(0 0 0 / .5);
  transition: transform .16s cubic-bezier(.23, 1, .32, 1);
}
.m-zap::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid #25D366;
  animation: m-pulso 2.4s cubic-bezier(.22, .61, .36, 1) infinite;
}
@keyframes m-pulso { from { transform: scale(1); opacity: .6; } to { transform: scale(1.6); opacity: 0; } }
@media (hover: hover) and (pointer: fine) {
  .m-zap:hover { transform: scale(1.06); }
  .m-zap:hover::after { animation: none; opacity: 0; }
}
.m-zap:active { transform: scale(.95); }
@media (prefers-reduced-motion: reduce) { .m-zap::after { animation: none; opacity: 0; } }`,
  js: null
}
];

/* ============================================================
   A página: grade, filtro, janela do modelo, copiar e abrir sozinho.
   ============================================================ */
(function () {
  'use strict';
  var grade = document.getElementById('mod-grade');
  var MODELOS = window.GT_MODELOS;
  if (!grade || !MODELOS) return;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function doisDigitos(n) { return (n < 10 ? '0' : '') + n; }

  /* o JS de cada modelo, como texto: o corpo da função, sem o recuo do arquivo */
  function codigoJs(m) {
    if (!m.js) return '';
    var fonte = m.js.toString();
    var corpo = fonte.slice(fonte.indexOf('{') + 1, fonte.lastIndexOf('}')).replace(/^\n+|\s+$/g, '');
    var linhas = corpo.split('\n');
    var recuo = Math.min.apply(null, linhas.filter(function (l) { return l.trim(); }).map(function (l) { return l.match(/^ */)[0].length; }));
    corpo = linhas.map(function (l) { return '  ' + l.slice(recuo); }).join('\n');
    return "document.querySelectorAll('" + m.raiz + "').forEach(function (raiz) {\n" + corpo + '\n});';
  }
  function arquivo(m) {
    var js = codigoJs(m);
    return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(m.nome) + '</title>\n<style>\n' +
      ':root { --m-destaque: #F5C542; color-scheme: dark; }\n' +
      'body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0B1211; color: #E7EDEB; font-family: system-ui, sans-serif; }\n\n' +
      m.css + '\n</style>\n</head>\n<body>\n\n' + m.html + '\n\n' + (js ? '<script>\n' + js + '\n<\/script>\n' : '') + '</body>\n</html>\n';
  }

  /* o CSS de todos os modelos entra uma vez na página — é o mesmo texto que se copia */
  var estilo = document.createElement('style');
  estilo.textContent = MODELOS.map(function (m) { return m.css; }).join('\n\n');
  document.head.appendChild(estilo);

  function montar(m, alvo) {
    alvo.innerHTML = m.html;
    if (!m.js) return;
    alvo.querySelectorAll(m.raiz).forEach(function (raiz) {
      try { m.js(raiz); } catch (e) { /* um modelo quebrado não derruba os outros */ }
    });
  }

  /* ---------- a grade ---------- */
  MODELOS.forEach(function (m, i) {
    var cel = document.createElement('article');
    cel.className = 'mod-cel' + (i % 5 === 1 ? ' mod-cel--destaque' : '');
    cel.id = 'm-' + m.id;
    cel.setAttribute('data-cat', m.cat);
    cel.innerHTML =
      '<div class="mod-cel__palco"></div>' +
      '<button class="mod-cel__abrir" type="button">' +
        '<span class="mod-cel__num">' + doisDigitos(i + 1) + ' · ' + esc(m.cat) + '</span>' +
        '<span class="mod-cel__nome">' + esc(m.nome) + '<span class="mod-cel__seta" aria-hidden="true">→</span></span>' +
        '<span class="mod-cel__desc">' + esc(m.desc) + '</span>' +
        '<code class="mod-cel__assina">' + esc(m.assina) + '</code>' +
      '</button>';
    montar(m, cel.querySelector('.mod-cel__palco'));
    cel.querySelector('.mod-cel__abrir').addEventListener('click', function () { abrir(m, i); });
    grade.appendChild(cel);
  });

  /* ---------- filtro por categoria ---------- */
  var filtros = document.getElementById('mod-filtros');
  if (filtros) {
    var cats = ['Todos'].concat(MODELOS.map(function (m) { return m.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    filtros.innerHTML = cats.map(function (c, i) {
      var n = c === 'Todos' ? MODELOS.length : MODELOS.filter(function (m) { return m.cat === c; }).length;
      return '<button class="mod-filtro" type="button" data-cat="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' + esc(c) + ' <span>' + n + '</span></button>';
    }).join('');
    filtros.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-cat]');
      if (!b) return;
      var cat = b.getAttribute('data-cat');
      filtros.querySelectorAll('[data-cat]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      grade.querySelectorAll('.mod-cel').forEach(function (cel) { cel.hidden = cat !== 'Todos' && cel.getAttribute('data-cat') !== cat; });
    });
  }

  /* ---------- a lista por categoria, no fim ---------- */
  var indice = document.getElementById('mod-indice');
  if (indice) {
    var porCat = {};
    MODELOS.forEach(function (m, i) { (porCat[m.cat] = porCat[m.cat] || []).push([m, i]); });
    indice.innerHTML = Object.keys(porCat).map(function (c) {
      return '<div class="mod-indice__grupo"><p class="mod-indice__rot">' + esc(c) + '</p>' +
        porCat[c].map(function (p) { return '<a href="#m-' + p[0].id + '">' + esc(p[0].nome) + '<span aria-hidden="true">→</span></a>'; }).join('') + '</div>';
    }).join('');
  }

  /* ---------- a janela do modelo ---------- */
  var janela = document.createElement('dialog');
  janela.className = 'mod-janela';
  janela.setAttribute('aria-labelledby', 'mod-janela-titulo');
  janela.innerHTML =
    '<div class="mod-janela__barra"><div><p class="mod-janela__num"></p><h2 class="mod-janela__titulo" id="mod-janela-titulo"></h2></div>' +
    '<button class="mod-janela__fechar" type="button" aria-label="Fechar">×</button></div>' +
    '<p class="mod-janela__desc"></p>' +
    '<div class="mod-janela__palco"></div>' +
    '<div class="mod-janela__acoes">' +
      '<button class="mod-botao mod-botao--cheio" type="button" data-acao="tudo">Copiar tudo (um arquivo .html)</button>' +
      '<button class="mod-botao" type="button" data-acao="sozinho">Abrir sozinho ↗</button>' +
      '<a class="mod-botao mod-janela__ref" hidden>De onde vem →</a>' +
    '</div>' +
    '<div class="mod-janela__codigos"></div>';
  document.body.appendChild(janela);
  var atual = null;

  function copiarTexto(texto, botao) {
    var antes = botao.textContent;
    function feito(ok) { botao.textContent = ok ? 'copiado ✓' : 'não deu'; setTimeout(function () { botao.textContent = antes; }, 1400); }
    if (navigator.clipboard && location.protocol !== 'file:') navigator.clipboard.writeText(texto).then(function () { feito(true); }, function () { feito(false); });
    else feito(false);
  }
  function bloco(ling, texto) {
    return '<div class="bloco-codigo"><div class="bloco-codigo__barra"><span class="bloco-codigo__ling" data-l="' + ling + '">' + ling + '</span>' +
      '<button class="copiar mod-copiar" type="button">copiar</button></div><pre><code>' + esc(texto) + '</code></pre></div>';
  }
  function abrir(m, i) {
    if (!janela.showModal) return;
    atual = m;
    janela.querySelector('.mod-janela__num').textContent = doisDigitos(i + 1) + ' · ' + m.cat;
    janela.querySelector('.mod-janela__titulo').textContent = m.nome;
    janela.querySelector('.mod-janela__desc').textContent = m.desc;
    montar(m, janela.querySelector('.mod-janela__palco'));
    var ref = janela.querySelector('.mod-janela__ref');
    ref.hidden = !m.ref;
    if (m.ref) ref.href = m.ref;
    var js = codigoJs(m);
    janela.querySelector('.mod-janela__codigos').innerHTML = bloco('html', m.html) + bloco('css', m.css) + (js ? bloco('js', js) : '');
    janela.querySelectorAll('.mod-copiar').forEach(function (b) {
      b.addEventListener('click', function () { copiarTexto(b.closest('.bloco-codigo').querySelector('code').textContent, b); });
    });
    janela.showModal();
    janela.scrollTop = 0;
    if (history.replaceState) history.replaceState(null, '', '#m-' + m.id);
  }
  janela.querySelector('.mod-janela__fechar').addEventListener('click', function () { janela.close(); });
  janela.addEventListener('click', function (e) { if (e.target === janela) janela.close(); });
  janela.addEventListener('close', function () {
    janela.querySelector('.mod-janela__palco').innerHTML = '';   /* para animação e observador da cópia */
    atual = null;
    if (history.replaceState) history.replaceState(null, '', location.pathname);
  });
  janela.querySelector('[data-acao="tudo"]').addEventListener('click', function () { if (atual) copiarTexto(arquivo(atual), this); });
  janela.querySelector('[data-acao="sozinho"]').addEventListener('click', function () {
    if (!atual) return;
    /* o arquivo inteiro vira um endereço local do navegador: nada sai daqui */
    var url = URL.createObjectURL(new Blob([arquivo(atual)], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  });

  /* link direto para um modelo: modelos.html#m-toast abre a janela dele */
  function peloEndereco() {
    var id = location.hash.replace('#m-', '');
    for (var i = 0; i < MODELOS.length; i++) if (MODELOS[i].id === id) { abrir(MODELOS[i], i); return; }
  }
  peloEndereco();
  window.addEventListener('hashchange', peloEndereco);
})();
