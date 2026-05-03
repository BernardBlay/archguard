# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Advanced Mode Specific Rules

### .bobrules.json Schema (config/.bobrules.json)
- Custom JSON schema for architectural guardrails
- Structure: `version`, `project`, `description`, `meta`, `guardrails[]`
- `meta.terminology_map` maps natural language terms to technical concepts (e.g., "UI" → ["components", "pages", "views"])
- Each guardrail requires: `id`, `name`, `description`, `severity` (critical/high/medium/low)
- This is the validation source - Granite-3-8b uses these rules to validate Bob's plans

### MCP Server Implementation (src/mcp/index.ts)
- Uses @modelcontextprotocol/sdk for MCP protocol
- Must expose tools/resources for Bob IDE integration
- Intercepts planning phase, NOT execution phase
- Returns validation results before code generation

### Validator Implementation (src/validator/)
- `granite.ts` - watsonx.ai API integration for Granite-3-8b-instruct
- `rules.ts` - Loads and parses config/.bobrules.json
- Must use IBM Cloud credentials from .env (WATSONX_API_KEY, WATSONX_PROJECT_ID, WATSONX_ENDPOINT)
- Endpoint format: https://us-south.ml.cloud.ibm.com (region-specific)

### Dashboard Server (src/dashboard/)
- Separate Express server with SSE (Server-Sent Events) for real-time updates
- Runs on PORT from .env (default 3001), NOT standard 3000
- NOT part of MCP server - runs independently via `npm run dashboard`
- index.html serves the dashboard UI

### TypeScript Configuration
- Strict mode enabled - all types must be explicit
- Target ES2020, CommonJS modules
- Source in src/, compiled to dist/
- Use ts-node for development (`npm run dev`), compiled JS for production (`npm start`)

### Environment Variables (.env)
- WATSONX_API_KEY - IBM Cloud API key (required)
- WATSONX_PROJECT_ID - watsonx.ai project ID (required)
- WATSONX_ENDPOINT - watsonx.ai endpoint URL (defaults to us-south)
- PORT - Dashboard server port (defaults to 3001)