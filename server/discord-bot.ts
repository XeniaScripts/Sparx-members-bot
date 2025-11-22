import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { storage } from './storage';

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN is required');
}

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('DISCORD_CLIENT_ID is required');
}

// Helper to get the correct OAuth redirect URI
export function getOAuthRedirectUri(): string {
  // If explicitly set, use it
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI;
  }
  
  // If BASE_URL is set, use it (takes precedence over NODE_ENV)
  if (process.env.BASE_URL) {
    return `${process.env.BASE_URL}/auth/callback`;
  }
  
  // Otherwise, use default based on environment
  if (process.env.NODE_ENV === 'production') {
    return 'https://your-domain.repl.co/auth/callback';
  }
  
  return 'http://localhost:5000/auth/callback';
}

// Helper to get the website base URL
export function getWebsiteUrl(): string {
  // Extract base URL from redirect URI
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI.replace('/auth/callback', '');
  }
  
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://your-domain.repl.co';
  }
  
  return 'http://localhost:5000';
}

// Create Discord bot client
export const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

// Register slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('authorize')
    .setDescription('Get the authorization link to authorize this bot for member transfers'),
  new SlashCommandBuilder()
    .setName('server')
    .setDescription('Transfer members from current server to target server')
    .addStringOption(option =>
      option
        .setName('target_id')
        .setDescription('Target server ID (enable Developer Mode in Discord to copy)')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the invite link to add this bot to a server'),
  new SlashCommandBuilder()
    .setName('website')
    .setDescription('Get the link to the Sparx Members Bot website for transferring members'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// Initialize bot
export async function initializeBot() {
  try {
    console.log('Starting Discord bot...');
    
    // Register commands globally
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands },
    );
    console.log('Successfully registered application commands');

    // Bot ready handler
    discordClient.once('ready', () => {
      console.log(`Discord bot logged in as ${discordClient.user?.tag}`);
    });

    // Command handler
    discordClient.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'authorize') {
        await handleAuthorizeCommand(interaction);
      } else if (interaction.commandName === 'server') {
        await handleServerCommand(interaction);
      } else if (interaction.commandName === 'invite') {
        await handleInviteCommand(interaction);
      } else if (interaction.commandName === 'website') {
        await handleWebsiteCommand(interaction);
      }
    });

    // Login to Discord
    await discordClient.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('Error initializing Discord bot:', error);
    throw error;
  }
}

