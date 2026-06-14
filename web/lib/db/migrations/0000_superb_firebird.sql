CREATE TYPE "public"."channel_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('youtube', 'instagram', 'linkedin', 'x', 'tiktok');--> statement-breakpoint
CREATE TABLE "connected_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"platform" "platform" NOT NULL,
	"handle" text NOT NULL,
	"external_id" text,
	"status" "channel_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tenant_platform_handle" UNIQUE("tenant_id","platform","handle")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "connected_channels" ADD CONSTRAINT "connected_channels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;