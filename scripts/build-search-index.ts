/**
 * Build script to generate search indexes from Bible data.
 * Reads all JSON files from public/data/{lang}/{bookNumber}/{chapter}.json
 * and generates sharded inverted indexes in public/search-index/{lang}/
 *
 * Usage: tsx scripts/build-search-index.ts
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { join, resolve } from "path";

import { tokenizeText } from "../src/lib/search/normalize";
import type { Language } from "../src/lib/bibleData";

interface VerseRef {
  bookNumber: number;
  chapter: number;
  verse: number;
}

interface SearchIndex {
  language: Language;
  entries: Record<string, VerseRef[]>;
  metadata: {
    totalTokens: number;
    totalVerses: number;
    buildTime: string;
  };
}

interface SearchIndexManifest {
  language: Language;
  metadata: {
    totalTokens: number;
    totalVerses: number;
    buildTime: string;
    totalShards: number;
  };
  shardFiles: Record<string, string>;
}

interface SearchIndexShard {
  entries: Record<string, VerseRef[]>;
}

const languages: Language[] = ["en", "no", "am", "ti"];
const dataDir = resolve("./public/data");
const outputDir = resolve("./public/search-index");

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

function getShardKey(token: string): string {
  if (!token) return "_";
  const firstChar = Array.from(token)[0];
  return firstChar || "_";
}

async function buildSearchIndexes() {
  console.log("🔍 Building search indexes...");

  for (const language of languages) {
    console.log(`\nProcessing ${language}...`);
    const languageDir = join(dataDir, language);

    if (!existsSync(languageDir)) {
      console.warn(`⚠️  Language directory not found: ${languageDir}`);
      continue;
    }

    const index: SearchIndex = {
      language,
      entries: {},
      metadata: {
        totalTokens: 0,
        totalVerses: 0,
        buildTime: new Date().toISOString(),
      },
    };

    // Iterate through all book directories
    const bookDirs = readdirSync(languageDir).filter((file: string) => {
      const bookPath = join(languageDir, file);
      const stat = statSync(bookPath);
      return stat.isDirectory();
    });

    let totalVersesProcessed = 0;

    for (const bookDir of bookDirs) {
      const bookNumber = parseInt(bookDir, 10);
      if (isNaN(bookNumber)) continue;

      const bookPath = join(languageDir, bookDir);
      const chapterFiles = readdirSync(bookPath).filter((file: string) =>
        file.endsWith(".json")
      );

      for (const chapterFile of chapterFiles) {
        const chapterPath = join(bookPath, chapterFile);
        try {
          const content = readFileSync(chapterPath, "utf-8");
          const chapterData = JSON.parse(content);

          const chapter = chapterData.chapter || parseInt(chapterFile, 10);

          // Process each verse
          for (const verse of chapterData.verses || []) {
            totalVersesProcessed++;
            const verseText = verse.text || "";
            const verseNumber = verse.verse;

            // Tokenize the verse text
            const tokens = tokenizeText(verseText, language);

            for (const token of tokens) {
              if (!index.entries[token]) {
                index.entries[token] = [];
              }

              // Use Set to avoid duplicates (same verse appearing in same chapter)
              const verseKey = `${bookNumber}:${chapter}:${verseNumber}`;
              const isDuplicate = index.entries[token].some(
                (v) => `${v.bookNumber}:${v.chapter}:${v.verse}` === verseKey
              );

              if (!isDuplicate) {
                index.entries[token].push({
                  bookNumber,
                  chapter,
                  verse: verseNumber,
                });
              }
            }
          }
        } catch (err) {
          console.error(`Error processing ${chapterPath}:`, err);
        }
      }
    }

    index.metadata.totalTokens = Object.keys(index.entries).length;
    index.metadata.totalVerses = totalVersesProcessed;

    const languageOutputDir = join(outputDir, language);
    const shardOutputDir = join(languageOutputDir, "shards");
    mkdirSync(shardOutputDir, { recursive: true });

    const legacyOutputFile = join(outputDir, `${language}.json`);
    if (existsSync(legacyOutputFile)) {
      unlinkSync(legacyOutputFile);
    }

    const shardedEntries: Record<string, Record<string, VerseRef[]>> = {};
    for (const [token, refs] of Object.entries(index.entries)) {
      const shardKey = getShardKey(token);
      if (!shardedEntries[shardKey]) {
        shardedEntries[shardKey] = {};
      }
      shardedEntries[shardKey][token] = refs;
    }

    const manifest: SearchIndexManifest = {
      language,
      metadata: {
        totalTokens: index.metadata.totalTokens,
        totalVerses: index.metadata.totalVerses,
        buildTime: index.metadata.buildTime,
        totalShards: 0,
      },
      shardFiles: {},
    };

    for (const shardKey of Object.keys(shardedEntries).sort()) {
      const shardFileName = `${encodeURIComponent(shardKey)}.json`;
      const shardPath = join(shardOutputDir, shardFileName);
      const shardPayload: SearchIndexShard = {
        entries: shardedEntries[shardKey],
      };

      writeFileSync(shardPath, JSON.stringify(shardPayload));
      manifest.shardFiles[shardKey] = `shards/${shardFileName}`;
    }

    manifest.metadata.totalShards = Object.keys(manifest.shardFiles).length;
    const manifestPath = join(languageOutputDir, "manifest.json");
    writeFileSync(manifestPath, JSON.stringify(manifest));

    const sizeKb = (readFileSync(manifestPath).length / 1024).toFixed(2);
    console.log(
      `✅ ${language}: ${totalVersesProcessed} verses, ${index.metadata.totalTokens} unique tokens, ${manifest.metadata.totalShards} shards (manifest ${sizeKb} KB)`
    );
  }

  console.log("\n✨ Search indexes built successfully!");
}

buildSearchIndexes().catch((err) => {
  console.error("❌ Error building indexes:", err);
  process.exit(1);
});

