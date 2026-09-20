# Gustavo Tutorial

Material de estudo de desenvolvimento web em português, mais as ferramentas do dia a dia de
projeto de cliente. HTML, CSS e JavaScript puros — sem framework, sem etapa de build.

No ar: https://gustavo-tutorial.vercel.app/

## Rodar localmente

Não precisa instalar nada para ver o site. Qualquer servidor estático serve:

    python3 -m http.server 8000

E abra http://localhost:8000

## Depois de mexer no conteúdo

    python3 scripts/indice.py      # regera o índice da busca
    python3 scripts/sumario.py html-puro.html   # regera o sumário daquela trilha
    python3 scripts/sitemap.py     # atualiza as datas do sitemap

## Antes de publicar

    npm install playwright        # só na primeira vez, só para testar
    npx playwright install chromium
    node scripts/verificar.mjs

A suíte sobe um servidor sozinha, abre todas as páginas em desktop e celular, e falha se achar
overflow horizontal, âncora quebrada, erro de JavaScript ou menu com contagem errada.

## Publicar

Push na branch principal. A Vercel republica sozinha.

As convenções do projeto — o que é gerado por script, o que nunca editar à mão, o critério para
uma ferramenta nova entrar — estão em `CLAUDE.md`.
