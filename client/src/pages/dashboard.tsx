import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Users, CheckCircle2, XCircle, AlertCircle, Server, Loader2, Search } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import type { DiscordGuild, TransferProgress } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [sourceGuildId, setSourceGuildId] = useState<string>("");
  const [targetGuildId, setTargetGuildId] = useState<string>("");
  const [sourceSearch, setSourceSearch] = useState<string>("");
  const [targetSearch, setTargetSearch] = useState<string>("");
  const [activeTransfer, setActiveTransfer] = useState<TransferProgress | null>(null);
  const [, setLocation] = useLocation();

  // Fetch user's guilds (authentication via session cookies)
  const { data: guilds, isLoading: guildsLoading, error: guildsError } = useQuery<DiscordGuild[]>({
    queryKey: ['/api/guilds'],
    queryFn: async () => {
      const response = await fetch('/api/guilds', {
        credentials: 'include', // Send session cookies
      });
      if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Not authorized');
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch guilds');
      }
      return response.json();
    },
  });

  // Fetch user profile (authentication via session cookies)
  const { data: user } = useQuery<{ username: string; discriminator: string; avatar: string }>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        credentials: 'include', // Send session cookies
      });
      if (response.status === 401) {
        setLocation('/');
        throw new Error('Not authorized');
      }
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  // Redirect if not authenticated
  if (guildsError) {
    const errorMessage = (guildsError as Error).message || 'Unknown error';
    const needsReauth = errorMessage.includes('Authorization needs update') || errorMessage.includes('re-authorize');
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              {needsReauth ? 'Re-Authorization Required' : 'Error'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {needsReauth 
                ? 'Your authorization needs to be updated to include the guilds permission. Please re-authorize to continue.'
                : errorMessage}
            </p>
            <Button 
              className="w-full"
              onClick={() => setLocation('/')}
              data-testid="button-return-home"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Start transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: { sourceGuildId: string; targetGuildId: string }) => {
      const response = await fetch('/api/transfer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send session cookies
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to start transfer');
      return response.json() as Promise<TransferProgress>;
    },
    onSuccess: (data) => {
      setActiveTransfer(data);
      // Poll for updates
      const pollInterval = setInterval(async () => {
        try {
          const progress = await fetch(`/api/transfer/status/${data.transferId}`).then(r => r.json());
          setActiveTransfer(progress);
          
          if (progress.status === 'completed' || progress.status === 'failed') {
            clearInterval(pollInterval);
            queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
          }
        } catch (err) {
          clearInterval(pollInterval);
        }
      }, 1000);
    },
  });

  const handleStartTransfer = () => {
    if (!sourceGuildId || !targetGuildId) return;
    transferMutation.mutate({ sourceGuildId, targetGuildId });
  };

  const sourceGuild = guilds?.find(g => g.id === sourceGuildId);
  const targetGuild = guilds?.find(g => g.id === targetGuildId);

  // Filter guilds based on search
  const filteredSourceGuilds = guilds?.filter(g => 
    g.name.toLowerCase().includes(sourceSearch.toLowerCase())
  ) || [];
  const filteredTargetGuilds = guilds?.filter(g => 
    g.name.toLowerCase().includes(targetSearch.toLowerCase())
  ) || [];

  const canTransfer = sourceGuildId && targetGuildId && 
                      sourceGuild?.botPresent && targetGuild?.botPresent &&
                      sourceGuildId !== targetGuildId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiDiscord className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold">Sparx Members <span className="text-primary">⚡️</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/bot-servers')}
              data-testid="button-bot-servers"
            >
              Bot Servers
            </Button>
            {user && (
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://cdn.discordapp.com/avatars/${user.avatar}.png`} />
                  <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm" data-testid="text-username">{user.username}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Transfer Members</h1>
          <p className="text-muted-foreground">
            Select source and target servers to begin transferring members
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Server Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Server Selection</CardTitle>
              <CardDescription>
                The bot must be present in both servers to transfer members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Source Server */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Server</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search servers..."
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                    className="pl-10"
                    disabled={guildsLoading}
                    data-testid="input-source-search"
                  />
                </div>
                {sourceGuildId && (
                  <div className="bg-card border rounded-md p-3 flex items-center gap-3">
                    {sourceGuild?.icon ? (
                      <img 
                        src={`https://cdn.discordapp.com/icons/${sourceGuild.id}/${sourceGuild.icon}.png`}
                        className="w-8 h-8 rounded-full"
                        alt=""
                      />
                    ) : (
                      <Server className="w-8 h-8 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sourceGuild?.name}</p>
                      <p className="text-xs text-muted-foreground">{sourceGuild?.memberCount} members</p>
                    </div>
                    {sourceGuild?.botPresent ? (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Bot Present
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Bot Missing
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSourceGuildId("")}
                      data-testid="button-clear-source"
                    >
                      Clear
                    </Button>
                  </div>
                )}
                {!sourceGuildId && sourceSearch && (
                  <ScrollArea className="h-48 border rounded-md p-2">
                    <div className="space-y-1">
                      {filteredSourceGuilds.map((guild) => (
                        <Button
                          key={guild.id}
                          variant="ghost"
                          className="w-full justify-start h-auto py-2 px-2"
                          onClick={() => {
                            setSourceGuildId(guild.id);
                            setSourceSearch("");
                          }}
                          data-testid={`button-source-guild-${guild.id}`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            {guild.icon ? (
                              <img 
                                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                className="w-5 h-5 rounded-full"
                                alt=""
                              />
                            ) : (
                              <Server className="w-5 h-5" />
                            )}
                            <span className="text-sm flex-1 text-left">{guild.name}</span>
                            {!guild.botPresent && (
                              <Badge variant="destructive" className="text-xs">No Bot</Badge>
                            )}
                          </div>
                        </Button>
                      ))}
                      {filteredSourceGuilds.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No servers found</p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Target Server */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Server</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search servers..."
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className="pl-10"
                    disabled={guildsLoading}
                    data-testid="input-target-search"
                  />
                </div>
                {targetGuildId && (
                  <div className="bg-card border rounded-md p-3 flex items-center gap-3">
                    {targetGuild?.icon ? (
                      <img 
                        src={`https://cdn.discordapp.com/icons/${targetGuild.id}/${targetGuild.icon}.png`}
                        className="w-8 h-8 rounded-full"
                        alt=""
                      />
                    ) : (
                      <Server className="w-8 h-8 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{targetGuild?.name}</p>
                      <p className="text-xs text-muted-foreground">{targetGuild?.memberCount} members</p>
                    </div>
                    {targetGuild?.botPresent ? (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Bot Present
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Bot Missing
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setTargetGuildId("")}
                      data-testid="button-clear-target"
                    >
                      Clear
                    </Button>
                  </div>
                )}
                {!targetGuildId && targetSearch && (
                  <ScrollArea className="h-48 border rounded-md p-2">
                    <div className="space-y-1">
                      {filteredTargetGuilds.map((guild) => (
                        <Button
                          key={guild.id}
                          variant="ghost"
                          className="w-full justify-start h-auto py-2 px-2"
                          onClick={() => {
                            setTargetGuildId(guild.id);
                            setTargetSearch("");
                          }}
                          data-testid={`button-target-guild-${guild.id}`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            {guild.icon ? (
                              <img 
                                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                className="w-5 h-5 rounded-full"
                                alt=""
                              />
                            ) : (
                              <Server className="w-5 h-5" />
                            )}
                            <span className="text-sm flex-1 text-left">{guild.name}</span>
                            {!guild.botPresent && (
                              <Badge variant="destructive" className="text-xs">No Bot</Badge>
                            )}
                          </div>
                        </Button>
                      ))}
                      {filteredTargetGuilds.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No servers found</p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <Separator />

              <Button 
                onClick={handleStartTransfer}
                disabled={!canTransfer || transferMutation.isPending || activeTransfer?.status === 'in_progress'}
                className="w-full"
                size="lg"
                data-testid="button-start-transfer"
              >
                {transferMutation.isPending || activeTransfer?.status === 'in_progress' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    Start Transfer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {!canTransfer && sourceGuildId && targetGuildId && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    {sourceGuildId === targetGuildId && <p>Source and target servers must be different</p>}
                    {!sourceGuild?.botPresent && <p>Bot must be added to source server</p>}
                    {!targetGuild?.botPresent && <p>Bot must be added to target server</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Progress</CardTitle>
              <CardDescription>
                {activeTransfer ? 'Real-time transfer status' : 'Progress will appear here when transfer starts'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTransfer ? (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{activeTransfer.current} / {activeTransfer.total}</span>
                    </div>
                    <Progress 
                      value={(activeTransfer.current / activeTransfer.total) * 100}
                      data-testid="progress-transfer"
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-2xl font-semibold text-green-500" data-testid="text-success-count">
                        {activeTransfer.successCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Successful</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-semibold text-yellow-500" data-testid="text-skipped-count">
                        {activeTransfer.skippedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Skipped</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-semibold text-destructive" data-testid="text-failed-count">
                        {activeTransfer.failedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Results Feed */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Transfer Log</h4>
                    <ScrollArea className="h-64 rounded-md border p-4">
                      <div className="space-y-2">
                        {activeTransfer.results.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Waiting for results...
                          </p>
                        ) : (
                          activeTransfer.results.map((result, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm" data-testid={`result-${idx}`}>
                              {result.status === 'success' && (
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              )}
                              {result.status === 'skipped' && (
                                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              )}
                              {result.status === 'failed' && (
                                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {result.username}#{result.discriminator}
                                </div>
                                {result.reason && (
                                  <div className="text-xs text-muted-foreground">{result.reason}</div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-center">
                    {activeTransfer.status === 'completed' && (
                      <Badge variant="outline" className="gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Transfer Completed
                      </Badge>
                    )}
                    {activeTransfer.status === 'in_progress' && (
                      <Badge variant="outline" className="gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transfer In Progress
                      </Badge>
                    )}
                    {activeTransfer.status === 'failed' && (
                      <Badge variant="destructive" className="gap-2">
                        <XCircle className="w-4 h-4" />
                        Transfer Failed
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select servers and start a transfer to see progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
