#!/usr/bin/env node
/**
 * scripts/minify-json.js
 * 海蝕機関 — data/ 以下の全 JSON を minify（改行・空白削除）
 * GitHub Actions のビルドステップで実行されます。
 */

const fs   = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
const files   = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));

let totalSavedBytes = 0;
let errorCount      = 0;

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  try {
    const raw     = fs.readFileSync(filePath, "utf-8");
    const before  = raw.length;
    const content = JSON.parse(raw);                     // parse → 構文チェック兼ねる
    const minified = JSON.stringify(content);            // re-stringify → minify
    const after   = minified.length;
    const saved   = before - after;

    fs.writeFileSync(filePath, minified, "utf-8");

    const pct = before > 0 ? ((saved / before) * 100).toFixed(1) : "0.0";
    console.log(`  ✓ ${file.padEnd(32)} ${before.toString().padStart(7)}B → ${after.toString().padStart(7)}B  (−${pct}%)`);
    totalSavedBytes += saved;
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
    errorCount++;
  }
});

console.log(`\nMinified ${files.length - errorCount}/${files.length} files.`);
console.log(`Total saved: ${(totalSavedBytes / 1024).toFixed(1)} KB`);

if (errorCount > 0) {
  console.error(`\n${errorCount} error(s) encountered.`);
  process.exit(1);
}
