"use strict";
/**
 * Repository Structure Rules and Code Generation Guidelines for LAPA v1.2 Phase 15
 *
 * This module enforces strict directory structure and code generation rules
 * to maintain separation of concerns (SoC) and consistent architecture.
 *
 * Rules enforce:
 * - Strict directory structure: /src/{components|services|models}
 * - Layer interdependencies (frontend consumes backend APIs)
 * - Code generation patterns aligned with LAPA architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoRulesManager = exports.RepoRulesManager = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const events_1 = require("events");
/**
 * Repository Rules Manager
 *
 * Enforces repository structure and code generation rules according to LAPA v1.2 standards.
 */
class RepoRulesManager extends events_1.EventEmitter {
    rules = [];
    directoryRules = [];
    layerDependencyRules = [];
    basePath;
    constructor(basePath = process.cwd()) {
        super();
        this.basePath = basePath;
        this.initializeDefaultRules();
    }
    /**
     * Initialize default repository rules
     */
    initializeDefaultRules() {
        // Directory structure rules
        this.directoryRules = [
            {
                path: 'src/components',
                required: false,
                allowedSubdirs: ['ui', 'forms', 'layout'],
                forbiddenPatterns: [/\.(service|model|api)\.ts$/i]
            },
            {
                path: 'src/services',
                required: false,
                allowedSubdirs: ['api', 'storage', 'auth'],
                forbiddenPatterns: [/\.(component|ui|view)\.tsx?$/i]
            },
            {
                path: 'src/models',
                required: false,
                allowedSubdirs: ['types', 'schemas'],
                forbiddenPatterns: [/\.(component|service|api)\.tsx?$/i]
            }
        ];
        // Layer dependency rules (frontend consumes backend APIs)
        this.layerDependencyRules = [
            {
                from: ['src/components', 'src/ui'],
                to: ['src/services', 'src/models'],
                allowed: true,
                reason: 'Frontend components can consume services and models'
            },
            {
                from: ['src/services'],
                to: ['src/models'],
                allowed: true,
                reason: 'Services can use models'
            },
            {
                from: ['src/models'],
                to: ['src/components', 'src/services'],
                allowed: false,
                reason: 'Models should not depend on components or services (circular dependency)'
            },
            {
                from: ['src/components'],
                to: ['src/components'],
                allowed: true,
                reason: 'Components can import other components'
            }
        ];
        // Code generation rules
        this.rules = [
            {
                id: 'strict-dir-structure',
                name: 'Strict Directory Structure',
                description: 'Files must be placed in appropriate directories (components|services|models)',
                pattern: /^src\/(components|services|models|core|agents|orchestrator|swarm|validation|premium|rag|local|mcp|modes|inference|sandbox|shims|ui|types)\//,
                severity: 'error',
                fixable: true,
                fix: (path) => {
                    // Suggest moving to appropriate directory
                    if (path.includes('component') || path.includes('ui')) {
                        return path.replace(/src\/[^/]+/, 'src/components');
                    }
                    if (path.includes('service') || path.includes('api')) {
                        return path.replace(/src\/[^/]+/, 'src/services');
                    }
                    if (path.includes('model') || path.includes('type') || path.includes('schema')) {
                        return path.replace(/src\/[^/]+/, 'src/models');
                    }
                    return path;
                }
            },
            {
                id: 'no-circular-deps',
                name: 'No Circular Dependencies',
                description: 'Prevent circular dependencies between layers',
                pattern: /.*/,
                severity: 'error',
                fixable: false
            },
            {
                id: 'frontend-backend-separation',
                name: 'Frontend-Backend Separation',
                description: 'Frontend (components/ui) must not directly access backend internals',
                pattern: /^(src\/(components|ui)\/.*\.tsx?)$/,
                severity: 'error',
                fixable: true
            },
            {
                id: 'service-api-only',
                name: 'Service API Only',
                description: 'Services should expose clean APIs, not internal implementation details',
                pattern: /^src\/services\/.*\.ts$/,
                severity: 'warning',
                fixable: false
            }
        ];
    }
    /**
     * Validate file path against repository rules
     */
    async validateFilePath(filePath) {
        const violations = [];
        const suggestions = [];
        const relativePath = (0, path_1.relative)(this.basePath, filePath);
        const normalizedPath = relativePath.replace(/\\/g, '/');
        // Check directory structure rules
        for (const rule of this.directoryRules) {
            const rulePath = rule.path.replace(/\\/g, '/');
            if (normalizedPath.startsWith(rulePath)) {
                // Check forbidden patterns
                if (rule.forbiddenPatterns) {
                    for (const pattern of rule.forbiddenPatterns) {
                        if (pattern.test(normalizedPath)) {
                            violations.push({
                                rule: {
                                    id: 'forbidden-pattern',
                                    name: 'Forbidden Pattern',
                                    description: `File matches forbidden pattern: ${pattern}`,
                                    pattern: pattern.toString(),
                                    severity: 'error',
                                    fixable: false
                                },
                                path: normalizedPath,
                                message: `File ${normalizedPath} matches forbidden pattern ${pattern}`,
                                severity: 'error',
                                fixable: false
                            });
                        }
                    }
                }
            }
        }
        // Check code generation rules
        for (const rule of this.rules) {
            if (typeof rule.pattern === 'string') {
                if (!normalizedPath.match(new RegExp(rule.pattern))) {
                    if (rule.severity === 'error') {
                        violations.push({
                            rule,
                            path: normalizedPath,
                            message: `${rule.name}: ${rule.description}`,
                            severity: rule.severity,
                            fixable: rule.fixable,
                            suggestedFix: rule.fix ? rule.fix(normalizedPath) : undefined
                        });
                    }
                }
            }
            else {
                if (!rule.pattern.test(normalizedPath)) {
                    if (rule.severity === 'error' && rule.id === 'strict-dir-structure') {
                        violations.push({
                            rule,
                            path: normalizedPath,
                            message: `${rule.name}: File must be in appropriate directory structure`,
                            severity: rule.severity,
                            fixable: rule.fixable,
                            suggestedFix: rule.fix ? rule.fix(normalizedPath) : undefined
                        });
                    }
                }
            }
        }
        // Generate suggestions
        if (violations.length > 0) {
            for (const violation of violations) {
                if (violation.suggestedFix) {
                    suggestions.push(`Move ${violation.path} to ${violation.suggestedFix}`);
                }
            }
        }
        return {
            valid: violations.filter(v => v.severity === 'error').length === 0,
            violations,
            suggestions
        };
    }
    /**
     * Validate import dependencies between layers
     */
    async validateImportDependency(fromPath, toPath) {
        const fromRelative = (0, path_1.relative)(this.basePath, fromPath).replace(/\\/g, '/');
        const toRelative = (0, path_1.relative)(this.basePath, toPath).replace(/\\/g, '/');
        for (const rule of this.layerDependencyRules) {
            const fromMatches = rule.from.some(pattern => fromRelative.startsWith(pattern));
            const toMatches = rule.to.some(pattern => toRelative.startsWith(pattern));
            if (fromMatches && toMatches) {
                return {
                    allowed: rule.allowed,
                    reason: rule.reason
                };
            }
        }
        // Default: allow if no specific rule matches
        return { allowed: true };
    }
    /**
     * Get code generation template for a given file type
     */
    getCodeGenTemplate(type, name) {
        const templates = {
            component: `/**
 * ${name} Component
 * 
 * Generated according to LAPA v1.2 repository rules
 */

import React from 'react';

export interface ${name}Props {
  // Component props
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};
`,
            service: `/**
 * ${name} Service
 * 
 * Generated according to LAPA v1.2 repository rules
 */

export class ${name}Service {
  // Service implementation
}
`,
            model: `/**
 * ${name} Model
 * 
 * Generated according to LAPA v1.2 repository rules
 */

export interface ${name} {
  // Model definition
}
`
        };
        return templates[type] || '';
    }
    /**
     * Validate entire repository structure
     */
    async validateRepository() {
        const violations = [];
        const suggestions = [];
        try {
            // Check required directories
            for (const dirRule of this.directoryRules) {
                if (dirRule.required) {
                    const dirPath = (0, path_1.join)(this.basePath, dirRule.path);
                    try {
                        await fs_1.promises.access(dirPath);
                    }
                    catch {
                        violations.push({
                            rule: {
                                id: 'missing-required-dir',
                                name: 'Missing Required Directory',
                                description: `Required directory ${dirRule.path} is missing`,
                                pattern: dirRule.path,
                                severity: 'error',
                                fixable: true
                            },
                            path: dirRule.path,
                            message: `Required directory ${dirRule.path} is missing`,
                            severity: 'error',
                            fixable: true,
                            suggestedFix: `Create directory: ${dirRule.path}`
                        });
                    }
                }
            }
        }
        catch (error) {
            this.emit('error', error);
        }
        return {
            valid: violations.filter(v => v.severity === 'error').length === 0,
            violations,
            suggestions
        };
    }
    /**
     * Add custom rule
     */
    addRule(rule) {
        this.rules.push(rule);
        this.emit('rule-added', rule);
    }
    /**
     * Add custom directory rule
     */
    addDirectoryRule(rule) {
        this.directoryRules.push(rule);
        this.emit('directory-rule-added', rule);
    }
    /**
     * Add custom layer dependency rule
     */
    addLayerDependencyRule(rule) {
        this.layerDependencyRules.push(rule);
        this.emit('layer-dependency-rule-added', rule);
    }
}
exports.RepoRulesManager = RepoRulesManager;
/**
 * Default repository rules manager instance
 */
exports.repoRulesManager = new RepoRulesManager();
//# sourceMappingURL=repo-rules.js.map