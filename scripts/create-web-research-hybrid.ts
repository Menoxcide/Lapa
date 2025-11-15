/**
 * Create Web Research Hybrid Persona
 * 
 * Creates a hybrid persona that combines RESEARCH_WIZARD, INTEGRATOR, and FEATURE
 * to continuously scour the web for AI-related data and implement findings.
 */

import { personaManager } from '../src/agents/persona.manager.ts';

async function createWebResearchHybrid() {
  console.log('🔬 Creating Web Research Hybrid Persona...\n');

  // Create hybrid persona combining RESEARCH_WIZARD, INTEGRATOR, and FEATURE
  const hybrid = await personaManager.createHybridPersona(
    [
      'research-wizard',  // Research capabilities
      'integrator-agent', // Integration capabilities
      'feature-agent'     // Feature implementation
    ],
    {
      weights: [0.5, 0.3, 0.2], // Research-focused
      targetExpertise: [
        'web scraping',
        'research',
        'data collection',
        'internet research',
        'reddit',
        'arxiv',
        'twitter',
        'x',
        'ai research',
        'agent research',
        'model research',
        'nim',
        'inference',
        'integration',
        'implementation',
        'continuous research',
        'automated research',
        'recursive updates'
      ],
      tokenOptimization: 'maximum' // Maximum token efficiency
    }
  );

  console.log('\n✅ Hybrid Persona Created:');
  console.log(`   Name: ${hybrid.name}`);
  console.log(`   ID: ${hybrid.id}`);
  console.log(`   Expertise Areas: ${hybrid.expertiseAreas.slice(0, 10).join(', ')}...`);
  
  if (hybrid.metadata?._toonTokenReduction) {
    console.log(`   Token Reduction: ${hybrid.metadata._toonTokenReduction.toFixed(1)}%`);
  }

  // Now create the enhanced persona document with web research capabilities
  await createEnhancedWebResearchPersona(hybrid);

  return hybrid;
}

async function createEnhancedWebResearchPersona(baseHybrid: any) {
  // This will be handled by PERSONA_EVOLVER to create the full persona document
  console.log('\n📝 Enhanced persona document will be created by PERSONA_EVOLVER');
  console.log('   Use: /neuraforge PERSONA_EVOLVER to enhance this hybrid persona');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('create-web-research-hybrid')) {
  createWebResearchHybrid().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { createWebResearchHybrid };

