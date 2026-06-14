import { NextResponse, type NextRequest } from "next/server";
import { getAuth0, isAuthConfigured } from "./lib/auth0";

/**
 * - Sem Auth0 configurado → deixa passar (preview com mock).
 * - Com Auth0 → o SDK monta /auth/* e protegemos o resto da app.
 */
export async function middleware(request: NextRequest) {
  if (!isAuthConfigured) return NextResponse.next();

  const auth0 = getAuth0();
  const res = await auth0.middleware(request);

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/auth")) return res; // rotas do SDK

  const session = await auth0.getSession(request);
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.nextUrl.origin));
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
