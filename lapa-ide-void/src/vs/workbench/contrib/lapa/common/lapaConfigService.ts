/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { join } from '../../../../base/common/path.js';

/**
 * LAPA Configuration Service
 * 
 * Loads LAPA configuration from ~/.lapa/config.json and integrates it with Void settings.
 * Implements Phase 1 I1: CtxMoat-AddLAPACfg (P29DomExp+W42CorpKnow ~/.lapa/config.json VoidSet)
 */

export interface LAPAConfig {
	agents?: {
		enabled?: boolean;
		configPath?: string;
	};
	memory?: {
		engine?: 'sqlite' | 'episodic' | 'vector';
		persistPath?: string;
	};
	inference?: {
		preferredProvider?: 'nim' | 'ollama' | 'openai';
		nimPath?: string;
		ollamaEndpoint?: string;
	};
	swarm?: {
		enabled?: boolean;
		webRTCEnabled?: boolean;
	};
	[key: string]: any;
}

export interface ILAPAConfigService {
	readonly _serviceBrand: undefined;
	readonly config: LAPAConfig | null;
	readonly configPath: string;
	loadConfig(): Promise<LAPAConfig | null>;
	getConfigValue<T>(key: string, defaultValue: T): T;
}

export const ILAPAConfigService = createDecorator<ILAPAConfigService>('LAPAConfigService');

class LAPAConfigService extends Disposable implements ILAPAConfigService {
	_serviceBrand: undefined;
	
	private _config: LAPAConfig | null = null;
	private readonly _configPath: string;
	
	constructor() {
		super();
		
		// Determine config path: ~/.lapa/config.json
		const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
		this._configPath = join(homeDir, '.lapa', 'config.json');
	}
	
	get config(): LAPAConfig | null {
		return this._config;
	}
	
	get configPath(): string {
		return this._configPath;
	}
	
	async loadConfig(): Promise<LAPAConfig | null> {
		try {
			// In electron-main, we can use Node.js fs directly
			const { readFile } = await import('fs/promises');
			const { existsSync } = await import('fs');
			
			if (existsSync(this._configPath)) {
				const content = await readFile(this._configPath, 'utf-8');
				this._config = JSON.parse(content) as LAPAConfig;
				return this._config;
			}
		} catch (error) {
			console.error('[LAPAConfigService] Failed to load config:', error);
			this._config = null;
		}
		
		return null;
	}
	
	getConfigValue<T>(key: string, defaultValue: T): T {
		if (!this._config) {
			return defaultValue;
		}
		
		const keys = key.split('.');
		let value: any = this._config;
		
		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = value[k];
			} else {
				return defaultValue;
			}
		}
		
		return value !== undefined ? value : defaultValue;
	}
}

// Note: This service should be registered in electron-main process where fs access is available
// Registration should be done in electron-main workbench contribution

