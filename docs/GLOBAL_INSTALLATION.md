# Global Installation Guide

This guide explains how to configure ArchGuard to work globally across multiple projects in Bob IDE.

## Installation

### Step 1: Clone and Build ArchGuard

```bash
# Clone the repository
git clone https://github.com/yourusername/archguard.git
cd archguard

# Install dependencies and build
npm install
npm run build
```

### Step 2: Configure Bob IDE Global MCP

In Bob IDE:
1. Go to **Settings → MCP → Global MCPs → Open**
2. This opens the global MCP configuration file
3. Add ArchGuard configuration:

```json
{
  "mcpServers": {
    "archguard": {
      "command": "node",
      "args": ["C:/path/to/archguard/dist/mcp/index.js"],
      "env": {
        "WATSONX_API_KEY": "your-api-key-here",
        "WATSONX_PROJECT_ID": "your-project-id-here",
        "WATSONX_ENDPOINT": "https://us-south.ml.cloud.ibm.com",
        "PORT": "3001"
      }
    }
  }
}
```

**Important:** Replace `C:/path/to/archguard` with the actual absolute path where you cloned ArchGuard.

### Step 3: Move secure-planner Mode to Global Scope

In Bob IDE:
1. Go to **Settings → Modes**
2. Find **secure-planner** mode
3. Click **Edit**
4. Change **Scope** from "Project" to **Global**
5. Click **Save**

Now the secure-planner mode will be available in all projects!

### Step 4: Get watsonx.ai Credentials

1. Go to [IBM Cloud](https://cloud.ibm.com)
2. Create or access a watsonx.ai project
3. Get your API key from IBM Cloud IAM
4. Get your project ID from watsonx.ai project settings
5. Update the MCP configuration with your credentials

## Setting Up a Project

### Step 1: Add .bobrules.json to Your Project

Navigate to your project directory and create a `.bobrules.json` file in the root:

```bash
cd /path/to/your/project
```

Copy the template from `archguard/templates/.bobrules.json` or create your own.

### Step 2: Customize Your Rules

Edit the `.bobrules.json` file to define your project's specific architectural guardrails:

```json
{
  "version": "1.0.0",
  "project": "My Awesome Project",
  "description": "Architectural guardrails for my project",
  "meta": {
    "philosophy": "Clean architecture with clear separation of concerns",
    "stack": "React, Node.js, PostgreSQL",
    "terminology_map": {
      "UI": ["components", "pages", "views"],
      "backend": ["api", "services", "controllers"],
      "database": ["models", "repositories"]
    }
  },
  "guardrails": [
    {
      "id": "no-direct-db-access",
      "name": "No Direct Database Access from UI",
      "description": "UI components must not directly access the database",
      "severity": "critical"
    }
  ]
}
```

### Step 3: Configure Bob IDE

Add ArchGuard to your Bob IDE MCP configuration. The location depends on your OS:

### Step 5: Use ArchGuard in Your Project

In Bob IDE:
1. Open the command palette (Ctrl/Cmd + Shift + P)
2. Type "Bob: Switch Mode"
3. Select "secure-planner" mode

## Usage

### Running the Dashboard (Optional)

To monitor validation results in real-time, start the dashboard:

```bash
cd /path/to/archguard
npm run dashboard
```

Then open http://localhost:3001 in your browser.

### Using with Bob IDE

Once configured globally, ArchGuard works automatically in any project:

1. Open any project in Bob IDE
2. Ensure the project has a `.bobrules.json` file
3. Switch to **secure-planner** mode
4. Give Bob a task
5. Bob creates a plan
6. ArchGuard intercepts and validates the plan against your project's rules
7. If violations are found, Bob receives feedback before executing
8. Bob adjusts the plan to comply with your rules

The MCP server starts automatically when Bob IDE connects to it.

## Configuration File Locations

ArchGuard searches for `.bobrules.json` in these locations (in order):

1. `<project-root>/.bobrules.json`
2. `<project-root>/.bob/.bobrules.json`
3. `<project-root>/config/.bobrules.json`

Place your configuration file in any of these locations.

## Environment Variables

ArchGuard requires these environment variables:

- `WATSONX_API_KEY` - Your IBM Cloud API key (required)
- `WATSONX_PROJECT_ID` - Your watsonx.ai project ID (required)
- `WATSONX_ENDPOINT` - watsonx.ai endpoint URL (optional, defaults to us-south)
- `PORT` - Dashboard server port (optional, defaults to 3001)

You can set these in:
1. Bob IDE MCP configuration (recommended for global use)
2. Project `.env` file (for project-specific overrides)
3. System environment variables

## Troubleshooting

### "Configuration file not found" Error

Make sure your project has a `.bobrules.json` file. Copy the template from `archguard/templates/.bobrules.json` to your project root.

### "Missing required environment variables" Error

Ensure your watsonx.ai credentials are set in the Bob IDE MCP configuration or environment variables.

### MCP Server Not Connecting

1. Check that Bob IDE is in "secure-planner" mode
2. Verify the MCP configuration path is correct
3. Restart Bob IDE after configuration changes
4. Check Bob IDE logs for connection errors

### Dashboard Not Loading

1. Ensure port 3001 is not in use by another application
2. Check firewall settings
3. Try a different port: `PORT=3002 archguard dashboard`

## Updating ArchGuard

```bash
cd /path/to/archguard
git pull
npm install
npm run build
```

After updating, restart Bob IDE to reload the MCP server.

## Multiple Projects

ArchGuard works seamlessly across multiple projects:

1. Each project has its own `.bobrules.json`
2. ArchGuard automatically detects the project you're working in
3. Rules are project-specific, not global
4. One global installation serves all projects

## Best Practices

1. **Version Control**: Commit `.bobrules.json` to your repository
2. **Team Alignment**: Ensure all team members use the same rules
3. **Start Simple**: Begin with a few critical rules, add more over time
4. **Document Rules**: Use clear descriptions in your guardrails
5. **Regular Updates**: Review and update rules as your architecture evolves

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/yourusername/archguard/issues
- Documentation: https://github.com/yourusername/archguard#readme