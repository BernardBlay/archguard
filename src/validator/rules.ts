import * as fs from 'fs';
import * as path from 'path';

export interface GuardrailRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface BobRulesConfig {
  version: string;
  project: string;
  description: string;
  meta: {
    philosophy: string;
    stack: string;
    terminology_map: Record<string, string[]>;
  };
  guardrails: GuardrailRule[];
}

/**
 * Find .bobrules.json in the project directory
 * Searches in multiple locations:
 * 1. Project root: .bobrules.json
 * 2. .bob directory: .bob/.bobrules.json
 * 3. config directory: config/.bobrules.json
 *
 * @param projectDir - The project directory to search in (defaults to cwd)
 * @returns Path to the config file or null if not found
 */
export function findConfigFile(projectDir: string = process.cwd()): string | null {
  const possiblePaths = [
    path.join(projectDir, '.bobrules.json'),
    path.join(projectDir, '.bob', '.bobrules.json'),
    path.join(projectDir, 'config', '.bobrules.json'),
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Load and parse the .bobrules.json configuration file
 * @param projectDir - The project directory to search in (defaults to cwd)
 * @returns Parsed configuration object
 */
export function loadRules(projectDir: string = process.cwd()): BobRulesConfig {
  const configPath = findConfigFile(projectDir);
  
  if (!configPath) {
    throw new Error(
      `Configuration file not found in project directory: ${projectDir}\n` +
      `Searched locations:\n` +
      `  - ${path.join(projectDir, '.bobrules.json')}\n` +
      `  - ${path.join(projectDir, '.bob', '.bobrules.json')}\n` +
      `  - ${path.join(projectDir, 'config', '.bobrules.json')}\n\n` +
      `Run 'archguard init' to create a default configuration file.`
    );
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config: BobRulesConfig = JSON.parse(configContent);

  // Validate required fields
  if (!config.version || !config.guardrails || !Array.isArray(config.guardrails)) {
    throw new Error('Invalid .bobrules.json format: missing required fields');
  }

  // Validate each guardrail
  config.guardrails.forEach((rule, index) => {
    if (!rule.id || !rule.name || !rule.description || !rule.severity) {
      throw new Error(`Invalid guardrail at index ${index}: missing required fields`);
    }
    if (!['critical', 'high', 'medium', 'low'].includes(rule.severity)) {
      throw new Error(`Invalid severity level for rule ${rule.id}: ${rule.severity}`);
    }
  });

  return config;
}

/**
 * Get all guardrail rules from the configuration
 * @returns Array of guardrail rules
 */
export function getGuardrails(): GuardrailRule[] {
  const config = loadRules();
  return config.guardrails;
}

/**
 * Get a specific guardrail rule by ID
 * @param id - The guardrail rule ID
 * @returns The guardrail rule or undefined if not found
 */
export function getGuardrailById(id: string): GuardrailRule | undefined {
  const guardrails = getGuardrails();
  return guardrails.find(rule => rule.id === id);
}

// Made with Bob
