#!/usr/bin/env node

/**
 * NVIDIA NIM Setup Script
 * 
 * This script sets up NVIDIA NIM locally via Docker.
 * It handles pulling the image and starting the container.
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

async function setupNIM() {
    console.log('Setting up NVIDIA NIM...');
    
    try {
        // Check if Docker is available
        await exec('docker --version');
        console.log('✅ Docker is available');
    } catch (error) {
        console.error('❌ Docker is not available. Please install Docker Desktop.');
        process.exit(1);
    }
    
    try {
        // Pull NIM image
        console.log('Pulling NVIDIA NIM Docker image...');
        await exec('docker pull nvcr.io/nim:latest');
        console.log('✅ NVIDIA NIM image pulled successfully');
    } catch (error) {
        console.error('❌ Failed to pull NVIDIA NIM image:', error.message);
        console.log('Please check NVIDIA NGC registry access');
        process.exit(1);
    }
    
    try {
        // Start NIM container
        console.log('Starting NVIDIA NIM container...');
        await exec('docker run -d --name lapa-nim -p 8000:8000 nvcr.io/nim:latest');
        console.log('✅ NVIDIA NIM container started successfully');
        console.log('NIM is now available at http://localhost:8000');
    } catch (error) {
        console.error('❌ Failed to start NVIDIA NIM container:', error.message);
        process.exit(1);
    }
    
    console.log('\n🎉 NVIDIA NIM setup complete!');
    console.log('Next steps:');
    console.log('1. Verify NIM is running: docker ps');
    console.log('2. Test the API: curl http://localhost:8000/health');
}

// Run setup if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupNIM();
}

export { setupNIM };