// Constantes/tipos compartilhados entre o client (ChannelsView) e o server (actions).
// NÃO pode morar no arquivo "use server" — de lá só saem funções async.

export const PLATFORMS = [
  "youtube",
  "instagram",
  "linkedin",
  "x",
  "tiktok",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export type ActionResult = { ok: boolean; error?: string };
