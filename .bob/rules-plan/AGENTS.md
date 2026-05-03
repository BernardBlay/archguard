# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Plan Mode Specific Rules

### Architecture Overview
- **MCP Interception Layer**: Sits between Bob's planning and execution phases
- **Validation Flow**: Bob plan → MCP server → Granite-3-8b → validation result → Bob
- **Dual-Server Design**: MCP server (stdio) + Dashboard server (HTTP/SSE) run independently

### Critical Architectural Constraints
- MCP server MUST use stdio transport (not HTTP) for Bob IDE integration
- Validation happens BEFORE code generation (planning phase only)
- Dashboard server is optional monitoring tool, NOT required for validation
- .bobrules.json is the single source of truth for all architectural rules

### Non-Obvious Design Decisions
- Granite-3-8b chosen for IBM ecosystem integration (not OpenAI or other providers)
- Terminology mapping in .bobrules.json enables natural language → technical concept translation
- Severity levels (critical/high/medium/low) allow graduated enforcement
- SSE (Server-Sent Events) used for real-time dashboard updates (not WebSockets)

### Integration Points
- Bob IDE requires "secure-planner" mode configuration (custom mode)
- MCP server exposes tools/resources via @modelcontextprotocol/sdk
- watsonx.ai API requires IBM Cloud credentials (WATSONX_API_KEY, WATSONX_PROJECT_ID)
- Dashboard runs on configurable PORT (default 3001, not 3000)

### WoRide Demo Project Context
- Layered architecture enforcement (UI → Service → DB)
- Payment API isolation (MTN, Vodafone, AirtelTigo must be separate services)
- Security-first approach (all routes require auth middleware)
- USSD and mobile app must share service layer, not direct DB access