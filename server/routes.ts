import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeBot, discordClient, getGuildInfo, addMemberToGuild, getOAuthRedirectUri } from "./discord-bot";
import type { TransferProgress, TransferMemberResult } from "@shared/schema";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = ConnectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Discord bot
  await initializeBot();

  // Setup session middleware
  app.use(session({
    store: new PgSession({
      pool: pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  }));

  // OAuth2 callback endpoint - both GET and POST
  // GET: Direct browser redirect from Discord
  // POST: From frontend callback handler
  const handleOAuthCallback = async (req: any, res: any, code: string, redirectUriPath: string) => {
    try {
      if (!code) {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      // Get the OAuth redirect URI (must match Discord OAuth app settings exactly)
      const redirectUri = getOAuthRedirectUri();

      console.log(`[OAuth] Exchanging code for tokens, redirect_uri: ${redirectUri}`);

      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          scope: 'identify guilds guilds.join',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('[OAuth] Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          body: errorData,
          redirectUri,
        });
        return res.status(400).json({ 
          error: 'Failed to exchange authorization code',
          details: errorData 
        });
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        return res.status(400).send('Failed to fetch user info');
      }

      const userData = await userResponse.json();

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Store OAuth token
      await storage.upsertOauthToken({
        discordUserId: userData.id,
        username: userData.username,
        discriminator: userData.discriminator || '0',
        avatar: userData.avatar,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt,
        scopes: tokenData.scope,
      });

      // Store user in session
      (req.session as any).discordUserId = userData.id;

      console.log(`[OAuth] Successfully authorized user ${userData.username} (${userData.id})`);
      res.json({ success: true, user: userData });
    } catch (error) {
      console.error('[OAuth] Callback error:', error);
      res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
  };

  // POST endpoint for OAuth callback (from frontend)
  app.post("/api/auth/callback", async (req, res) => {
    const { code } = req.body;
    await handleOAuthCallback(req, res, code, '/auth/callback');
  });

  // GET endpoint for OAuth callback (direct from Discord)
  app.get("/auth/callback", async (req, res) => {
    const { code, state } = req.query as { code?: string; state?: string };
    
    if (!code) {
      return res.status(400).send('Missing authorization code from Discord');
    }

    try {
      // Get the OAuth redirect URI (must match Discord OAuth app settings exactly)
      const redirectUri = getOAuthRedirectUri();

      console.log(`[OAuth] GET callback, redirect_uri: ${redirectUri}`);

      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          scope: 'identify guilds guilds.join',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('[OAuth] Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          body: errorData,
          redirectUri,
        });
        return res.status(400).send(`Authorization failed: ${errorData}`);
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        return res.status(400).send('Failed to fetch user info');
      }

      const userData = await userResponse.json();

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Store OAuth token
      await storage.upsertOauthToken({
        discordUserId: userData.id,
        username: userData.username,
        discriminator: userData.discriminator || '0',
        avatar: userData.avatar,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: expiresAt,
        scopes: tokenData.scope,
      });

      // Store user in session
      (req.session as any).discordUserId = userData.id;

      console.log(`[OAuth] Successfully authorized user ${userData.username} (${userData.id})`);

      // Save session before redirecting
      req.session.save((err) => {
        if (err) {
          console.error('[OAuth] Session save error:', err);
          return res.status(500).send('Failed to save session');
        }
        // Redirect to dashboard
        res.redirect('/dashboard?authorized=true');
      });
    } catch (error) {
      console.error('[OAuth] GET callback error:', error);
      res.status(500).send('Internal server error: ' + String(error));
    }
  });

  // Get OAuth configuration for frontend
  app.get("/api/oauth/config", async (req, res) => {
    res.json({
      clientId: process.env.DISCORD_CLIENT_ID,
    });
  });

  // Get current user info
  app.get("/api/user", async (req, res) => {
    try {
      const userId = (req.session as any).discordUserId;
      
      if (!userId) {
        return res.status(401).send('Not authorized');
      }

      const token = await storage.getOauthToken(userId);
      if (!token) {
        return res.status(401).send('Not authorized');
      }

      res.json({
        id: token.discordUserId,
        username: token.username,
        discriminator: token.discriminator,
        avatar: token.avatar,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Get user's guilds
  app.get("/api/guilds", async (req, res) => {
    try {
      const userId = (req.session as any).discordUserId;
      
      if (!userId) {
        return res.status(401).send('Not authorized');
      }

      const token = await storage.getOauthToken(userId);
      if (!token) {
        return res.status(401).send('Not authorized');
      }

      // Check if token is expired
      if (new Date(token.expiresAt) < new Date()) {
        console.error(`[Guilds] Token expired for user ${userId}`);
        return res.status(401).json({ error: 'Token expired. Please re-authorize.' });
      }

      console.log(`[Guilds] Fetching guilds for user ${userId} with token scopes: ${token.scopes}`);

      // Get guilds from Discord API
      const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      });

      if (!guildsResponse.ok) {
        const errorData = await guildsResponse.text();
        console.error(`[Guilds] Discord API error:`, {
          status: guildsResponse.status,
          statusText: guildsResponse.statusText,
          error: errorData,
          userId,
          tokenExpires: token.expiresAt,
        });
        return res.status(400).json({ error: 'Failed to fetch guilds', details: errorData });
      }

      const guilds = await guildsResponse.json();

      // Enhance with bot presence info using the bot's guild cache
      const enhancedGuilds = await Promise.all(
        guilds.map(async (guild: any) => {
          const botGuild = discordClient.guilds.cache.get(guild.id);
          const info = botGuild ? await getGuildInfo(guild.id) : null;
          return {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            memberCount: info?.memberCount || guild.approximate_member_count || 0,
            botPresent: !!botGuild,
          };
        })
      );

      res.json(enhancedGuilds);
    } catch (error) {
      console.error('Error fetching guilds:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Start transfer
  app.post("/api/transfer/start", async (req, res) => {
    try {
      const { sourceGuildId, targetGuildId } = req.body;
      const userId = (req.session as any).discordUserId;

      if (!userId) {
        return res.status(401).send('Not authorized');
      }

      const userToken = await storage.getOauthToken(userId);
      if (!userToken) {
        return res.status(401).send('Not authorized');
      }

      // Verify both guilds exist and bot is in them
      const sourceGuild = discordClient.guilds.cache.get(sourceGuildId);
      const targetGuild = discordClient.guilds.cache.get(targetGuildId);

      if (!sourceGuild || !targetGuild) {
        return res.status(400).send('Bot must be in both servers');
      }

      const sourceInfo = await getGuildInfo(sourceGuildId);
      const targetInfo = await getGuildInfo(targetGuildId);

      if (!sourceInfo || !targetInfo) {
        return res.status(400).send('Failed to fetch server information');
      }

      // Create transfer record
      const transfer = await storage.createTransfer({
        discordUserId: userId,
        sourceGuildId: sourceGuildId,
        sourceGuildName: sourceInfo.name,
        targetGuildId: targetGuildId,
        targetGuildName: targetInfo.name,
        status: 'pending',
        totalMembers: 0,
        successCount: 0,
        skippedCount: 0,
        failedCount: 0,
        results: null,
        errorMessage: null,
        completedAt: null,
      });

      // Start transfer in background
      console.log(`[Transfer] Starting transfer ${transfer.id} from ${sourceGuildId} to ${targetGuildId}`);
      performTransfer(transfer.id, sourceGuildId, targetGuildId).catch(err => {
        console.error('[Transfer] Background error:', err);
      });

      // Return initial progress from database
      const progress: TransferProgress = {
        transferId: transfer.id,
        status: 'in_progress',
        current: 0,
        total: 0,
        successCount: 0,
        skippedCount: 0,
        failedCount: 0,
        results: [],
      };

      res.json(progress);
    } catch (error) {
      console.error('Error starting transfer:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Get transfer status
  app.get("/api/transfer/status/:transferId", async (req, res) => {
    try {
      const { transferId } = req.params;
      
      // Always fetch from database for persistence across restarts
      const transfer = await storage.getTransfer(transferId);
      if (!transfer) {
        return res.status(404).send('Transfer not found');
      }

      // Reconstruct progress from database
      const progress: TransferProgress = {
        transferId: transfer.id,
        status: transfer.status as any,
        current: transfer.successCount + transfer.skippedCount + transfer.failedCount,
        total: transfer.totalMembers,
        successCount: transfer.successCount,
        skippedCount: transfer.skippedCount,
        failedCount: transfer.failedCount,
        results: (transfer.results as any) || [],
      };

      res.json(progress);
    } catch (error) {
      console.error('Error fetching transfer status:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Get user's transfer history
  app.get("/api/transfers", async (req, res) => {
    try {
      const userId = (req.session as any).discordUserId;
      
      if (!userId) {
        return res.status(401).send('Not authorized');
      }

      const transfers = await storage.getTransfersByUser(userId);
      res.json(transfers);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      res.status(500).send('Internal server error');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background transfer function - persists all progress to database
async function performTransfer(
  transferId: string,
  sourceGuildId: string,
  targetGuildId: string
) {
  const results: TransferMemberResult[] = [];
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  try {
    console.log(`[Transfer ${transferId}] Starting`);
    // Update status
    await storage.updateTransfer(transferId, { status: 'in_progress' });

    // Get all users who have authorized the bot
    const allAuthorizedUsers = await storage.getAllOauthTokens();
    console.log(`[Transfer ${transferId}] Found ${allAuthorizedUsers.length} authorized users`);
    
    await storage.updateTransfer(transferId, { totalMembers: allAuthorizedUsers.length });

    // Process each authorized user
    for (const memberToken of allAuthorizedUsers) {
      console.log(`[Transfer ${transferId}] Processing ${memberToken.username} (${memberToken.discordUserId})`);
      
      // Check if token is expired
      if (new Date(memberToken.expiresAt) < new Date()) {
        console.log(`[Transfer ${transferId}] Token expired for ${memberToken.username}`);
        const result: TransferMemberResult = {
          userId: memberToken.discordUserId,
          username: memberToken.username,
          discriminator: memberToken.discriminator || '0',
          status: 'failed',
          reason: 'OAuth token expired',
        };
        results.push(result);
        failedCount++;
        continue;
      }

      // Add all authorized users to the target server
      console.log(`[Transfer ${transferId}] Adding ${memberToken.username} to target guild ${targetGuildId}`);
      const addResult = await addMemberToGuild(
        targetGuildId,
        memberToken.discordUserId,
        memberToken.accessToken
      );

      console.log(`[Transfer ${transferId}] Result for ${memberToken.username}: success=${addResult.success}, reason=${addResult.reason}`);

      const result: TransferMemberResult = {
        userId: memberToken.discordUserId,
        username: memberToken.username,
        discriminator: memberToken.discriminator || '0',
        status: addResult.success ? 'success' : (addResult.reason === 'Already in server' ? 'skipped' : 'failed'),
        reason: addResult.reason,
      };

      results.push(result);
      
      if (addResult.success) {
        successCount++;
      } else if (addResult.reason === 'Already in server') {
        skippedCount++;
      } else {
        failedCount++;
      }

      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[Transfer ${transferId}] Completed - Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`);
    
    // Final update with all results
    await storage.updateTransfer(transferId, {
      status: 'completed',
      successCount,
      skippedCount,
      failedCount,
      results: results as any,
      completedAt: new Date(),
    });
  } catch (error: any) {
    console.error(`[Transfer ${transferId}] Failed:`, error);
    await storage.updateTransfer(transferId, {
      status: 'failed',
      errorMessage: error.message,
      completedAt: new Date(),
    });
  }
}
