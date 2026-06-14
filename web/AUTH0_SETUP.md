# Auth0 — setup do tenant Laplace

Passo a passo para criar e ligar o Auth0 ao app (`web/`). Domínio: **uselaplace.co**.
Modelo: **Universal Login** (login hospedado pela Auth0) + **Organizations** (1 org = 1 tenant).

> Sem `.env.local` preenchido, o app roda em **modo preview** (telas com dados mock, sem login real). Tudo abaixo é para ligar o login de verdade.

---

## 1. Criar conta e tenant
1. Crie conta em https://auth0.com → escolha a região (ex.: US).
2. O "tenant domain" fica algo como `laplace.us.auth0.com` → será o `AUTH0_DOMAIN`.

## 2. Application (Regular Web App)
1. **Applications → Create Application** → nome `Laplace Platform` → tipo **Regular Web Application**.
2. Em **Settings**:
   - **Allowed Callback URLs:** `http://localhost:3000/auth/callback, https://app.uselaplace.co/auth/callback`
   - **Allowed Logout URLs:** `http://localhost:3000, https://app.uselaplace.co`
   - **Allowed Web Origins:** `http://localhost:3000, https://app.uselaplace.co`
3. Copie **Domain**, **Client ID**, **Client Secret** → `.env.local`.

## 3. `.env.local`
Copie de `.env.example` e preencha:
```
AUTH0_DOMAIN=laplace.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=<openssl rand -hex 32>
APP_BASE_URL=http://localhost:3000
```

## 4. Organizations (multi-tenant)
1. **Organizations → Create Organization** → uma por cliente (ex.: `aura`, `sunday-drops`). O `name` vira o slug; `display_name` é o rótulo.
2. Em cada org, **Members** → convide/adicione usuários.
3. Na **Application → Organizations** (aba): defina **Type of Users = Business Users** e **Login Flow = Prompt for Credentials** (o app passa o parâmetro `organization` na hora do login — é o que a tela de seleção faz).

## 5. Management API (listar orgs — admin vê todas)
1. **Applications → Create Application** → tipo **Machine to Machine** → nome `Laplace Mgmt`.
2. Autorize na **Auth0 Management API** com os scopes:
   `read:organizations`, `read:organization_members`, `read:users`.
3. Copie Client ID/Secret → `.env.local`:
```
AUTH0_MGMT_CLIENT_ID=...
AUTH0_MGMT_CLIENT_SECRET=...
```

## 6. Social logins (Google / Microsoft)
**Authentication → Social** → ative **google-oauth2** e **windowslive** (ou Azure AD). Aparecem sozinhos no Universal Login (como na referência).

## 7. Branding do Universal Login
**Branding → Universal Login**: logo da Laplace, cor primária = azul metálico (ex.: `#1857A0`), fundo claro. É aqui que a tela de login ganha a cara da marca — sem código no app.

## 8. (Produção) Custom domain
**Branding → Custom Domains** → `auth.uselaplace.co` (CNAME no DNS). Deixa o login em `auth.uselaplace.co` em vez de `*.auth0.com`.

## 9. (Opcional) Claim de admin no token
Hoje o admin é detectado por `LAPLACE_ADMIN_EMAILS` no `.env`. Para usar roles:
- **Actions → Library → Build Custom** (trigger: Post Login):
```js
exports.onExecutePostLogin = async (event, api) => {
  const roles = event.authorization?.roles ?? [];
  api.idToken.setCustomClaim("https://uselaplace.co/roles", roles);
};
```
- Crie a role `admin` e atribua ao seu usuário. O app já lê esse claim.

---

## Rodar
```bash
cd web
npm install
npm run dev        # http://localhost:3000
```
- **Sem `.env.local`:** abre direto a tela de seleção de org (mock) — bom p/ ver o design.
- **Com `.env.local`:** `/` → Universal Login → seleção de org → `/app`.
