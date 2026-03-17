import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { H2, P, Muted } from '@/components/ui/typography';
import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowLeft, Zap } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
}

export default function AuthPage({ onBack }: AuthPageProps) {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <H2 className="mb-0">Sign in</H2>
      </div>

      {sent ? (
        <Alert>
          <Mail className="h-4 w-4" />
          <div className="ml-2">
            <P className="font-medium">Check your email</P>
            <Muted>We sent a magic link to <strong>{email}</strong>. Click it to sign in.</Muted>
          </div>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <P>Enter your email to receive a magic link — no password needed.</P>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
            />
            <div className="rounded-md border bg-muted/40 px-3 py-2.5 flex gap-2.5">
              <Zap className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <Muted className="text-xs leading-relaxed">
                A <strong>magic link</strong> is a one-click sign-in sent to your inbox — no password to remember.
                Click the link in the email and you're instantly signed in. Links expire after 1 hour.
              </Muted>
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <Muted>{error}</Muted>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
            <Mail className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending…' : 'Send magic link'}
          </Button>
        </form>
      )}
    </div>
  );
}
