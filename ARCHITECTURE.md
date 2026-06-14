# Laplace — Arquitetura

> Documento técnico. A visão e a tese de produto estão em [`LAPLACE.MD`](./LAPLACE.MD).
> Os três pilares do produto (Centralização → Grafo de audiência → Previsibilidade) mapeiam
> diretamente nas três camadas técnicas descritas abaixo.
>
> **Status:** ✅ feito · ⏳ em andamento · ⛔ bloqueado · ⬜ a construir

---

## 1. Princípios

1. **Plataforma única, multi-tenant.** Um só produto, um só codebase, um só deploy. Cada cliente é um **tenant** — um "repositório" lógico isolado **dentro** da mesma plataforma. **Não há deploy por cliente.**
2. **A plataforma é o destino; os dados entram por API.** `plataform-laplace` é a fonte única de verdade. Qualquer fonte de dados (extração TikHub, futuras integrações, dados do próprio cliente) **manda dado pra dentro** via uma **API de ingestão** tenant-scoped. Quem coleta é desacoplado de onde mora o dado.
3. **Os agentes são o produto.** As camadas 2 e 3 são agentes de IA, não pipelines estáticos. A lógica de modelagem e previsão é deles.
4. **Extração desacoplada.** A camada 1 isola a plataforma de qualquer provedor específico. Hoje TikHub; amanhã, qualquer fonte — todas falam a mesma API de ingestão.
5. **MVP enxuto.** Só os canais cobertos pela TikHub (YouTube, Instagram, X, LinkedIn, TikTok). Spotify e newsletter são fase 2 (§9).
6. **Infra híbrida, pragmática.** Web + APIs na **Vercel**; banco de metadados em **Postgres gerenciado**; o data lake / warehouse / compute pesado de dados fica pra **GCP** quando a ingestão real começar. Não é "tudo GCP" — é o que cada carga pede.

---

## 2. Estado atual (o que está no ar)

A plataforma **logada já roda em produção** com auth real e banco real — ainda com dados de **exemplo** nas telas até a ingestão real existir.

| Área | Estado |
|---|---|
| Web (Next.js 15 + TS + Tailwind) na **Vercel** → `https://laplace-platform.vercel.app` | ✅ no ar |
| Auth0 (tenant `plataform-laplace`): login, **Organizations = tenants**, admin por e-mail | ✅ |
| Telas: Home (AI-first), Dashboard, Audiência, Grafo (force-directed) | ✅ (dados de exemplo) |
| Tela **Canais**: conecta canais por tenant, persiste no Postgres | ✅ |
| Banco de **metadados** (Postgres + Drizzle): `tenants`, `connected_channels` | ✅ |
| Fio `org_id (Auth0) → tenant_id → connected_channels` | ✅ ligado |
| Tela de **Previsão** (Pilar 3) | ⬜ placeholder |
| **API de ingestão** (front door de dados) | ⬜ a construir |
| Camada 1 (extração TikHub) — cliente Python | ⛔ bloqueado (saldo TikHub) |
| Camadas 2 e 3 (agentes) | ⬜ a construir |

> Dados das telas vêm de `web/lib/sample.ts` (**exemplo**, não produção) — serão trocados por queries reais sem mexer nos componentes.

---

## 3. Stack

| Domínio | Tecnologia | Estado |
|---|---|---|
| Frontend web + APIs (ingestão e query) | **TypeScript / Next.js 15 (App Router)** | ✅ na Vercel |
| Banco de metadados da app | **Postgres** + **Drizzle ORM** | ✅ (dev: Docker · prod: Prisma Postgres) |
| Auth | **Auth0** (Universal Login + Organizations) | ✅ |
| Extração + Data/IA (camadas 1, 2, 3) | **Python** (3.11+) | ⬜ |
| LLM dos agentes | **Claude** (Opus 4.8 / Sonnet 4.6 / Haiku 4.5) | ⬜ |
| Provedor de extração | **TikHub.io** (ver `services/extraction/TIKHUB.md`) | ⛔ saldo |
| Data lake + warehouse (dado bruto/analítico) | **GCS + BigQuery** (GCP) | ⬜ adiado |

