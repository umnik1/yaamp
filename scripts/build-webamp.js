// Собирает webamp из исходников (webamp/packages/webamp) и копирует бандл
// в src/webamp, откуда его подключает renderer.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const webampRoot = path.join(root, 'webamp');
const builtBundle = path.join(webampRoot, 'packages/webamp/built/webamp.bundle.js');
const targetBundle = path.join(root, 'src/webamp/webamp.bundle.js');

if (!fs.existsSync(path.join(webampRoot, 'node_modules'))) {
  console.error('Зависимости webamp не установлены: выполните `yarn install` в папке webamp.');
  process.exit(1);
}

const run = (command) => execSync(command, { cwd: webampRoot, stdio: 'inherit' });

if (!fs.existsSync(path.join(webampRoot, 'packages/ani-cursor/dist'))) {
  run('yarn workspace ani-cursor build');
}
run('yarn workspace webamp build-library');

fs.copyFileSync(builtBundle, targetBundle);
console.log('Copied webamp.bundle.js to src/webamp');
