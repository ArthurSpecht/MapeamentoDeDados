# Mapeamento de Dados (LGPD)

## Requisitos

- Node.js 18.17+ (recomendado 20+)
- PostgreSQL 15+ local, remoto ou via Render

## Rodar localmente

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Acesse:

- http://localhost:3002
- http://localhost:3002/atividades-tratamento

## Banco de dados (PostgreSQL)

Opcional (via Docker):
- `docker compose up -d`

1. Copie o arquivo `.env.example` para `.env` e ajuste o `DATABASE_URL`
2. Defina também uma chave forte em `AUTH_SECRET` para login e sessão
3. Crie as tabelas:
   - `npm run prisma:migrate`

## Deploy no Render

O projeto ja esta preparado com o arquivo `render.yaml`.

### O que sera criado no Render

- 1 Web Service Node.js
- 1 banco PostgreSQL gerenciado
- Variavel `DATABASE_URL` vinculada automaticamente ao banco
- Variavel `AUTH_SECRET` deve ser configurada manualmente no serviço web
- Execucao de migrations antes do deploy com `npm run prisma:deploy`

### Passo a passo

1. Suba este repositorio para GitHub, GitLab ou Bitbucket
2. No Render, escolha **Blueprint** ou **New + > Blueprint**
3. Aponte para o repositorio com este `render.yaml`
4. Confirme a criacao do serviço `mapemaneto-de-dados` e do banco `mapemaneto-de-dados-db`
5. Aguarde o primeiro deploy
6. No serviço web, configure a variável `AUTH_SECRET` com uma chave segura

### Comandos de deploy configurados

- `buildCommand`: `npm install && npm run prisma:generate && npm run build`
- `preDeployCommand`: `npm run prisma:deploy`
- `startCommand`: `npx next start --hostname 0.0.0.0 --port $PORT`

### Observacoes

- O Render injeta a `DATABASE_URL` no serviço web a partir do banco criado no `render.yaml`
- As migrations versionadas estao em `prisma/migrations`
- Se voce alterar o schema depois, rode localmente `npm run prisma:migrate`, commite a nova migration e faca novo deploy
- Para ambiente local, mantenha seu `.env` separado do Render

## Se não abrir

1. Verifique a versão do Node:
   - `node -v`
2. Limpe cache/artefatos e reinstale:
   - rode `npm run clean`
   - rode `npm install` novamente (se necessário)
   - faça um hard refresh no navegador (Ctrl+F5)
3. Se você ver 404 para arquivos do /_next (webpack.js, react-refresh.js, etc):
   - pare o servidor, rode `npm run clean` e inicie novamente
3. Se a porta 3002 estiver ocupada:
   - `npm run dev -- -p 3003`
