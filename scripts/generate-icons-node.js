/**
 * Generate PNG icons from SVG using Node.js
 * Requires: sharp (npm install sharp)
 * Alternative to ImageMagick/Inkscape for icon generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconDir = 'media';
const outputDirs = {
    browser: 'src/vs/workbench/browser/media',
    editor: 'src/vs/workbench/browser/parts/editor/media',
    win32: 'resources/win32',
    darwin: 'resources/darwin'
};

const icons = [
    { svg: 'lapa-icon-sm.svg', png: 'lapa-icon-sm.png', size: 16, output: 'browser' },
    { svg: 'lapa-cube-noshadow.svg', png: 'lapa-cube-noshadow.png', size: 256, output: 'editor' },
    { svg: 'lapa-slice.svg', png: 'lapa-slice.png', size: 512, output: null }
];

async function generateIcons() {
    // Try to use sharp if available
    let sharp;
    try {
        const sharpModule = await import('sharp');
        sharp = sharpModule.default;
    } catch (e) {
        console.error('ERROR: sharp package not found.');
        console.error('Install it with: npm install sharp');
        console.error('Or use the PowerShell script with ImageMagick/Inkscape');
        process.exit(1);
    }
    console.log('Generating LAPA icons from SVG sources...\n');

    // Ensure output directories exist
    const rootPath = path.join(__dirname, '..', 'lapa-ide-void');
    Object.values(outputDirs).forEach(dir => {
        const fullPath = path.join(rootPath, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });

    for (const icon of icons) {
        const svgPath = path.join(rootPath, iconDir, icon.svg);
        const pngPath = path.join(rootPath, iconDir, icon.png);

        if (!fs.existsSync(svgPath)) {
            console.error(`  ✗ Source not found: ${icon.svg}`);
            continue;
        }

        try {
            await sharp(svgPath)
                .resize(icon.size, icon.size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(pngPath);

            const stats = fs.statSync(pngPath);
            console.log(`  ✓ Generated ${icon.png} (${Math.round(stats.size / 1024)} KB)`);

            // Copy to output directory if specified
            if (icon.output && outputDirs[icon.output]) {
                const destPath = path.join(rootPath, outputDirs[icon.output], icon.png);
                fs.copyFileSync(pngPath, destPath);
                console.log(`    → Copied to ${outputDirs[icon.output]}/`);
            }
        } catch (error) {
            console.error(`  ✗ Failed to generate ${icon.png}: ${error.message}`);
        }
    }

    console.log('\nIcon generation complete!');
}

generateIcons().catch(console.error);

