import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User OAuth tokens table
export const oauthTokens = pgTable("oauth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull().unique(),
  username: text("username").notNull(),
  discriminator: text("discriminator"),
  avatar: text("avatar"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at").notNull(),
  scopes: text("scopes").notNull(), // space-separated scopes
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Transfer history table
export const transfers = pgTable("transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  sourceGuildId: text("source_guild_id").notNull(),
  sourceGuildName: text("source_guild_name").notNull(),
  targetGuildId: text("target_guild_id").notNull(),
  targetGuildName: text("target_guild_name").notNull(),
  status: text("status").notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  totalMembers: integer("total_members").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  results: jsonb("results"), // Array of transfer results
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertOauthTokenSchema = createInsertSchema(oauthTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  startedAt: true,
});

// Types
export type OauthToken = typeof oauthTokens.$inferSelect;
export type InsertOauthToken = z.infer<typeof insertOauthTokenSchema>;

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;

// Frontend-specific types
export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  botPresent: boolean;
}

export interface TransferMemberResult {
  userId: string;
  username: string;
  discriminator: string;
  status: 'success' | 'skipped' | 'failed';
  reason?: string;
}

export interface TransferProgress {
  transferId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  current: number;
  total: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  results: TransferMemberResult[];
}
