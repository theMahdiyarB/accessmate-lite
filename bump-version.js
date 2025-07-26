// bump-version.js
// Simple script to increment the patch version in manifest.json

const fs = require('fs');
const path = 'manifest.json'; // Path to manifest file

// Read and parse manifest.json
const json = JSON.parse(fs.readFileSync(path, 'utf-8'));

// Split version string into array of numbers
let versionParts = json.version.split('.').map(Number);

// Ensure version has three parts: [major, minor, patch]
while (versionParts.length < 3) versionParts.push(0);
let [maj, min, patch] = versionParts;

// Increment patch version
patch++;
json.version = `${maj}.${min}.${patch}`;

// Write updated manifest.json back to disk
fs.writeFileSync(path, JSON.stringify(json, null, 2));

// Log the new version
console.log(`Version bumped to ${json.version}`);
