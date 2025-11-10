async function debugModule() {
  try {
    // Dynamically import the compiled module
    const handoffsLocal = await import('../../../dist-local/orchestrator/handoffs.local.js');
    
    console.log('Module keys:', Object.keys(handoffsLocal));
    console.log('LocalHandoffSystem:', handoffsLocal.LocalHandoffSystem);
    console.log('localHandoffSystem:', handoffsLocal.localHandoffSystem);
    
    // Try to access the class
    if (handoffsLocal.LocalHandoffSystem) {
      const handoffSystem = new handoffsLocal.LocalHandoffSystem();
      console.log('✓ LocalHandoffSystem created successfully');
    } else {
      console.log('LocalHandoffSystem not found in exports');
    }
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugModule();