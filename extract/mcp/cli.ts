#!/usr/bin/env node

/**
 * MCP Scaffolding CLI for LAPA v1.2 Phase 11
 * 
 * Command-line interface for generating MCP tools with the scaffolding system.
 */

import { mcpScaffolding, MCPScaffoldingConfig } from './scaffolding.ts';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// CLI command types
type Command = 'generate' | 'list' | 'info' | 'help';

// CLI arguments interface
interface CLiArgs {
  command: Command;
  toolName?: string;
  description?: string;
  inputSchema?: string;
  outputSchema?: string;
  templateType?: 'function' | 'class' | 'script';
  language?: 'typescript' | 'javascript' | 'python' | 'shell';
  category?: string;
  tags?: string[];
  outputFile?: string;
}

/**
 * Parse command line arguments
 * @param argv Command line arguments
 * @returns Parsed arguments
 */
function parseArgs(argv: string[]): CLiArgs {
  const args: CLiArgs = {
    command: 'help'
  };
  
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    
    switch (arg) {
      case 'generate':
      case 'gen':
        args.command = 'generate';
        break;
        
      case 'list':
        args.command = 'list';
        break;
        
      case 'info':
        args.command = 'info';
        break;
        
      case 'help':
      case '--help':
      case '-h':
        args.command = 'help';
        break;
        
      case '--name':
      case '-n':
        args.toolName = argv[++i];
        break;
        
      case '--description':
      case '-d':
        args.description = argv[++i];
        break;
        
      case '--input':
      case '-i':
        args.inputSchema = argv[++i];
        break;
        
      case '--output':
      case '-o':
        args.outputSchema = argv[++i];
        break;
        
      case '--template':
      case '-t':
        args.templateType = argv[++i] as 'function' | 'class' | 'script';
        break;
        
      case '--language':
      case '-l':
        args.language = argv[++i] as 'typescript' | 'javascript' | 'python' | 'shell';
        break;
        
      case '--category':
      case '-c':
        args.category = argv[++i];
        break;
        
      case '--tags':
        args.tags = argv[++i]?.split(',') || [];
        break;
        
      case '--file':
      case '-f':
        args.outputFile = argv[++i];
        break;
    }
  }
  
  return args;
}

/**
 * Generate a new MCP tool
 * @param args CLI arguments
 */
async function generateTool(args: CLiArgs): Promise<void> {
  if (!args.toolName) {
    console.error('Error: Tool name is required');
    process.exit(1);
  }
  
  if (!args.description) {
    console.error('Error: Tool description is required');
    process.exit(1);
  }
  
  if (!args.inputSchema) {
    console.error('Error: Input schema is required');
    process.exit(1);
  }
  
  // Parse input schema
  let inputSchema: Record<string, any>;
  try {
    if (args.inputSchema.endsWith('.json')) {
      // Read from file
      const schemaContent = await readFile(args.inputSchema, 'utf-8');
      inputSchema = JSON.parse(schemaContent);
    } else {
      // Parse as JSON string
      inputSchema = JSON.parse(args.inputSchema);
    }
  } catch (error) {
    console.error('Error: Invalid input schema JSON');
    process.exit(1);
  }
  
  // Parse output schema if provided
  let outputSchema: Record<string, any> | undefined;
  if (args.outputSchema) {
    try {
      if (args.outputSchema.endsWith('.json')) {
        // Read from file
        const schemaContent = await readFile(args.outputSchema, 'utf-8');
        outputSchema = JSON.parse(schemaContent);
      } else {
        // Parse as JSON string
        outputSchema = JSON.parse(args.outputSchema);
      }
    } catch (error) {
      console.error('Error: Invalid output schema JSON');
      process.exit(1);
    }
  }
  
  // Create scaffolding configuration
  const config: MCPScaffoldingConfig = {
    toolName: args.toolName,
    description: args.description,
    inputSchema,
    outputSchema,
    templateType: args.templateType || 'function',
    language: args.language || 'typescript',
    category: args.category,
    tags: args.tags
  };
  
  try {
    // Generate the tool
    const metadata = await mcpScaffolding.generateTool(config);
    console.log(`✓ Generated MCP tool: ${metadata.name}`);
    console.log(`  Path: ${metadata.path}`);
    console.log(`  Timestamp: ${new Date(metadata.timestamp).toISOString()}`);
  } catch (error) {
    console.error('Error generating tool:', error);
    process.exit(1);
  }
}

/**
 * List generated tools
 */
async function listTools(): Promise<void> {
  const tools = mcpScaffolding.getGeneratedTools();
  
  if (tools.length === 0) {
    console.log('No tools generated yet.');
    return;
  }
  
  console.log('Generated MCP Tools:');
  console.log('====================');
  
  for (const tool of tools) {
    console.log(`${tool.name} - ${tool.config.description}`);
    console.log(`  Category: ${tool.config.category || 'Uncategorized'}`);
    console.log(`  Language: ${tool.config.language}`);
    console.log(`  Template: ${tool.config.templateType}`);
    console.log(`  Path: ${tool.path}`);
    console.log('');
  }
}

/**
 * Show tool information
 * @param args CLI arguments
 */
async function showToolInfo(args: CLiArgs): Promise<void> {
  if (!args.toolName) {
    console.error('Error: Tool name is required');
    process.exit(1);
  }
  
  const metadata = mcpScaffolding.getToolMetadata(args.toolName);
  if (!metadata) {
    console.error(`Error: Tool '${args.toolName}' not found`);
    process.exit(1);
  }
  
  console.log(`Tool: ${metadata.name}`);
  console.log('====================');
  console.log(`Description: ${metadata.config.description}`);
  console.log(`Category: ${metadata.config.category || 'Uncategorized'}`);
  console.log(`Language: ${metadata.config.language}`);
  console.log(`Template Type: ${metadata.config.templateType}`);
  console.log(`Path: ${metadata.path}`);
  console.log(`Generated: ${new Date(metadata.timestamp).toISOString()}`);
  
  if (metadata.config.tags && metadata.config.tags.length > 0) {
    console.log(`Tags: ${metadata.config.tags.join(', ')}`);
  }
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
MCP Scaffolding CLI
===================

Usage: mcp-scaffold <command> [options]

Commands:
  generate|gen    Generate a new MCP tool
  list            List all generated tools
  info            Show information about a specific tool
  help            Show this help message

Generate Options:
  -n, --name <name>           Tool name (required)
  -d, --description <desc>    Tool description (required)
  -i, --input <schema>        Input schema JSON or file path (required)
  -o, --output <schema>       Output schema JSON or file path
  -t, --template <type>       Template type: function, class, script (default: function)
  -l, --language <lang>       Language: typescript, javascript, python, shell (default: typescript)
  -c, --category <category>   Tool category
  --tags <tags>               Comma-separated list of tags
  -f, --file <path>           Output file path

Examples:
  mcp-scaffold generate -n "file-reader" -d "Read file contents" -i '{"type":"object","properties":{"filePath":{"type":"string"}}}'
  mcp-scaffold list
  mcp-scaffold info -n "file-reader"
  `);
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  
  switch (args.command) {
    case 'generate':
      await generateTool(args);
      break;
      
    case 'list':
      await listTools();
      break;
      
    case 'info':
      await showToolInfo(args);
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

// Export for testing
export { parseArgs, generateTool, listTools, showToolInfo, showHelp };