# -*- coding: utf-8 -*-
import re, os, datetime
import os, sys
# roda a partir da raiz do repositório, não importa de onde foi chamado
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

def arquivo_de(loc):
    if loc.endswith('/'): return 'index.html'
    return loc.rsplit('/', 1)[-1]

txt = open('sitemap.xml', encoding='utf-8').read()

def sub(m):
    bloco = m.group(0)
    loc = re.search(r'<loc>(.*?)</loc>', bloco).group(1)
    arq = arquivo_de(loc)
    if not os.path.exists(arq):
        return bloco
    data = datetime.date.fromtimestamp(os.path.getmtime(arq)).isoformat()
    return re.sub(r'<lastmod>.*?</lastmod>', '<lastmod>%s</lastmod>' % data, bloco)

novo = re.sub(r'<url>.*?</url>', sub, txt, flags=re.S)
open('sitemap.xml', 'w', encoding='utf-8').write(novo)
print('sitemap.xml atualizado')
