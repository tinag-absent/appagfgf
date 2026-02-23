#!/usr/bin/env node
/**
 * scripts/validate-json.js
 * 海蝕機関 — AJV v8 を使ってスキーマ検証を実行
 * data/*.json が schema/*.schema.json で定義されたスキーマに適合するか確認します。
 *
 * スキーマファイルの命名規則:
 *   schema/entity.schema.json      → data/entities-data.json
 *   schema/mission.schema.json     → data/mission-data.json
 *   schema/personnel.schema.json   → data/personnel-data.json
 *   schema/module.schema.json      → data/modules-data.json
 *   schema/location.schema.json    → data/locations-data.json
 *   schema/novel.schema.json       → data/novels-data.json
 */

const fs          = require("fs");
const path        = require("path");
const Ajv         = require("ajv");
const addFormats  = require("ajv-formats");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// スキーマ → データファイルのマッピング
// スキーマはルートオブジェクトのラッパーを検証（例: { entities: [...] }）
const SCHEMA_MAP = [
  { schema: "entity.schema.json",    data: "entities-data.json",  arrayKey: "entities"  },
  { schema: "mission.schema.json",   data: "mission-data.json",   arrayKey: "missions"  },
  { schema: "personnel.schema.json", data: "personnel-data.json", arrayKey: "personnel" },
  { schema: "module.schema.json",    data: "modules-data.json",   arrayKey: "modules"   },
  { schema: "location.schema.json",  data: "locations-data.json", arrayKey: "locations" },
  { schema: "novel.schema.json",     data: "novels-data.json",    arrayKey: "novels"    },
];

const schemaDir = path.join(__dirname, "../schema");
const dataDir   = path.join(__dirname, "../data");

let totalErrors = 0;
let tested      = 0;

SCHEMA_MAP.forEach(({ schema: schemaFile, data: dataFile, arrayKey }) => {
  const schemaPath = path.join(schemaDir, schemaFile);
  const dataPath   = path.join(dataDir, dataFile);

  if (!fs.existsSync(schemaPath)) {
    console.warn(`  ⚠ Schema not found, skipping: ${schemaFile}`);
    return;
  }
  if (!fs.existsSync(dataPath)) {
    console.warn(`  ⚠ Data not found, skipping: ${dataFile}`);
    return;
  }

  let schema, data;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    data   = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch (e) {
    console.error(`  ✗ Parse error in ${schemaFile} or ${dataFile}: ${e.message}`);
    totalErrors++;
    return;
  }

  const validate = ajv.compile(schema);
  const items    = data[arrayKey] || [];
  let fileErrors = 0;

  items.forEach((item, idx) => {
    const valid = validate(item);
    if (!valid) {
      validate.errors.forEach(err => {
        console.error(`  ✗ ${dataFile}[${idx}] (${item.id || "?"}): ${err.instancePath} ${err.message}`);
      });
      fileErrors++;
    }
  });

  if (fileErrors === 0) {
    console.log(`  ✓ ${dataFile.padEnd(28)} — ${items.length} items OK`);
  } else {
    console.error(`  ✗ ${dataFile.padEnd(28)} — ${fileErrors}/${items.length} items FAILED`);
    totalErrors += fileErrors;
  }
  tested++;
});

console.log(`\nValidated ${tested} schema/data pairs.`);

if (totalErrors > 0) {
  console.error(`\n✗ ${totalErrors} validation error(s). Fix data before deploying.`);
  process.exit(1);
} else {
  console.log("✓ All validations passed.");
}
