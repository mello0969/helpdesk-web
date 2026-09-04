# HelpDesk Web — Front-end consumidor da API

Front-end estático (HTML + CSS + JavaScript puro, sem frameworks) que
consome a HelpDesk API de forma assíncrona via `fetch`.

## Como rodar localmente

1. Suba a `helpdesk-api` primeiro (veja o README dela) — por padrão em
   `http://localhost:4000`.
2. Abra o arquivo `js/api.js` e confira se `API_URL` aponta pro endereço
   certo da API (local ou em produção).
3. Abra `index.html` no navegador. Recomendado usar a extensão **Live
   Server** do VS Code, ou:
   ```bash
   npx serve .
   ```
   (não pode ser aberto direto como `file://` em alguns navegadores por
   causa de CORS — sirva como um servidor HTTP simples).

## Deploy em produção (Vercel)

Veja o guia completo em `DEPLOY.md` na raiz do repositório principal.

Resumindo: suba esta pasta como um projeto estático no Vercel, copie a URL
gerada (ex: `https://seu-helpdesk-web.vercel.app`) e configure essa mesma
URL na variável `FRONTEND_URL` do `.env` da API (pra liberar o CORS), e
atualize `API_URL` em `js/api.js` com a URL da API publicada no Render.
