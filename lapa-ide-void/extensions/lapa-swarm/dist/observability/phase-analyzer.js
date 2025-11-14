"use strict";
/**
 * Phase Analyzer for LAPA v1.2.2 — Phase 16
 *
 * This module analyzes git history and event logs to generate phase summaries.
 * It extracts file changes, commits, dependencies, and metrics for LPSP.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhaseAnalyzer = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const event_bus_ts_1 = require("../core/event-bus.ts");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Phase Analyzer class
 */
class PhaseAnalyzer {
    config;
    events = [];
    constructor(config = {}) {
        this.config = {
            gitRepoPath: config.gitRepoPath || process.cwd(),
            includeEventLogs: config.includeEventLogs ?? true,
            ...config
        };
    }
    /**
     * Analyzes git history for a phase
     */
    async analyzeGitHistory(phaseNumber) {
        try {
            // Get commits for the phase
            const commits = await this.getCommits(phaseNumber);
            // Get file changes
            const files = await this.getFileChanges(phaseNumber);
            return { files, commits };
        }
        catch (error) {
            console.error('Failed to analyze git history:', error);
            return { files: [], commits: [] };
        }
    }
    /**
     * Gets commits related to a phase
     */
    async getCommits(phaseNumber) {
        try {
            const since = this.config.phaseStartDate
                ? `--since="${this.config.phaseStartDate.toISOString()}"`
                : '';
            const until = this.config.phaseEndDate
                ? `--until="${this.config.phaseEndDate.toISOString()}"`
                : '';
            const command = `git log --pretty=format:"%H|%s|%an|%at" ${since} ${until}`;
            const { stdout } = await execAsync(command, {
                cwd: this.config.gitRepoPath
            });
            const commits = [];
            for (const line of stdout.split('\n').filter(Boolean)) {
                const [hash, message, author, timestamp] = line.split('|');
                if (hash && message && author && timestamp) {
                    // Check if commit message mentions the phase
                    if (message.toLowerCase().includes(`phase ${phaseNumber}`) ||
                        message.toLowerCase().includes(`phase-${phaseNumber}`)) {
                        commits.push({
                            hash,
                            message,
                            author,
                            timestamp: parseInt(timestamp, 10) * 1000 // Convert to milliseconds
                        });
                    }
                }
            }
            return commits;
        }
        catch (error) {
            console.error('Failed to get commits:', error);
            return [];
        }
    }
    /**
     * Gets file changes for a phase
     */
    async getFileChanges(phaseNumber) {
        try {
            const since = this.config.phaseStartDate
                ? `--since="${this.config.phaseStartDate.toISOString()}"`
                : '';
            const until = this.config.phaseEndDate
                ? `--until="${this.config.phaseEndDate.toISOString()}"`
                : '';
            const command = `git log --name-status --pretty=format:"" ${since} ${until}`;
            const { stdout } = await execAsync(command, {
                cwd: this.config.gitRepoPath
            });
            const fileMap = new Map();
            for (const line of stdout.split('\n').filter(Boolean)) {
                const match = line.match(/^([AMD])\s+(.+)$/);
                if (match) {
                    const [, status, path] = match;
                    const fileStatus = status === 'A' ? 'added' :
                        status === 'M' ? 'modified' :
                            status === 'D' ? 'deleted' : 'renamed';
                    // Only include files related to the phase
                    if (path.includes(`phase${phaseNumber}`) ||
                        path.includes(`phase-${phaseNumber}`) ||
                        path.includes(`phase_${phaseNumber}`)) {
                        fileMap.set(path, {
                            path,
                            status: fileStatus
                        });
                    }
                }
            }
            return Array.from(fileMap.values());
        }
        catch (error) {
            console.error('Failed to get file changes:', error);
            return [];
        }
    }
    /**
     * Analyzes dependencies from package.json, requirements.txt, etc.
     */
    async analyzeDependencies() {
        const dependencies = [];
        const dependenciesAdded = [];
        const dependenciesRemoved = [];
        try {
            // Check for package.json (npm)
            try {
                const packageJsonPath = (0, path_1.join)(this.config.gitRepoPath || process.cwd(), 'package.json');
                const packageJson = JSON.parse(await (0, promises_1.readFile)(packageJsonPath, 'utf-8'));
                if (packageJson.dependencies) {
                    for (const [name, version] of Object.entries(packageJson.dependencies)) {
                        dependencies.push({
                            name,
                            version: String(version),
                            type: 'npm'
                        });
                    }
                }
            }
            catch (error) {
                // package.json not found or invalid, skip
            }
            // Check for requirements.txt (pip)
            try {
                const requirementsPath = (0, path_1.join)(this.config.gitRepoPath || process.cwd(), 'requirements.txt');
                const requirements = await (0, promises_1.readFile)(requirementsPath, 'utf-8');
                for (const line of requirements.split('\n').filter(Boolean)) {
                    const match = line.match(/^([^=<>!]+)(?:==|>=|<=|>|<|!=)(.+)$/);
                    if (match) {
                        const [, name, version] = match;
                        dependencies.push({
                            name: name.trim(),
                            version: version.trim(),
                            type: 'pip'
                        });
                    }
                    else {
                        dependencies.push({
                            name: line.trim(),
                            type: 'pip'
                        });
                    }
                }
            }
            catch (error) {
                // requirements.txt not found, skip
            }
        }
        catch (error) {
            console.error('Failed to analyze dependencies:', error);
        }
        return { dependencies, dependenciesAdded, dependenciesRemoved };
    }
    /**
     * Analyzes event logs for metrics
     */
    async analyzeEventLogs(phaseNumber) {
        const metrics = [];
        if (!this.config.includeEventLogs) {
            return metrics;
        }
        try {
            // Collect events from event bus (if available)
            // In a real implementation, this would read from persistent event logs
            const phaseEvents = this.events.filter(event => {
                const eventPhase = event.metadata?.phase;
                return typeof eventPhase === 'string' && (eventPhase === phaseNumber ||
                    eventPhase === `phase-${phaseNumber}` ||
                    eventPhase === `phase_${phaseNumber}`);
            });
            // Extract metrics from events
            const performanceEvents = phaseEvents.filter(e => e.type === 'performance.metric');
            for (const event of performanceEvents) {
                if (event.payload && typeof event.payload === 'object') {
                    const payload = event.payload;
                    metrics.push({
                        name: payload.metric || 'unknown',
                        value: payload.value || 0,
                        unit: payload.unit,
                        timestamp: event.timestamp,
                        metadata: payload
                    });
                }
            }
        }
        catch (error) {
            console.error('Failed to analyze event logs:', error);
        }
        return metrics;
    }
    /**
     * Collects events from event bus
     */
    collectEvents() {
        // Subscribe to events for analysis - use specific events or union
        // For wildcard, assuming eventBus supports it or use multiple subscriptions
        // Minimal fix: subscribe to known event types as strings
        // Subscribe to events for analysis - bypass type checking for wildcard-like subscription
        // @ts-ignore
        event_bus_ts_1.eventBus.subscribe('*', (event) => {
            this.events.push(event);
            // Keep only last 1000 events to prevent memory issues
            if (this.events.length > 1000) {
                this.events = this.events.slice(-1000);
            }
        });
    }
    /**
     * Analyzes components for a phase
     */
    async analyzeComponents(phaseNumber) {
        const components = [];
        try {
            const srcPath = (0, path_1.join)(this.config.gitRepoPath || process.cwd(), 'src');
            const phaseFiles = await this.findPhaseFiles(srcPath, phaseNumber);
            for (const file of phaseFiles) {
                const name = file.split('/').pop() || file;
                components.push({
                    name,
                    path: file,
                    status: 'implemented', // In production, would check file contents
                    description: `Component for Phase ${phaseNumber}`
                });
            }
        }
        catch (error) {
            console.error('Failed to analyze components:', error);
        }
        return components;
    }
    /**
     * Finds files related to a phase
     */
    async findPhaseFiles(dir, phaseNumber) {
        const files = [];
        try {
            const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = (0, path_1.join)(dir, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = await this.findPhaseFiles(fullPath, phaseNumber);
                    files.push(...subFiles);
                }
                else if (entry.isFile()) {
                    if (entry.name.includes(`phase${phaseNumber}`) ||
                        entry.name.includes(`phase-${phaseNumber}`) ||
                        entry.name.includes(`phase_${phaseNumber}`)) {
                        files.push(fullPath);
                    }
                }
            }
        }
        catch (error) {
            // Directory might not exist or be accessible
        }
        return files;
    }
    /**
     * Generates a complete phase summary
     */
    async generatePhaseSummary(phaseNumber, title, description) {
        const [gitData, dependencies, metrics, components] = await Promise.all([
            this.analyzeGitHistory(phaseNumber),
            this.analyzeDependencies(),
            this.analyzeEventLogs(phaseNumber),
            this.analyzeComponents(phaseNumber)
        ]);
        return {
            phase: phaseNumber,
            version: '1.2.2',
            title,
            description,
            status: 'completed',
            startDate: this.config.phaseStartDate?.getTime() || Date.now(),
            endDate: this.config.phaseEndDate?.getTime() || Date.now(),
            files: gitData.files,
            commits: gitData.commits,
            dependencies: dependencies.dependencies,
            dependenciesAdded: dependencies.dependenciesAdded,
            dependenciesRemoved: dependencies.dependenciesRemoved,
            metrics,
            components
        };
    }
}
exports.PhaseAnalyzer = PhaseAnalyzer;
//# sourceMappingURL=phase-analyzer.js.map