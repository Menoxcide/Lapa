/**
 * Generate Windows .ico file from PNG using sharp
 * Requires: sharp (npm install sharp)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateICO() {
    let sharp;
    try {
        const sharpModule = await import('sharp');
        sharp = sharpModule.default;
    } catch (e) {
        console.error('ERROR: sharp package not found.');
        console.error('Install it with: npm install sharp');
        process.exit(1);
    }

    const rootPath = path.join(__dirname, '..');
    const svgPath = path.join(rootPath, 'media', 'lapa-icon.svg');
    const icoPath = path.join(rootPath, 'resources', 'win32', 'code.ico');

    // Ensure output directory exists
    const icoDir = path.dirname(icoPath);
    if (!fs.existsSync(icoDir)) {
        fs.mkdirSync(icoDir, { recursive: true });
    }

    if (!fs.existsSync(svgPath)) {
        console.error(`ERROR: Source not found: ${svgPath}`);
        process.exit(1);
    }

    console.log('Generating Windows .ico file...\n');

    // Generate multiple sizes for ICO
    const sizes = [16, 32, 48, 64, 128, 256];
    const tempPngs = [];

    try {
        for (const size of sizes) {
            const tempPath = path.join(icoDir, `temp_${size}.png`);
            await sharp(svgPath)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(tempPath);
            tempPngs.push(tempPath);
            console.log(`  ✓ Generated ${size}x${size} PNG`);
        }

        // Note: sharp doesn't directly create ICO files
        // We'll create a multi-size PNG that can be converted to ICO
        // For actual ICO, use ImageMagick: magick temp_*.png code.ico
        // Or use an online converter
        
        console.log('\n⚠️  Note: Sharp cannot directly create ICO files.');
        console.log('To create the ICO file, use one of these methods:');
        console.log('\n1. ImageMagick (if installed):');
        console.log(`   magick ${tempPngs.map(p => `"${p}"`).join(' ')} "${icoPath}"`);
        console.log('\n2. Online converter:');
        console.log('   - Upload the 256x256 PNG to https://convertio.co/png-ico/');
        console.log('   - Select sizes: 16, 32, 48, 64, 128, 256');
        console.log(`   - Save as: ${icoPath}`);
        console.log('\n3. Resource Hacker:');
        console.log('   - Download: http://www.angusj.com/resourcehacker/');
        console.log('   - Create new icon project');
        console.log('   - Import all PNG files');
        console.log(`   - Save as: ${icoPath}`);

        // Cleanup temp files
        console.log('\nCleaning up temporary files...');
        tempPngs.forEach(p => {
            if (fs.existsSync(p)) {
                fs.unlinkSync(p);
            }
        });

        console.log('\n✓ PNG files generated. Follow instructions above to create ICO.');
    } catch (error) {
        console.error(`✗ Error: ${error.message}`);
        // Cleanup on error
        tempPngs.forEach(p => {
            if (fs.existsSync(p)) {
                fs.unlinkSync(p);
            }
        });
        process.exit(1);
    }
}

generateICO().catch(console.error);

