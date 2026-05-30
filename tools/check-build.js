const fs = require('node:fs');
const vm = require('node:vm');

const requiredFiles = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'sw.js',
  'setka-icon.svg',
  'storage/teams.js',
  'storage/events.js',
  'storage/matches.js',
  'stats/calculateTeamStats.js',
  'stats/calculatePlayerStats.js',
  'stats/calculateRoleStats.js',
  'stats/calculateSetStats.js',
  'stats/calculateSeasonStats.js',
  'stats/compareMatches.js',
  'stats/getBestPerformers.js',
  'export/pdf.js'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Не найден файл: ${file}`);
  }
}

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
if (manifest.name !== 'Сетка' || manifest.short_name !== 'Сетка') {
  throw new Error('В manifest.json должно быть название «Сетка»');
}

const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('<title>Сетка</title>')) {
  throw new Error('В index.html должен быть title «Сетка»');
}

[
  'storage/teams.js',
  'storage/events.js',
  'storage/matches.js',
  'stats/calculateTeamStats.js',
  'stats/calculatePlayerStats.js',
  'stats/calculateRoleStats.js',
  'stats/calculateSetStats.js',
  'stats/calculateSeasonStats.js',
  'stats/compareMatches.js',
  'stats/getBestPerformers.js',
  'export/pdf.js',
  'script.js'
].forEach((file) => {
  new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
});
new vm.Script(fs.readFileSync('sw.js', 'utf8'), { filename: 'sw.js' });

console.log('Проверка PWA завершена: файлы на месте, manifest валиден, JavaScript разбирается.');
