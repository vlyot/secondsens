import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { H2, H3, P, Muted, Small } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchHistoryCard } from '@/components/SearchHistoryCard';
import { getHistory, type HistoryItem } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, LogOut, User, Search } from 'lucide-react';

interface ProfilePageProps {
  onRerun: (item: HistoryItem) => void;
  onBack: () => void;
}

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function formatJoinDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function ProfilePage({ onRerun, onBack }: ProfilePageProps) {
  const { user, session, signOut } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    getHistory(session.access_token)
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, [session?.access_token]);

  const email = user?.email ?? '';
  const joinDate = user?.created_at ? formatJoinDate(user.created_at) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <H2 className="mb-0">Profile</H2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">
                {email ? getInitials(email) : <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <P className="font-medium truncate">{email}</P>
              {joinDate && <Muted>Member since {joinDate}</Muted>}
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total searches</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold">{items.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last search</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : items.length > 0 ? (
              <Small className="line-clamp-2 leading-snug">{items[0].product_name}</Small>
            ) : (
              <Muted>—</Muted>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="space-y-3">
        <H3 className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search history
        </H3>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <P className="text-muted-foreground text-center py-6">No searches yet — try a recommendation.</P>
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <SearchHistoryCard key={item.id} item={item} onRerun={onRerun} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
