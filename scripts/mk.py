# -*- coding: utf-8 -*-
"""mk.py new <arq> <titulo> <desc> <lead> <link-antes>   |   mk.py add <arq>"""
import re, glob, sys, os
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
BLOCO = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'blocos')
os.chdir(SITE)

def topicos_toc(partes):
    out = []
    for sec in re.finditer(r'<section class="parte" id="(s\d+)">(.*?)\n</section>', partes, re.S):
        sid, corpo = sec.group(1), sec.group(2)
        num = re.search(r'PARTE (\d+)</span><h2>(.*?)</h2>', corpo)
        out.append('<a class="sumario__parte" href="#%s">%s · %s</a>' % (sid, num.group(1), num.group(2)))
        out.append('<ol>')
        for t in re.finditer(r'<article class="topico" id="([^"]+)"[^>]*>\s*<div class="topico__cabeca"><h3>(.*?)</h3>', corpo, re.S):
            out.append('<li><a href="#%s">%s</a></li>' % (t.group(1), t.group(2)))
        out.append('</ol>')
    return '\n'.join(out)

def novas_partes():
    fs = sorted(glob.glob(BLOCO + '/p*.html'), key=lambda f: int(re.search(r'p(\d+)', f).group(1)))
    return ''.join(open(f, encoding='utf-8').read() for f in fs)

modo = sys.argv[1]
partes = novas_partes()

if modo == 'new':
    arq, titulo, desc, lead, antes = sys.argv[2:7]
    rotulo = sys.argv[7]
    link = '<a href="%s"><strong>%s</strong><span>%s</span></a>' % (arq, titulo, rotulo)
    modelo = open('movimento.html', encoding='utf-8').read()
    menu = re.search(r'<nav class="navmenu".*?</nav>', modelo, re.S).group(0)
    menu = menu.replace(' class="is-atual"', '')
    menu = re.sub(r'<span class="navmenu__aqui">.*?</span>', '', menu, flags=re.S)
    menu = menu.replace('<a href="%s">' % antes, link + '\n<a href="%s">' % antes)

    for f in glob.glob('*.html'):
        if f in (arq, 'artifact-index.html'): continue
        h = open(f, encoding='utf-8').read()
        if arq in h: continue
        h = re.sub(r'(<a href="%s"(?: class="is-atual")?><strong>)' % antes, link + r'\n\1', h, count=1)
        open(f, 'w', encoding='utf-8').write(h)

    mp = menu.replace('<a href="%s">' % arq, '<a href="%s" class="is-atual">' % arq)
    mp = mp.rstrip()[:-6] + '<span class="navmenu__aqui">%s</span>\n</nav>' % titulo
    np_, nt = partes.count('class="parte"'), partes.count('class="topico"')
    pag = open(BLOCO + '/molde.html', encoding='utf-8').read()
    pag = pag.replace('{{T}}', titulo).replace('{{D}}', desc).replace('{{LEAD}}', lead)
    pag = pag.replace('{{MENU}}', mp).replace('{{SUM}}', '<p class="sumario__titulo">%s</p>\n' % titulo + topicos_toc(partes))
    pag = pag.replace('{{NP}}', str(np_)).replace('{{NT}}', str(nt)).replace('{{PARTES}}', partes)
    open(arq, 'w', encoding='utf-8').write(pag)
    print('%s: %d partes, %d topicos' % (arq, np_, nt))

elif modo == 'add':
    arq = sys.argv[2]
    h = open(arq, encoding='utf-8').read()
    ultimo = max(int(x) for x in re.findall(r'<section class="parte" id="s(\d+)">', h))
    ultimo_num = max(int(x) for x in re.findall(r'PARTE (\d+)</span>', h))
    # renumera o bloco novo
    for i, sec in enumerate(re.findall(r'<section class="parte" id="s(\d+)">', partes)):
        partes = partes.replace('id="s%s">' % sec, 'id="s@%d">' % (ultimo + i + 1), 1)
    for i, n in enumerate(re.findall(r'PARTE (\d+)</span>', partes)):
        partes = partes.replace('PARTE %s</span>' % n, 'PARTE @%d</span>' % (ultimo_num + i + 1), 1)
    partes = partes.replace('id="s@', 'id="s').replace('PARTE @', 'PARTE ')
    h = h.replace('\n</main>', '\n\n' + partes + '\n</main>')
    # sumário
    novo_toc = topicos_toc(partes)
    h = h.replace('</div>\n</nav>\n<main class="leitura">', novo_toc + '\n</div>\n</nav>\n<main class="leitura">')
    np_, nt = h.count('class="parte"'), h.count('class="topico"')
    h = re.sub(r'<span>\d+ partes? · \d+ tópicos</span>', '<span>%d partes · %d tópicos</span>' % (np_, nt), h)
    open(arq, 'w', encoding='utf-8').write(h)
    print('%s: agora %d partes, %d topicos' % (arq, np_, nt))
