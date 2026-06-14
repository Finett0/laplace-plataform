# Laplace — Arquitetura

> Documento técnico. A visão e a tese de produto estão em [`LAPLACE.MD`](./LAPLACE.MD).
> Os três pilares do produto (Centralização → Grafo de audiência → Previsibilidade) mapeiam
> diretamente nas três camadas técnicas descritas abaixo.

---

## 1. Princípios

1. **Plataforma única, multi-tenant.** Um só produto, um só codebase, um só deploy. Cada cliente é um **tenant** isolado lógicamente — não há deploy por cliente.
2. **Os agentes são o produto.** As camadas 2 e 3 são agentes de IA, não pipelines estáticos. A lógica de modelagem e previsão é deles.
3. **Extração desacoplada.** A camada 1 isola a plataforma de qualquer provedor de dados específico. Hoje TikHub; amanhã, qualquer fonte.
4. **MVP enxuto.** Só os canais cobertos pela TikHub (YouTube, Instagram, X, LinkedIn, TikTok). Spotify e newsletter são fase 2 (ver §8).

---

## 2. Stack

| Domínio | Tecnologia |
|---|---|
| Extração + Data/IA (camadas 1, 2, 3) | **Python** (3.11+) |
| API pública + Frontend web | **TypeScript / Node** |
| Auth | **Auth0** |
| Infra | **GCP** |
| Provedor de extração | **TikHub.io** (ver memória `reference-tikhub-api`) |

---

## 3. Multi-tenancy

- **Isolamento lógico por `tenant_id`** em todas as tabelas e no grafo. Não há infra por cliente.
- **Auth0** como Identity Provider: cada usuário pertence a uma Organization (Auth0 Organizations = tenant). O `org_id` do token vira o `tenant_id`.
- Todo dado extraído, todo nó/aresta do grafo e toda previsão carregam `tenant_id`. Nenhuma query cruza tenants.
- Segredos por tenant (tokens de canais, etc.) no **GCP Secret Manager**, namespaced por `tenant_id`.

---

## 4. As três camadas

```
┌──────────────────────────────────────────────────────────────────────┐
│  CAMADA 1 — Extração            (Pilar 1: Centralização)               │
│  Conectores → TikHub.io → normalização → data lake bruto              │
└──────────────────────────────────────────────────────────────────────┘
                                  │  eventos / dados normalizados
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CAMADA 2 — AI Agentic Data Engineer   (Pilar 2: Grafo de audiência)  │
│  Agente que modela os dados e constrói/atualiza o grafo               │
└──────────────────────────────────────────────────────────────────────┘
                                  │  grafo + features
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CAMADA 3 — Agentic Analytics Engineer  (Pilar 3: Previsibilidade)    │
│  Agente que domina os algoritmos das redes e prevê performance        │
└──────────────────────────────────────────────────────────────────────┘
```

### Camada 1 — Extração

**Responsabilidade:** trazer todos os canais do creator para um lugar só, em formato normalizado.

- **Design plugável:** uma interface `Connector` por plataforma. O conector TikHub implementa YouTube, Instagram, X, LinkedIn e TikTok. Novos provedores/canais (Spotify, ESP) entram como novos conectores sem tocar nas camadas 2/3.
- **Cliente TikHub:** SDK Python (`pip install tikhub`), auth via `Authorization: Bearer`, base `api.tikhub.io`. Pay-per-request (~$0,001, só cobra em HTTP 200) → **cache agressivo e dedupe** para conter custo. Tratar `402` (saldo) e `429` (rate limit) com backoff.
- **Agendamento:** **Cloud Scheduler → Pub/Sub → Cloud Run jobs** para coletas periódicas por tenant/canal.
- **Normalização:** cada resposta vira um modelo canônico (`CanonicalProfile`, `CanonicalPost`, `CanonicalEngagement`, `CanonicalComment`) independente da plataforma.
- **Persistência bruta:** **GCS** (raw JSON, auditoria/replay) + **BigQuery** (normalizado, analítico).

### Camada 2 — AI Agentic Data Engineer

**Responsabilidade:** transformar dados normalizados no **grafo de audiência** (o micro: pessoas, relações, clusters, pontes, super-fãs, conectores cross-canal).

