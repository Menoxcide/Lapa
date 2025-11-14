"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTSSTTPipeline = void 0;
// Audio processing pipeline for text-to-speech and speech-to-text
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const os_1 = require("os");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class TTSSTTPipeline {
    ttsConfig;
    sttConfig;
    constructor(ttsConfig, sttConfig) {
        this.ttsConfig = ttsConfig || { provider: 'system' };
        this.sttConfig = sttConfig || { provider: 'system' };
    }
    async textToSpeech(text) {
        try {
            // Try different TTS providers based on configuration
            switch (this.ttsConfig.provider) {
                case 'piper':
                    return await this.piperTTS(text);
                case 'speechbrain':
                    return await this.speechbrainTTS(text);
                case 'system':
                default:
                    return await this.systemTTS(text);
            }
        }
        catch (error) {
            console.error('TTS Error:', error);
            // Fallback to system TTS
            return await this.systemTTS(text);
        }
    }
    async speechToText(audio) {
        try {
            // Try different STT providers based on configuration
            switch (this.sttConfig.provider) {
                case 'whisper':
                    return await this.whisperSTT(audio);
                case 'speechbrain':
                    return await this.speechbrainSTT(audio);
                case 'system':
                default:
                    return await this.systemSTT(audio);
            }
        }
        catch (error) {
            console.error('STT Error:', error);
            // Fallback to system STT
            return await this.systemSTT(audio);
        }
    }
    /**
     * Text-to-Speech using Piper (offline neural TTS)
     * @param text Text to convert to speech
     * @returns Audio buffer containing synthesized speech
     */
    async piperTTS(text) {
        // Create temporary files
        const tempDir = (0, os_1.tmpdir)();
        const inputFile = (0, path_1.join)(tempDir, `tts_input_${Date.now()}.txt`);
        const outputFile = (0, path_1.join)(tempDir, `tts_output_${Date.now()}.wav`);
        try {
            // Write text to input file
            await (0, promises_1.writeFile)(inputFile, text);
            // Determine model path
            const modelPath = this.ttsConfig.modelPath || 'en_US-lessac-medium.onnx';
            // Execute Piper command
            const command = `echo "${text.replace(/"/g, '\\"')}" | piper --model ${modelPath} --output_file ${outputFile}`;
            await execAsync(command);
            // Read the generated audio file
            const audioBuffer = await (0, promises_1.readFile)(outputFile);
            return audioBuffer;
        }
        finally {
            // Clean up temporary files
            try {
                await (0, promises_1.unlink)(inputFile);
                await (0, promises_1.unlink)(outputFile);
            }
            catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
    }
    /**
     * Text-to-Speech using SpeechBrain (offline neural TTS)
     * @param text Text to convert to speech
     * @returns Audio buffer containing synthesized speech
     */
    async speechbrainTTS(text) {
        // For now, we'll use system TTS as a placeholder
        // In a real implementation, this would interface with SpeechBrain's Python API
        console.log('Using SpeechBrain TTS (placeholder)');
        return await this.systemTTS(text);
    }
    /**
     * System Text-to-Speech using native OS capabilities
     * @param text Text to convert to speech
     * @returns Audio buffer containing synthesized speech
     */
    async systemTTS(text) {
        const tempDir = (0, os_1.tmpdir)();
        const outputFile = (0, path_1.join)(tempDir, `system_tts_${Date.now()}.wav`);
        try {
            // Use different commands based on OS
            let command;
            if (process.platform === 'win32') {
                // Windows PowerShell command for text-to-speech
                command = `powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.SetOutputToWaveFile('${outputFile}'); $speak.Speak('${text.replace(/'/g, "''")}'); $speak.Dispose()"`;
            }
            else if (process.platform === 'darwin') {
                // macOS command for text-to-speech
                command = `say -o ${outputFile} "${text.replace(/"/g, '\\"')}"`;
            }
            else {
                // Linux command for text-to-speech (requires festival)
                command = `echo "${text.replace(/"/g, '\\"')}" | text2wave -o ${outputFile}`;
            }
            await execAsync(command);
            const audioBuffer = await (0, promises_1.readFile)(outputFile);
            return audioBuffer;
        }
        finally {
            // Clean up temporary file
            try {
                await (0, promises_1.unlink)(outputFile);
            }
            catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
    }
    /**
     * Speech-to-Text using Whisper (offline neural STT)
     * @param audio Audio buffer containing speech
     * @returns Transcribed text
     */
    async whisperSTT(audio) {
        // Create temporary files
        const tempDir = (0, os_1.tmpdir)();
        const inputFile = (0, path_1.join)(tempDir, `stt_input_${Date.now()}.wav`);
        const outputFile = (0, path_1.join)(tempDir, `stt_output_${Date.now()}.txt`);
        try {
            // Write audio to input file
            await (0, promises_1.writeFile)(inputFile, audio);
            // Determine model
            const model = this.sttConfig.model || 'base';
            const language = this.sttConfig.language || 'en';
            // Execute Whisper command
            const command = `whisper ${inputFile} --model ${model} --language ${language} --output_format txt --output_dir ${tempDir}`;
            await execAsync(command);
            // Read the generated text file
            const textBuffer = await (0, promises_1.readFile)(outputFile, 'utf-8');
            return textBuffer.trim();
        }
        finally {
            // Clean up temporary files
            try {
                await (0, promises_1.unlink)(inputFile);
                await (0, promises_1.unlink)(outputFile);
            }
            catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
    }
    /**
     * Speech-to-Text using SpeechBrain (offline neural STT)
     * @param audio Audio buffer containing speech
     * @returns Transcribed text
     */
    async speechbrainSTT(audio) {
        // For now, we'll use system STT as a placeholder
        // In a real implementation, this would interface with SpeechBrain's Python API
        console.log('Using SpeechBrain STT (placeholder)');
        return await this.systemSTT(audio);
    }
    /**
     * System Speech-to-Text using native OS capabilities
     * @param audio Audio buffer containing speech
     * @returns Transcribed text
     */
    async systemSTT(audio) {
        // For system STT, we'll return a placeholder
        // In a real implementation, this would interface with OS speech recognition APIs
        console.log('Using system STT (placeholder)');
        return '[Speech recognition not implemented in this placeholder]';
    }
}
exports.TTSSTTPipeline = TTSSTTPipeline;
//# sourceMappingURL=tts-stt.js.map