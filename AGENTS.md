# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Context
ArchGuard is an MCP server that intercepts IBM Bob's planning phase to validate against architectural rules using IBM Granite-3-8b. Built for IBM Bob Dev Day Hackathon 2026.

**NEW:** ArchGuard now provides in-IDE validation - results appear directly in Bob IDE chat without requiring terminal access!

## Critical Non-Obvious Patterns

### Dual-Server Architecture
- **MCP Server**: `npm run dev` (port not exposed, MCP protocol)
  - Provides `validate_plan` tool for validation
  - Provides `create_bob_rules` tool for auto-generating `.bob/rules` files
  - Returns formatted markdown for in-IDE display
- **Dashboard Server**: `npm run dashboard` (Express + SSE on PORT from .env, default 3001)
  - OPTIONAL monitoring tool (not required for validation)
  - Both servers run independently - dashboard is NOT part of MCP server

### .bobrules.json Schema (config/.bobrules.json)
- Custom architectural guardrail definitions with severity levels (critical/high/medium/low)
- `terminology_map` section maps natural language to technical concepts for AI understanding
- Each guardrail has: id, name, description, severity
- This file is the SOURCE OF TRUTH for validation - Granite-3-8b validates Bob's plans against these rules

### watsonx.ai Integration
- Requires IBM Cloud credentials: WATSONX_API_KEY, WATSONX_PROJECT_ID, WATSONX_ENDPOINT
- Uses Granite-3-8b-instruct model (not OpenAI or other providers)
- Endpoint defaults to us-south region: https://us-south.ml.cloud.ibm.com

### MCP Tools
- **validate_plan**: Validates architectural plans, returns formatted markdown for in-IDE display
- **create_bob_rules**: Auto-generates `.bob/rules-{mode}/AGENTS.md` files with guardrails
- Results appear directly in Bob IDE chat - no terminal needed!

### MCP Configuration for Bob IDE
- Must be added to Bob IDE settings as MCP server
- Can be used with ANY mode after generating rules via `create_bob_rules`
- Recommended: Use "secure-planner" mode (custom mode) for automatic validation
- MCP server intercepts BEFORE code execution, during planning phase

## Build Commands
- `npm run build` - Compiles TypeScript to dist/
- `npm run dev` - Runs MCP server with ts-node (development)
- `npm start` - Runs compiled MCP server from dist/
- `npm run dashboard` - Runs separate Express dashboard server (OPTIONAL)

## Key Features
- **In-IDE Validation**: Results appear directly in Bob IDE chat (no terminal needed)
- **Auto-Generate Rules**: `create_bob_rules` tool creates `.bob/rules` for any mode
- **Formatted Output**: Markdown with emojis, severity levels, and actionable guidance
- **Severity-Based**: Violations categorized as Critical, High, Medium, Low

## Code Style
- TypeScript strict mode enabled
- Target: ES2020, CommonJS modules
- All source in src/, compiled to dist/
- No linting config present - follow TypeScript strict mode rules