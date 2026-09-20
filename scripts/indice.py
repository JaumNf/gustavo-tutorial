# -*- coding: utf-8 -*-
import re, json, glob, os
import os, sys
# roda a partir da raiz do repositório, não importa de onde foi chamado
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

TRILHAS = {
 'html-puro.html':'HTML puro', 'html-puro-2.html':'HTML puro', 'fluxo.html':'Fluxo de trabalho', 'qualidade.html':'Qualidade',
 'landing-pages.html':'Landing pages', 'trafego.html':'Tráfego', 'movimento.html':'Movimento',
 'motion.html':'Referência: Motion', 'frameworks.html':'Frameworks', 'back-end.html':'Back-end',
 'negocio.html':'Negócio', 'ferramentas.html':'Ferramentas', 'ia.html':'Trabalhando com IA', 'colofao.html':'Colofão',
 'patch-notes.html':'Patch notes',
}
def limpo(s):
    s = re.sub(r'<[^>]+>', '', s)
    s = (s.replace('&lt;','<').replace('&gt;','>').replace('&amp;','&')
          .replace('&#9662;','').replace('&quot;','"').replace('&nbsp;',' '))
    return re.sub(r'\s+', ' ', s).strip()

itens = []
for arq, trilha in TRILHAS.items():
    if not os.path.exists(arq): continue
    h = open(arq, encoding='utf-8').read()
    corpo = h[h.index('<main'):]
    for sec in re.finditer(r'<section class="parte" id="[^"]+">(.*?)\n</section>', corpo, re.S):
        txt = sec.group(1)
        pn = re.search(r'(?:PARTE (\d+)|FERRAMENTA)</span>\s*<h2>(.*?)</h2>', txt, re.S)
        parte = (('%s · %s' % (pn.group(1), limpo(pn.group(2)))) if pn and pn.group(1) else (limpo(pn.group(2)) if pn else ''))
        if arq == 'ferramentas.html':
            sid = re.search(r'<section class="parte" id="([^"]+)">', sec.group(0))
            itens.append({'t': limpo(pn.group(2)), 'p': 'Ferramenta', 'u': arq + '#' + (sid.group(1) if sid else ''),
                          'r': 'Ferramentas', 'd': limpo(re.search(r'<p class="parte__resumo">(.*?)</p>', txt, re.S).group(1))[:150], 'g': ''})
            continue
        for t in re.finditer(
            r'<article class="topico" id="([^"]+)"[^>]*>\s*<div class="topico__cabeca">\s*<h3>(.*?)</h3>(.*?)</div>\s*<div class="topico__corpo[^"]*">(.*?)(?=<div class="nota"|<div class="bloco-codigo"|<div class="tabela-caixa"|</div>)',
            txt, re.S):
            tags = ' '.join(re.findall(r'<span class="tag tag--(\w+)"', t.group(3)))
            trecho = limpo(t.group(4))[:150]
            itens.append({'t': limpo(t.group(2)), 'p': parte, 'u': arq + '#' + t.group(1),
                          'r': trilha, 'd': trecho, 'g': tags})
    # páginas sem .parte (colofão)
    if not re.search(r'<section class="parte"', corpo):
        for hh in re.finditer(r'<h2[^>]*>(.*?)</h2>', corpo, re.S):
            itens.append({'t': limpo(hh.group(1)), 'p': '', 'u': arq, 'r': trilha, 'd': '', 'g': ''})

open('busca-indice.js','w',encoding='utf-8').write(
    '/* gerado automaticamente — não editar à mão */\nwindow.GT_BUSCA=' +
    json.dumps(itens, ensure_ascii=False, separators=(',',':')) + ';\n')
print('itens indexados:', len(itens), '|', os.path.getsize('busca-indice.js')//1024, 'KB')
