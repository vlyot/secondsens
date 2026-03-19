import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductImage } from '@/services/api';
import { cn } from '@/lib/utils';

const SIZE_CLASSES = {
  sm: 'size-12',
  md: 'size-16',
} as const;

const ICON_CLASSES = {
  sm: 'size-5',
  md: 'size-7',
} as const;

/**
 * ProductThumbnail - Non-blocking product image with skeleton loading and icon fallback.
 *
 * Fetches the image lazily on mount via /api/product-image (2s timeout).
 * Shows a skeleton while loading, then either the image or a Package icon.
 *
 * @param productName - Canonical product name to look up
 * @param size - "sm" (48px) for disambiguation list, "md" (64px) for results header
 */
export function ProductThumbnail({
  productName,
  size = 'sm',
}: {
  productName: string;
  size?: 'sm' | 'md';
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProductImage(productName).then((url) => {
      if (!cancelled) {
        setImageUrl(url);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productName]);

  if (loading) {
    return (
      <Skeleton
        className={cn('shrink-0 rounded-lg', SIZE_CLASSES[size])}
        aria-label="Loading product image"
      />
    );
  }

  return (
    <Avatar className={cn('shrink-0 rounded-lg', SIZE_CLASSES[size])}>
      <AvatarImage
        src={imageUrl ?? ''}
        alt={`${productName} thumbnail`}
        className="object-cover"
      />
      <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
        <Package className={ICON_CLASSES[size]} aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  );
}

export default ProductThumbnail;
