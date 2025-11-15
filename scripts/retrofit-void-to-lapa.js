#!/usr/bin/env node
/**
 * Void → LAPA Retrofit Script
 * 
 * Automates the retrofit of void references to LAPA:
 * 1. Rename directory: void/ → lapa/
 * 2. Rename files containing "void"
 * 3. Replace code references
 * 4. Update imports
 * 5. Validate changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const voidDir = path.join(rootDir, 'lapa-ide-void', 'src', 'vs', 'workbench', 'contrib', 'void');
const lapaDir = path.join(rootDir, 'lapa-ide-void', 'src', 'vs', 'workbench', 'contrib', 'lapa');

// Files to rename (void → lapa)
const filesToRename = [
	'voidSettingsService.ts',
	'voidUpdateActions.ts',
	'voidUpdateMainService.ts',
	'voidSettingsPane.ts',
	'voidCommandBarService.ts',
	'voidOnboardingService.ts',
	'voidSCMService.ts',
	'voidModelService.ts',
	'voidSelectionHelperWidget.ts',
	'void.contribution.ts',
	'voidSCMMainService.ts',
	'voidUpdateService.ts',
	'voidUpdateServiceTypes.ts',
	'voidSCMTypes.ts',
	'voidSettingsTypes.ts',
];

// Patterns to replace in code
const codeReplacements = [
	// Service names
	{ pattern: /VoidSettingsService/g, replacement: 'LAPASettingsService' },
	{ pattern: /IVoidSettingsService/g, replacement: 'ILAPASettingsService' },
	{ pattern: /voidSettingsService/g, replacement: 'lapaSettingsService' },
	{ pattern: /voidSettings/g, replacement: 'lapaSettings' },
	
	// Update service
	{ pattern: /VoidUpdateService/g, replacement: 'LAPAUpdateService' },
	{ pattern: /IVoidUpdateService/g, replacement: 'ILAPAUpdateService' },
	{ pattern: /voidUpdateService/g, replacement: 'lapaUpdateService' },
	
	// SCM service
	{ pattern: /VoidSCMService/g, replacement: 'LAPASCMService' },
	{ pattern: /IVoidSCMService/g, replacement: 'ILAPASCMService' },
	{ pattern: /voidSCMService/g, replacement: 'lapaSCMService' },
	
	// Model service
	{ pattern: /VoidModelService/g, replacement: 'LAPAModelService' },
	{ pattern: /IVoidModelService/g, replacement: 'ILAPAModelService' },
	{ pattern: /voidModelService/g, replacement: 'lapaModelService' },
	
	// Command bar
	{ pattern: /VoidCommandBarService/g, replacement: 'LAPACommandBarService' },
	{ pattern: /IVoidCommandBarService/g, replacement: 'ILAPACommandBarService' },
	{ pattern: /voidCommandBarService/g, replacement: 'lapaCommandBarService' },
	
	// Onboarding
	{ pattern: /VoidOnboardingService/g, replacement: 'LAPAOnboardingService' },
	{ pattern: /IVoidOnboardingService/g, replacement: 'ILAPAOnboardingService' },
	{ pattern: /voidOnboardingService/g, replacement: 'lapaOnboardingService' },
	
	// Selection helper
	{ pattern: /VoidSelectionHelperWidget/g, replacement: 'LAPASelectionHelperWidget' },
	{ pattern: /voidSelectionHelper/g, replacement: 'lapaSelectionHelper' },
	
	// Types
	{ pattern: /VoidSettings/g, replacement: 'LAPASettings' },
	{ pattern: /voidSettingsTypes/g, replacement: 'lapaSettingsTypes' },
	
	// Paths in imports
	{ pattern: /\/void\//g, replacement: '/lapa/' },
	{ pattern: /from ['"].*\/void\//g, replacement: (match) => match.replace('/void/', '/lapa/') },
	
	// Action IDs
	{ pattern: /VOID_/g, replacement: 'LAPA_' },
	{ pattern: /void\./g, replacement: 'lapa.' },
	
	// Comments
	{ pattern: /\/\/ Void/g, replacement: '// LAPA' },
	{ pattern: /\/\* Void/g, replacement: '/* LAPA' },
];

/**
 * Recursively process directory
 */
