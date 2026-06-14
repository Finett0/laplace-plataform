import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Está o Auth0 configurado? Sem isso, o app roda em modo preview
 * (telas visíveis com dados mock; sem login real) — mesmo espírito
 * "o frontend nunca quebra" do protótipo v1.
 */
export const isAuthConfigured = Boolean(
  process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_SECRET,
);

// Construção tardia: o Auth0Client v4 valida env no construtor, então só
// instanciamos quando realmente configurado.
let client: Auth0Client | undefined;
export function getAuth0(): Auth0Client {
  if (!client) client = new Auth0Client();
  return client;
}
