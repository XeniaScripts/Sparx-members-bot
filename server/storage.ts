import { oauthTokens, transfers, type OauthToken, type InsertOauthToken, type Transfer, type InsertTransfer } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // OAuth Tokens
  getOauthToken(discordUserId: string): Promise<OauthToken | undefined>;
  getAllOauthTokens(): Promise<OauthToken[]>;
  upsertOauthToken(token: InsertOauthToken): Promise<OauthToken>;
  deleteOauthToken(discordUserId: string): Promise<void>;

  // Transfers
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getTransfer(id: string): Promise<Transfer | undefined>;
  updateTransfer(id: string, data: Partial<Transfer>): Promise<Transfer>;
  getTransfersByUser(discordUserId: string): Promise<Transfer[]>;
}

export class DatabaseStorage implements IStorage {
  // OAuth Tokens
  async getOauthToken(discordUserId: string): Promise<OauthToken | undefined> {
    const [token] = await db
      .select()
      .from(oauthTokens)
      .where(eq(oauthTokens.discordUserId, discordUserId));
    return token || undefined;
  }

  async getAllOauthTokens(): Promise<OauthToken[]> {
    return await db.select().from(oauthTokens);
  }

  async upsertOauthToken(insertToken: InsertOauthToken): Promise<OauthToken> {
    const existing = await this.getOauthToken(insertToken.discordUserId);
    
    if (existing) {
      const [updated] = await db
        .update(oauthTokens)
        .set({
          ...insertToken,
          updatedAt: new Date(),
        })
        .where(eq(oauthTokens.discordUserId, insertToken.discordUserId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(oauthTokens)
        .values(insertToken)
        .returning();
      return created;
    }
  }

  async deleteOauthToken(discordUserId: string): Promise<void> {
    await db
      .delete(oauthTokens)
      .where(eq(oauthTokens.discordUserId, discordUserId));
  }

  // Transfers
  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const [transfer] = await db
      .insert(transfers)
      .values(insertTransfer)
      .returning();
    return transfer;
  }

  async getTransfer(id: string): Promise<Transfer | undefined> {
    const [transfer] = await db
      .select()
      .from(transfers)
      .where(eq(transfers.id, id));
    return transfer || undefined;
  }

  async updateTransfer(id: string, data: Partial<Transfer>): Promise<Transfer> {
    // Only update mutable fields, exclude primary key and immutable fields
    const { id: _, discordUserId: __, sourceGuildId: ___, sourceGuildName: ____, 
            targetGuildId: _____, targetGuildName: ______, startedAt: _______, ...updateData } = data as any;
    
    const [updated] = await db
      .update(transfers)
      .set(updateData)
      .where(eq(transfers.id, id))
      .returning();
    return updated;
  }

  async getTransfersByUser(discordUserId: string): Promise<Transfer[]> {
    return await db
      .select()
      .from(transfers)
      .where(eq(transfers.discordUserId, discordUserId))
      .orderBy(transfers.startedAt);
  }
}

export const storage = new DatabaseStorage();