function processDirectory(dir, baseDir = dir) {
	if (!fs.existsSync(dir)) {
		console.warn(`Directory not found: ${dir}`);
		return;
	}

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relPath = path.relative(baseDir, fullPath);

		// Skip node_modules, dist, etc.
		if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
			continue;
		}

		if (entry.isDirectory()) {
			processDirectory(fullPath, baseDir);
		} else if (entry.isFile()) {
			// Process TypeScript/JavaScript files
			if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) {
				processFile(fullPath);
			}
		}
	}
}

/**
 * Process a single file
 */
function processFile(filePath) {
	let content = fs.readFileSync(filePath, 'utf8');
	let modified = false;

	// Apply code replacements
	for (const { pattern, replacement } of codeReplacements) {
		if (pattern.test(content)) {
			content = content.replace(pattern, replacement);
			modified = true;
		}
	}

	if (modified) {
		fs.writeFileSync(filePath, content, 'utf8');
		console.log(`✅ Updated: ${path.relative(rootDir, filePath)}`);
	}
}

/**
 * Rename files
 */
function renameFiles(dir) {
	for (const oldName of filesToRename) {
		const oldPath = path.join(dir, oldName);
		if (fs.existsSync(oldPath)) {
			const newName = oldName.replace(/void/gi, 'lapa');
			const newPath = path.join(dir, newName);
			fs.renameSync(oldPath, newPath);
			console.log(`✅ Renamed: ${oldName} → ${newName}`);
		}
	}

	// Recursively process subdirectories
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.isDirectory()) {
			renameFiles(path.join(dir, entry.name));
		}
	}
}

/**
 * Main retrofit process
 */
async function main() {
	console.log('🚀 Starting Void → LAPA Retrofit...\n');

	// Step 1: Check directory status
	if (fs.existsSync(voidDir)) {
		console.log('⚠️  Directory still named "void/"');
		console.log('   Please manually rename: void/ → lapa/');
		console.log('   Then run this script again.\n');
		console.log('   Or close all files and run:');
		console.log(`   Rename-Item -Path "${voidDir}" -NewName "lapa"`);
		process.exit(1);
	} else if (fs.existsSync(lapaDir)) {
		console.log('✅ Directory already renamed to lapa/, continuing...\n');
	} else {
		console.error(`❌ Directory not found: ${voidDir} or ${lapaDir}`);
		process.exit(1);
	}

	// Step 2: Rename files
	console.log('📝 Step 2: Renaming files...');
	renameFiles(lapaDir);
	console.log('');

	// Step 3: Replace code references
	console.log('🔍 Step 3: Replacing code references...');
	processDirectory(lapaDir);
	console.log('');

	// Step 4: Update package.json contributions
	console.log('📦 Step 4: Updating package.json...');
	const packageJsonPath = path.join(rootDir, 'lapa-ide-void', 'package.json');
	if (fs.existsSync(packageJsonPath)) {
		let pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
		let modified = false;

		// Update contribution points
		if (pkg.contributes) {
			// Update view containers
			if (pkg.contributes.viewsContainers) {
				for (const container of Object.values(pkg.contributes.viewsContainers)) {
					if (container.id && container.id.includes('void')) {
						container.id = container.id.replace(/void/gi, 'lapa');
						modified = true;
					}
				}
			}

			// Update views
			if (pkg.contributes.views) {
				for (const views of Object.values(pkg.contributes.views)) {
					if (Array.isArray(views)) {
						for (const view of views) {
							if (view.id && view.id.includes('void')) {
								view.id = view.id.replace(/void/gi, 'lapa');
								modified = true;
							}
						}
					}
				}
			}

			// Update commands
			if (pkg.contributes.commands) {
				for (const cmd of pkg.contributes.commands) {
					if (cmd.command && cmd.command.includes('void')) {
						cmd.command = cmd.command.replace(/void/gi, 'lapa');
						modified = true;
					}
				}
			}
		}

		if (modified) {
			fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
			console.log('✅ Updated package.json\n');
		}
	}

	console.log('🎉 Retrofit complete!');
	console.log('\n📋 Next steps:');
	console.log('1. Review changes in lapa-ide-void/src/vs/workbench/contrib/lapa/');
	console.log('2. Update any remaining references manually');
	console.log('3. Test build: cd lapa-ide-void && npm run compile');
	console.log('4. Test runtime functionality');
}

main().catch(error => {
	console.error('❌ Retrofit failed:', error);
	process.exit(1);
});

