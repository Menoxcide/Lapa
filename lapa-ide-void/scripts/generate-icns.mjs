/**
 * Generate macOS .icns file from PNG using sharp and iconutil
 * Requires: sharp (npm install sharp) and macOS with iconutil
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateICNS() {
    // Check if running on macOS
    if (process.platform !== 'darwin') {
        console.log('⚠️  ICNS generation is only available on macOS.');
        console.log('This script requires the iconutil command which is macOS-only.');
        return;
    }

    let sharp;
    try {
        const sharpModule = await import('sharp');
        sharp = sharpModule.default;
    } catch (e) {
        console.error('ERROR: sharp package not found.');
        console.error('Install it with: npm install sharp');
        process.exit(1);
    }

    // Check for iconutil
    try {
        execSync('which iconutil', { stdio: 'ignore' });
    } catch (e) {
        console.error('ERROR: iconutil not found. This command is macOS-only.');
        process.exit(1);
    }

    const rootPath = path.join(__dirname, '..');
    const svgPath = path.join(rootPath, 'media', 'lapa-icon.svg');
    const iconsetPath = path.join(rootPath, 'resources', 'darwin', 'lapa-icon.iconset');
    const icnsPath = path.join(rootPath, 'resources', 'darwin', 'code.icns');

    // Ensure output directory exists
    const darwinDir = path.join(rootPath, 'resources', 'darwin');
    if (!fs.existsSync(darwinDir)) {
        fs.mkdirSync(darwinDir, { recursive: true });
    }

    if (!fs.existsSync(svgPath)) {
        console.error(`ERROR: Source not found: ${svgPath}`);
        process.exit(1);
    }

    console.log('Generating macOS .icns file...\n');

    // Create iconset directory
    if (fs.existsSync(iconsetPath)) {
        fs.rmSync(iconsetPath, { recursive: true });
    }
    fs.mkdirSync(iconsetPath, { recursive: true });

    // Required icon sizes for macOS
    const iconSizes = [
        { name: 'icon_16x16.png', size: 16 },
        { name: 'icon_16x16@2x.png', size: 32 },
        { name: 'icon_32x32.png', size: 32 },
        { name: 'icon_32x32@2x.png', size: 64 },
        { name: 'icon_128x128.png', size: 128 },
        { name: 'icon_128x128@2x.png', size: 256 },
        { name: 'icon_256x256.png', size: 256 },
        { name: 'icon_256x256@2x.png', size: 512 },
        { name: 'icon_512x512.png', size: 512 },
        { name: 'icon_512x512@2x.png', size: 1024 }
    ];

    try {
        // Generate all icon sizes
        for (const iconSize of iconSizes) {
            const outputPath = path.join(iconsetPath, iconSize.name);
            await sharp(svgPath)
                .resize(iconSize.size, iconSize.size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(outputPath);
            console.log(`  ✓ Generated ${iconSize.name} (${iconSize.size}x${iconSize.size})`);
        }

        // Convert iconset to ICNS using iconutil
        console.log('\nConverting iconset to ICNS...');
        execSync(`iconutil -c icns "${iconsetPath}" -o "${icnsPath}"`, { stdio: 'inherit' });

        // Cleanup iconset directory
        fs.rmSync(iconsetPath, { recursive: true });

        if (fs.existsSync(icnsPath)) {
            const stats = fs.statSync(icnsPath);
            console.log(`\n✓ Generated ${path.basename(icnsPath)} (${Math.round(stats.size / 1024)} KB)`);
        } else {
            console.error('\n✗ Failed to generate ICNS file');
            process.exit(1);
        }
    } catch (error) {
        console.error(`\n✗ Error: ${error.message}`);
        // Cleanup on error
        if (fs.existsSync(iconsetPath)) {
            fs.rmSync(iconsetPath, { recursive: true });
        }
        process.exit(1);
    }
}

generateICNS().catch(console.error);

