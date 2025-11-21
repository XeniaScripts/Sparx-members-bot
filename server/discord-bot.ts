import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { storage } from './storage';

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN is required');
}

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('DISCORD_CLIENT_ID is required');
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
    .setName('server')
    .setDescription('Transfer members from current server to target server')
    .addStringOption(option =>
      option
        .setName('target_id')
        .setDescription('Target server ID (enable Developer Mode in Discord to copy)')
        .setRequired(true)
    ),
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

      if (interaction.commandName === 'server') {
        await handleServerCommand(interaction);
      }
    });

    // Login to Discord
    await discordClient.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('Error initializing Discord bot:', error);
    throw error;
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
    await interaction.reply({
      content: '❌ You need to authorize the bot first. Please visit the web dashboard to authorize.',
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: `✅ Transfer initiated! Use the web dashboard at ${process.env.NODE_ENV === 'production' ? 'your-domain.com' : 'http://localhost:5000'}/dashboard to monitor progress.\n\n**Source:** ${interaction.guild?.name}\n**Target:** ${targetGuild.name}`,
    ephemeral: true,
  });
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
      return { success: false, reason: 'Bot not in target server' };
    }

    // Check if user is already in guild
    const existingMember = guild.members.cache.get(userId);
    if (existingMember) {
      return { success: false, reason: 'Already in server' };
    }

    // Add member using OAuth token
    await guild.members.add(userId, {
      accessToken: accessToken,
    });

    return { success: true };
  } catch (error: any) {
    console.error(`Error adding member ${userId} to guild ${guildId}:`, error);
    
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
