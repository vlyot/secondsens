import { useEffect, useState, useCallback } from 'react';
import { H2, P, Muted } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SearchHistoryCard } from '@/components/SearchHistoryCard';
import { getHistory, type HistoryItem } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { History, ArrowLeft, House } from 'lucide-react';

const PAGE_SIZE = 10;

interface HistoryPageProps {
  onRerun: (item: HistoryItem) => void;
  onBack: () => void;
  onGoToLanding: () => void;
}

export default function HistoryPage({ onRerun, onBack, onGoToLanding }: HistoryPageProps) {
  const { session } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (offset: number) => {
    if (!session?.access_token) return;
    try {
      const page = await getHistory(session.access_token, PAGE_SIZE, offset);
      setItems((prev) => offset === 0 ? page : [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    setIsLoading(true);
    loadPage(0).finally(() => setIsLoading(false));
  }, [session?.access_token, loadPage]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadPage(items.length);
    setIsLoadingMore(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onGoToLanding} aria-label="Go to home">
          <House className="h-4 w-4" />
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <SearchHistoryCard key={item.id} item={item} onRerun={onRerun} />
            ))}
          </div>

          {isLoadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          )}

          {hasMore && !isLoadingMore && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoadMore}
            >
              Load more
            </Button>
          )}
        </>
      )}
    </div>
  );
}
