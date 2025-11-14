// Audio processing pipeline for text-to-speech and speech-to-text
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export interface AudioProcessingPipeline {
  textToSpeech(text: string): Promise<Buffer>;
  speechToText(audio: Buffer): Promise<string>;
}

export interface TTSConfig {
  provider: 'piper' | 'speechbrain' | 'system';
  voice?: string;
  modelPath?: string;
}

export interface STTConfig {
  provider: 'whisper' | 'speechbrain' | 'system';
  model?: string;
  language?: string;
}

export class TTSSTTPipeline implements AudioProcessingPipeline {
  private ttsConfig: TTSConfig;
  private sttConfig: STTConfig;
  
  constructor(ttsConfig?: TTSConfig, sttConfig?: STTConfig) {
    this.ttsConfig = ttsConfig || { provider: 'system' };
    this.sttConfig = sttConfig || { provider: 'system' };
  }

  async textToSpeech(text: string): Promise<Buffer> {
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
    } catch (error) {
      console.error('TTS Error:', error);
      // Fallback to system TTS
      return await this.systemTTS(text);
    }
  }

  async speechToText(audio: Buffer): Promise<string> {
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
    } catch (error) {
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
  private async piperTTS(text: string): Promise<Buffer> {
    // Create temporary files
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `tts_input_${Date.now()}.txt`);
    const outputFile = join(tempDir, `tts_output_${Date.now()}.wav`);
    
    try {
      // Write text to input file
      await writeFile(inputFile, text);
      
      // Determine model path
      const modelPath = this.ttsConfig.modelPath || 'en_US-lessac-medium.onnx';
      
      // Execute Piper command
      const command = `echo "${text.replace(/"/g, '\\"')}" | piper --model ${modelPath} --output_file ${outputFile}`;
      await execAsync(command);
      
      // Read the generated audio file
      const audioBuffer = await readFile(outputFile);
      
      return audioBuffer;
    } finally {
      // Clean up temporary files
      try {
        await unlink(inputFile);
        await unlink(outputFile);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Text-to-Speech using SpeechBrain (offline neural TTS)
   * @param text Text to convert to speech
   * @returns Audio buffer containing synthesized speech
   */
  private async speechbrainTTS(text: string): Promise<Buffer> {
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
  private async systemTTS(text: string): Promise<Buffer> {
    const tempDir = tmpdir();
    const outputFile = join(tempDir, `system_tts_${Date.now()}.wav`);
    
    try {
      // Use different commands based on OS
      let command: string;
      if (process.platform === 'win32') {
        // Windows PowerShell command for text-to-speech
        command = `powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.SetOutputToWaveFile('${outputFile}'); $speak.Speak('${text.replace(/'/g, "''")}'); $speak.Dispose()"`;
      } else if (process.platform === 'darwin') {
        // macOS command for text-to-speech
        command = `say -o ${outputFile} "${text.replace(/"/g, '\\"')}"`;
      } else {
        // Linux command for text-to-speech (requires festival)
        command = `echo "${text.replace(/"/g, '\\"')}" | text2wave -o ${outputFile}`;
      }
      
      await execAsync(command);
      const audioBuffer = await readFile(outputFile);
      return audioBuffer;
    } finally {
      // Clean up temporary file
      try {
        await unlink(outputFile);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Speech-to-Text using Whisper (offline neural STT)
   * @param audio Audio buffer containing speech
   * @returns Transcribed text
   */
  private async whisperSTT(audio: Buffer): Promise<string> {
    // Create temporary files
    const tempDir = tmpdir();
    const inputFile = join(tempDir, `stt_input_${Date.now()}.wav`);
    const outputFile = join(tempDir, `stt_output_${Date.now()}.txt`);
    
    try {
      // Write audio to input file
      await writeFile(inputFile, audio);
      
      // Determine model
      const model = this.sttConfig.model || 'base';
      const language = this.sttConfig.language || 'en';
      
      // Execute Whisper command
      const command = `whisper ${inputFile} --model ${model} --language ${language} --output_format txt --output_dir ${tempDir}`;
      await execAsync(command);
      
      // Read the generated text file
      const textBuffer = await readFile(outputFile, 'utf-8');
      return textBuffer.trim();
    } finally {
      // Clean up temporary files
      try {
        await unlink(inputFile);
        await unlink(outputFile);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Speech-to-Text using SpeechBrain (offline neural STT)
   * @param audio Audio buffer containing speech
   * @returns Transcribed text
   */
  private async speechbrainSTT(audio: Buffer): Promise<string> {
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
  private async systemSTT(audio: Buffer): Promise<string> {
    // For system STT, we'll return a placeholder
    // In a real implementation, this would interface with OS speech recognition APIs
    console.log('Using system STT (placeholder)');
    return '[Speech recognition not implemented in this placeholder]';
  }
}