package shared

import (
	"sync"
	"time"
)

const (
	ProductValidationTTL = 7 * 24 * time.Hour
	RecommendationTTL    = 24 * time.Hour
)

type cacheEntry struct {
	value     any
	expiresAt time.Time
	insertIdx int
}

// Cache is a thread-safe in-memory TTL cache with LRU eviction.
type Cache struct {
	mu         sync.RWMutex
	entries    map[string]*cacheEntry
	maxEntries int
	ttl        time.Duration
	insertSeq  int
}

// NewCache creates a new Cache with the given capacity and TTL.
func NewCache(maxEntries int, ttl time.Duration) *Cache {
	return &Cache{
		entries:    make(map[string]*cacheEntry, maxEntries),
		maxEntries: maxEntries,
		ttl:        ttl,
	}
}

// Set adds or replaces an entry. Evicts the oldest entry if at capacity.
func (c *Cache) Set(key string, value any) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, exists := c.entries[key]; !exists && len(c.entries) >= c.maxEntries {
		c.evictOldest()
	}

	c.insertSeq++
	c.entries[key] = &cacheEntry{
		value:     value,
		expiresAt: time.Now().Add(c.ttl),
		insertIdx: c.insertSeq,
	}
}

// Get retrieves an entry. Returns (value, true) if found and not expired.
func (c *Cache) Get(key string) (any, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	entry, ok := c.entries[key]
	if !ok {
		return nil, false
	}
	if time.Now().After(entry.expiresAt) {
		delete(c.entries, key)
		return nil, false
	}
	return entry.value, true
}

// Delete removes an entry.
func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.entries, key)
}

// evictOldest removes the entry with the lowest insertIdx. Must be called with write lock held.
func (c *Cache) evictOldest() {
	var oldestKey string
	oldestIdx := int(^uint(0) >> 1) // max int

	for k, e := range c.entries {
		if e.insertIdx < oldestIdx {
			oldestIdx = e.insertIdx
			oldestKey = k
		}
	}
	if oldestKey != "" {
		delete(c.entries, oldestKey)
	}
}
