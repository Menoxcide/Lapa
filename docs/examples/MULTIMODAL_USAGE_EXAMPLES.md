# Multimodal Usage Examples - Phase 20 Implementation

## Overview
This document provides comprehensive usage examples for the multimodal capabilities implemented in Phase 20 of LAPA v1.3.0-preview SwarmOS Edition. These examples demonstrate how to leverage vision and voice agents for various tasks.

## Vision Agent Examples

### Basic Image Processing
```typescript
import { VisionAgentTool } from '../src/multimodal/vision-agent-tool';

// Create a vision agent tool instance
const visionTool = new VisionAgentTool();

// Process an image and get description
const imageBuffer = Buffer.from('base64-encoded-image-data', 'base64');
const result = await visionTool.execute({
  toolName: 'vision-agent',
  parameters: {
    action: 'processImage',
    imageData: imageBuffer
  },
  context: {}
});

console.log('Image description:', result.output);
```

### UI Screenshot Analysis
```typescript
// Analyze a UI screenshot and extract components
const screenshotBuffer = Buffer.from('base64-screenshot-data', 'base64');
const analysisResult = await visionTool.execute({
  toolName: 'vision-agent',
  parameters: {
    action: 'analyzeScreenshot',
    imageData: screenshotBuffer
  },
  context: {}
});

console.log('UI Analysis:', analysisResult.output);
// Output includes: description, layout info, color palette, text content
```

### Code Generation from Design
```typescript
// Generate React code from a UI design image
const designBuffer = Buffer.from('base64-design-data', 'base64');
const codeResult = await visionTool.execute({
  toolName: 'vision-agent',
  parameters: {
    action: 'generateCodeFromDesign',
    imageData: designBuffer,
    framework: 'react' // Options: 'react', 'vue', 'angular'
  },
  context: {}
});

console.log('Generated React code:', codeResult.output);
```

### UI Element Recognition
```typescript
// Recognize UI elements in an image
const uiElements = await visionTool.execute({
  toolName: 'vision-agent',
  parameters: {
    action: 'recognizeUIElements',
    imageData: imageBuffer
  },
  context: {}
});

console.log('Detected UI elements:', uiElements.output);
// Output: Array of UI elements with type, position, size, and properties
```

## Voice Agent Examples

### Basic Speech-to-Text
```typescript
import { VoiceAgentTool } from '../src/multimodal/voice-agent-tool';

// Create a voice agent tool instance
const voiceTool = new VoiceAgentTool();

// Transcribe audio to text
const audioBuffer = Buffer.from('base64-audio-data', 'base64');
const transcription = await voiceTool.execute({
  toolName: 'voice-agent',
  parameters: {
    action: 'transcribe',
    audioData: audioBuffer,
    format: 'wav' // Supported formats: wav, mp3, etc.
  },
  context: {}
});

console.log('Transcribed text:', transcription.output.text);
```

### Text-to-Speech Synthesis
```typescript
// Convert text to speech
const synthesisResult = await voiceTool.execute({
  toolName: 'voice-agent',
  parameters: {
    action: 'synthesize',
    text: 'Hello, this is LAPA speaking.'
  },
  context: {}
});

console.log('Generated audio buffer length:', synthesisResult.output.audioBuffer.length);
// Use the audioBuffer for playback or storage
```

### Voice Command Execution
```typescript
// Execute a voice command
const commandResult = await voiceTool.execute({
  toolName: 'voice-agent',
  parameters: {
    action: 'executeCommand',
    command: 'What time is it?'
  },
  context: {}
});

console.log('Command response:', commandResult.output.response);
```

### Voice Q&A with RAG Integration
```typescript
// Ask a question with RAG-powered answers
const questionResult = await voiceTool.execute({
  toolName: 'voice-agent',
  parameters: {
    action: 'ask',
    question: 'How do I configure event bus settings?',
    context: 'LAPA configuration documentation',
    sessionId: 'user-session-123'
  },
  context: {}
});

console.log('Answer:', questionResult.output.answer);
console.log('Sources:', questionResult.output.sources);
```

### Dictation Support
```typescript
// Start dictation mode
await voiceTool.execute({
  toolName: 'voice-agent',
  parameters: {
    action: 'startDictation'
  },
  context: {}
});

// ... process audio chunks during dictation ...

// Stop dictation and get results
const dictationResult = await voiceTool.execute({
  toolName: 'voice-agent',
  parameters: {
    action: 'stopDictation'
  },
  context: {}
});

console.log('Dictation result:', dictationResult.output);
```

## Multimodal Coordination Examples

### Unified Vision-Voice Interface
```typescript
import { VisionVoiceController } from '../src/multimodal/vision-voice';

// Create multimodal controller
const multimodalController = new VisionVoiceController({
  visionModel: 'nemotron-vision',
  voiceModel: 'whisper',
  enableAudioProcessing: true,
  enableImageProcessing: true
});

// Process multimodal input (image + audio)
const multimodalInput = {
  image: imageBuffer,
  audio: audioBuffer,
  modality: 'auto' // Auto-detect best modality
};

const multimodalResult = await multimodalController.processMultimodalInput(multimodalInput);
console.log('Multimodal result:', multimodalResult);
```

### Modality Switching
```typescript
// Set preferred modality
multimodalController.setCurrentModality('vision'); // Force vision processing
// or
multimodalController.setCurrentModality('voice'); // Force voice processing
// or  
multimodalController.setCurrentModality('auto'); // Auto-detect based on input

const currentModality = multimodalController.getCurrentModality();
console.log('Current modality:', currentModality);
```

