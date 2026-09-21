/* ============================================================
   _ferramentas.mjs — a lista única das ferramentas.
   Hub (index) → página (ferramentas.html) → subpágina (uma por ferramenta).
   navmenu, verificar, indice, sitemap e ferramentas.mjs leem daqui.
   O ferramentas.js tem o mesmo mapa id → arquivo (PAGINA_DE): ferramenta
   nova entra nos dois lugares.
   ============================================================ */
export const FASES = [
  { n: 1, id: 'fase-1', nome: 'Antes do projeto' },
  { n: 2, id: 'fase-2', nome: 'Identidade' },
  { n: 3, id: 'fase-3', nome: 'Montar a página' },
  { n: 4, id: 'fase-4', nome: 'Entregar' },
];

export const FERRAMENTAS = [
  { id: 'f-briefing',   arquivo: 'ferramenta-briefing.html',      nome: 'Briefing',                 fase: 1 },
  { id: 'f-preco',      arquivo: 'ferramenta-preco.html',         nome: 'Preço',                    fase: 1 },
  { id: 'f-proposta',   arquivo: 'ferramenta-proposta.html',      nome: 'Proposta que fecha',       fase: 1 },
  { id: 'f-paleta',     arquivo: 'ferramenta-paleta.html',        nome: 'Paleta em tokens',         fase: 2 },
  { id: 'f-contraste',  arquivo: 'ferramenta-contraste.html',     nome: 'Contraste',                fase: 2 },
  { id: 'f-fonte',      arquivo: 'ferramenta-tipografia.html',    nome: 'Tipografia',               fase: 2 },
  { id: 'f-escala',     arquivo: 'ferramenta-escala.html',        nome: 'Escala de texto e espaço', fase: 2 },
  { id: 'f-sistema',    arquivo: 'ferramenta-design-system.html', nome: 'Design system',            fase: 2 },
  { id: 'f-gerador',    arquivo: 'ferramenta-gerador.html',       nome: 'Gerador de comando',       fase: 3, scripts: ['gerador.js'] },
  { id: 'f-head',       arquivo: 'ferramenta-cabecalho.html',     nome: 'Cabeçalho da página',      fase: 3 },
  { id: 'f-zap',        arquivo: 'ferramenta-whatsapp.html',      nome: 'Link de WhatsApp',         fase: 3 },
  { id: 'f-utm',        arquivo: 'ferramenta-utm.html',           nome: 'Gerador de UTM',           fase: 3 },
  { id: 'f-checklist',  arquivo: 'ferramenta-checklist.html',     nome: 'Checklist de entrega',     fase: 4 },
  { id: 'f-inventario', arquivo: 'ferramenta-inventario.html',    nome: 'Inventário de acessos',    fase: 4 },
];

export const ARQUIVOS = FERRAMENTAS.map((f) => f.arquivo);
