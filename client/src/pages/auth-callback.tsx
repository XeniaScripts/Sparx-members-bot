import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      return;
    }

    // Exchange code for tokens
    fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          throw new Error(error || 'Failed to authorize');
        }
        return res.json();
      })
      .then(() => {
        // Session is now managed server-side via secure cookies
        setStatus('success');
        setMessage('Authorization successful! Redirecting to dashboard...');
        setTimeout(() => setLocation('/dashboard'), 2000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md" data-testid="card-auth-status">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-destructive" />}
            {status === 'loading' && 'Authorizing...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authorization Failed'}
          </CardTitle>
          <CardDescription data-testid="text-auth-message">{message}</CardDescription>
        </CardHeader>
        {status === 'error' && (
          <CardContent>
            <Button 
              onClick={() => setLocation('/')} 
              className="w-full"
              data-testid="button-back-home"
            >
              Back to Home
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