---

## 4. Multi-tenancy — "cada cliente é um repositório"

- **Plataforma única.** Um deploy serve todos os clientes. Cada cliente é um **tenant** = um repositório lógico de dados isolado.
- **Auth0 como fonte de identidade e de tenant.** Cada usuário pertence a uma **Organization** (Auth0 Organizations = tenants). O `org_id` do token vira o **`tenant_id`** da plataforma. Admin (`LAPLACE_ADMIN_EMAILS`, depois role no token) enxerga todas as orgs; cliente vê só as suas.
- **Isolamento lógico por `tenant_id`** em tudo: cada linha de metadados, cada dado ingerido, cada nó/aresta do grafo e cada previsão carrega `tenant_id`. **Nenhuma query cruza tenants** (garantido no servidor — server actions/handlers derivam o tenant da sessão, nunca do client).
- **Hoje:** `web/lib/tenant.ts` resolve `org_id → tenant`; `tenants` e `connected_channels` já isolam por `tenant_id`.
- Segredos por tenant (tokens de canais, API keys) → **Secret Manager** (GCP) quando a ingestão real existir.

---

## 5. As APIs da plataforma

A plataforma tem **duas superfícies de API** distintas — uma pra dado entrar, outra pra dado sair:

### 5.1 API de ingestão (write) — *como o dado entra* ⬜

O **front door** dos dados. Qualquer fonte manda dado normalizado **pra dentro** da plataforma, tenant-scoped.

- **Quem chama:** os workers de extração (camada 1) e, no futuro, qualquer conector/fonte (Spotify, ESP, dado do próprio cliente).
- **Auth:** **machine-to-machine por tenant** (API key/token de serviço por tenant — não a sessão Auth0 do usuário). Cada request declara/assina o `tenant_id` de destino.
- **Contrato:** recebe **entidades canônicas** (`CanonicalProfile`, `CanonicalPost`, `CanonicalEngagement`, `CanonicalComment`) independentes de plataforma; valida; deduplica; persiste (raw + normalizado).
- **Por que existe:** desacopla *quem coleta* de *onde o dado mora*. Trocar TikHub por outro provedor, ou adicionar uma fonte, não toca nas camadas 2/3 — todas escrevem pelo mesmo contrato.
- **Implementação prevista:** rotas no Next (`web/app/api/ingest/...`) ou serviço dedicado; escreve no warehouse (BigQuery) + lake (GCS).

### 5.2 API de consulta (read) — *como o dado sai* ⏳

O que o **frontend** consome: dashboards, grafo, previsões.

- **Quem chama:** a web logada (sessão **Auth0**).
- **Auth:** sessão do usuário → `tenant_id` da org selecionada → filtra tudo por tenant.
- **Implementação:** Server Components + Server Actions do Next (já é o padrão — ex.: a tela de Canais lê/escreve via Drizzle isolando por tenant). Hoje serve dados de exemplo; passará a servir queries reais.

---

## 6. As três camadas

```
   FONTES                INGESTÃO              MODELAGEM (agentes)         CONSUMO
┌───────────┐      ┌──────────────────┐   ┌──────────────────────┐   ┌──────────────┐
│  TikHub   │─┐    │  API de ingestão │   │ C2: Data Engineer    │   │  Web logada  │
│  (futuras)│─┼──▶ │  (tenant-scoped) │──▶│   → grafo            │──▶│ (API consulta│
│  sources  │─┘    │  + lake/warehouse│   │ C3: Analytics Eng.   │   │  por tenant) │
└───────────┘      └──────────────────┘   │   → previsões        │   └──────────────┘
                                          └──────────────────────┘
```

### Camada 1 — Extração (Pilar 1: Centralização) ⛔

**Responsabilidade:** trazer todos os canais do creator para a plataforma, normalizados, **via API de ingestão**.

