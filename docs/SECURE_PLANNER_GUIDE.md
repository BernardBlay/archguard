# Secure Planner Mode - User Guide

## Overview
The **Secure Planner** mode is ArchGuard's primary interface for validating architectural plans before any code is written. It intercepts Bob's planning phase and validates against your project's architectural guardrails using IBM Granite-3-8b.

## How It Works

### 1. Architecture Flow
```
User Request → Bob (Secure Planner Mode) → validate_plan MCP Tool → 
Granite-3-8b AI → Validation Result → Bob → User
```

### 2. Key Components
- **MCP Server**: Exposes `validate_plan` tool via stdio transport
- **Granite-3-8b**: IBM's AI model validates plans against `.bobrules.json`
- **Dashboard**: Real-time monitoring (optional, runs separately)

## Setup Instructions

### Prerequisites
1. IBM watsonx.ai credentials (API key + Project ID)
2. Bob IDE with MCP support
3. Node.js 18+ installed

### Step 1: Configure Environment
Create `.env` file with your watsonx.ai credentials:
```bash
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here
WATSONX_ENDPOINT=https://us-south.ml.cloud.ibm.com
PORT=3001
```

### Step 2: Build the MCP Server
```bash
npm install
npm run build
```

### Step 3: Configure Bob IDE
The MCP server is already configured in `.bob/mcp.json`:
```json
{
  "mcpServers": {
    "archguard": {
      "command": "node",
      "args": ["C:/Users/Thinkpad X270/OneDrive/Desktop/archguard/dist/mcp/index.js"],
      "env": {
        "WATSONX_API_KEY": "",
        "WATSONX_PROJECT_ID": "",
        "WATSONX_ENDPOINT": "https://us-south.ml.cloud.ibm.com",
        "PORT": "3001"
      }
    }
  }
}
```

**Important**: Update the environment variables in `.bob/mcp.json` with your actual credentials, or Bob will read from your `.env` file.

### Step 4: Restart Bob IDE
After configuring the MCP server, restart Bob IDE to load the ArchGuard MCP server.

### Step 5: Switch to Secure Planner Mode
In Bob IDE, switch to the **Secure Planner** mode. You should see it in the mode selector.

## Using Secure Planner Mode

### Basic Workflow

1. **Describe Your Plan**: Tell Bob what you want to build
   ```
   "I need to add a new payment endpoint for MTN Mobile Money"
   ```

2. **Bob Creates a Plan**: Bob will analyze your request and create a detailed plan

3. **Automatic Validation**: Bob will automatically call the `validate_plan` MCP tool

4. **Review Results**: You'll receive one of two outcomes:
   - ✅ **Approved**: No violations found, proceed to implementation
   - ❌ **Rejected**: Violations found with explanations and suggestions

### Example: Valid Plan
```
User: "Add a new user profile endpoint"

Bob's Plan:
1. Create GET /api/users/:id route
2. Add authentication middleware
3. Create UserService.getProfile() method
4. Query database through service layer
5. Return user data

Validation Result: ✅ APPROVED
- Follows layered architecture
- Uses authentication middleware
- Service layer properly isolates database access
```

### Example: Invalid Plan (Violations Found)
```
User: "Add a payment processing endpoint"

Bob's Plan:
1. Create POST /api/payments route
2. Process payment directly in route handler
3. Connect to database from route
4. Call MTN API directly

Validation Result: ❌ REJECTED

Violations:
1. [CRITICAL] direct-db-access
   - Routes must not access database directly
   - Use service layer instead

2. [HIGH] no-business-logic-in-routes
   - Payment processing logic belongs in PaymentService
   - Routes should only handle HTTP concerns

3. [HIGH] payment-api-isolation
   - MTN payment logic must be in separate MTNPaymentService
   - Maintains provider isolation

Suggestions:
- Create PaymentService.processPayment()
- Create MTNPaymentService.charge()
- Route should only validate input and call service
```

## Understanding Validation Results

### Result Structure
```json
{
  "isValid": false,
  "violations": [
    {
      "ruleId": "direct-db-access",
      "ruleName": "No Direct Database Access from Routes",
      "severity": "critical",
      "explanation": "Routes must not access database directly. Use service layer instead."
    }
  ],
  "summary": "Found 3 violation(s). Critical: 1, High: 2"
}
```

