# CodeTrail Web

Projeto standalone da versao web do CodeTrail, separado na raiz do repositorio em `CodeTrailWeb`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase SSR
- Stripe

## Escopo atual

- landing page institucional
- autenticacao web
- workspace protegido em `/workspace`
- dashboard, trilhas, sessoes, tarefas, revisoes, projetos, notas, flashcards, mind maps, analytics, configuracoes e billing
- mesmas conexoes de Supabase e Stripe usadas na versao anterior

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3001`.

## Variáveis de ambiente

Base minima para rodar local e na Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_PUBLISHABLE_KEY=
```

Variaveis opcionais:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
GITHUB_TOKEN=
GITHUB_RELEASES_TOKEN=
E2E_BASE_URL=http://127.0.0.1:3001
E2E_USER_EMAIL=
E2E_USER_PASSWORD=
```

## Validacao

```bash
npm run lint
npm run build
npm run test:unit
```

## Testes E2E com Playwright

Instalacao dos browsers:

```bash
npm run test:e2e:install
```

Smoke publico e rotas de API:

```bash
npm run test:e2e:smoke
```

Alias equivalente:

```bash
npm run test:e2e:public
```

Suite completa:

```bash
npm run test:e2e
```

Suite autenticada:

```bash
npm run test:e2e:authenticated
```

Para liberar os cenarios autenticados, configure estas variaveis no ambiente local:

```bash
E2E_BASE_URL=http://127.0.0.1:3001
E2E_USER_EMAIL=seu-usuario-de-teste
E2E_USER_PASSWORD=sua-senha-de-teste
```

A suite foi organizada assim:

- `tests/`: unitarios em Vitest
- `tests/e2e/public`: smoke publico em varios browsers e mobile
- `tests/e2e/api`: rotas Next e integracoes server-side
- `tests/e2e/setup`: autenticacao persistida com `storageState`
- `tests/e2e/authenticated`: navegacao e fluxos do workspace autenticado
- `tests/e2e/helpers`: auth, onboarding, console, workspace e utilitarios de seletores

Cobertura automatizada atual:

- carregamento inicial, redirect raiz, erros criticos de cliente e reduced motion
- tela de autenticacao em login/cadastro, callback OAuth com erro e credenciais invalidas
- protecao de rotas privadas sem sessao
- APIs internas de billing config e download Windows
- navegacao autenticada, sidebar, onboarding reabrivel, billing, download e sessao no workspace
- auditoria detalhada de CRUDs em sessoes, tarefas, revisoes, notas, projetos, flashcards e mind maps

Limitacoes externas deliberadas:

- OAuth Google real nao e executado por padrao porque depende de provider externo e credenciais dedicadas; a suite cobre o botao e o retorno/callback
- checkout Stripe live nao entra na suite default para evitar cobranca real; billing cobre os estados internos, retorno, sync e modal de cancelamento
- os cenarios autenticados dependem de `E2E_USER_EMAIL` e `E2E_USER_PASSWORD` apontando para uma conta estavel de teste

## Deploy

1. importe este repo na Vercel
2. mantenha o framework como `Next.js`
3. use `npm ci` em install e `npm run build` em build
4. publique com as variaveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
5. se quiser o endpoint de download Windows com menos risco de rate limit, configure tambem `GITHUB_TOKEN` ou `GITHUB_RELEASES_TOKEN`

## CI/CD

- CI via GitHub Actions em [.github/workflows/ci.yml](./.github/workflows/ci.yml)
- validacoes:
  - lint
  - build
  - testes unitarios
  - Playwright E2E
- CD recomendado:
  - conectar o repo direto na Vercel para deploy automatico a cada push em `main`
