# ArchGuard

An architectural guardrail system for IBM Bob. ArchGuard prevents AI-generated code from violating your project's architectural principles before a single line is written.

## The Problem
AI coding agents like IBM Bob generate code that is locally correct but globally wrong. They ignore your security model, layer boundaries, and API design principles — producing functional but structurally unsound code.

## The Solution
ArchGuard sits between Bob's planning phase and execution phase. It:
1. Reads your project's `.bobrules.json` architectural rulebook
2. Intercepts Bob's plan via MCP
3. Validates the plan against your rules using IBM Granite-3-8b
4. Blocks violations and explains exactly what rule was broken and how to fix it
5. Streams results to a live dashboard in real time

## Quick Start

### Global Setup (Works Across All Projects)

1. **Clone and build ArchGuard:**
```bash
git clone https://github.com/yourusername/archguard.git
cd archguard
npm install
npm run build
```

2. **Configure Bob IDE Global MCP:**
   - Go to **Settings → MCP → Global MCPs → Open**
   - Add ArchGuard configuration with absolute path:
```json
{
  "mcpServers": {
    "archguard": {
      "command": "node",
      "args": ["C:/path/to/archguard/dist/mcp/index.js"],
      "env": {
        "WATSONX_API_KEY": "your-api-key",
        "WATSONX_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

3. **Move secure-planner mode to Global:**
   - **Settings → Modes → secure-planner → Edit**
   - Change **Scope** from "Project" to **Global**

4. **Add `.bobrules.json` to your projects:**
   - Copy `templates/.bobrules.json` to your project root
   - Customize the rules for your project

## Documentation

- **[Global Installation Guide](docs/GLOBAL_INSTALLATION.md)** - Complete guide for installing and using ArchGuard globally
- **[Quick Start Guide](docs/QUICK_START.md)** - Get started quickly
- **[Secure Planner Guide](docs/SECURE_PLANNER_GUIDE.md)** - Using ArchGuard with Bob's secure-planner mode

## Features

- ✅ **Global Configuration** - Configure once in Bob IDE, works across all projects
- ✅ **Project-Specific Rules** - Each project defines its own architectural guardrails
- ✅ **AI-Powered Validation** - Uses IBM Granite-3-8b for intelligent rule checking
- ✅ **Real-Time Dashboard** - Monitor validation results as they happen
- ✅ **Bob IDE Integration** - Seamless integration via Model Context Protocol (MCP)
- ✅ **Flexible Configuration** - Support for multiple `.bobrules.json` locations

## Demo Project
WoRide — Ghana's premier ride-hailing service (woride.app)

## Tech Stack
- IBM Bob IDE (custom mode + MCP server)
- IBM Granite-3-8b-instruct via watsonx.ai
- TypeScript + Node.js
- Express + SSE (real-time dashboard)
- Model Context Protocol (MCP)

## Running the Dashboard

To monitor validation results in real-time:

```bash
cd archguard
npm run dashboard
```

Then open http://localhost:3001 in your browser.

## Requirements

- Node.js >= 16.0.0
- IBM watsonx.ai account with Granite-3-8b access
- IBM Bob IDE

## Team
- Bernard Blay
- Vanessa Koranteng

## License
MIT

## IBM Bob Dev Day Hackathon 2026
