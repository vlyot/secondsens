import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Muted, Small } from '@/components/ui/typography';
import { RotateCw } from 'lucide-react';
import type { HistoryItem } from '@/services/api';

function getVerdict(item: HistoryItem): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const top = item.recommendation?.recommendations?.[0];
  if (!top) return { label: 'Unknown', variant: 'secondary' };
  const condition = top.condition ?? '';
  if (condition === 'Brand New') return { label: 'Buy New', variant: 'default' };
  return { label: `Buy ${condition}`, variant: 'secondary' };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

interface SearchHistoryCardProps {
  item: HistoryItem;
  onRerun: (item: HistoryItem) => void;
}

export function SearchHistoryCard({ item, onRerun }: SearchHistoryCardProps) {
  const verdict = getVerdict(item);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onRerun(item)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight line-clamp-2">{item.product_name}</CardTitle>
          <Badge variant={verdict.variant} className="shrink-0 text-xs">{verdict.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Muted className="text-xs">{formatDate(item.created_at)}</Muted>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onRerun(item); }}
            aria-label="Re-run search"
          >
            <RotateCw className="h-3 w-3 mr-1" />
            <Small>Re-run</Small>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
