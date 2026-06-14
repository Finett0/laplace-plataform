# Laplace

> **Se controlamos os dados e entendemos os algoritmos das redes, conseguimos criar previsibilidade de resultado de conteúdo.**

Plataforma SaaS **multi-tenant** que transforma a produção de conteúdo de **aposta em estimativa** — centralizando o dado, mapeando a audiência no micro e modelando o algoritmo de cada rede para prever o resultado **antes de publicar**.

📄 Tese completa: [`LAPLACE.MD`](./LAPLACE.MD) · Arquitetura: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## Os 3 pilares → as 3 camadas

| Pilar (produto) | Camada (técnica) | O quê |
|---|---|---|
| 1. Centralização | **Extração** | Puxa todos os canais via TikHub → dado normalizado |
| 2. Grafo de audiência | **AI Agentic Data Engineer** | Modela os dados e constrói o grafo (clusters, pontes, super-fãs) |
| 3. Previsibilidade *(o moat)* | **Agentic Analytics Engineer** | Domina o algoritmo de cada rede → estima performance antes de publicar |

---

## Stack

| Domínio | Tecnologia |
|---|---|
| Extração + Dados/IA (camadas 1–3) | **Python** |
| API + Frontend web | **TypeScript / Next.js 15 (App Router) + Tailwind** |
| Auth | **Auth0** (Universal Login + Organizations = tenants) |
| Infra | **GCP** (Cloud Run, Pub/Sub, BigQuery, GCS) |
| Extração | **TikHub.io** |
| IA dos agentes | **Claude** |
| Domínio | **uselaplace.co** (app: `app.uselaplace.co`, auth: `auth.uselaplace.co`) |

---

## Estrutura do repositório

```
laplace-plataform/
├── README.md                  ← você está aqui (índice geral)
├── LAPLACE.MD                 tese de produto (os 3 pilares)
├── ARCHITECTURE.md            arquitetura técnica (3 camadas, multi-tenancy, GCP)
│
├── design/                    Design system
│   ├── DESIGN.MD              doc canônico (cor, tipografia, layout)
│   └── metallic-blue.html     preview vivo / calibrador (abre no navegador)
│
├── web/                       Frontend (Next.js + TS) — a plataforma logada
│   ├── app/                   rotas (App Router)
│   │   ├── select-org/        seleção de organização (tenant)
│   │   └── app/               shell + Home, Dashboard, Audiência, Grafo, Previsão
│   ├── components/            Sidebar, primitivas de UI
│   ├── lib/                   auth0, organizations, sample (dados de exemplo)
│   ├── middleware.ts          proteção de rotas Auth0
│   └── AUTH0_SETUP.md         passo a passo p/ criar o tenant Auth0
│
└── services/
    └── extraction/            Camada 1 — extração de dados
        ├── TIKHUB.md          referência de integração da API TikHub
        └── probe.py           sonda respostas reais p/ travar normalizadores
```

---

## Design

Base **branca** + **azul metálico** (sheen de metal escovado, no espírito do dourado da Patagon, em azul). Tipografia **Space Grotesk** (display) + **Hanken Grotesk** (UI). Layout estilo lemlist. Tudo em [`design/DESIGN.MD`](./design/DESIGN.MD); tokens em `web/app/globals.css` + `web/tailwind.config.ts`.

---

## Status atual

| Área | Estado |
|---|---|
| Tese + arquitetura | ✅ documentadas |
| Design system | ✅ tokens + doc + preview |
| Frontend — tela de seleção de org | ✅ pronta |
| Frontend — shell + Home / Dashboard / Audiência | ✅ prontos (dados de **exemplo**) |
| Frontend — Grafo (force-directed, Temas + Audiência) | ✅ pronto (d3-force + canvas; dados de **exemplo**) |
| Frontend — Previsão | 🟡 placeholder |
| Auth0 — wiring (SDK v4, middleware, org picker) | ✅ pronto, em modo preview |
| Auth0 — tenant real | ⛔ pendente: rodar `auth0 login` + criar tenant ([guia](./web/AUTH0_SETUP.md)) |
| Extração — doc + probe + chave | ✅ chave válida, paths confirmados |
| Extração — dados reais | ⛔ pendente: **adicionar saldo** na conta TikHub (endpoints de dados exigem crédito pago) |
| Camadas 2 e 3 (agentes) | ⬜ a construir |

> **Nota:** os dados nas telas (`web/lib/sample.ts`) são de **exemplo**, para a UI renderizar enquanto a ingestão real não existe. Serão trocados por queries reais sem mexer nos componentes.

---

## Rodar o frontend

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

- **Sem `.env.local`** → modo **preview**: abre direto o app com dados de exemplo (ideal p/ ver a UI).
- **Com `.env.local`** (ver `web/.env.example` + `web/AUTH0_SETUP.md`) → fluxo real: Auth0 login → seleção de org → app.

---

## Próximos passos

1. **Auth0:** `auth0 login` (CLI já instalada) → eu finalizo o tenant + `.env.local`.
2. **TikHub:** adicionar saldo → rodar `services/extraction/probe.py` → travar os normalizadores.
3. **Camada 1:** cliente TikHub em Python + conectores plugáveis + persistência (GCS/BigQuery).
4. **Frontend:** tela de Previsão (Pilar 3) e troca dos dados de exemplo pelos reais.
5. **Camadas 2 e 3:** os agentes (Data Engineer e Analytics Engineer).

---

## Bloqueadores conhecidos

- ⛔ **Tenant Auth0** ainda não criado (login interativo pendente).
- ⛔ **Saldo TikHub** zerado — endpoints de dados não aceitam crédito grátis.
- ⚠️ A `TIKHUB_API_KEY` foi compartilhada em chat → **rotacionar** quando possível.
