import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Server, Users, ExternalLink, Copy, Check } from "lucide-react";
import { SiDiscord } from "react-icons/si";

interface BotGuild {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  ownerId: string;
  inviteUrl: string;
}

export default function BotGuilds() {
  const [, setLocation] = useLocation();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: config } = useQuery({
    queryKey: ['/api/oauth/config'],
    queryFn: async () => {
      const response = await fetch('/api/oauth/config');
      if (!response.ok) throw new Error('Failed to fetch config');
      return response.json();
    },
  });

  const { data: botGuilds, isLoading, error } = useQuery<BotGuild[]>({
    queryKey: ['/api/bot/guilds'],
    queryFn: async () => {
      const response = await fetch('/api/bot/guilds', {
        credentials: 'include',
      });
      if (response.status === 401) {
        setLocation('/');
        throw new Error('Not authorized');
      }
      if (!response.ok) throw new Error('Failed to fetch bot guilds');
      return response.json();
    },
  });

  const handleCopyInvite = async (inviteUrl: string, guildId: string) => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedId(guildId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/dashboard')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <SiDiscord className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold">Sparx Members <span className="text-primary">⚡️</span></span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Bot Servers</h1>
          <p className="text-muted-foreground">
            List of all Discord servers where the bot is a member
          </p>
        </div>

        {error && (
          <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{(error as Error).message}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="h-12 bg-muted rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {botGuilds && botGuilds.length > 0 ? (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Found {botGuilds.length} server{botGuilds.length !== 1 ? 's' : ''}
                </div>
                <ScrollArea className="w-full">
                  <div className="space-y-2 pr-4">
                    {botGuilds.map((guild) => (
                      <Card key={guild.id}>
                        <CardContent className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              {guild.icon ? (
                                <AvatarImage
                                  src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                  alt={guild.name}
                                />
                              ) : null}
                              <AvatarFallback>
                                <Server className="w-6 h-6 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <h3 className="font-medium" data-testid={`text-guild-name-${guild.id}`}>
                                {guild.name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{guild.memberCount} members</span>
                                </div>
                                <span className="text-xs">ID: {guild.id}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyInvite(guild.inviteUrl, guild.id)}
                                data-testid={`button-copy-invite-${guild.id}`}
                              >
                                {copiedId === guild.id ? (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copy Link
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => window.open(guild.inviteUrl, '_blank')}
                                data-testid={`button-join-server-${guild.id}`}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Join Server
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-muted-foreground">
                    No servers found
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                  <p>The bot is not in any servers yet. Invite it to your servers to see them here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
