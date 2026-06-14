/**
 * Schema do banco de METADADOS da app (Postgres).
 * Não é o data lake nem o warehouse (esses ficam em GCS/BigQuery, fase posterior).
 * É o fio que liga o `org_id` do Auth0 → `tenant_id` persistido e diz à camada 1
 * (extração) QUAIS canais cada tenant conectou.
 */
import {
  pgTable,
  text,
  uuid,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

/** Plataformas cobertas pela TikHub no MVP. */
export const platformEnum = pgEnum("platform", [
  "youtube",
  "instagram",
  "linkedin",
  "x",
  "tiktok",
]);

export const channelStatusEnum = pgEnum("channel_status", ["active", "paused"]);

/** Espelha as Organizations do Auth0 (1 org = 1 tenant). `id` = org_id do Auth0. */
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(), // ex.: org_UmSZGdvMWn4A0tpI
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Canais que cada tenant conectou — o que a camada 1 vai extrair. */
export const connectedChannels = pgTable(
  "connected_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    handle: text("handle").notNull(), // @mkbhd, username…
    externalId: text("external_id"), // id interno resolvido na 1ª extração
    status: channelStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("uq_tenant_platform_handle").on(t.tenantId, t.platform, t.handle)],
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type ConnectedChannel = typeof connectedChannels.$inferSelect;
export type NewConnectedChannel = typeof connectedChannels.$inferInsert;
