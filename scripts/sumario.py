# -*- coding: utf-8 -*-
import re, sys
arq = sys.argv[1]
h = open(arq, encoding='utf-8').read()
titulo = re.search(r'<p class="sumario__titulo">(.*?)</p>', h).group(1)
corpo = h[h.index('<main class="leitura'):]
linhas = ['<p class="sumario__titulo">%s</p>' % titulo]
for sec in re.finditer(r'<section class="parte" id="(s\d+)">(.*?)\n</section>', corpo, re.S):
    sid, txt = sec.group(1), sec.group(2)
    num = re.search(r'PARTE (\d+)</span>\s*<h2>(.*?)</h2>', txt, re.S)
    if not num: continue
    linhas.append('<a class="sumario__parte" href="#%s">%s · %s</a>' % (sid, num.group(1), num.group(2)))
    linhas.append('<ol>')
    for t in re.finditer(r'<article class="topico" id="([^"]+)"[^>]*>\s*<div class="topico__cabeca">\s*<h3>(.*?)</h3>', txt, re.S):
        linhas.append('<li><a href="#%s">%s</a></li>' % (t.group(1), t.group(2)))
    linhas.append('</ol>')
novo = '\n'.join(linhas)
ini = h.index('<p class="sumario__titulo">'); fim = h.index('</div>\n</nav>')
h = h[:ini] + novo + '\n' + h[fim:]
np_, nt = h.count('class="parte"'), h.count('class="topico"')
h = re.sub(r'<span>\d+ partes? · \d+ tópicos</span>', '<span>%d partes · %d tópicos</span>' % (np_, nt), h)
open(arq, 'w', encoding='utf-8').write(h)
print('%s: %d partes, %d topicos, %d itens' % (arq, np_, nt, novo.count('<li>')))
