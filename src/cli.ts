#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

const COMMANDS = {
  init: 'Initialize ArchGuard in the current project',
  start: 'Start the ArchGuard MCP server',
  dashboard: 'Start the ArchGuard dashboard server',
  help: 'Show this help message',
};

function showHelp() {
  console.log(`
ArchGuard - Architectural Guardrails for IBM Bob
================================================

Usage: archguard <command> [options]

Commands:
  init        ${COMMANDS.init}
  start       ${COMMANDS.start}
  dashboard   ${COMMANDS.dashboard}
  help        ${COMMANDS.help}

Examples:
  archguard init              # Create .bobrules.json in current project
  archguard start             # Start MCP server (for Bob IDE)
  archguard dashboard         # Start dashboard on http://localhost:3001

For more information, visit: https://github.com/yourusername/archguard
`);
}

function initProject() {
  const cwd = process.cwd();
  const targetPath = path.join(cwd, '.bobrules.json');

  // Check if .bobrules.json already exists
  if (fs.existsSync(targetPath)) {
    console.error('❌ Error: .bobrules.json already exists in this directory');
    console.log('\nIf you want to reset it, delete the existing file first:');
    console.log(`   rm ${targetPath}`);
    process.exit(1);
  }

  // Find the template file (relative to the installed package)
  const templatePath = path.join(__dirname, '..', 'templates', '.bobrules.json');

  if (!fs.existsSync(templatePath)) {
    console.error('❌ Error: Template file not found');
    console.error(`Expected at: ${templatePath}`);
    process.exit(1);
  }

  // Copy template to current directory
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(targetPath, templateContent, 'utf-8');

    console.log('✅ Successfully initialized ArchGuard!');
    console.log(`\nCreated: ${targetPath}`);
    console.log('\nNext steps:');
    console.log('1. Edit .bobrules.json to define your project\'s architectural rules');
    console.log('2. Add ArchGuard to your Bob IDE MCP configuration');
    console.log('3. Switch to "secure-planner" mode in Bob IDE');
    console.log('\nFor detailed setup instructions, run: archguard help');
  } catch (error) {
    console.error('❌ Error creating .bobrules.json:', error);
    process.exit(1);
  }
}

function startMCPServer() {
  console.log('Starting ArchGuard MCP server...');
  console.log('This will run the MCP server for Bob IDE integration.\n');

  // Import and run the MCP server
  require('./mcp/index');
}

function startDashboard() {
  console.log('Starting ArchGuard dashboard server...');
  console.log('Dashboard will be available at http://localhost:3001\n');

  // Import and run the dashboard server
  require('./dashboard/server');
}

// Main CLI logic
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }

  switch (command) {
    case 'init':
      initProject();
      break;

    case 'start':
      startMCPServer();
      break;

    case 'dashboard':
      startDashboard();
      break;

    default:
      console.error(`❌ Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
  }
}

// Run CLI
main();

// Made with Bob
