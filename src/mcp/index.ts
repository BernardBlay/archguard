#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Import validator functions (to be implemented in separate subtasks)
import { loadRules, type GuardrailRule } from "../validator/rules.js";
import { validateWithGranite } from "../validator/granite.js";

// Types for validation results
interface ValidationViolation {
  ruleId: string;
  ruleName: string;
  severity: string;
  explanation: string;
}

interface ValidationResult {
  approved: boolean;
  violations: ValidationViolation[];
  suggestions: string[];
}

// MCP Server instance
const server = new Server(
  {
    name: "archguard",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the validate_plan tool
const VALIDATE_PLAN_TOOL: Tool = {
  name: "validate_plan",
  description:
    "Validates an architectural plan against project guardrails using IBM Granite-3-8b AI model. Returns approval status, violations, and suggestions.",
  inputSchema: {
    type: "object",
    properties: {
      plan: {
        type: "string",
        description:
          "The architectural plan or code changes to validate against guardrails",
      },
    },
    required: ["plan"],
  },
};

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("[ArchGuard] Listing available tools");
  return {
    tools: [VALIDATE_PLAN_TOOL],
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[ArchGuard] Tool called: ${name}`);

  if (name !== "validate_plan") {
    throw new Error(`Unknown tool: ${name}`);
  }

  if (!args || typeof args.plan !== "string") {
    throw new Error("Invalid arguments: 'plan' parameter is required and must be a string");
  }

  const plan = args.plan as string;

  try {
    // Load architectural rules from config
    console.error("[ArchGuard] Loading guardrail rules...");
    const rules = await loadRules();
    console.error(`[ArchGuard] Loaded ${rules.length} guardrail rules`);

    // Validate plan using Granite-3-8b AI model
    console.error("[ArchGuard] Validating plan with Granite-3-8b...");
    const validationResult = await validateWithGranite(plan, rules);
    console.error(
      `[ArchGuard] Validation complete. Approved: ${validationResult.approved}, Violations: ${validationResult.violations.length}`
    );

    // Return structured validation result
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(validationResult, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error("[ArchGuard] Validation error:", error);

    // Return error in structured format
    const errorResult: ValidationResult = {
      approved: false,
      violations: [
        {
          ruleId: "system-error",
          ruleName: "System Error",
          severity: "critical",
          explanation:
            error instanceof Error
              ? `Validation failed: ${error.message}`
              : "Unknown validation error occurred",
        },
      ],
      suggestions: [
        "Check that watsonx.ai credentials are configured correctly in .env",
        "Verify that config/.bobrules.json is valid",
        "Review the error logs for more details",
      ],
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(errorResult, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the MCP server
async function main() {
  console.error("[ArchGuard] Starting MCP server...");
  console.error("[ArchGuard] Server name: archguard");
  console.error("[ArchGuard] Server version: 1.0.0");
  console.error("[ArchGuard] Transport: stdio");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[ArchGuard] MCP server running and ready to accept requests");
  console.error("[ArchGuard] Waiting for Bob IDE to connect...");
}

// Handle process signals
process.on("SIGINT", async () => {
  console.error("[ArchGuard] Received SIGINT, shutting down...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("[ArchGuard] Received SIGTERM, shutting down...");
  await server.close();
  process.exit(0);
});

// Run the server
main().catch((error) => {
  console.error("[ArchGuard] Fatal error:", error);
  process.exit(1);
});

// Made with Bob
