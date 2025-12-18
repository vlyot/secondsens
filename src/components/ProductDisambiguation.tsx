import type { Product } from '@/lib/types';

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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disambiguation-title"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="disambiguation-title" className="text-xl font-bold text-gray-900">
            Found {products.length} matches
          </h2>
          <p className="text-sm text-gray-600 mt-1">Which product did you mean?</p>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200 group"
              aria-label={`Select ${product.canonical_name}`}
            >
              <div className="font-medium text-gray-900 group-hover:text-blue-700">
                {product.canonical_name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {product.category.replace('_', ' ')} • {product.aliases.slice(0, 2).join(', ')}
                {product.aliases.length > 2 && `...`}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            aria-label="Cancel and search again"
          >
            Try Different Search
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDisambiguation;
