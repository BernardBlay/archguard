# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Context
ArchGuard is an MCP server that intercepts IBM Bob's planning phase to validate against architectural rules using IBM Granite-3-8b. Built for IBM Bob Dev Day Hackathon 2026.

## Critical Non-Obvious Patterns

### Dual-Server Architecture
- **MCP Server**: `npm run dev` (port not exposed, MCP protocol)
- **Dashboard Server**: `npm run dashboard` (Express + SSE on PORT from .env, default 3001)
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

### MCP Configuration for Bob IDE
- Must be added to Bob IDE settings as MCP server
- Requires switching to "secure-planner" mode in Bob (custom mode, not standard)
- MCP server intercepts BEFORE code execution, during planning phase

## Build Commands
- `npm run build` - Compiles TypeScript to dist/
- `npm run dev` - Runs MCP server with ts-node (development)
- `npm start` - Runs compiled MCP server from dist/
- `npm run dashboard` - Runs separate Express dashboard server

## Code Style
- TypeScript strict mode enabled
- Target: ES2020, CommonJS modules
- All source in src/, compiled to dist/
- No linting config present - follow TypeScript strict mode rules