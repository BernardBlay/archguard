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

## Demo Project
WoRide — Ghana's premier ride-hailing service (woride.app)

## Tech Stack
- IBM Bob IDE (custom mode + MCP server)
- IBM Granite-3-8b-instruct via watsonx.ai
- TypeScript + Node.js
- Express + SSE (real-time dashboard)

## Setup
1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env` and fill in watsonx.ai credentials
4. `npm run dev`
5. Add MCP server to Bob IDE settings
6. Switch to `secure-planner` mode in Bob

## Team
- Bernard Blay
- Vanessa Koranteng

## IBM Bob Dev Day Hackathon 2026
