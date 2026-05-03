#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Import validator functions
import { getGuardrails, type GuardrailRule } from "../validator/rules";
import { validateWithGranite, type ValidationResult, type ValidationViolation } from "../validator/granite";
import * as fs from 'fs';
import * as path from 'path';

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

// Define the create_bob_rules tool
const CREATE_BOB_RULES_TOOL: Tool = {
  name: "create_bob_rules",
  description:
    "Automatically creates or updates .bob/rules-{mode}/AGENTS.md file with architectural guardrails and mode-specific guidance. This integrates validation rules directly into Bob IDE without requiring terminal access.",
  inputSchema: {
    type: "object",
    properties: {
      mode: {
        type: "string",
        description:
          "The Bob mode to create rules for (e.g., 'code', 'plan', 'ask', 'advanced', 'secure-planner')",
      },
      project_context: {
        type: "string",
        description:
          "Optional project-specific context to include in the rules file",
      },
    },
    required: ["mode"],
  },
};

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [VALIDATE_PLAN_TOOL, CREATE_BOB_RULES_TOOL],
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "create_bob_rules") {
    return handleCreateBobRules(args);
  }

  if (name !== "validate_plan") {
    throw new Error(`Unknown tool: ${name}`);
  }

  if (!args || typeof args.plan !== "string") {
    throw new Error("Invalid arguments: 'plan' parameter is required and must be a string");
  }

  const plan = args.plan as string;

  try {
    // Load architectural rules from config
    const rules = getGuardrails();

    // Validate plan using Granite-3-8b AI model
    const validationResult = await validateWithGranite(plan, rules);

    // Format result for in-IDE display
    const formattedResult = formatValidationForIDE(validationResult);

    // Return both human-readable and structured formats
    return {
      content: [
        {
          type: "text",
          text: formattedResult,
        },
      ],
    };
  } catch (error) {
    // Return error in structured format
    const errorResult: ValidationResult = {
      isValid: false,
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
      summary: error instanceof Error
        ? `Validation failed: ${error.message}`
        : "Unknown validation error occurred. Check watsonx.ai credentials and config/.bobrules.json",
    };

    const formattedError = formatValidationForIDE(errorResult);

    return {
      content: [
        {
          type: "text",
          text: formattedError,
        },
      ],
      isError: true,
    };
  }
});
/**
 * Handle create_bob_rules tool request
 * Creates or updates .bob/rules-{mode}/AGENTS.md with architectural guardrails
 */
