# TikHub — Referência de integração (camada 1: extração)

> Provedor de extração de dados (scraping-as-API) da Laplace. Este doc é a referência
> técnica para a **integração direta** da plataforma. Visão geral também em `ARCHITECTURE.md`.
>
> **Fontes:** docs https://docs.tikhub.io · índice LLM https://docs.tikhub.io/llms.txt
> (cada endpoint tem uma página `https://docs.tikhub.io/{id}e0.md`) · API ref https://tikhub.io/api-reference

---

## 1. Fundamentos

- **Base URL:** `https://api.tikhub.io` (China continental: `https://api.tikhub.dev`, mesmos paths).
- **Auth:** header `Authorization: Bearer <token>`. Keys em https://user.tikhub.io.
- **Padrão de path:** `/api/v1/{plataforma}/{versão}/{ação}` — ex.: `/api/v1/youtube/web/get_video_info`.
- **Custo:** pay-per-request, **base $0,001/req**; alguns endpoints custam mais (ex.: `get_video_info` = **$0,002**). **Só cobra em HTTP 200.** Desconto por volume diário até 50% (30k+/dia). `402` = saldo insuficiente, `429` = rate limit.
- **Escala:** ~1010 endpoints, 16+ plataformas, OpenAPI-native (Swagger testável). SDKs Python (`pip install tikhub`) e Java.

### 1.1 Envelope de resposta (consistente em toda a API)

```jsonc
{
  "code": 200,
  "request_id": "…",
  "router": "/api/v1/…",
  "message": "…",        // EN
  "message_zh": "…",     // ZH
  "data": { /* ... */ }, // payload — SHAPE NÃO DOCUMENTADO/varia
  "time": "2026-…",
  "time_stamp": 1718000000,
  "cache_url": "…"        // alguns endpoints; cache ~24h
}
```

> ⚠️ **O interior de `data` não é documentado e varia entre plataformas/versões.** A normalização
> tem que ser **defensiva** — ver §5. (Foi assim no protótipo v1: `lib/tikhub.ts` com `pick`/`itemsOf`.)

**Envelope de ERRO (≠ sucesso):** vem aninhado em `detail`:
```jsonc
{ "detail": { "code": 402, "request_id": "…", "message": "Insufficient balance…",
  "message_zh": "…", "support": "Discord: …", "router": "/api/v1/…",
  "params": {…}, "headers": {…}, "time": "…", "time_stamp": 0 } }
```
> ⚠️ O corpo de erro **ecoa de volta o header `Authorization`** (a chave). Nunca commitar/logar respostas cruas — `samples/` é gitignored.

**💳 Crédito pago obrigatório p/ dados:** endpoints de dados (IG/YouTube/etc.) retornam `402` se a conta não tiver **saldo pago** — eles **não aceitam o crédito grátis** do check-in diário. Top-up: https://user.tikhub.io/users/add_credit
**Confirmado por probe (2026-06-13):** chave válida (auth OK), paths corretos (`/api/v1/instagram/v1/fetch_user_info_by_username`, `/api/v1/youtube/web/get_channel_videos_v2`, `…/get_video_info`), porém conta sem saldo → 402 em todos. Rodar `services/extraction/probe.py` após o top-up para travar os mapeamentos.

### 1.2 Paginação

Não é uniforme — depende do endpoint:
- **YouTube:** `nextToken` (token opaco devolvido no `data`, reenviado no próximo request).
- **Instagram / outros:** cursor / `max_id` / `pagination_token` (varia).

Sempre tratar como "cursor opaco": ler o cursor do `data`, repassar até vir vazio.

### 1.3 Resolução em 2 passos (handle → id → conteúdo)

Quase toda coleta começa resolvendo o identificador público para o ID interno:
- **YouTube:** `@handle`/URL → `get_channel_id` → `get_channel_videos_v2`.
- **Instagram:** `username` → `fetch_user_info_by_username` (tem o user_id) → `fetch_user_posts`.