### Severity Levels
- **Critical**: Must fix before proceeding (security, data integrity)
- **High**: Should fix before proceeding (architecture violations)
- **Medium**: Recommended to fix (code quality)
- **Low**: Nice to fix (style, conventions)

## Architectural Guardrails

The guardrails are defined in `config/.bobrules.json`. Key rules include:

### Layered Architecture
- Routes → Services → Database
- No layer skipping allowed
- Each layer has specific responsibilities

### Security
- All routes require authentication middleware
- No hardcoded credentials
- Input validation required

### Payment API Isolation
- Each payment provider (MTN, Vodafone, AirtelTigo) in separate service
- No mixing of provider logic
- Consistent interface across providers

### Code Organization
- No business logic in routes
- Services handle business logic
- Database access only through services

## Monitoring with Dashboard

### Start the Dashboard
```bash
npm run dashboard
```

### Access Dashboard
Open `http://localhost:3001` in your browser

### Dashboard Features
- Real-time validation events
- Violation statistics
- Rule violation breakdown
- Historical validation log

## Troubleshooting

### MCP Tool Not Found
**Problem**: `Tool 'validate_plan' does not exist on server 'archguard'`

**Solutions**:
1. Rebuild the project: `npm run build`
2. Check `.bob/mcp.json` path is correct
3. Restart Bob IDE
4. Verify MCP server is configured in Bob settings

### Validation Fails with System Error
**Problem**: `Validation failed: Missing required environment variables`

**Solutions**:
1. Check `.env` file exists with correct credentials
2. Verify `WATSONX_API_KEY` and `WATSONX_PROJECT_ID` are set
3. Test credentials with: `npm run test-credentials` (if available)

### No Violations Detected (But Should Be)
**Problem**: Plan violates rules but validation passes

**Solutions**:
1. Check `config/.bobrules.json` is properly formatted
2. Verify rule descriptions are clear and specific
3. Review Granite-3-8b prompt in `src/validator/granite.ts`
4. Consider adding more context to rule descriptions

## Best Practices

### 1. Write Clear Plans
- Be specific about what you want to build
- Mention relevant architectural concerns
- Reference existing patterns when applicable

### 2. Iterate on Violations
- Don't ignore violations
- Understand why the rule exists
- Revise plan to address root cause

### 3. Keep Rules Updated
- Review `.bobrules.json` regularly
- Add new rules as patterns emerge
- Update rule descriptions for clarity

### 4. Use Dashboard for Insights
- Monitor common violations
- Identify patterns in rejected plans
- Refine rules based on data

## Advanced Usage

### Custom Guardrails
Edit `config/.bobrules.json` to add project-specific rules:

```json
{
  "id": "custom-rule",
  "name": "Your Rule Name",
  "description": "Clear description of what's not allowed and why",
  "severity": "high"
}
```

### Terminology Mapping
Help Granite understand your domain language:

```json
{
  "terminology_map": {
    "payment": ["MTN", "Vodafone", "AirtelTigo", "mobile money"],
    "ride": ["trip", "journey", "booking"]
  }
}
```

## FAQ

**Q: Can I skip validation for urgent fixes?**
A: No. Secure Planner mode always validates. Switch to Code mode if you need to bypass (not recommended).

**Q: How long does validation take?**
A: Typically 2-5 seconds depending on plan complexity and Granite-3-8b response time.

**Q: Can I validate multiple plans at once?**
A: No. Each plan is validated independently. This ensures focused, accurate validation.

**Q: What if Granite-3-8b is down?**
A: Validation will fail with a system error. You can switch to Code mode temporarily, but violations won't be caught.

**Q: Can I use a different AI model?**
A: Currently only Granite-3-8b is supported. It's optimized for IBM watsonx.ai integration.

## Support

For issues or questions:
1. Check this guide first
2. Review `AGENTS.md` for technical details
3. Check Bob IDE logs for MCP errors
4. Review dashboard for validation patterns

## Next Steps

1. ✅ Configure your `.env` file
2. ✅ Build the project: `npm run build`
3. ✅ Restart Bob IDE
4. ✅ Switch to Secure Planner mode
5. ✅ Try validating a simple plan
6. ✅ Review results and iterate

---

**Built for IBM Bob Dev Day Hackathon 2026**
**Team**: Bernard Blay, Vanessa Koranteng