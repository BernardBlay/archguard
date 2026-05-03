# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Ask Mode Specific Rules

### Project Context
- ArchGuard is an MCP server for IBM Bob Dev Day Hackathon 2026
- Validates AI-generated code plans against architectural rules using IBM Granite-3-8b
- Demo project: WoRide - Ghana's premier ride-hailing service (woride.app)

### Documentation Structure
- config/.bobrules.json contains architectural guardrail definitions (not typical config location)
- src/mcp/ contains MCP server implementation (intercepts Bob's planning phase)
- src/validator/ contains Granite-3-8b integration and rule validation logic
- src/dashboard/ contains separate Express server for real-time validation monitoring

### Non-Standard Patterns
- Dashboard server runs independently from MCP server (two separate processes)
- MCP server uses stdio transport (not HTTP) for Bob IDE integration
- Requires "secure-planner" mode in Bob IDE (custom mode, not documented in standard Bob docs)
- watsonx.ai credentials required (IBM Cloud specific, not generic AI provider)

### Key Concepts
- **Architectural Guardrails**: Rules defined in .bobrules.json that prevent code violations
- **Planning Phase Interception**: MCP server validates BEFORE code generation, not after
- **Terminology Mapping**: .bobrules.json includes AI-friendly term mappings for better understanding
- **Severity Levels**: critical/high/medium/low determine validation strictness