import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Small, Medium } from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * ProductDisambiguation - Animated modal for selecting from multiple product matches
 *
 * Displays a list of candidate products when search is ambiguous.
 * Features staggered entrance animations for product items.
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
  onNoneSelected,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
  onCancel: () => void;
  onNoneSelected: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Found {products.length} matches</DialogTitle>
          <DialogDescription>Which product did you mean?</DialogDescription>
        </DialogHeader>

        {/* Product list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {products.map((product, index) => (
              <motion.button
                key={product.id}
                onClick={() => onSelect(product)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md group"
                aria-label={`Select ${product.canonical_name}`}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              >
                <Medium className="group-hover:text-primary transition-colors">
                  {product.canonical_name}
                </Medium>
                <Small className="text-muted-foreground mt-1">
                  {product.category.replace('_', ' ')} • {product.aliases.slice(0, 2).join(', ')}
                  {product.aliases.length > 2 && `...`}
                </Small>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            onClick={onNoneSelected}
            variant="ghost"
            aria-label="None of these products match my search"
          >
            None of these
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            aria-label="Cancel and search again"
            className="transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Try Different Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDisambiguation;
