# -*- coding: utf-8 -*-
import re, os
import os, sys
# roda a partir da raiz do repositório, não importa de onde foi chamado
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

# (href, label_forte, label_descricao)
GRUPOS = [
    ('Construção', [
        ('html-puro.html', 'HTML puro', 'Do zero ao site publicado'),
        ('qualidade.html', 'Qualidade', 'Imagem, a11y, Vitals e testes'),
        ('movimento.html', 'Movimento', 'Animação com critério'),
        ('motion.html', 'Referência: Motion', 'A API inteira, em português'),
        ('frameworks.html', 'Frameworks', 'Formatos além do vanilla'),
        ('back-end.html', 'Back-end', 'Servidor, banco e login'),
    ], None),
    ('Captação e Vendas', [
        ('landing-pages.html', 'Landing pages', 'A estratégia da página'),
        ('trafego.html', 'Tráfego', 'Ser encontrado no Google'),
        ('negocio.html', 'Negócio', 'Preço, escopo e contrato'),
    ], None),
    ('Método', [
        ('fluxo.html', 'Fluxo de trabalho', 'Terminal, Git e DevTools'),
        ('ia.html', 'Trabalhando com IA', 'Brief, referência e o gerador'),
        ('colofao.html', 'Colofão', 'Como este site foi feito'),
    ], None),
    ('Ferramentas', [
        ('ferramentas.html', 'Ferramentas', 'As doze do dia a dia'),
        ('ferramentas.html#f-checklist', 'Checklist de entrega', 'Antes de publicar'),
        ('ferramentas.html#f-proposta', 'Proposta que fecha', 'Os oito pontos'),
        ('ferramentas.html#f-briefing', 'Briefing', 'As dez perguntas'),
        ('ferramentas.html#f-zap', 'Link de WhatsApp', 'Com a mensagem pronta'),
        ('ferramentas.html#f-utm', 'Gerador de UTM', 'Rastrear a origem'),
        ('ia.html#t-ia-gerador', 'Gerador de comando', 'Brief para a IA'),
    ], 'navmenu__grupo--trabalhar'),
    ('Patch notes', [
        ('patch-notes.html', 'Patch notes', 'O que mudou no site'),
    ], None),
]

# arquivo -> (href que fica 'is-atual', texto do navmenu__aqui) — None = nenhum dos dois (home/404)
# arquivo -> modo do alternador ('estudo', 'trabalho' ou None)
MODO = {
    'ferramentas.html': 'trabalho',
}
for _a in ['html-puro.html','html-puro-2.html','qualidade.html','movimento.html','motion.html',
           'frameworks.html','back-end.html','landing-pages.html','trafego.html','negocio.html',
           'fluxo.html','ia.html','estudar.html']:
    MODO[_a] = 'estudo'

PAGINA = {
    'estudar.html':        (None, None),
    'html-puro.html':      ('html-puro.html', 'HTML puro'),
    'html-puro-2.html':    ('html-puro.html', 'HTML puro · parte 2'),
    'qualidade.html':      ('qualidade.html', 'Qualidade'),
    'movimento.html':      ('movimento.html', 'Movimento'),
    'motion.html':         ('motion.html', 'Referência: Motion'),
    'frameworks.html':     ('frameworks.html', 'Frameworks'),
    'back-end.html':       ('back-end.html', 'Back-end'),
    'landing-pages.html':  ('landing-pages.html', 'Landing pages'),
    'trafego.html':        ('trafego.html', 'Tráfego'),
    'negocio.html':        ('negocio.html', 'Negócio'),
    'fluxo.html':          ('fluxo.html', 'Fluxo de trabalho'),
    'ia.html':             ('ia.html', 'Trabalhando com IA'),
    'colofao.html':        ('colofao.html', 'Colofão'),
    'patch-notes.html':    ('patch-notes.html', 'Patch notes'),
    'ferramentas.html':    ('ferramentas.html', None),
    'index.html':          None,
    '404.html':            None,
}

def montar_nav(arquivo):
    atual = PAGINA[arquivo]
    href_atual, aqui_texto = atual if atual else (None, None)

    partes = ['<nav class="navmenu" aria-label="Navegação do site">',
              '<details class="navmenu__caixa" id="navmenu">',
              '<summary class="navmenu__botao">Menu<span aria-hidden="true">&#9662;</span></summary>',
              '<div class="navmenu__painel">']
    for rotulo, links, classe_extra in GRUPOS:
        cls = 'navmenu__grupo' + (' ' + classe_extra if classe_extra else '')
        partes.append('<div class="%s">' % cls)
        partes.append('<p class="navmenu__rotulo">%s</p>' % rotulo)
        for href, forte, desc in links:
            atual_attr = ' class="is-atual"' if href == href_atual else ''
            partes.append('<a href="%s"%s><strong>%s</strong><span>%s</span></a>' % (href, atual_attr, forte, desc))
        partes.append('</div>')
    partes.append('</div>')
    partes.append('</details>')
    modo = MODO.get(arquivo)
    partes.append('<div class="modos">')
    partes.append('<a class="modo%s" href="estudar.html">Estudar</a>' %
                  (' is-atual' if modo == 'estudo' else ''))
    partes.append('<a class="modo modo--trabalho%s" href="ferramentas.html">Trabalhar</a>' %
                  (' is-atual' if modo == 'trabalho' else ''))
    partes.append('</div>')
    if aqui_texto:
        partes.append('<span class="navmenu__aqui">%s</span>' % aqui_texto)
    partes.append('</nav>')
    return '\n'.join(partes)

alterados, iguais, problemas = [], [], []
for arq in PAGINA:
    if not os.path.exists(arq):
        print('AVISO: nao existe ->', arq)
        continue
    h = open(arq, encoding='utf-8').read()
    if not re.search(r'<nav class="navmenu" aria-label="[^"]*">.*?</nav>', h, re.S):
        print('ERRO: nao achei o <nav class="navmenu"> em', arq)
        problemas.append(arq)
        continue
    novo_bloco = montar_nav(arq)
    h2 = re.sub(r'<nav class="navmenu" aria-label="[^"]*">.*?</nav>', novo_bloco, h, count=1, flags=re.S)
    if h2 == h:
        iguais.append(arq)
        continue
    open(arq, 'w', encoding='utf-8').write(h2)
    alterados.append(arq)

print('atualizados:', len(alterados), '| ja estavam certos:', len(iguais), '| com problema:', len(problemas))
for a in alterados: print('  atualizado:', a)
for a in problemas: print('  PROBLEMA:', a)