---

## 2. YouTube — `/api/v1/youtube/web/` (YouTube-Web-API, 21 endpoints)

Catálogo completo (títulos oficiais do índice; paths confirmados onde marcado ✓):

| # | Função | Endpoint (path = base + ação) |
|---|---|---|
| 1 | Vídeo info V1 | `get_video_info` ✓ (params: `video_id`*, `lang`, `videos`, `audios`, `subtitles`, `related`; **$0,002**) |
| 2 | Vídeo info V2 | `…/get_video_info_v2` |
| 3 | Vídeo detalhes V3 | V3 |
| 4 | Legendas | get video subtitles |
| 5 | Comentários do vídeo | get video comments |
| 6 | Respostas de comentário | get video sub comments |
| 7 | Descrição do canal | get channel description |
| 8 | Vídeos relacionados | get related videos |
| 9 | Buscar vídeo | search video |
| 10 | Busca geral (filtros) | general search with filters |
| 11 | Buscar Shorts | YouTube Shorts search |
| 12 | Obter channel ID | `get_channel_id` |
| 13 | Channel ID por URL V2 | get channel id from url v2 |
| 14 | Channel URL por ID | get channel url from id |
| 15 | Info do canal | get channel information |
| 16 | Vídeos do canal V1 *(deprecando)* | get channel videos v1 |
| 17 | **Vídeos do canal V2** | `get_channel_videos_v2` ✓ (params: `channel_id`*, `lang`, `sortBy`=newest/oldest/mostPopular, `contentType`=videos/shorts/live, `nextToken`) |
| 18 | Vídeos do canal V3 | get channel videos v3 |
| 19 | Shorts do canal | get channel short videos |
| 20 | Buscar canal | search channel |
| 21 | Vídeos em alta | get trending videos |

Há também **YouTube-Web-V2-API** (`/api/v1/youtube/web_v2/…`, ~20 endpoints): detalhes/streaming aprimorados, community posts/engagement, comentários, Shorts.

