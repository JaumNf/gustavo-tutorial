/* ============================================================
   _texto.mjs — leitura/escrita de texto com normalização de fim de
   linha, para casar com o "universal newlines" do Python: lê
   convertendo \r\n para \n (para regex e indexOf com \n literal
   funcionarem igual em CRLF e LF), escreve convertendo \n de volta
   para \r\n — a convenção já usada nos arquivos deste repositório.
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';

export function lerTexto(caminho) {
  return readFileSync(caminho, 'utf-8').replace(/\r\n/g, '\n');
}

export function escreverTexto(caminho, conteudo) {
  writeFileSync(caminho, conteudo.replace(/\n/g, '\r\n'), 'utf-8');
}
