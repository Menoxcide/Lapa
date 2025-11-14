"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceUtils = void 0;
// Voice processing utilities for the multimodal voice agent
const promises_1 = require("fs/promises");
const path_1 = require("path");
const os_1 = require("os");
const util_1 = require("util");
const child_process_1 = require("child_process");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class VoiceUtils {
    /**
     * Converts audio buffer to WAV format if needed
     * @param audioBuffer Audio buffer in any format
     * @param format Input format
     * @returns Audio buffer in WAV format
     */
    static async convertToWav(audioBuffer, format = 'wav') {
        // If already WAV, return as is
        if (format.toLowerCase() === 'wav') {
            return audioBuffer;
        }
        // Create temporary files
        const tempDir = (0, os_1.tmpdir)();
        const inputFile = (0, path_1.join)(tempDir, `audio_input_${Date.now()}.${format}`);
        const outputFile = (0, path_1.join)(tempDir, `audio_output_${Date.now()}.wav`);
        try {
            // Write input file
            await (0, promises_1.writeFile)(inputFile, audioBuffer);
            // Convert using ffmpeg (if available)
            const command = `ffmpeg -i ${inputFile} -acodec pcm_s16le -ar 16000 -ac 1 ${outputFile}`;
            await execAsync(command);
            // Read converted file
            const wavBuffer = await (0, promises_1.readFile)(outputFile);
            return wavBuffer;
        }
        catch (error) {
            console.warn('Audio conversion failed, returning original buffer:', error);
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
     * Normalizes audio buffer volume
     * @param audioBuffer Audio buffer to normalize
     * @returns Normalized audio buffer
     */
    static async normalizeAudio(audioBuffer) {
        // Create temporary files
        const tempDir = (0, os_1.tmpdir)();
        const inputFile = (0, path_1.join)(tempDir, `audio_normalize_input_${Date.now()}.wav`);
        const outputFile = (0, path_1.join)(tempDir, `audio_normalize_output_${Date.now()}.wav`);
        try {
            // Write input file
            await (0, promises_1.writeFile)(inputFile, audioBuffer);
            // Normalize using ffmpeg (if available)
            const command = `ffmpeg -i ${inputFile} -af loudnorm=I=-16:TP=-1.5:LRA=11 ${outputFile}`;
            await execAsync(command);
            // Read normalized file
            const normalizedBuffer = await (0, promises_1.readFile)(outputFile);
            return normalizedBuffer;
        }
        catch (error) {
            console.warn('Audio normalization failed, returning original buffer:', error);
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
     * Removes silence from audio buffer
     * @param audioBuffer Audio buffer to process
     * @returns Audio buffer with silence removed
     */
    static async removeSilence(audioBuffer) {
        // Create temporary files
        const tempDir = (0, os_1.tmpdir)();
        const inputFile = (0, path_1.join)(tempDir, `audio_silence_input_${Date.now()}.wav`);
        const outputFile = (0, path_1.join)(tempDir, `audio_silence_output_${Date.now()}.wav`);
        try {
            // Write input file
            await (0, promises_1.writeFile)(inputFile, audioBuffer);
            // Remove silence using ffmpeg (if available)
            const command = `ffmpeg -i ${inputFile} -af silenceremove=1:0:-50dB:-1:0:-50dB ${outputFile}`;
            await execAsync(command);
            // Read processed file
            const processedBuffer = await (0, promises_1.readFile)(outputFile);
            return processedBuffer;
        }
        catch (error) {
            console.warn('Silence removal failed, returning original buffer:', error);
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
     * Validates audio buffer
     * @param audioBuffer Audio buffer to validate
     * @returns Boolean indicating if audio is valid
     */
    static async validateAudioBuffer(audioBuffer) {
        // Basic validation - check if buffer is not empty
        if (!audioBuffer || audioBuffer.length === 0) {
            return false;
        }
        // Check if buffer has WAV header (simple check)
        if (audioBuffer.length >= 4) {
            const header = audioBuffer.subarray(0, 4).toString('ascii');
            if (header === 'RIFF') {
                return true;
            }
        }
        // For now, we'll assume non-empty buffers are valid
        return true;
    }
    /**
     * Estimates audio duration
     * @param audioBuffer Audio buffer
     * @returns Estimated duration in seconds
     */
    static estimateDuration(audioBuffer) {
        // Simple estimation based on buffer size
        // This is a rough approximation and would need more sophisticated analysis in a real implementation
        const bytesPerSecond = 32000; // Rough estimate for 16kHz 16-bit mono audio
        return audioBuffer.length / bytesPerSecond;
    }
    /**
     * Splits audio buffer into chunks
     * @param audioBuffer Audio buffer to split
     * @param chunkDuration Duration of each chunk in seconds
     * @returns Array of audio buffer chunks
     */
    static splitAudioIntoChunks(audioBuffer, chunkDuration) {
        // Estimate bytes per second
        const bytesPerSecond = 32000; // Rough estimate for 16kHz 16-bit mono audio
        const chunkSize = Math.floor(chunkDuration * bytesPerSecond);
        const chunks = [];
        // Split buffer into chunks
        for (let i = 0; i < audioBuffer.length; i += chunkSize) {
            const end = Math.min(i + chunkSize, audioBuffer.length);
            const chunk = audioBuffer.subarray(i, end);
            chunks.push(chunk);
        }
        return chunks;
    }
}
exports.VoiceUtils = VoiceUtils;
//# sourceMappingURL=voice-utils.js.map