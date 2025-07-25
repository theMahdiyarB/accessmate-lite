const fs = require('fs');
const path = 'manifest.json';

const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
let versionParts = json.version.split('.').map(Number);

// Ensure three numbers: [major, minor, patch]
while (versionParts.length < 3) versionParts.push(0);
let [maj, min, patch] = versionParts;

patch++;
json.version = `${maj}.${min}.${patch}`;
fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log(`Version bumped to ${json.version}`);
