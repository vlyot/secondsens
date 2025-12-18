import { useState } from 'react';

/**
 * SearchBar - Product search input component
 *
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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Product search"
        />
        <button
          type="submit"
          disabled={isLoading || !validateQuery(query)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          aria-label="Get recommendation"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
