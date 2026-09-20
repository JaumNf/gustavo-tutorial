# -*- coding: utf-8 -*-
import re, json, os
import os, sys
# roda a partir da raiz do repositório, não importa de onde foi chamado
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

TRILHAS = [
 'html-puro.html', 'fluxo.html', 'qualidade.html', 'landing-pages.html',
 'trafego.html', 'movimento.html', 'motion.html', 'frameworks.html',
 'back-end.html', 'negocio.html', 'ia.html',
]
# paginas extras cujos topicos contam para a trilha-base indicada
# (trilha longa dividida em mais de um arquivo, mas um so card na home)
EXTRAS = { 'html-puro.html': ['html-puro-2.html'] }

mapa = {}
for arq in TRILHAS:
    h = open(arq, encoding='utf-8').read()
    ids = re.findall(r'<article class="topico" id="([^"]+)"', h)
    for extra in EXTRAS.get(arq, []):
        he = open(extra, encoding='utf-8').read()
        ids += re.findall(r'<article class="topico" id="([^"]+)"', he)
    mapa[arq] = ids

open('progresso.js', 'w', encoding='utf-8').write(
    '/* gerado automaticamente — não editar à mão. usado pela home para mostrar progresso. */\n'
    'window.GT_PROGRESSO=' + json.dumps(mapa, ensure_ascii=False, separators=(',', ':')) + ';\n'
)
total = sum(len(v) for v in mapa.values())
print('trilhas:', len(mapa), '| topicos:', total, '|', os.path.getsize('progresso.js'), 'bytes')
