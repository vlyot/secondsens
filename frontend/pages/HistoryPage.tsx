import { useEffect, useState } from 'react';
import { H2, P, Muted } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SearchHistoryCard } from '@/components/SearchHistoryCard';
import { getHistory, type HistoryItem } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { History, ArrowLeft } from 'lucide-react';

interface HistoryPageProps {
  onRerun: (item: HistoryItem) => void;
  onBack: () => void;
}

export default function HistoryPage({ onRerun, onBack }: HistoryPageProps) {
  const { session } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    getHistory(session.access_token)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history'))
      .finally(() => setIsLoading(false));
  }, [session?.access_token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <H2 className="mb-0">Search history</H2>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Muted className="text-destructive">{error}</Muted>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <History className="h-8 w-8 text-muted-foreground mx-auto" />
          <P className="text-muted-foreground">No searches yet — try a recommendation.</P>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <SearchHistoryCard key={item.id} item={item} onRerun={onRerun} />
          ))}
        </div>
      )}
    </div>
  );
}
