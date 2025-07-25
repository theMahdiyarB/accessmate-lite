const fs = require('fs');
const path = 'manifest.json';

const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
let [maj, min, patch] = json.version.split('.').map(Number);
patch++;
json.version = `${maj}.${min}.${patch}`;
fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log(`Version bumped to ${json.version}`);