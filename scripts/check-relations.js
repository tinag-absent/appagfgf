#!/usr/bin/env node
/**
 * scripts/check-relations.js
 * 海蝕機関 — データ間の参照整合性チェック
 *
 * チェック内容:
 *   1. missions.relatedPersonnel  → personnel.id
 *   2. missions.relatedEntities   → entities.id / entities.code
 *   3. missions.relatedModules    → modules.id / modules.code
 *   4. novels.relatedPersonnel    → personnel.id
 *   5. novels.relatedEntities     → entities.id / entities.code
 *   6. novels.relatedMissions     → missions.id
 *   7. entities.containment (任意フィールド参照)
 *   8. IDフォーマット重複チェック（同一コレクション内）
 */

const fs   = require("fs");
const path = require("path");

function load(filename) {
  const filePath = path.join(__dirname, "../data", filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ File not found, skipping: ${filename}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`  ✗ JSON parse error in ${filename}: ${e.message}`);
    process.exit(1);
  }
}

// ── データ読み込み ─────────────────────────────────────────
const missionData   = load("mission-data.json");
const entityData    = load("entities-data.json");
const personnelData = load("personnel-data.json");
const moduleData    = load("modules-data.json");
const locationData  = load("locations-data.json");
const novelData     = load("novels-data.json");

const missions  = missionData?.missions  || [];
const entities  = entityData?.entities   || [];
const personnel = personnelData?.personnel || [];
const modules   = moduleData?.modules    || [];
const locations = locationData?.locations || [];
const novels    = novelData?.novels      || [];

// ── ID セット構築 ──────────────────────────────────────────
const entityIds    = new Set([...entities.map(e => e.id),  ...entities.map(e => e.code).filter(Boolean)]);
const personnelIds = new Set(personnel.map(p => p.id));
const moduleIds    = new Set([...modules.map(m => m.id),   ...modules.map(m => m.code).filter(Boolean)]);
const locationIds  = new Set(locations.map(l => l.id));
const missionIds   = new Set(missions.map(m => m.id));

let errors   = 0;
let warnings = 0;

function err(msg)  { console.error(`  ✗ ${msg}`); errors++;   }
function warn(msg) { console.warn( `  ⚠ ${msg}`); warnings++; }
function ok(msg)   { console.log(  `  ✓ ${msg}`); }

// ── 1. ミッション → 人員参照 ──────────────────────────────
console.log("\n[1] missions.relatedPersonnel → personnel.id");
let m1ok = true;
missions.forEach(m => {
  (m.relatedPersonnel || []).forEach(ref => {
    if (!personnelIds.has(ref)) {
      err(`Mission ${m.id}: relatedPersonnel "${ref}" not found`);
      m1ok = false;
    }
  });
});
if (m1ok) ok(`All ${missions.length} missions' personnel refs OK`);

// ── 2. ミッション → 実体参照 ──────────────────────────────
console.log("\n[2] missions.relatedEntities → entities.id / code");
let m2ok = true;
missions.forEach(m => {
  (m.relatedEntities || []).forEach(ref => {
    if (!entityIds.has(ref)) {
      err(`Mission ${m.id}: relatedEntities "${ref}" not found`);
      m2ok = false;
    }
  });
});
if (m2ok) ok(`All missions' entity refs OK`);

// ── 3. ミッション → モジュール参照 ─────────────────────────
console.log("\n[3] missions.relatedModules → modules.id / code");
let m3ok = true;
missions.forEach(m => {
  (m.relatedModules || []).forEach(ref => {
    if (!moduleIds.has(ref)) {
      // モジュール参照は任意のため WARNING 扱い
      warn(`Mission ${m.id}: relatedModules "${ref}" not found (optional)`);
      m3ok = false;
    }
  });
});
if (m3ok) ok(`All missions' module refs OK`);

// ── 4. 小説 → 人員参照 ────────────────────────────────────
console.log("\n[4] novels.relatedPersonnel → personnel.id");
let n1ok = true;
novels.forEach(n => {
  (n.relatedPersonnel || []).forEach(ref => {
    if (!personnelIds.has(ref)) {
      err(`Novel ${n.id}: relatedPersonnel "${ref}" not found`);
      n1ok = false;
    }
  });
});
if (n1ok) ok(`All ${novels.length} novels' personnel refs OK`);

// ── 5. 小説 → 実体参照 ────────────────────────────────────
console.log("\n[5] novels.relatedEntities → entities.id / code");
let n2ok = true;
novels.forEach(n => {
  (n.relatedEntities || []).forEach(ref => {
    if (!entityIds.has(ref)) {
      err(`Novel ${n.id}: relatedEntities "${ref}" not found`);
      n2ok = false;
    }
  });
});
if (n2ok) ok(`All novels' entity refs OK`);

// ── 6. 小説 → ミッション参照 ──────────────────────────────
console.log("\n[6] novels.relatedMissions → missions.id");
let n3ok = true;
novels.forEach(n => {
  (n.relatedMissions || []).forEach(ref => {
    if (!missionIds.has(ref)) {
      warn(`Novel ${n.id}: relatedMissions "${ref}" not found (mission may not be in data yet)`);
      n3ok = false;
    }
  });
});
if (n3ok) ok(`All novels' mission refs OK`);

// ── 7. ID重複チェック ──────────────────────────────────────
console.log("\n[7] Duplicate ID check");
function checkDuplicates(items, label, idFn = x => x.id) {
  const seen = new Map();
  let dupFound = false;
  items.forEach((item, idx) => {
    const id = idFn(item);
    if (!id) { warn(`${label}[${idx}]: missing id`); return; }
    if (seen.has(id)) {
      err(`${label}: Duplicate id "${id}" at index ${idx} and ${seen.get(id)}`);
      dupFound = true;
    } else {
      seen.set(id, idx);
    }
  });
  if (!dupFound) ok(`${label}: no duplicate IDs (${items.length} items)`);
}
checkDuplicates(missions,  "missions");
checkDuplicates(entities,  "entities");
checkDuplicates(personnel, "personnel");
checkDuplicates(modules,   "modules");
checkDuplicates(locations, "locations");
checkDuplicates(novels,    "novels");

// ── 8. securityLevel 範囲チェック ─────────────────────────
console.log("\n[8] securityLevel range check (1–3)");
let slOk = true;
[...missions, ...novels].forEach(item => {
  if (item.securityLevel !== undefined) {
    if (![1,2,3].includes(item.securityLevel)) {
      err(`${item.id}: securityLevel=${item.securityLevel} is not in [1,2,3]`);
      slOk = false;
    }
  }
});
if (slOk) ok(`All securityLevel values valid`);

// ── 結果サマリー ───────────────────────────────────────────
console.log(`\n${"─".repeat(56)}`);
console.log(`Errors:   ${errors}`);
console.log(`Warnings: ${warnings}`);
console.log(`${"─".repeat(56)}`);

if (errors > 0) {
  console.error(`\n✗ Relation check FAILED with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log(`\n✓ Relation check passed.${warnings > 0 ? ` (${warnings} warning(s))` : ""}`);
}
