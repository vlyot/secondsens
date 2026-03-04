import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * SearchBar - Product search input component with micro-interactions
 *
 * Uses shadcn/ui Button and Input components with Framer Motion animations.
 * Manages local query state and validates user input before submitting.
 * Features focus animations and button press feedback.
 *
 * @param onSearch - Callback fired when user submits valid query
 * @param isLoading - Disables input/button when true
 * @param placeholder - Optional custom placeholder text
 * @returns Rendered search form component
 */
export function SearchBar({
  onSearch,
  isLoading,
  placeholder = "Search product (e.g., 'Logitech G Pro X')",
}: {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const prefersReducedMotion = useReducedMotion();

  const validateQuery = (q: string): boolean => {
    const trimmed = q.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateQuery(query)) {
      return;
    }

    onSearch(query.trim());
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          aria-label="Product search"
          className="flex-1 transition-all duration-200 focus-visible:scale-[1.01]"
        />
        <motion.div
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          transition={{ duration: 0.1 }}
        >
          <Button
            type="submit"
            disabled={isLoading || !validateQuery(query)}
            aria-label="Get recommendation"
            className="transition-all duration-200"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </motion.div>
      </div>
    </form>
  );
}

export default SearchBar;