**Para a Laplace:** info do canal (#15) + vídeos do canal V2 (#17, paginado) + vídeo info (#1, stats: views/likes/comentários) + comentários (#5/#6, para o grafo de audiência).

---

## 3. Instagram — `/api/v1/instagram/v1/` (Instagram-V1-API, 29 endpoints)

| Função | Ação |
|---|---|
| Shortcode → media id | `shortcode_to_media_id` ✓ (param `shortcode`*) |
| Media id → shortcode | media_id_to_shortcode |
| User info por user_id | get user info by user id (+ V2) |
| **User data por username** | get user data by username (**V1/V2/V3**) ✓ conceito `fetch_user_info_by_username?username=` |
| User data por user_id | get user data by user id (+ V2) |
| About do usuário | get user about info |
| **Posts do usuário** | get user posts list (+ **V2**) |
| **Reels do usuário** | get user reels list |
| Reposts / Tagged | get user reposts / tagged posts |
| Perfis relacionados | get related profiles |
| Busca (users/hashtags/places) | search |
| **Post por URL / por ID** | get post by url (+ V2) / by id |
| **Comentários do post** | get post comments V2 |
| Respostas de comentário | get comment replies |
| Posts por música / hashtag / local | get posts by music / hashtag / location |
| Locais, cidades, explore | location/cities/explore sections |

Também **Instagram-V2-API** (`/instagram/v2/…`, 27 endpoints: followers/following, etc.) e **Instagram-V3-API** (`/instagram/v3/…`, ~20). Há ≥3 versões porque o shape muda; escolher a mais estável por caso.

**Para a Laplace:** user data por username (perfil + user_id) → posts list V2 + reels (paginado, métricas por peça) → post comments V2 + comment replies (audiência: quem comenta).

---

## 4. Outras plataformas relevantes

> LinkedIn e Twitter **não aparecem no `llms.txt`** (índice curado), mas existem na API e nos SDKs.
> Paths-base confirmados nas páginas por plataforma; enumerar os endpoints exatos no Swagger ao implementar.

- **Twitter/X** — `/api/v1/twitter/web/…` (módulo SDK `twitter_web`). Ex. confirmado: `fetch_tweet_detail?tweet_id=`. Categorias: tweet detail, perfil + timeline, followers/following, replies/quotes, search, trending, lists.
- **LinkedIn** — `/api/v1/linkedin/web/…` e `/api/v1/linkedin/web_v2/…` (~43 endpoints; SDK `linkedin_web`, `linkedin_web_v2`). Ex. confirmado: `get_user_profile?username=`. Categorias: perfil + sub-seções (experience/skills/education), posts/comments/**reactions**, empresas/funcionários/vagas, hashtags, search.
  - 🔑 No protótipo v1, o LinkedIn alimentou o **grafo de audiência** (quem reagiu aos posts) — endpoint de **reactions** é central para o Pilar 2. Tratado como best-effort (frágil); guardar `full_urn` do post.
- **TikTok** — `/api/v1/tiktok/web/…` (55+), `/tiktok/app/v3/…` (70+), `/tiktok/ads/…` (30+), `/tiktok/shop/web/…` (13). Cobertura mais rica de toda a API.

**Não cobre:** Spotify, newsletter/email → fase 2 via conectores próprios (Spotify API / ESP).

---

## 5. Estratégia de integração na Laplace

### 5.1 Normalização defensiva (obrigatória)

Como `data` é não-documentado e variável, **nunca** acoplar componentes ao shape cru. Padrão (do v1):
- `pick(obj, ["a.b", "likes_count", "like_count", "edge_liked_by.count"])` — tenta múltiplos caminhos.
- `itemsOf(data, knownKeys)` — acha a lista de itens (chaves conhecidas → senão maior array de objetos).
- coerções tolerantes: `"1.2K"`→1200, unix/ISO→ISO, `"MM:SS"`→segundos.
- **preservar o `raw` íntegro** em cada item (ajuste de mapeamento depois fica trivial).
- modelo canônico por entidade: `CanonicalProfile`, `CanonicalPost`, `CanonicalEngagement`, `CanonicalComment`.

### 5.2 Receita de ingestão por canal

```
resolve(handle) → id interno
  → list(id, cursor) [paginar até esvaziar]   // posts/vídeos
    → detail(itemId) se faltar métrica          // views/likes/comments
    → comments(itemId) / reactions(itemId)       // → grafo de audiência (Pilar 2)
```

### 5.3 Custo

- Cache agressivo + dedupe (cobra só em 200, mas cada chamada conta).
- Agrupar coletas por tenant/dia para cair na faixa de desconto (≥30k/dia = -50%).
- Preferir endpoints que já trazem métricas na listagem (evita N detalhes).
- Respeitar `429` com backoff exponencial; tratar `402` (saldo) como alerta operacional.

### 5.4 Mapa endpoint → necessidade Laplace

| Necessidade | YouTube | Instagram | LinkedIn / X |
|---|---|---|---|
| Perfil/canal | get_channel_info | user data by username | get_user_profile / user |
| Lista de conteúdo | get_channel_videos_v2 | user posts/reels list | posts |
| Métricas por peça | get_video_info | post by id | post detail |
| Audiência (quem engaja) | video comments + sub | post comments + replies | **reactions** + comments |

---

## 6. Próximos passos da camada 1

1. Cliente HTTP TikHub (auth, retry/backoff, tratamento 402/429) — Python.
2. Modelos canônicos + normalizadores defensivos por plataforma.
3. Conectores plugáveis (YouTube, Instagram, LinkedIn, X, TikTok) implementando uma interface comum.
4. Orquestração (Cloud Scheduler → Pub/Sub → Cloud Run) + persistência (GCS raw + BigQuery).
