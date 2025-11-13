import { mkdirSync, copyFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

// Create dist directory
const distDir = 'extension/dist';
mkdirSync(distDir, { recursive: true });

// Copy necessary files
const filesToCopy = [
  'cursor.json',
  'README.md',
  'LICENSE',
  'AGENT.md',
  'DOCUMENTATION.md',
  'LAPA_Master_Plan.toon',
  'LAPA_v1.2_TOON_SPEC.toon'
];

filesToCopy.forEach(file => {
  if (statSync(file, { throwIfNoEntry: false })) {
    copyFileSync(file, join(distDir, file));
  }
});

// Create a simple index.js file
const indexContent = `
module.exports = {
  activate: function() {
    console.log('LAPA extension activated');
  },
  deactivate: function() {
    console.log('LAPA extension deactivated');
  }
};
`;

writeFileSync(join(distDir, 'index.js'), indexContent);

console.log('Simple build completed');