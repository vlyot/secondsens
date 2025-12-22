import type { Product } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Small, Medium } from '@/components/ui/typography';

/**
 * ProductDisambiguation - Modal for selecting from multiple product matches
 *
 * Displays a list of candidate products when search is ambiguous.
 * User selects the intended product or cancels to search again.
 * Modal blocks background interaction until resolved.
 *
 * @param products - List of candidate products to choose from
 * @param onSelect - Callback when user selects a product
 * @param onCancel - Callback when user cancels disambiguation
 * @returns Rendered disambiguation modal component
 */
export function ProductDisambiguation({
  products,
  onSelect,
  onCancel,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Found {products.length} matches</DialogTitle>
          <DialogDescription>Which product did you mean?</DialogDescription>
        </DialogHeader>

        {/* Product list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors border border-border hover:border-primary/50 group"
              aria-label={`Select ${product.canonical_name}`}
            >
              <Medium className="group-hover:text-primary">
                {product.canonical_name}
              </Medium>
              <Small className="text-muted-foreground mt-1">
                {product.category.replace('_', ' ')} • {product.aliases.slice(0, 2).join(', ')}
                {product.aliases.length > 2 && `...`}
              </Small>
            </button>
          ))}
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button
            onClick={onCancel}
            variant="outline"
            aria-label="Cancel and search again"
          >
            Try Different Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDisambiguation;
