import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Users, CheckCircle2 } from "lucide-react";
import { SiDiscord } from "react-icons/si";

export default function Home() {
  const handleAuthorize = async () => {
    try {
      const response = await fetch('/api/oauth/config');
      const config = await response.json();
      
      const redirectUri = `${window.location.origin}/auth/callback`;
      const scopes = 'identify guilds guilds.join';
      const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to get OAuth config:', error);
      alert('Failed to initialize authorization. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Discord-themed gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            {/* Logo/Brand */}
            <div className="inline-flex items-center gap-2">
              <SiDiscord className="w-12 h-12 text-primary" />
              <span className="text-4xl font-bold">Sparx Members <span className="text-primary">⚡️</span></span>
            </div>

            {/* Hero Title */}
            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-5xl font-semibold tracking-tight">
                Transfer Discord Members
                <br />
                <span className="text-primary">Instantly & Securely</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Seamlessly move your community members between Discord servers with OAuth2 authorization. 
                No invite links needed.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                onClick={handleAuthorize}
                data-testid="button-authorize"
                className="gap-2"
              >
                <SiDiscord className="w-5 h-5" />
                Authorize with Discord
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = '/terms'}
                data-testid="button-terms"
              >
                View Terms
              </Button>
            </div>

            {/* Free Members Bot CTA */}
            <div className="space-y-2">
              <p className="text-lg font-semibold text-primary">Free Members Bot</p>
              <p className="text-sm text-muted-foreground">
                Authorize to get started instantly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-3">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to transfer your community</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card data-testid="card-step-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-semibold text-primary">1</span>
              </div>
              <CardTitle>Authorize</CardTitle>
              <CardDescription>
                Connect your Discord account and grant the bot permission to add members to servers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Secure OAuth2 authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>One-time authorization</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="card-step-2">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-semibold text-primary">2</span>
              </div>
              <CardTitle>Select Servers</CardTitle>
              <CardDescription>
                Choose your source server and target destination where members will be transferred
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Bot must be in both servers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Real-time server verification</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="card-step-3">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-semibold text-primary">3</span>
              </div>
              <CardTitle>Transfer Members</CardTitle>
              <CardDescription>
                Watch real-time progress as members are automatically added to your target server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Live progress tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Detailed success/failure reports</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <Card className="bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">For You:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Authorize the bot with your Discord account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Have permission to manage members in source server</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">For the Bot:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Must be added to both source and target servers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Needs "Create Invite" and "Manage Members" permissions</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Badge variant="outline" className="text-xs">
                  Note: Members must have previously authorized the bot to be transferred
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>
            By using Sparx Members, you agree to our{' '}
            <a href="/terms" className="text-primary hover-elevate">Terms of Service</a>
          </p>
          <p className="mt-3 text-xs">
            If you deauthorize, you will not be able to use the bot and will have to reauthorize
          </p>
          <p className="mt-2">Powered by Discord OAuth2 API</p>
        </div>
      </footer>
    </div>
  );
}
