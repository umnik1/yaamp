// Удаляет результаты прошлых сборок, чтобы в dist и установщик не попадали
// старые бандлы. Использование: node scripts/clean.js dist [artifacts ...]
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const KEEP = new Set(['.gitignore']);

for (const dir of process.argv.slice(2)) {
  const target = path.join(root, dir);
  if (!fs.existsSync(target)) continue;

  for (const name of fs.readdirSync(target)) {
    if (KEEP.has(name)) continue;
    fs.rmSync(path.join(target, name), { recursive: true, force: true });
  }
  console.log(`Cleaned ${dir}`);
}
