import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { SiDiscord } from "react-icons/si";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SiDiscord className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold">ServerSync</span>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold mb-3">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                By using ServerSync ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                ServerSync is a Discord bot that facilitates the transfer of Discord server members 
                from one server to another using Discord's OAuth2 API with the guilds.join scope.
              </p>
              <p>
                The Service requires:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>User authorization via Discord OAuth2</li>
                <li>The bot must be present in both source and target servers</li>
                <li>Users must have appropriate permissions in the source server</li>
                <li>Members being transferred must have previously authorized the bot</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. OAuth2 Authorization and Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                When you authorize ServerSync, you grant the following permissions:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>identify</strong> - Access your Discord username and user ID</li>
                <li><strong>guilds.join</strong> - Add you to Discord servers</li>
              </ul>
              <p>
                We store your OAuth access token securely to facilitate member transfers. 
                Your token is encrypted and used solely for the purpose of adding members to servers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the Service in compliance with Discord's Terms of Service</li>
                <li>Not use the Service for spam, harassment, or malicious purposes</li>
                <li>Only transfer members with their prior consent and authorization</li>
                <li>Ensure you have appropriate permissions in the servers you manage</li>
                <li>Not attempt to circumvent rate limits or abuse the Service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Data Collection and Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>We collect and store:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your Discord user ID, username, and avatar</li>
                <li>OAuth access and refresh tokens</li>
                <li>Transfer history including server IDs and transfer results</li>
              </ul>
              <p>
                We do not share your data with third parties. Your data is used exclusively 
                to provide the member transfer service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Service Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The Service is subject to Discord's API rate limits and restrictions. We cannot guarantee:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>100% successful transfer of all members</li>
                <li>Instant transfer completion for large servers</li>
                <li>Availability during Discord API outages</li>
              </ul>
              <p>
                Members can only be transferred if they have previously authorized the bot 
                with the guilds.join scope.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                We reserve the right to terminate or suspend access to the Service for users who:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Violate these Terms of Service</li>
                <li>Abuse the Service or Discord's API</li>
                <li>Engage in malicious or harmful activities</li>
              </ul>
              <p>
                You may revoke the bot's authorization at any time through Discord's 
                "Authorized Apps" settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                The Service is provided "as is" without warranties of any kind, either express or implied. 
                We do not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                ServerSync and its operators shall not be liable for any damages arising from the use 
                or inability to use the Service, including but not limited to failed transfers, 
                data loss, or service interruptions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                We reserve the right to modify these Terms of Service at any time. 
                Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Questions or Concerns?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                If you have any questions about these Terms of Service or the Service itself, 
                please contact us through Discord or revoke your authorization if you no longer 
                wish to use the Service.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