## Integration with Agent Framework

### Using Vision Agent in YAML Configuration
```yaml
version: "1.0"

agents:
  ui-designer:
    role: "UI Design Analyzer"
    goal: "Analyze UI designs and generate code"
    backstory: "Expert in UI/UX design and frontend development"
    model: "DeepSeek-R1-671B"
    capabilities: ["vision-processing", "code-generation"]
    tools: ["vision-agent"]
    
  voice-assistant:
    role: "Voice Assistant"
    goal: "Process voice commands and provide audio responses"
    backstory: "Specialized in speech recognition and synthesis"
    model: "Qwen3-Coder-480B-A35B-Instruct"
    capabilities: ["voice-processing", "command-execution"]
    tools: ["voice-agent"]

globalSettings:
  enableAutoRefine: true
  defaultModel: "ollama"
  vetoThreshold: 0.833
```

### Event Integration Example
```typescript
import { eventBus } from '../src/core/event-bus';

// Subscribe to multimodal events
eventBus.subscribe('vision.image.processed', (event) => {
  console.log('Image processed:', event.payload);
});

eventBus.subscribe('voice.audio.processed', (event) => {
  console.log('Audio processed:', event.payload);
});

eventBus.subscribe('multimodal.coordination', (event) => {
  console.log('Multimodal coordination event:', event.payload);
});
```

## Advanced Usage Patterns

### Vision-Voice Sequential Processing
```typescript
// Process image first, then use voice for description
const imageAnalysis = await visionTool.execute({
  toolName: 'vision-agent',
  parameters: {
    action: 'processImage',
    imageData: imageBuffer
  },
  context: {}
});

const voiceDescription = await voiceTool.execute({
  toolName: 'voice-agent',
  parameters: {
    action: 'synthesize',
    text: `This image shows: ${imageAnalysis.output}`
  },
  context: {}
});
```

### Error Handling and Fallbacks
```typescript
try {
  const result = await visionTool.execute({
    toolName: 'vision-agent',
    parameters: {
      action: 'processImage',
      imageData: invalidImageBuffer
    },
    context: {}
  });
  
  if (!result.success) {
    // Fallback to voice description request
    const fallbackResult = await voiceTool.execute({
      toolName: 'voice-agent',
      parameters: {
        action: 'ask',
        question: 'Can you describe this image?'
      },
      context: {}
    });
    
    console.log('Fallback description:', fallbackResult.output.answer);
  }
} catch (error) {
  console.error('Multimodal processing failed:', error);
}
```

## Performance Optimization

### Batch Processing
```typescript
// Process multiple images efficiently
const imageBuffers = [buffer1, buffer2, buffer3];
const batchResults = await Promise.all(
  imageBuffers.map(buffer => 
    visionTool.execute({
      toolName: 'vision-agent',
      parameters: {
        action: 'processImage',
        imageData: buffer
      },
      context: {}
    })
  )
);

console.log('Batch processing complete:', batchResults.length, 'images processed');
```

### Caching Strategies
```typescript
// Implement caching for repeated operations
const visionCache = new Map();

async function processImageWithCache(imageBuffer: Buffer) {
  const cacheKey = imageBuffer.toString('base64').substring(0, 100);
  
  if (visionCache.has(cacheKey)) {
    return visionCache.get(cacheKey);
  }
  
  const result = await visionTool.execute({
    toolName: 'vision-agent',
    parameters: {
      action: 'processImage',
      imageData: imageBuffer
    },
    context: {}
  });
  
  visionCache.set(cacheKey, result);
  return result;
}
```

## Testing Examples

### Unit Test for Vision Agent
```typescript
import { VisionAgentTool } from '../src/multimodal/vision-agent-tool';

describe('Vision Agent Tool', () => {
  let visionTool: VisionAgentTool;
  
  beforeEach(() => {
    visionTool = new VisionAgentTool();
  });
  
  it('should process images correctly', async () => {
    const mockImageBuffer = Buffer.from('test-image-data');
    
    const result = await visionTool.execute({
      toolName: 'vision-agent',
      parameters: {
        action: 'processImage',
        imageData: mockImageBuffer
      },
      context: {}
    });
    
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });
});
```

### Integration Test for Multimodal Flow
```typescript
import { VisionVoiceController } from '../src/multimodal/vision-voice';

describe('Multimodal Integration', () => {
  let controller: VisionVoiceController;
  
  beforeEach(() => {
    controller = new VisionVoiceController({
      visionModel: 'nemotron-vision',
      voiceModel: 'whisper',
      enableAudioProcessing: true,
      enableImageProcessing: true
    });
  });
  
  it('should handle multimodal input', async () => {
    const imageBuffer = Buffer.from('test-image');
    const audioBuffer = Buffer.from('test-audio');
    
    const result = await controller.processMultimodalInput({
      image: imageBuffer,
      audio: audioBuffer,
      modality: 'auto'
    });
    
    expect(result).toBeDefined();
    expect(result.text).toBeDefined();
  });
});
```

## Conclusion

These examples demonstrate the comprehensive multimodal capabilities available in LAPA Phase 20. The vision and voice agents provide powerful tools for UI analysis, code generation, speech processing, and natural language interaction. The multimodal coordination system enables seamless integration between different modalities for enhanced user experiences.

For more detailed API documentation, refer to the source code in [`src/multimodal/`](../src/multimodal/) and the comprehensive test suites in [`src/__tests__/multimodal/`](../src/__tests__/multimodal/).