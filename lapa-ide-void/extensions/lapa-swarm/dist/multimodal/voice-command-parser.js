"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceCommandParser = void 0;
class VoiceCommandParser {
    /**
     * Parses a voice command into structured intent and entities
     * @param command Raw voice command text
     * @returns Parsed command with intent and entities
     */
    static parseCommand(command) {
        const lowerCommand = command.toLowerCase().trim();
        // Define command patterns
        const patterns = [
            {
                pattern: /(hello|hi|hey)\b/,
                intent: 'greeting',
                entities: {},
                baseConfidence: 0.9
            },
            {
                pattern: /\b(help|assist|support)\b/,
                intent: 'help',
                entities: {},
                baseConfidence: 0.8
            },
            {
                pattern: /\b(time|clock)\b/,
                intent: 'get_time',
                entities: {},
                baseConfidence: 0.9
            },
            {
                pattern: /\b(date|calendar|day)\b/,
                intent: 'get_date',
                entities: {},
                baseConfidence: 0.9
            },
            {
                pattern: /\b(start|begin)\s+(dictation|recording)\b/,
                intent: 'start_dictation',
                entities: {},
                baseConfidence: 0.95
            },
            {
                pattern: /\b(stop|end)\s+(dictation|recording)\b/,
                intent: 'stop_dictation',
                entities: {},
                baseConfidence: 0.95
            },
            {
                pattern: /\b(create|make|generate)\s+(file|document)\s+(named|called)?\s+(.+?)\b/,
                intent: 'create_file',
                entities: (match) => ({
                    fileName: match[4]?.trim()
                }),
                baseConfidence: 0.85
            },
            {
                pattern: /\b(open|launch)\s+(.+?)\b/,
                intent: 'open_application',
                entities: (match) => ({
                    application: match[2]?.trim()
                }),
                baseConfidence: 0.8
            },
            {
                pattern: /\b(search|find|look for)\s+(.+?)\b/,
                intent: 'search',
                entities: (match) => ({
                    query: match[2]?.trim()
                }),
                baseConfidence: 0.85
            },
            {
                pattern: /\b(send|email|message)\s+(to\s+)?(.+?)\s+(about|regarding|subject)?\s*(.+?)\b$/,
                intent: 'send_message',
                entities: (match) => ({
                    recipient: match[3]?.trim(),
                    subject: match[5]?.trim()
                }),
                baseConfidence: 0.8
            }
        ];
        // Try to match command against patterns
        for (const patternDef of patterns) {
            const match = lowerCommand.match(patternDef.pattern);
            if (match) {
                // Calculate confidence based on match quality
                const matchLength = match[0].length;
                const commandLength = lowerCommand.length;
                const matchRatio = matchLength / commandLength;
                // Adjust confidence based on how much of the command matched
                const confidence = Math.min(patternDef.baseConfidence * (0.5 + 0.5 * matchRatio), 0.95);
                // Extract entities
                let entities = {};
                if (typeof patternDef.entities === 'function') {
                    entities = patternDef.entities(match);
                }
                else {
                    entities = patternDef.entities;
                }
                return {
                    intent: patternDef.intent,
                    entities: entities,
                    confidence: confidence,
                    rawCommand: command
                };
            }
        }
        // Default fallback for unrecognized commands
        return {
            intent: 'unknown',
            entities: {},
            confidence: 0.3,
            rawCommand: command
        };
    }
    /**
     * Extracts entities from a command using keyword matching
     * @param command Command text
     * @returns Extracted entities
     */
    static extractEntities(command) {
        const entities = {};
        const lowerCommand = command.toLowerCase();
        // Extract potential file names (words ending with common extensions)
        const filePattern = /\b(\w+\.(txt|doc|docx|pdf|js|ts|py|java|cpp|html|css|json))\b/g;
        const fileMatches = lowerCommand.match(filePattern);
        if (fileMatches) {
            entities.files = fileMatches;
        }
        // Extract potential applications (common application names)
        const appKeywords = ['notepad', 'calculator', 'browser', 'chrome', 'firefox', 'vscode', 'editor'];
        const appMatches = appKeywords.filter(app => lowerCommand.includes(app));
        if (appMatches.length > 0) {
            entities.applications = appMatches;
        }
        // Extract potential dates (simple pattern matching)
        const datePattern = /\b(today|tomorrow|yesterday|\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|\d{1,2}\/\d{1,2}\/\d{2,4})\b/gi;
        const dateMatches = command.match(datePattern);
        if (dateMatches) {
            entities.dates = dateMatches;
        }
        // Extract potential times (simple pattern matching)
        const timePattern = /\b(\d{1,2}:\d{2}\s*(am|pm)?|\d{1,2}\s*(am|pm))\b/gi;
        const timeMatches = command.match(timePattern);
        if (timeMatches) {
            entities.times = timeMatches;
        }
        return entities;
    }
    /**
     * Normalizes a command by removing filler words and standardizing terms
     * @param command Raw command
     * @returns Normalized command
     */
    static normalizeCommand(command) {
        // Remove common filler words
        const fillerWords = ['please', 'could you', 'would you', 'can you', 'i want', 'i need', 'the'];
        let normalized = command.toLowerCase();
        for (const filler of fillerWords) {
            normalized = normalized.replace(new RegExp(`\\b${filler}\\b`, 'g'), '');
        }
        // Standardize common synonyms
        const synonyms = {
            'create': 'make',
            'launch': 'open',
            'begin': 'start',
            'finish': 'stop',
            'terminate': 'stop',
            'exit': 'stop',
            'quit': 'stop'
        };
        for (const [synonym, standard] of Object.entries(synonyms)) {
            normalized = normalized.replace(new RegExp(`\\b${synonym}\\b`, 'g'), standard);
        }
        // Remove extra whitespace
        normalized = normalized.replace(/\s+/g, ' ').trim();
        return normalized;
    }
}
exports.VoiceCommandParser = VoiceCommandParser;
//# sourceMappingURL=voice-command-parser.js.map