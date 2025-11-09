#!/usr/bin/env node

/**
 * LAPA Phase Generator
 * 
 * This script generates the foundation files for each phase of LAPA development.
 * Usage: node generate-phase.js <phase-number>
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const phases = {
    0: {
        name: "Foundation",
        files: [
            {
                path: "src/mcp/ctx-zip.integration.ts",
                description: "ctx-zip integration for context compression"
            },
            {
                path: "src/inference/nim.local.ts",
                description: "NVIDIA NIM local inference integration"
            },
            {
                path: "src/sandbox/local.provider.ts",
                description: "Local sandbox provider for MCP"
            },
            {
                path: "cursor.json",
                description: "Extension manifest"
            }
        ]
    },
    1: {
        name: "Core Agent",
        files: [
            {
                path: "src/agents/moe-router.ts",
                description: "MoE routing logic"
            },
            {
                path: "src/agents/ray-parallel.ts",
                description: "Ray parallel execution"
            },
            {
                path: "src/agents/agent.md.generator.ts",
                description: "AGENT.md auto-generation"
            }
        ]
    }
};

async function generatePhase(phaseNumber) {
    const phase = phases[phaseNumber];
    
    if (!phase) {
        console.error(`Phase ${phaseNumber} not found`);
        process.exit(1);
    }
    
    console.log(`Generating Phase ${phaseNumber}: ${phase.name}`);
    
    for (const file of phase.files) {
        const filePath = join(__dirname, '..', file.path);
        const dirPath = dirname(filePath);
        
        // Create directory if it doesn't exist
        try {
            await mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error(`Failed to create directory ${dirPath}:`, error);
        }
        
        console.log(`  → Creating ${file.path}`);
        
        // Skip files that already exist
        try {
            await writeFile(filePath, `// ${file.description}\n// Generated for LAPA Phase ${phaseNumber}: ${phase.name}\n`, { flag: 'wx' });
        } catch (error) {
            if (error.code === 'EEXIST') {
                console.log(`    File already exists, skipping...`);
            } else {
                console.error(`    Failed to create file:`, error);
            }
        }
    }
    
    console.log(`Phase ${phaseNumber} generation complete!`);
}

// Main execution
if (process.argv.length < 3) {
    console.log("Usage: node generate-phase.js <phase-number>");
    console.log("Available phases:");
    Object.entries(phases).forEach(([num, phase]) => {
        console.log(`  ${num}: ${phase.name}`);
    });
    process.exit(1);
}

const phaseNumber = parseInt(process.argv[2]);
generatePhase(phaseNumber);