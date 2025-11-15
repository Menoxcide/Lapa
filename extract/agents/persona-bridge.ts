/**
 * Persona Bridge - NEURAFORGE to Runtime Integration
 * 
 * Bridges NEURAFORGE filesystem persona system with LAPA runtime agent system.
 * Enables seamless integration between:
 * - NEURAFORGE: Filesystem-based persona management (docs/personas/*.md)
 * - LAPA Runtime: In-memory persona management (PersonaManager)
 * 
 * This bridge allows NEURAFORGE to enhance the runtime system without
 * being part of the runtime itself.
 */

import { filesystemPersonaLoader } from './filesystem-persona-loader.ts';
import { personaManager, type Persona } from './persona.manager.ts';
import { eventBus } from '../core/event-bus.ts';

export interface PersonaBridgeConfig {
  enableAutoSync: boolean;
  syncInterval: number; // milliseconds
  watchForChanges: boolean;
}

const DEFAULT_CONFIG: PersonaBridgeConfig = {
  enableAutoSync: true,
  syncInterval: 60 * 1000, // 1 minute
  watchForChanges: false
};

/**
 * Persona Bridge
 * 
 * Synchronizes personas between NEURAFORGE filesystem system and
 * LAPA runtime system
 */
export class PersonaBridge {
  private config: PersonaBridgeConfig;
  private syncTimer?: NodeJS.Timeout;
  private isInitialized: boolean = false;

  constructor(config?: Partial<PersonaBridgeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the bridge
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Load personas from filesystem into runtime
    await filesystemPersonaLoader.initialize();

    // Start auto-sync if enabled
    if (this.config.enableAutoSync) {
      this.startAutoSync();
    }

    // Subscribe to persona changes
    this.subscribeToEvents();

    this.isInitialized = true;
    console.log('✅ PersonaBridge: Initialized and synced filesystem personas to runtime');
  }

  /**
   * Start auto-sync timer
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncFilesystemToRuntime().catch(console.error);
    }, this.config.syncInterval);

    console.log(`🔄 PersonaBridge: Auto-sync enabled (interval: ${this.config.syncInterval}ms)`);
  }

  /**
   * Stop auto-sync
   */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
    this.isInitialized = false;
    console.log('🛑 PersonaBridge: Stopped');
  }

  /**
   * Sync personas from filesystem to runtime
   */
  async syncFilesystemToRuntime(): Promise<number> {
    try {
      const count = await filesystemPersonaLoader.loadAllPersonas();
      return count;
    } catch (error) {
      console.error('PersonaBridge: Sync failed', error);
      return 0;
    }
  }

  /**
   * Sync a specific persona from filesystem to runtime
   */
  async syncPersona(personaId: string): Promise<boolean> {
    return await filesystemPersonaLoader.reloadPersona(personaId);
  }

  /**
   * Get runtime persona (from PersonaManager)
   */
  async getRuntimePersona(personaId: string): Promise<Persona | undefined> {
    return await personaManager.getPersona(personaId);
  }

  /**
   * Get filesystem persona (from FilesystemPersonaLoader)
   */
  getFilesystemPersona(personaId: string) {
    return filesystemPersonaLoader.getParsedPersona(personaId);
  }

  /**
   * List all personas (from both systems)
   */
  async listAllPersonas(): Promise<{
    runtime: Persona[];
    filesystem: string[];
    synced: string[];
  }> {
    const runtimePersonas = await personaManager.listPersonas();
    const filesystemPersonas = filesystemPersonaLoader.listLoadedPersonas();
    
    // Find synced personas (exist in both)
    const synced = filesystemPersonas.filter(fsId =>
      runtimePersonas.some((rp: Persona) => rp.id.toLowerCase() === fsId.toLowerCase())
    );

    return {
      runtime: runtimePersonas,
      filesystem: filesystemPersonas,
      synced
    };
  }

  /**
   * Subscribe to persona-related events
   */
  private subscribeToEvents(): void {
    // Subscribe to runtime persona updates
    eventBus.subscribe('agent.updated' as any, async (event: any) => {
      if (event.payload && event.payload.personaId) {
        // Persona evolved in runtime, could sync back to filesystem if needed
        console.log(`🔄 PersonaBridge: Persona ${event.payload.personaId} evolved in runtime`);
      }
    });
  }

  /**
   * Check if bridge is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get bridge status
   */
  getStatus(): {
    initialized: boolean;
    autoSyncEnabled: boolean;
    syncInterval: number;
    personasCount: {
      runtime: number;
      filesystem: number;
      synced: number;
    };
  } {
    // Note: This method needs to be async, but it's called from non-async contexts
    // For now, return a placeholder. In production, this should be async.
    return {
      initialized: this.isInitialized,
      autoSyncEnabled: this.config.enableAutoSync && !!this.syncTimer,
      syncInterval: this.config.syncInterval,
      personasCount: {
        runtime: 0,
        filesystem: 0,
        synced: 0
      }
    };
  }

  /**
   * Get status (async version)
   */
  async getStatusAsync(): Promise<{
    initialized: boolean;
    autoSyncEnabled: boolean;
    syncInterval: number;
    personasCount: {
      runtime: number;
      filesystem: number;
      synced: number;
    };
  }> {
    const personas = await this.listAllPersonas();
    return {
      initialized: this.isInitialized,
      autoSyncEnabled: this.config.enableAutoSync && !!this.syncTimer,
      syncInterval: this.config.syncInterval,
      personasCount: {
        runtime: personas.runtime.length,
        filesystem: personas.filesystem.length,
        synced: personas.synced.length
      }
    };
  }
}

// Export singleton instance
export const personaBridge = new PersonaBridge();