- **Design plugável:** uma interface `Connector` por plataforma. O conector TikHub cobre YouTube, Instagram, X, LinkedIn, TikTok. Novas fontes entram como novos conectores.
- **Input:** lê os `connected_channels` do tenant (✅ já existe) → resolve handle → id interno → puxa conteúdo.
- **Cliente TikHub:** SDK Python, `Authorization: Bearer`, base `api.tikhub.io`. Pay-per-request (~$0,001, só cobra em HTTP 200) → **cache + dedupe**. Tratar `402` (saldo) e `429` (rate limit) com backoff.
- **Saída:** entidades canônicas → **API de ingestão** (§5.1).
- **Agendamento (prod):** Cloud Scheduler → Pub/Sub → Cloud Run jobs, por tenant/canal.
- ⛔ **Bloqueado:** conta TikHub sem saldo (endpoints de dados retornam `402`).

### Camada 2 — AI Agentic Data Engineer (Pilar 2: Grafo) ⬜

**Responsabilidade:** transformar dado normalizado no **grafo de audiência** (pessoas, relações, clusters, pontes, super-fãs, conectores cross-canal).

- Agente (LLM + ferramentas) que lê o warehouse, decide modelagem, resolve **identidade cross-canal** e constrói/atualiza o grafo.
- **Grafo:** nós = creator, conteúdos, audiência, temas; arestas = engajou, comentou, segue, co-ocorrência de tema, ponte entre clusters. Detecção de clusters, conectores (centralidade), buracos.
- **Persistência do grafo:** decisão em aberto (§8).

### Camada 3 — Agentic Analytics Engineer (Pilar 3: Previsibilidade) ⬜ — *o moat*

**Responsabilidade:** dado o grafo + histórico, **modelar o algoritmo de cada rede** e estimar performance **antes de publicar**.

- Conhece, por plataforma, a função de distribuição (YouTube ≠ LinkedIn) e cruza com o estado da audiência.
- **Saídas:** faixa de performance esperada (tema × formato × canal × audiência); recomendação de cross-posting; alerta de saturação. Insight **antes**, não relatório depois.

---

## 7. Fluxo de dados (alvo)

```
connected_channels (por tenant) ─▶ Camada 1 (workers Python)
        │                                  │  entidades canônicas
        │                                  ▼
        │                          API de INGESTÃO (tenant-scoped, M2M auth)
        │                                  │
        │                                  ▼
        │                          GCS (raw) + BigQuery (normalizado)
        │                                  │
        │                                  ▼
        │                  Camada 2 (agente) ─▶ Grafo (DB §8)
        │                                  │
        │                                  ▼
        │                  Camada 3 (agente) ─▶ Previsões
        ▼                                  ▼
   (orquestração)                  API de CONSULTA (Next, sessão Auth0)
                                           │
                                           ▼
                                   Web logada — dashboard, grafo, previsão
```

---

## 8. Infra

### 8.1 Hoje (em produção)

| Função | Onde |
|---|---|
| Web + APIs (ingestão/consulta) | **Vercel** (`laplace-platform`, root `web/`, deploy via CLI) |
| Banco de metadados (tenants, config, canais) | **Prisma Postgres** (`db.prisma.io`, conexão TCP direta + SSL) |
| Banco em dev | **Postgres local** (Docker, `docker-compose.yml`) |
| Auth | **Auth0** (tenant `plataform-laplace.us.auth0.com`) |
| Código | **GitHub** `Finett0/laplace-plataform` |

### 8.2 Adiado (entra com a ingestão real — provavelmente GCP)

| Função | Serviço previsto |
|---|---|
| Data lake bruto (raw JSON, auditoria/replay) | Cloud Storage (GCS) |
| Warehouse analítico (normalizado) | BigQuery |
| Compute dos workers/agentes (Python) | Cloud Run / Cloud Run Jobs |
| Orquestração/agendamento | Pub/Sub + Cloud Scheduler |
| **Banco do grafo** de audiência | **A decidir** — Postgres + `apache age`/`pgRouting`, Neo4j, ou Spanner Graph |
| Segredos por tenant | Secret Manager |

> O banco de metadados (Postgres gerenciado) e o warehouse (BigQuery) são **coisas distintas**: metadados = config leve da app (mora perto da web); warehouse = volume analítico do dado ingerido.

---

## 9. Estrutura de repositório

