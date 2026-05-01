# Word Search Feature Documentation

## Overview

The word search feature allows users to search for specific words or phrases across the entire Bible in all four supported languages (English, Norwegian, Amharic, Tigrinya).

## Features

- **Multi-language Support**: Search in English, Norwegian, Amharic, or Tigrinya
- **Language-aware Normalization**: 
  - Latin scripts (English, Norwegian): Case-insensitive, diacritics normalized, punctuation removed
  - Ethiopic scripts (Amharic, Tigrinya): Ethiopic punctuation removed, whitespace normalized
- **Fast Search**: Pre-built inverted indexes for O(1) lookups
- **Exact & Prefix Matching**: Find exact words or words starting with your query
- **Result Ranking**: Results grouped by chapter for easy navigation
- **Full Verse Results**: Entire matching verse text is shown in results
- **Query Highlighting**: Matched terms are highlighted in each result verse

## Architecture

### Build-Time Indexing

The search indexes are built at build time using `scripts/build-search-index.ts`:

1. Reads all Bible data from `public/data/{language}/{bookNumber}/{chapter}.json`
2. Normalizes and tokenizes each verse
3. Builds an inverted index: `token -> [verse references]`
4. Outputs sharded JSON indexes to:
   - `public/search-index/{language}/manifest.json`
   - `public/search-index/{language}/shards/*.json`

**Index Sizes:**
- English: ~25 MB
- Norwegian: ~24 MB  
- Amharic: ~17 MB
- Tigrinya: ~20 MB

### Runtime Search

The search index is lazily loaded when needed:

1. User enters a search query and selects a language
2. `wordSearch()` function normalizes the query and tokenizes it
3. Manifest is fetched from `public/search-index/{language}/manifest.json`
4. Only needed shard(s) are fetched from `public/search-index/{language}/shards/*.json`
5. Loaded shards are cached in memory
6. Legacy fallback is supported for `public/search-index/{language}.json` (if manifest is unavailable)
7. Queries are ANDed together (all tokens must match in a verse)
8. Results are grouped by chapter, full verse text is shown, and matches are highlighted

## Data Structures

### Normalize Module (`src/lib/search/normalize.ts`)

**Functions:**
- `normalizeText(text, language)`: Normalize text for a specific language
- `tokenizeText(text, language)`: Split text into tokens
- `tokenMatches(queryToken, textToken, mode)`: Check if tokens match (exact or prefix)
- `extractSnippet(text, query, contextWords)`: Extract context around a match

### Search Index Module (`src/lib/search/searchIndex.ts`)

**Types:**
- `SearchIndex`: Complete index for a language
- `SearchIndexManifest`: Per-language shard manifest
- `VerseRef`: Reference to a verse (bookNumber, chapter, verse)
- `WordSearchResult`: Result set with hits grouped by chapter
- `SearchResultVerse`: Individual verse result with full verse text

**Functions:**
- `loadSearchIndex(language)`: Fetch and cache the search index
- `loadSearchManifest(language)`: Fetch shard manifest for a language
- `wordSearch(query, language)`: Search for a word in a language
- `multiLanguageWordSearch(query, languages)`: Search across multiple languages

## Usage

### Building Indexes

Automatically runs during the build process:

```bash
npm run build
```

Or rebuild indexes manually:

```bash
npm run build:search-index
```

### Using the UI

1. Open the app
2. Click the **"Search words"** tab in the search box
3. Enter a word or phrase (e.g., "love", "faith", "kingdom")
4. Select a language
5. Click "Search Words"
6. Results appear grouped by chapter
7. Click a result to jump to that verse with full context

### Programmatic Usage

```typescript
import { wordSearch } from "@/lib/search/searchIndex";

// Search for "love" in English
const result = await wordSearch("love", "en");

if (result.totalHits > 0) {
  result.results.forEach(chapter => {
    console.log(`${chapter.bookNumber}:${chapter.chapter}`);
    chapter.verses.forEach(verse => {
      console.log(`  ${verse.verse}: ${verse.text}`);
    });
  });
}
```

## Normalization Rules

### English & Norwegian

- Convert to lowercase
- Remove diacritics (å → a, é → e, etc.)
- Remove punctuation
- Normalize whitespace
- Strip HTML/markup tags
- Filter tokens < 2 characters

### Amharic & Tigrinya

- Remove Ethiopic punctuation (፡, ፣, ።, ፥, ፦)
- Normalize whitespace
- Strip HTML/markup tags
- Filter tokens < 2 characters

## Search Behavior

- **AND Logic**: If searching for multiple words, all must appear in the verse
- **Prefix Matching**: "lo" matches "love", "loves", etc.
- **Case Insensitive**: "Love" finds "love"
- **Punctuation Agnostic**: "don't" finds "dont" or vice versa

## Performance Considerations

### Index Size Budget

Current index output is sharded by language and token prefix.

Approximate language totals (from generated shard sets):
- English: ~25 MB across ~29 shards
- Norwegian: ~24 MB across ~25 shards
- Amharic: ~17 MB across ~210 shards
- Tigrinya: ~19 MB across ~211 shards

**Optimization Opportunities:**
- Compress indexes with gzip (would reduce by ~70%)
- Lazy-load by Testament (OT/NT) instead of full index
- Tokenize less frequently (remove 1-2 char words earlier)

### Query Performance

- Average query time: <50ms (after index loaded)
- Manifest load time: very small (<10KB)
- Shard load time: depends on query and shard size

### Memory Usage

- Cached data: only loaded shards + requested chapter verse text
- In-memory result set: <1 MB (typical)

## Future Enhancements

- [ ] Fuzzy matching for typos
- [ ] Boolean operators (OR, NOT)
- [ ] Phrase search (exact word order)
- [ ] Search history/saved searches
- [ ] Multi-language simultaneous search
- [x] Result highlighting in word-search result verses
- [ ] Index compression (gzip)
- [ ] Search analytics

## Testing

Run normalization tests:

```bash
tsx scripts/test-search.ts
```

## Troubleshooting

**Search returns no results:**
- Try a different spelling
- Remove punctuation from query
- Make sure index is built with `npm run build:search-index`
- Check browser DevTools Network tab to verify index loaded

**Search is slow:**
- First load might be slow if index is large
- Check browser DevTools Performance tab
- Consider gzip compression for production

**Index file not found (404):**
- Verify `public/search-index/{lang}/manifest.json` exists
- Verify `public/search-index/{lang}/shards/*.json` files exist
- Check that build completed successfully
- Check BASE_URL configuration in astro.config.mjs

