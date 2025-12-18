import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * SearchBar - Product search input component
 *
 * Uses shadcn/ui Button and Input components for consistency.
 * Manages local query state and validates user input before submitting.
 * Disables input when API call is in progress (isLoading).
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
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || !validateQuery(query)}
          aria-label="Get recommendation"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </form>
  );
}

export default SearchBar;
