/**
 * Test normalization and tokenization for different languages.
 * Usage: tsx scripts/test-search.ts
 */

import { normalizeText, tokenizeText, tokenMatches } from "../src/lib/search/normalize";

console.log("🧪 Testing search normalization and tokenization...\n");

// Test English
console.log("📝 English:");
const enText = "The beginning God created the heaven and the earth.";
const enNorm = normalizeText(enText, "en");
const enTokens = tokenizeText(enText, "en");
console.log(`  Original: ${enText}`);
console.log(`  Normalized: ${enNorm}`);
console.log(`  Tokens: ${enTokens.join(", ")}`);
console.log(`  Query "beginning" matches "beginning": ${tokenMatches("beginning", "beginning", "exact")}`);
console.log(`  Query "begin" matches "beginning": ${tokenMatches("begin", "beginning", "prefix")}\n`);

// Test Norwegian
console.log("📝 Norwegian:");
const noText = "I begynnelsen skapte Gud himmelen og jorden.";
const noNorm = normalizeText(noText, "no");
const noTokens = tokenizeText(noText, "no");
console.log(`  Original: ${noText}`);
console.log(`  Normalized: ${noNorm}`);
console.log(`  Tokens: ${noTokens.join(", ")}`);
console.log(`  Query "begynnelsen" matches "begynnelsen": ${tokenMatches("begynnelsen", "begynnelsen", "exact")}\n`);

// Test Amharic
console.log("📝 Amharic:");
const amText = "በመጀመሪያ መፍጠር ሕዝቅኤል። በሊላ ሳአ።";
const amNorm = normalizeText(amText, "am");
const amTokens = tokenizeText(amText, "am");
console.log(`  Original: ${amText}`);
console.log(`  Normalized: ${amNorm}`);
console.log(`  Tokens: ${amTokens.join(", ")}\n`);

// Test Tigrinya
console.log("📝 Tigrinya:");
const tiText = "ዘፍጥረት ዘጸአት ዘሌዋውያን ዘህልቍ።";
const tiNorm = normalizeText(tiText, "ti");
const tiTokens = tokenizeText(tiText, "ti");
console.log(`  Original: ${tiText}`);
console.log(`  Normalized: ${tiNorm}`);
console.log(`  Tokens: ${tiTokens.join(", ")}\n`);

console.log("✅ Normalization and tokenization tests completed!");

