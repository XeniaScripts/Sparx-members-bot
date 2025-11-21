# ServerSync - Discord Member Transfer Bot

A Discord bot that automatically transfers members between servers using OAuth2 authorization with the `guilds.join` scope.

## Features

- **OAuth2 Authorization**: Secure user authentication with Discord
- **Automatic Member Transfer**: Transfer authorized users between servers without invite links
- **Real-time Progress Tracking**: Live updates on transfer status with success/failure details
- **Secure Session Management**: Server-side sessions with PostgreSQL storage
- **Beautiful UI**: Discord-themed interface with responsive design

## How It Works

1. **Authorization**: Users authorize the bot with Discord OAuth2, granting the `guilds.join` scope
2. **Token Storage**: OAuth access tokens are securely stored in the database
3. **Server Selection**: Users select source and target servers (bot must be in both)
4. **Transfer**: The bot transfers all users who have authorized it to the target server
5. **Progress Tracking**: Real-time updates show success, skipped, and failed transfers

## Important Notes

### Member Transfer Limitations

- **Only authorized users can be transferred**: The bot can only transfer users who have individually authorized it with the `guilds.join` scope
- **Not a full server migration tool**: This bot does NOT fetch all members from a server (that would require the privileged `GuildMembers` intent)
- **Users must authorize first**: Each user who wants to be transferable must visit the website and authorize

### Bot Setup

**Discord Developer Portal Settings:**
1. Go to https://discord.com/developers/applications
2. Select your application
3. **Bot Section:**
   - ✅ Public Bot: ON (so others can invite)
   - ❌ Require OAuth2 Code Grant: OFF
   - ❌ Privileged Gateway Intents: None required
4. **OAuth2 Section:**
   - Add redirect URI: `http://localhost:5000/auth/callback` (dev)
   - Add redirect URI: `https://your-domain.repl.co/auth/callback` (production)

## Bot Invite Link

To invite the bot to your Discord servers, use this link (replace CLIENT_ID with your Discord application's client ID):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=0&scope=bot%20applications.commands
```

The bot needs minimal permissions since member additions are done via OAuth2, not bot permissions.

## Architecture

### Frontend (`client/`)
- **Landing Page**: Hero section with OAuth authorization button
- **Dashboard**: Server selection and transfer interface with real-time progress
- **Terms Page**: Detailed terms of service explaining bot usage

### Backend (`server/`)
- **Discord Bot**: Discord.js bot with `/server` slash command
- **OAuth Routes**: Authorization and callback endpoints
- **Transfer Logic**: Background transfer processing with database persistence
- **Session Management**: Express sessions stored in PostgreSQL

### Database (`shared/schema.ts`)
- **oauth_tokens**: Stores user OAuth access/refresh tokens
- **transfers**: Transfer history and progress tracking
- **session**: Express session store (auto-created)

## Environment Variables

Required secrets:
- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your Discord application client ID
- `DISCORD_CLIENT_SECRET`: Your Discord application client secret
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `SESSION_SECRET`: Secret for session encryption (auto-configured)

Frontend environment:
- `VITE_DISCORD_CLIENT_ID`: Client ID for OAuth redirect (auto-synced from DISCORD_CLIENT_ID)

## Running the Application

The application runs on port 5000 with a single command:
```bash
npm run dev
```

This starts:
- Discord bot (connects to Discord gateway)
- Express server (API and session management)
- Vite dev server (frontend with HMR)

## Security Features

- ✅ Secure server-side sessions with httpOnly cookies
- ✅ OAuth tokens encrypted in database
- ✅ No client-side token storage
- ✅ Session-based authentication (no userId in URLs)
- ✅ PostgreSQL session store with automatic cleanup
- ✅ CSRF protection via session tokens

## API Endpoints

### OAuth
- `POST /api/auth/callback` - Exchange OAuth code for tokens
- `GET /api/user` - Get current user info
- `GET /api/guilds` - Get user's guilds with bot presence info

### Transfers
- `POST /api/transfer/start` - Start a new transfer
- `GET /api/transfer/status/:transferId` - Get transfer progress
- `GET /api/transfers` - Get user's transfer history

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express, Discord.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Session**: express-session with connect-pg-simple
- **Build**: Vite

## Development

The codebase follows a schema-first approach:
1. Define data models in `shared/schema.ts`
2. Build frontend components
3. Implement backend API routes
4. Integrate frontend with backend

All changes to database schema are applied with:
```bash
npm run db:push
```

## User Flow

1. User visits landing page
2. Clicks "Authorize with Discord"
3. Redirected to Discord OAuth (grants `identify` and `guilds.join`)
4. Redirected back to `/auth/callback`
5. Session created with user ID
6. Redirected to dashboard
7. Selects source and target servers
8. Starts transfer
9. Watches real-time progress
10. Views transfer results

## Limitations & Future Enhancements

Current limitations:
- Can only transfer users who have authorized the bot
- No role mapping or assignment
- No member filtering (by role, join date, etc.)
- No rate limit handling beyond basic 1s delay
- No OAuth token refresh (tokens expire after 7 days)

Future features (not in MVP):
- Rate limiting and queue system
- Role mapping for transferred members
- Member filtering options
- Transfer history dashboard
- OAuth token refresh handling
- Multi-server batch transfers
