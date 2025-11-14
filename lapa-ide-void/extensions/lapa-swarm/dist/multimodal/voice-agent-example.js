"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceAgentExample = voiceAgentExample;
// Voice Agent Example Usage
const advanced_voice_agent_ts_1 = require("./advanced-voice-agent.ts");
/**
 * Example demonstrating how to use the voice agent
 */
async function voiceAgentExample() {
    console.log('Initializing Voice Agent...');
    // Configure the voice agent
    const config = {
        ttsProvider: 'system', // Use system TTS for simplicity
        sttProvider: 'system', // Use system STT for simplicity
        enableRAGIntegration: false, // Disable RAG for this example
        enableEventPublishing: true, // Enable event publishing
        language: 'en'
    };
    // Create the voice agent
    const voiceAgent = new advanced_voice_agent_ts_1.AdvancedVoiceAgent(config);
    console.log('Voice Agent initialized successfully!');
    // Example 1: Text-to-Speech
    console.log('\n--- Text-to-Speech Example ---');
    try {
        const text = "Hello! I am your voice assistant. How can I help you today?";
        console.log(`Generating speech for: "${text}"`);
        const ttsResult = await voiceAgent.generateAudio(text);
        console.log(`Audio generated successfully!`);
        console.log(`- Duration: ${ttsResult.duration?.toFixed(2)} seconds`);
        console.log(`- Audio size: ${ttsResult.audioBuffer.length} bytes`);
        console.log(`- Processing time: ${ttsResult.processingTime} ms`);
    }
    catch (error) {
        console.error('Error in TTS:', error);
    }
    // Example 2: Voice Commands
    console.log('\n--- Voice Command Examples ---');
    const commands = [
        "Hello there!",
        "What time is it?",
        "What's today's date?",
        "Please help me",
        "Start dictation",
        "Stop dictation"
    ];
    for (const commandText of commands) {
        try {
            console.log(`\nExecuting command: "${commandText}"`);
            const command = { command: commandText };
            const result = await voiceAgent.executeVoiceCommand(command);
            console.log(`Response: ${result.response}`);
            console.log(`Action: ${result.action}`);
        }
        catch (error) {
            console.error('Error executing command:', error);
        }
    }
    // Example 3: Question Answering
    console.log('\n--- Question Answering Example ---');
    try {
        const question = {
            question: "What can you do to help me?"
        };
        console.log(`Asking: "${question.question}"`);
        const answer = await voiceAgent.askQuestion(question);
        console.log(`Answer: ${answer.answer}`);
        console.log(`Confidence: ${answer.confidence?.toFixed(2)}`);
        console.log(`Processing time: ${answer.processingTime} ms`);
    }
    catch (error) {
        console.error('Error in Q&A:', error);
    }
    // Example 4: Dictation
    console.log('\n--- Dictation Example ---');
    try {
        console.log('Starting dictation...');
        await voiceAgent.startDictation();
        // Simulate adding audio chunks
        const audioChunks = [
            Buffer.from('First part of dictation'),
            Buffer.from('Second part of dictation'),
            Buffer.from('Final part of dictation')
        ];
        for (const chunk of audioChunks) {
            await voiceAgent.addToDictationBuffer(chunk);
        }
        console.log('Stopping dictation...');
        await voiceAgent.stopDictation();
        console.log('Dictation completed!');
    }
    catch (error) {
        console.error('Error in dictation:', error);
    }
    console.log('\n--- Voice Agent Example Completed ---');
}
// Run the example if this file is executed directly
if (require.main === module) {
    voiceAgentExample().catch(console.error);
}
//# sourceMappingURL=voice-agent-example.js.map