- Agente (LLM + ferramentas) que lê o BigQuery, decide modelagem, resolve identidade cross-canal (a mesma pessoa em vários canais) e **constrói/atualiza o grafo**.
- **Modelo de grafo:** nós = creator, conteúdos, membros de audiência, temas/hashtags; arestas = engajou, comentou, segue, co-ocorrência de tema, ponte entre clusters.
- Detecção de **clusters** (comunidades), **conectores** (alta centralidade/betweenness), **buracos** estruturais.
- **Persistência do grafo:** ver §6.

### Camada 3 — Agentic Analytics Engineer

**Responsabilidade:** o moat. Dado o grafo + histórico, **modelar o algoritmo de cada rede** e estimar performance de conteúdo **antes de publicar**.

- Agente que conhece, por plataforma, a função de distribuição (o que YouTube premia ≠ o que LinkedIn premia) e cruza com o estado da audiência (grafo).
- **Saídas acionáveis:** faixa de performance esperada (tema × formato × canal × audiência); recomendação de cross-posting ("explode no canal A, leve pro B"); alerta de saturação de formato por cluster.
- Insight **antes** da publicação, não relatório depois.

---

## 5. Fluxo de dados

```
Cloud Scheduler ─▶ Pub/Sub ─▶ Cloud Run (Conector TikHub)
        │                              │
        │                              ▼
        │                      GCS (raw) + BigQuery (normalizado)
        │                              │
        │                              ▼
        │              Camada 2: Agente Data Engineer ─▶ Grafo (DB §6)
        │                              │
        │                              ▼
        │              Camada 3: Agente Analytics ─▶ Previsões
        │                              │
        ▼                              ▼
   API (TS/Node) ◀──────────── consultas do frontend
        │
        ▼
   Frontend web (TS) — dashboard, grafo, previsões
```

---

## 6. Infra GCP (proposta inicial)

| Função | Serviço GCP |
|---|---|
| Compute (serviços + jobs) | Cloud Run / Cloud Run Jobs |
| Mensageria / orquestração | Pub/Sub + Cloud Scheduler |
| Data lake bruto | Cloud Storage (GCS) |
| Warehouse analítico | BigQuery |
| Metadados da app (tenants, usuários, config) | Cloud SQL (Postgres) |
| Grafo de audiência | **A decidir** — opções: Postgres + `pgRouting`/`apache age`, Neo4j (Aura/self-host em GKE), ou Spanner Graph |
| Segredos (tokens por tenant) | Secret Manager |
| LLM dos agentes | Claude (Anthropic) — modelos atuais: Opus 4.8 / Sonnet 4.6 / Haiku 4.5 |
| Auth | Auth0 (externo a GCP) |

> **Decisão pendente:** banco do grafo (§6) — depende do volume e dos padrões de query da camada 2. Spanner Graph se quisermos tudo GCP-managed; Neo4j se quisermos o ecossistema de grafo mais maduro.

---

## 7. Estrutura de repositório (proposta)

```
laplace-plataform/
├── LAPLACE.MD              # tese de produto
├── ARCHITECTURE.md         # este doc
├── services/
│   ├── extraction/         # Camada 1 — Python (conectores, cliente TikHub)
│   ├── data-engineer/      # Camada 2 — Python (agente + grafo)
│   ├── analytics-engineer/ # Camada 3 — Python (agente + previsão)
│   └── api/                # API pública — TypeScript/Node
├── web/                    # Frontend — TypeScript
├── packages/               # libs compartilhadas (modelos canônicos, tipos)
└── infra/                  # IaC GCP (Terraform)
```

---

## 8. Fora do MVP (Fase 2)

- **Spotify** (podcasts/música) — TikHub não cobre. Fonte: Spotify for Podcasters / Spotify Web API.
- **Newsletter / email** — TikHub não cobre. Fonte: API do ESP (Beehiiv / Substack / ConvertKit / Mailchimp).
- Ambos entram como novos **conectores** na camada 1, sem alterar camadas 2/3.

---

## 9. Decisões em aberto

1. Banco do grafo (§6).
2. Modelo exato de identidade cross-canal na camada 2 (como afirmar que dois perfis são a mesma pessoa).
3. Como os agentes (2 e 3) são orquestrados: contínuos vs. sob demanda; framework de agente.
4. Estratégia de custo TikHub: frequência de coleta por tenant × volume para otimizar a faixa de desconto.
