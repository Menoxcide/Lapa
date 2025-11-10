// Simple Node.js script to test local handoff functionality

// Simple Node.js script to test local handoff functionality

// Use CommonJS require for the compiled module
const { LocalHandoffSystem } = require('../../../dist-local/orchestrator/handoffs.local.js');

console.log('Testing LocalHandoffSystem...');

try {
  // Create an instance of LocalHandoffSystem
  const handoffSystem = new LocalHandoffSystem();
  console.log('✓ LocalHandoffSystem created successfully');
  
  // Register a mock agent
  const mockAgent = {
    id: 'test-agent-1',
    name: 'Test Agent',
    model: 'llama3.1',
    type: 'ollama'
  };
  
  handoffSystem.registerLocalAgent(mockAgent);
  console.log('✓ Local agent registered successfully');
  
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error);
  process.exit(1);
}

console.log('Testing LocalHandoffSystem...');

try {
  // Create an instance of LocalHandoffSystem
  const handoffSystem = new LocalHandoffSystem();
  console.log('✓ LocalHandoffSystem created successfully');
  
  // Register a mock agent
  const mockAgent = {
    id: 'test-agent-1',
    name: 'Test Agent',
    model: 'llama3.1',
    type: 'ollama'
  };
  
  handoffSystem.registerLocalAgent(mockAgent);
  console.log('✓ Local agent registered successfully');
  
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error);
  process.exit(1);
}