```
laplace-plataform/
├── LAPLACE.MD                 # tese de produto
├── ARCHITECTURE.md            # este doc
├── README.md                  # índice geral
├── docker-compose.yml         # Postgres local (dev) ✅
├── design/                    # design system (DESIGN.MD + preview)
├── web/                       # ✅ Next.js (web + APIs) — Vercel
│   ├── app/                   #   rotas (App Router): select-org, app/{home,dashboard,
│   │                          #   audiencia,grafo,previsao,canais}
│   ├── components/            #   Sidebar, primitivas de UI
│   ├── lib/
│   │   ├── auth0.ts           #   client Auth0 (construção tardia)
│   │   ├── organizations.ts   #   Management API (admin vê todas as orgs)
│   │   ├── tenant.ts          #   org_id da sessão → tenant
│   │   ├── db/                #   Drizzle: schema, migrations, seed, client
│   │   └── sample.ts          #   dados de EXEMPLO (provisório)
│   └── middleware.ts          #   proteção de rotas Auth0
└── services/
    ├── extraction/            # ⏳ Camada 1 — Python (probe.py, TIKHUB.md; cliente a construir)
    ├── data-engineer/         # ⬜ Camada 2 — Python (agente + grafo)
    └── analytics-engineer/    # ⬜ Camada 3 — Python (agente + previsão)
```

> A "API de ingestão" e a "API de consulta" vivem dentro de `web/` (rotas Next / Server Actions) por enquanto; se o volume pedir, a ingestão pode virar serviço próprio.

---

## 10. Dependências e pendências

### Bloqueadores

- ⛔ **Saldo TikHub** — endpoints de dados retornam `402`. Trava toda a camada 1 (e, por consequência, dado real nas camadas 2/3 e nas telas).
- 🔒 **Rotacionar credenciais** que passaram por chat: `TIKHUB_API_KEY` e a string do Prisma Postgres.

### A construir (em ordem de dependência)

1. ⬜ **API de ingestão** (§5.1) — o front door; contrato canônico + auth M2M por tenant.
2. ⛔→⬜ **Camada 1**: cliente TikHub Python + conectores plugáveis, lendo `connected_channels` e escrevendo na API de ingestão.
3. ⬜ **Persistência real**: GCS (raw) + BigQuery (normalizado) — quando a ingestão começar.
4. ⬜ **Trocar `sample.ts`** por queries reais na API de consulta (sem tocar nos componentes).
5. ⬜ **Tela de Previsão** (Pilar 3).
6. ⬜ **Camadas 2 e 3** (os agentes).

### Decisões em aberto

1. **Banco do grafo** (§8.2) — depende do volume/queries da camada 2.
2. **Identidade cross-canal** na camada 2 — como afirmar que dois perfis são a mesma pessoa.
3. **Orquestração dos agentes** (2 e 3) — contínuos vs. sob demanda; framework.
4. **Estratégia de custo TikHub** — frequência × volume por tenant pra cair na faixa de desconto.
5. **Onde a ingestão roda** — rotas Next (Vercel) vs. serviço Python dedicado (GCP), conforme volume.

### Operacional de produção (pendente)

- ⬜ **Custom domain** `app.uselaplace.co` (Vercel + callbacks Auth0) e `auth.uselaplace.co` (Auth0, exige plano pago).
- ⬜ **Git-connect da Vercel** — auto-deploy a cada push (hoje é deploy via CLI).
- ⬜ **Tenant Auth0 de produção dedicado** — separar dados de teste dos reais (exige upgrade).
- ⬜ **Roles no token Auth0** — trocar `LAPLACE_ADMIN_EMAILS` por role `admin` (o código já lê o claim).

---

## 11. Fora do MVP (Fase 2)

- **Spotify** (podcasts/música) — TikHub não cobre. Fonte: Spotify for Podcasters / Spotify Web API.
- **Newsletter / email** — TikHub não cobre. Fonte: API do ESP (Beehiiv / Substack / ConvertKit / Mailchimp).
- Ambos entram como novos **conectores** na camada 1, mandando dado pela **mesma API de ingestão** — sem alterar camadas 2/3.
