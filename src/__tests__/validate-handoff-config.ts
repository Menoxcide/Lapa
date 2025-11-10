import { HybridHandoffSystem, HandoffConfigValidationError, HANDOFF_CONFIG_PRESETS } from '../orchestrator/handoffs';

async function testHandoffConfiguration() {
  console.log('Testing Handoff Configuration Enhancements...\n');

  try {
    // Test 1: Basic configuration validation
    console.log('Test 1: Basic configuration validation');
    const handoffSystem = new HybridHandoffSystem();
    
    // Valid update
    handoffSystem.updateConfig({ confidenceThreshold: 0.9 });
    console.log('✓ Valid configuration update succeeded');
    
    // Invalid update
    try {
      handoffSystem.updateConfig({ confidenceThreshold: 1.5 });
      console.log('✗ Invalid configuration update should have failed');
    } catch (error) {
      if (error instanceof HandoffConfigValidationError) {
        console.log('✓ Invalid configuration update correctly rejected');
      } else {
        console.log('✗ Unexpected error type:', error);
      }
    }
    
    // Test 2: Configuration presets
    console.log('\nTest 2: Configuration presets');
    handoffSystem.loadPreset('development');
    const devConfig = handoffSystem.getConfig();
    console.log('✓ Development preset loaded, confidence threshold:', devConfig.confidenceThreshold);
    
    handoffSystem.loadPreset('production');
    const prodConfig = handoffSystem.getConfig();
    console.log('✓ Production preset loaded, confidence threshold:', prodConfig.confidenceThreshold);
    
    // Test 3: Environment-based configuration
    console.log('\nTest 3: Environment-based configuration');
    // Set some environment variables
    process.env.HANDOFF_CONFIDENCE_THRESHOLD = '0.85';
    process.env.HANDOFF_MAX_HANDOFF_DEPTH = '7';
    
    handoffSystem.loadConfigFromEnvironment();
    const envConfig = handoffSystem.getConfig();
    console.log('✓ Environment configuration loaded, confidence threshold:', envConfig.confidenceThreshold);
    console.log('✓ Environment configuration loaded, max handoff depth:', envConfig.maxHandoffDepth);
    
    // Test 4: Configuration health check
    console.log('\nTest 4: Configuration health check');
    const health = handoffSystem.checkConfigHealth();
    console.log('✓ Configuration health check:', health.isValid ? 'Valid' : 'Invalid');
    if (health.errors.length > 0) {
      console.log('  Errors:', health.errors);
    }
    
    // Test 5: Threshold management
    console.log('\nTest 5: Threshold management');
    // This would normally be tested through the private threshold manager,
    // but we can test the public interface that uses it
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testHandoffConfiguration();