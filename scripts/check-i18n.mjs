// Every literal tr("…") key used in src/ must have an Albanian translation in the catalog.
// Run: npm run check:i18n
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) files.push(p);
  }
};
walk("src");

const catalog = new Set();
for (const f of files.filter((f) => f.includes(join("i18n", "messages", "catalog")))) {
  for (const m of readFileSync(f, "utf8").matchAll(/^\s+(?:"((?:[^"\\]|\\.)*)"|([A-Za-z]\w*)):/gm)) catalog.add(m[1] !== undefined ? JSON.parse(`"${m[1]}"`) : m[2]);
}

const missing = new Map();
for (const f of files) {
  for (const m of readFileSync(f, "utf8").matchAll(/\btr\(\s*"((?:[^"\\]|\\.)*)"/g)) {
    const key = JSON.parse(`"${m[1]}"`);
    if (!catalog.has(key)) missing.set(key, f);
  }
}
for (const [key, f] of missing) console.log(`missing: ${JSON.stringify(key)}  (${f})`);
console.log(`${catalog.size} translations, ${missing.size} missing`);
process.exit(missing.size ? 1 : 0);
