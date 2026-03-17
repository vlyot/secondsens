import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { API_URL } from '@/lib/constants';

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
  const [catalog, setCatalog] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => r.json())
      .then((data: string[]) => setCatalog(data))
      .catch(() => {/* silent fallback to plain text input */});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = query.trim().length >= 2
    ? catalog.filter((name) => name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const validateQuery = (q: string): boolean => {
    const trimmed = q.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
  };

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!validateQuery(trimmed)) return;
    setShowSuggestions(false);
    setQuery('');
    onSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(query);
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={isLoading}
            aria-label="Product search"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            className="flex-1 transition-all duration-200 focus-visible:scale-[1.01]"
            autoComplete="off"
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

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md">
          <Command>
            <CommandList>
              <CommandEmpty>No matches</CommandEmpty>
              <CommandGroup>
                {suggestions.map((name) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={(value) => {
                      setQuery(value);
                      submit(value);
                    }}
                  >
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
