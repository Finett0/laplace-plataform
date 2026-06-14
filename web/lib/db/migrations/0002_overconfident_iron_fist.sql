CREATE TABLE "channel_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"channel_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"external_id" text,
	"display_name" text,
	"headline" text,
	"followers" integer,
	"content_count" integer,
	"avatar_url" text,
	"raw" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_profile_channel" UNIQUE("channel_id")
);
--> statement-breakpoint
ALTER TABLE "channel_profiles" ADD CONSTRAINT "channel_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_profiles" ADD CONSTRAINT "channel_profiles_channel_id_connected_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."connected_channels"("id") ON DELETE cascade ON UPDATE no action;