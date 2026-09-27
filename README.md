# Conta-AI

Inventário de campo: registro de patrimônio (módulos, ar-condicionados,
banheiros, sobretetos e caixas de dejetos) com localização por GPS,
responsável e data/hora automáticos. Sem login — abre pelo link e já
funciona.

## Estrutura

- `index.html` — o app (front-end). É estático, não precisa de build.
- `Codigo.gs` — backend em Google Apps Script, usa uma planilha do
  Google Sheets como banco de dados.

## Deploy do backend (uma vez só)

1. Crie uma planilha nova no Google Sheets.
2. Extensões → Apps Script → cole o conteúdo de `Codigo.gs`.
3. Rode a função `configurarPlanilha` uma vez (autoriza o acesso e cria
   a aba "Registros").
4. Implantar → Nova implantação → tipo "App da Web" → executar como
   "Eu" → acesso "Qualquer pessoa". Copie a URL que termina em `/exec`.
5. Em `index.html`, cole essa URL na constante `DEFAULT_API_URL` no
   início do `<script>`.

## Deploy do front-end

Importe este repositório no Vercel (Add New → Project) e faça o
deploy. Como é um HTML estático, não precisa de nenhuma configuração
de build.

Depois de publicado, o link pode ser enviado direto para o celular
das equipes de campo — não precisa de login nem instalação.
