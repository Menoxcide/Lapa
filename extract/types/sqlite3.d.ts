/**
 * Type declarations for sqlite3 module
 * This is a temporary type definition until sqlite3 is properly installed
 */

declare module 'sqlite3' {
  export interface RunResult {
    lastID?: number;
    changes?: number;
  }

  export interface Statement {
    run(...params: any[]): Statement;
    get(...params: any[]): Statement;
    all(...params: any[]): Statement;
    finalize(callback?: (err: Error | null) => void): void;
  }

  type RunCallback = (this: Statement, err: Error | null) => void;
  type GetCallback = (err: Error | null, row: any) => void;
  type AllCallback = (err: Error | null, rows: any[]) => void;
  type SerializeCallback = () => void;
  type CloseCallback = (err: Error | null) => void;

  export class Database {
    constructor(filename: string, callback?: (err: Error | null) => void);
    constructor(filename: string, mode?: number, callback?: (err: Error | null) => void);
    
    run(sql: string, callback?: RunCallback): Database;
    run(sql: string, param1: any, callback?: RunCallback): Database;
    run(sql: string, param1: any, param2: any, callback?: RunCallback): Database;
    run(sql: string, param1: any, param2: any, param3: any, callback?: RunCallback): Database;
    run(sql: string, param1: any, param2: any, param3: any, param4: any, callback?: RunCallback): Database;
    run(sql: string, param1: any, param2: any, param3: any, param4: any, param5: any, callback?: RunCallback): Database;
    run(sql: string, param1: any, param2: any, param3: any, param4: any, param5: any, param6: any, callback?: RunCallback): Database;
    run(sql: string, param1: any, param2: any, param3: any, param4: any, param5: any, param6: any, param7: any, callback?: RunCallback): Database;
    
    get(sql: string, callback?: GetCallback): Database;
    get(sql: string, param1: any, callback?: GetCallback): Database;
    get(sql: string, param1: any, param2: any, callback?: GetCallback): Database;
    get(sql: string, param1: any, param2: any, param3: any, callback?: GetCallback): Database;
    
    all(sql: string, callback?: AllCallback): Database;
    all(sql: string, param1: any, callback?: AllCallback): Database;
    all(sql: string, param1: any, param2: any, callback?: AllCallback): Database;
    all(sql: string, param1: any, param2: any, param3: any, callback?: AllCallback): Database;
    
    each(sql: string, callback?: (err: Error | null, row: any) => void, complete?: (err: Error | null, count: number) => void): Database;
    
    exec(sql: string, callback?: (err: Error | null) => void): Database;
    
    prepare(sql: string, callback?: (err: Error | null) => void): Statement;
    
    serialize(callback?: SerializeCallback): void;
    parallelize(callback?: SerializeCallback): void;
    
    close(callback?: CloseCallback): void;
  }
}

