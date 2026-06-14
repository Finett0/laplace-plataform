# Laplace — Design System

> Documento canônico da linguagem visual da **plataforma** (a parte logada — **não** a landing page).
> Preview vivo / calibrador de cor: [`metallic-blue.html`](./metallic-blue.html) (abre direto no navegador, sem build).
> Implementação: [`web/app/globals.css`](../web/app/globals.css) + [`web/tailwind.config.ts`](../web/tailwind.config.ts).

---

## 1. Princípio

**Base branca, calma e espaçada — e o azul como a única coisa que reluz.**

Referências de aesthetic: **Glean**, **Minerva**, **lemlist** (layout / arquitetura de informação) + o **dourado metálico da Patagon AI**, traduzido para **azul**. O app é claro e silencioso; o metálico é o detalhe premium que dá o "feel" caro. Inspiração, não cópia.

Decisões deliberadas:
- App logado em **tema claro/branco** (auth/seleção de org podem ter tema próprio à parte).
- Cor da marca: **azul**, com tratamento **metálico** (sheen + grão), não azul chapado.
- Tipografia **sem** Space Grotesk (era a do protótipo v1) e sem Inter/Roboto/Arial.

---

## 2. Cor

### 2.1 Neutros (a base branca)

| Token | Hex | Uso |
|---|---|---|
| `--canvas` | `#F6F8FB` | fundo do app |
| `--surface` | `#FFFFFF` | cards, sidebar |
| `--surface-2` | `#FBFCFE` | sub-superfície |
| `--border` | `#E7ECF3` | divisórias / contornos |
| `--border-2` | `#DCE3EC` | contorno mais marcado |
| `--ink` | `#0E1C2E` | texto forte |
| `--muted` | `#5A6B80` | texto secundário |
| `--faint` | `#93A1B3` | texto terciário / labels caps |
| `--positive` | `#0F9D6B` | delta positivo |

### 2.2 Rampa azul (a marca)

| 50 | 100 | 200 | 300 | 400 | 500 | 600 (core) | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `#EEF6FE` | `#D8EAFB` | `#A9D1F6` | `#6FB1EC` | `#3F8FD6` | `#2E74C0` | `#1857A0` | `#134273` | `#0C2C4F` | `#0A2440` |

Acentos planos (texto azul, bordas ativas, fundos suaves) saem desta rampa. No Tailwind: `steel-50…900`.

### 2.3 Azul metálico (o destaque) — **variante B travada**

Não é azul chapado. São **dois gradientes sobrepostos + grão fino**:

1. **Dimensão** — topo claro / base escura, dá volume:
   `linear-gradient(180deg, rgba(255,255,255,.30), transparent 38%, rgba(0,0,0,.20))`
2. **Matiz** — sweep com banda clara no meio (o "sheen"):
   `linear-gradient(135deg, #0c2c4f, #1857a0 34%, #3f8fd6 50%, #1857a0 66%, #0a2440)`
3. **Grão** — `feTurbulence` SVG em `mix-blend-mode: overlay`, opacidade ~.45 (brushed metal).

Aplicado em: **botões primários, sidebar ativa, badges, logomark, avatar, fills de gráfico, strip dos KPIs**. Tudo lê uma única variável `--metal` → trocar num lugar propaga para o app inteiro.

**Sheen no hover:** banda de luz diagonal cruza o elemento (`::after` com translate em ~.6s).

#### Variantes de intensidade (knob de calibração)

| Variante | Caráter | Token |
|---|---|---|
| **A** | sóbria / navy discreto | `--metal-a` |
| **B** ✦ **travada** | equilíbrio (presença sem exagero) | `--metal-b` |
| **C** | brilhante / mais "chrome" | `--metal-c` |

`--metal: var(--metal-b)` em `web/app/globals.css`. A e C continuam definidas como tokens — para trocar, reaponte `--metal` em `:root`.

### 2.4 Apoios

- `--metal-wash` — `linear-gradient(135deg, #EAF3FE, #DCEBFB)` para chips ativos e fundos suaves.
- `--grain` — textura `feTurbulence` reaproveitada nas superfícies metálicas.

---

## 3. Tipografia

- **Display (títulos, números grandes):** **Space Grotesk** (500–700), `letter-spacing: -.02em`. (Escolha do usuário.)
- **UI / corpo / números tabulares:** **Hanken Grotesk** (400–700), `font-feature-settings: "tnum"`.
- Números de métrica usam `tabular-nums`; KPIs grandes usam gradiente azul via `.text-metal` (`background-clip: text`).
- Carga: `@import` do Google Fonts no `globals.css`. Em produção, trocar para `next/font` (variáveis `--font-display` / `--font-sans` já previstas no Tailwind config).

---

## 4. Forma, profundidade & motion

- **Raios:** `sm 8` · `md 12` · `lg 16` · `xl 22` (px).
- **Sombras:** `--shadow-sm` (cards), `--shadow-md` (cards de destaque), `--shadow-metal` (superfícies metálicas: drop azul + inset highlight branco no topo).
- **Easing padrão:** `cubic-bezier(.22,.61,.36,1)` (`--ease`, Tailwind `ease-soft`).
- **Entrada:** `.animate-rise` (fade + sobe 10px) com `animation-delay` escalonado; respeita `prefers-reduced-motion`.

---

## 5. Layout (estilo lemlist)

- **Sidebar clara** (~264px) à esquerda: logomark metálico + wordmark, **busca global ⌘K**, nav em **seções agrupadas** (label em caps mudos), **item ativo = superfície metálica** (texto branco + grão), **badges** de contagem, perfil do usuário no rodapé. Ícones **outline** (stroke ~1.7).
- **Home AI-first:** saudação + input de prompt grande ("Pergunte aos seus dados…") + chips de ideia + cards de preview.
- **Dashboard:** cards de KPI (com strip metálica lateral) + cards grandes de gráfico com toggles segmentados (Diário/Semanal/Mensal); data-viz recolorida para a rampa azul.

Navegação prevista da plataforma: **Home · Dashboard · Grafo · Audiência · Previsão**.

---

## 6. Implementação

Tokens materializados (Tailwind v3 + Next.js App Router):

**`web/app/globals.css`** — CSS variables, base styles e primitivas:
- `.metal` — gradiente + grão + sombra (botão primário, sidebar ativa, badge, logomark, avatar)
- `.metal-sheen` — sweep de luz no hover (usar junto de `.metal`)
- `.text-metal` — texto com a rampa azul (KPIs, wordmark)
- `.animate-rise` — entrada escalonada

**`web/tailwind.config.ts`** — utilitários a partir dos tokens:
- `bg-metal`, `bg-metal-wash`
- cores `steel-50…900`, `ink`, `muted`, `faint`, `positive`, `canvas`, `surface(-2)`, `border(-2)`
- `font-display`, `font-sans`
- `shadow-{sm,md,metal}`, `rounded-{sm,md,lg,xl}`, `animate-rise`, `ease-soft`

---

## 7. Em aberto

- Trocar `@import` de fontes por `next/font` no scaffold do Next.
- Scaffold do app em `web/` e primeira tela real (Home AI-first) usando estes tokens.
- Tema das telas de **auth / seleção de org** (referências eram dark) — definir quando montar o fluxo Auth0.

---

*Arquivos relacionados: [`metallic-blue.html`](./metallic-blue.html) (preview vivo), [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (arquitetura), [`../LAPLACE.MD`](../LAPLACE.MD) (tese de produto).*