// Handle /authorize command
async function handleAuthorizeCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Get the OAuth redirect URI (must match Discord app settings)
    const redirectUri = getOAuthRedirectUri();

    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify guilds guilds.join');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('prompt', 'consent');
    
    console.log(`[Discord] Generated auth URL with redirect_uri: ${redirectUri}`);

    // Check if user is already authorized
    const existingToken = await storage.getOauthToken(interaction.user.id);
    if (existingToken) {
      await interaction.reply({
        content: `✅ You're already authorized!\n\nYour authorization is active. You can now use the **server** command or visit the web dashboard to transfer members.\n\nClick below to authorize again if you want to refresh your authorization:\n\n[🔗 Authorize with Discord](${authUrl.toString()})`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `✅ **Authorize the bot to transfer members**\n\nClick the button below to authorize with Discord. This grants the bot permission to add you to other servers you authorize.\n\n[🔗 Authorize with Discord](${authUrl.toString()})`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error('Error handling authorize command:', error);
    await interaction.reply({
      content: '❌ An error occurred. Please try again later.',
      ephemeral: true,
    });
  }
}

// Handle /invite command
async function handleInviteCommand(interaction: ChatInputCommandInteraction) {
  try {
    const inviteUrl = new URL('https://discord.com/api/oauth2/authorize');
    inviteUrl.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID!);
    inviteUrl.searchParams.set('permissions', '0');
    inviteUrl.searchParams.set('scope', 'bot');
    
    await interaction.reply({
      content: `✅ **Add the bot to a server**\n\nClick the link below to invite this bot to any server where you have permission to manage the server:\n\n[🔗 Invite Bot to Server](${inviteUrl.toString()})`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error handling invite command:', error);
    await interaction.reply({
      content: '❌ An error occurred. Please try again later.',
      ephemeral: true,
    });
  }
}

// Handle /website command
async function handleWebsiteCommand(interaction: ChatInputCommandInteraction) {
  try {
    const websiteUrl = getWebsiteUrl();
    
    await interaction.reply({
      content: `✅ **Sparx Members Bot**\n\nVisit the website to transfer members:\n\n[🌐 Open Sparx Members Bot](${websiteUrl}/dashboard)`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error handling website command:', error);
    await interaction.reply({
      content: '❌ An error occurred. Please try again later.',
      ephemeral: true,
    });
  }
}

// Handle /server command
async function handleServerCommand(interaction: ChatInputCommandInteraction) {
  const targetGuildId = interaction.options.getString('target_id', true);
  const sourceGuildId = interaction.guildId;

  if (!sourceGuildId) {
    await interaction.reply({
      content: '❌ This command must be used in a server.',
      ephemeral: true,
    });
    return;
  }

  if (sourceGuildId === targetGuildId) {
    await interaction.reply({
      content: '❌ Source and target servers cannot be the same.',
      ephemeral: true,
    });
    return;
  }

  // Check if bot is in target guild
  const targetGuild = discordClient.guilds.cache.get(targetGuildId);
  if (!targetGuild) {
    await interaction.reply({
      content: '❌ The bot must be added to the target server first. Please invite the bot to both servers.',
      ephemeral: true,
    });
    return;
  }

  // Check if user has authorized
  const userToken = await storage.getOauthToken(interaction.user.id);
  if (!userToken) {
    // Get the OAuth redirect URI for the authorization link
    const redirectUri = getOAuthRedirectUri();
    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify guilds guilds.join');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('prompt', 'consent');

    await interaction.reply({
      content: `❌ You need to authorize the bot first!\n\n[🔗 Click here to authorize](${authUrl.toString()})`,
      ephemeral: true,
    });
    return;
  }

  // Acknowledge the command
  await interaction.deferReply({ ephemeral: true });

  try {
    // Get all authorized users
    const allTokens = await storage.getAllOauthTokens();
    console.log(`[/server] Starting transfer from ${interaction.guild?.name} to ${targetGuild.name}. Authorized users: ${allTokens.length}`);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Transfer each authorized user
    for (const token of allTokens) {
      // Skip bots
      try {
        const user = await discordClient.users.fetch(token.discordUserId);
        if (user.bot) {
          console.log(`[/server] Skipping bot user ${token.discordUserId}`);
          continue;
        }
      } catch (error) {
        console.log(`[/server] Could not fetch user ${token.discordUserId}, skipping`);
        continue;
      }

      const result = await addMemberToGuild(targetGuildId, token.discordUserId, token.accessToken);
      
      if (result.success) {
        successCount++;
        console.log(`[/server] Successfully transferred user ${token.discordUserId}`);
      } else {
        failCount++;
        const errorMsg = result.reason || 'Unknown error';
        errors.push(`<@${token.discordUserId}>: ${errorMsg}`);
        console.log(`[/server] Failed to transfer user ${token.discordUserId}: ${errorMsg}`);
      }

      // Rate limiting - Discord allows ~50 adds per minute
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let summary = `✅ **Transfer Complete**\n\n**Source:** ${interaction.guild?.name}\n**Target:** ${targetGuild.name}\n\n`;
    summary += `✔️ **Successful:** ${successCount}\n`;
    summary += `❌ **Failed:** ${failCount}\n`;

    if (errors.length > 0 && errors.length <= 10) {
      summary += `\n**Errors:**\n${errors.slice(0, 10).join('\n')}`;
    } else if (errors.length > 10) {
      summary += `\n**Errors:** ${errors.length} failures (too many to display)`;
    }

    await interaction.editReply(summary);
  } catch (error) {
    console.error('[/server] Transfer error:', error);
    await interaction.editReply({
      content: '❌ An error occurred during the transfer. Please try again.'
    });
  }
}

// Helper function to get guild info
export async function getGuildInfo(guildId: string) {
  const guild = discordClient.guilds.cache.get(guildId);
  if (!guild) return null;

  try {
    return {
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      memberCount: guild.memberCount,
      botPresent: true,
    };
  } catch (error) {
    console.error(`Error fetching guild info for ${guildId}:`, error);
    return null;
  }
}

// Helper function to add member to guild using OAuth token
export async function addMemberToGuild(
  guildId: string,
  userId: string,
  accessToken: string
): Promise<{ success: boolean; reason?: string }> {
  try {
    const guild = discordClient.guilds.cache.get(guildId);
    if (!guild) {
      console.error(`[addMember] Bot not in guild ${guildId}`);
      return { success: false, reason: 'Bot not in target server' };
    }

    // Check if user is already in guild
    const existingMember = guild.members.cache.get(userId);
    if (existingMember) {
      console.log(`[addMember] User ${userId} already in guild ${guildId}`);
      return { success: false, reason: 'Already in server' };
    }

    // Add member using OAuth token
    console.log(`[addMember] Adding user ${userId} to guild ${guildId}`);
    await guild.members.add(userId, {
      accessToken: accessToken,
    });

    console.log(`[addMember] Successfully added user ${userId} to guild ${guildId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[addMember] Error adding member ${userId} to guild ${guildId}:`, {
      code: error.code,
      message: error.message,
      status: error.status,
    });
    
    if (error.code === 50007) {
      return { success: false, reason: 'Cannot send messages to this user' };
    } else if (error.code === 50013) {
      return { success: false, reason: 'Missing permissions' };
    } else if (error.code === 40007) {
      return { success: false, reason: 'User has DMs disabled' };
    }
    
    return { success: false, reason: error.message || 'Unknown error' };
  }
}

// Note: We can't fetch ALL guild members without privileged GuildMembers intent
// Instead, we only transfer members who have already authorized the bot
// This is handled in the transfer logic by checking the oauth_tokens table