async function handleCreateBobRules(args: any) {
  if (!args || typeof args.mode !== "string") {
    throw new Error("Invalid arguments: 'mode' parameter is required and must be a string");
  }

  const mode = args.mode as string;
  const projectContext = (args.project_context as string) || "";

  try {
    // Load guardrails from config
    const rules = getGuardrails();
    
    // Create .bob directory if it doesn't exist
    const bobDir = path.join(process.cwd(), '.bob');
    if (!fs.existsSync(bobDir)) {
      fs.mkdirSync(bobDir, { recursive: true });
    }

    // Create mode-specific rules directory
    const modeRulesDir = path.join(bobDir, `rules-${mode}`);
    if (!fs.existsSync(modeRulesDir)) {
      fs.mkdirSync(modeRulesDir, { recursive: true });
    }

    // Generate AGENTS.md content
    const agentsContent = generateAgentsMarkdown(mode, rules, projectContext);

    // Write AGENTS.md file
    const agentsPath = path.join(modeRulesDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, agentsContent, 'utf-8');

    // Return success message
    const successMessage = `✅ **Bob Rules Created Successfully**

**Location:** \`.bob/rules-${mode}/AGENTS.md\`

**What was created:**
- Mode-specific architectural guardrails for **${mode}** mode
- ${rules.length} guardrail rules integrated into Bob IDE
- Automatic validation triggers for this mode

**How it works:**
1. When you use **${mode}** mode in Bob IDE, these rules are automatically loaded
2. Bob will validate your plans against these guardrails BEFORE executing code
3. Violations appear directly in the chat - no terminal needed!

**Next steps:**
- Switch to **${mode}** mode in Bob IDE
- Start planning your changes
- Bob will automatically validate against these rules

**File created at:** \`${agentsPath}\``;

    return {
      content: [
        {
          type: "text",
          text: successMessage,
        },
      ],
    };
  } catch (error) {
    const errorMessage = `❌ **Failed to Create Bob Rules**

**Error:** ${error instanceof Error ? error.message : "Unknown error occurred"}

**Troubleshooting:**
- Ensure .bobrules.json exists in your project
- Check file permissions for .bob directory
- Verify the mode name is valid (e.g., 'code', 'plan', 'ask')`;

    return {
      content: [
        {
          type: "text",
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Generate AGENTS.md content with guardrails
 */
function generateAgentsMarkdown(mode: string, rules: GuardrailRule[], projectContext: string): string {
  const lines: string[] = [];
  
  lines.push("# AGENTS.md");
  lines.push("");
  lines.push("This file provides guidance to agents when working with code in this repository.");
  lines.push("");
  lines.push(`## ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode - Architectural Guardrails`);
  lines.push("");
  lines.push("**IMPORTANT:** All plans in this mode MUST be validated against the following architectural guardrails before execution.");
  lines.push("");
  
  // Group rules by severity
  const critical = rules.filter(r => r.severity === "critical");
  const high = rules.filter(r => r.severity === "high");
  const medium = rules.filter(r => r.severity === "medium");
  const low = rules.filter(r => r.severity === "low");
  
  if (critical.length > 0) {
    lines.push("### 🔴 CRITICAL Guardrails (Must Never Violate)");
    lines.push("");
    critical.forEach(rule => {
      lines.push(`#### ${rule.name}`);
      lines.push(`- **ID:** \`${rule.id}\``);
      lines.push(`- **Rule:** ${rule.description}`);
      lines.push("");
    });
  }
  
  if (high.length > 0) {
    lines.push("### 🟠 HIGH Priority Guardrails (Should Not Violate)");
    lines.push("");
    high.forEach(rule => {
      lines.push(`#### ${rule.name}`);
      lines.push(`- **ID:** \`${rule.id}\``);
      lines.push(`- **Rule:** ${rule.description}`);
      lines.push("");
    });
  }
  
  if (medium.length > 0) {
    lines.push("### 🟡 MEDIUM Priority Guardrails (Consider Carefully)");
    lines.push("");
    medium.forEach(rule => {
      lines.push(`#### ${rule.name}`);
      lines.push(`- **ID:** \`${rule.id}\``);
      lines.push(`- **Rule:** ${rule.description}`);
      lines.push("");
    });
  }
  
  if (low.length > 0) {
    lines.push("### 🔵 LOW Priority Guardrails (Best Practices)");
    lines.push("");
    low.forEach(rule => {
      lines.push(`#### ${rule.name}`);
      lines.push(`- **ID:** \`${rule.id}\``);
      lines.push(`- **Rule:** ${rule.description}`);
      lines.push("");
    });
  }
  
  // Add project context if provided
  if (projectContext) {
    lines.push("## Project-Specific Context");
    lines.push("");
    lines.push(projectContext);
    lines.push("");
  }
  
  // Add validation workflow
  lines.push("## Validation Workflow");
  lines.push("");
  lines.push("1. **Before Planning:** Review the guardrails above");
  lines.push("2. **During Planning:** Ensure your plan complies with all CRITICAL and HIGH priority rules");
  lines.push("3. **Automatic Validation:** Your plan will be automatically validated using the `validate_plan` MCP tool");
  lines.push("4. **In-IDE Feedback:** Validation results appear directly in Bob IDE chat - no terminal needed!");
  lines.push("5. **Iterate if Needed:** If violations are found, revise your plan and validate again");
  lines.push("");
  lines.push("## How Validation Works");
  lines.push("");
  lines.push("- **AI-Powered:** Uses IBM Granite-3-8b-instruct model for intelligent validation");
  lines.push("- **Real-Time:** Validation happens during planning phase, before code execution");
  lines.push("- **In-IDE Display:** Results show directly in Bob IDE chat with clear, actionable feedback");
  lines.push("- **Severity-Based:** Violations are categorized by severity (Critical → Low)");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*Generated by ArchGuard MCP Server*");
  
  return lines.join("\n");
}


/**
 * Format validation results for display directly in Bob IDE
 * Creates a visually clear, actionable report that appears in the chat
 */
function formatValidationForIDE(result: ValidationResult): string {
  const lines: string[] = [];
  
  // Header with status emoji
  if (result.isValid) {
    lines.push("✅ **ARCHITECTURAL VALIDATION PASSED**");
    lines.push("");
    lines.push(result.summary);
    lines.push("");
    lines.push("You may proceed with implementation.");
  } else {
    lines.push("🚫 **ARCHITECTURAL VALIDATION FAILED**");
    lines.push("");
    lines.push(`**Summary:** ${result.summary}`);
    lines.push("");
    
    // Group violations by severity
    const critical = result.violations.filter(v => v.severity === "critical");
    const high = result.violations.filter(v => v.severity === "high");
    const medium = result.violations.filter(v => v.severity === "medium");
    const low = result.violations.filter(v => v.severity === "low");
    
    // Critical violations (blocking)
    if (critical.length > 0) {
      lines.push("## 🔴 CRITICAL VIOLATIONS (Must Fix)");
      lines.push("");
      critical.forEach((v, i) => {
        lines.push(`### ${i + 1}. ${v.ruleName}`);
        lines.push(`**Rule ID:** \`${v.ruleId}\``);
        lines.push(`**Issue:** ${v.explanation}`);
        lines.push("");
      });
    }
    
    // High severity violations
    if (high.length > 0) {
      lines.push("## 🟠 HIGH SEVERITY VIOLATIONS (Should Fix)");
      lines.push("");
      high.forEach((v, i) => {
        lines.push(`### ${i + 1}. ${v.ruleName}`);
        lines.push(`**Rule ID:** \`${v.ruleId}\``);
        lines.push(`**Issue:** ${v.explanation}`);
        lines.push("");
      });
    }
    
    // Medium severity violations
    if (medium.length > 0) {
      lines.push("## 🟡 MEDIUM SEVERITY VIOLATIONS (Consider Fixing)");
      lines.push("");
      medium.forEach((v, i) => {
        lines.push(`### ${i + 1}. ${v.ruleName}`);
        lines.push(`**Rule ID:** \`${v.ruleId}\``);
        lines.push(`**Issue:** ${v.explanation}`);
        lines.push("");
      });
    }
    
    // Low severity violations
    if (low.length > 0) {
      lines.push("## 🔵 LOW SEVERITY VIOLATIONS (Optional)");
      lines.push("");
      low.forEach((v, i) => {
        lines.push(`### ${i + 1}. ${v.ruleName}`);
        lines.push(`**Rule ID:** \`${v.ruleId}\``);
        lines.push(`**Issue:** ${v.explanation}`);
        lines.push("");
      });
    }
    
    // Action items
    lines.push("---");
    lines.push("");
    lines.push("## 📋 Next Steps");
    lines.push("");
    if (critical.length > 0) {
      lines.push("⚠️ **CRITICAL violations must be resolved before proceeding.**");
      lines.push("");
      lines.push("Please revise your plan to address the critical issues above, then I'll validate again.");
    } else if (high.length > 0) {
      lines.push("⚠️ **HIGH severity violations should be addressed.**");
      lines.push("");
      lines.push("Consider revising your plan to fix these issues for better architectural compliance.");
    } else {
      lines.push("✓ No critical or high severity violations.");
      lines.push("");
      lines.push("You may proceed, but consider addressing medium/low severity issues if time permits.");
    }
  }
  
  // Add JSON for programmatic access (collapsed by default in most markdown renderers)
  lines.push("");
  lines.push("<details>");
  lines.push("<summary>📊 Raw Validation Data (JSON)</summary>");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(result, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("</details>");
  
  return lines.join("\n");
}

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Handle process signals
process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await server.close();
  process.exit(0);
});

// Run the server
main().catch(() => {
  process.exit(1);
});

// Made with Bob
