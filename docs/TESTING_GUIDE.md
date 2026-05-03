# ArchGuard Testing Guide

This guide provides comprehensive testing procedures for ArchGuard's in-IDE validation features.

## Prerequisites

1. **MCP Server Running**: `npm run dev` in ArchGuard directory
2. **Bob IDE Configured**: MCP server added to Bob IDE settings
3. **Environment Variables Set**: WATSONX_API_KEY and WATSONX_PROJECT_ID in `.env`
4. **Project with .bobrules.json**: Either use ArchGuard's own config or create one

## Test Suite

### Test 1: Verify MCP Server is Running

**Objective**: Confirm the MCP server starts without errors

**Steps**:
1. Open terminal in ArchGuard directory
2. Run: `npm run dev`
3. Verify output shows: "MCP server started successfully" or similar

**Expected Result**: Server starts without errors, listens for MCP connections

**Status**: ✅ PASSED (build successful)

---

### Test 2: List Available MCP Tools

**Objective**: Verify both tools are registered

**Steps**:
1. In Bob IDE, check available MCP tools
2. Look for "archguard" server
3. Verify tools listed:
   - `validate_plan`
   - `create_bob_rules`

**Expected Result**: Both tools appear in MCP tools list

**How to Verify**: Bob IDE should show these tools when you type `use_mcp_tool("archguard", ...)`

---

### Test 3: Create Bob Rules for Code Mode

**Objective**: Test automatic `.bob/rules` generation

**Steps**:
1. In Bob IDE (any mode), run:
```typescript
use_mcp_tool("archguard", "create_bob_rules", {
  mode: "code"
})
```

**Expected Result**:
- Success message appears in chat
- File created at `.bob/rules-code/AGENTS.md`
- File contains all guardrails from `.bobrules.json`
- Guardrails categorized by severity (Critical, High, Medium, Low)

**Verification**:
```bash
# Check file exists
ls .bob/rules-code/AGENTS.md

# View content
cat .bob/rules-code/AGENTS.md
```

---

### Test 4: Create Bob Rules for Multiple Modes

**Objective**: Verify tool works for different modes

**Steps**:
1. Generate rules for plan mode:
```typescript
use_mcp_tool("archguard", "create_bob_rules", {
  mode: "plan"
})
```

2. Generate rules for ask mode:
```typescript
use_mcp_tool("archguard", "create_bob_rules", {
  mode: "ask"
})
```

3. Generate rules for advanced mode:
```typescript
use_mcp_tool("archguard", "create_bob_rules", {
  mode: "advanced"
})
```

**Expected Result**:
- Each command creates corresponding `.bob/rules-{mode}/AGENTS.md`
- All files contain same guardrails but with mode-specific context
- Success messages appear in chat for each

**Verification**:
```bash
ls .bob/rules-plan/AGENTS.md
ls .bob/rules-ask/AGENTS.md
ls .bob/rules-advanced/AGENTS.md
```

---

### Test 5: Validate a Compliant Plan

**Objective**: Test validation with a plan that passes all rules

**Steps**:
1. In Bob IDE (any mode), run:
```typescript
use_mcp_tool("archguard", "validate_plan", {
  plan: `
    Create a new user service layer:
    1. Add UserService class in services/user.service.ts
    2. Implement getUserById() method that calls UserRepository
    3. Add proper error handling with try-catch
    4. Include authentication checks before data access
    5. Return typed User objects
  `
})
```

**Expected Result**:
```markdown
✅ **ARCHITECTURAL VALIDATION PASSED**

All architectural guardrails passed. No violations detected.

You may proceed with implementation.

<details>
<summary>📊 Raw Validation Data (JSON)</summary>
...
</details>
```

**Verification Points**:
- ✅ Green checkmark emoji appears
- ✅ "PASSED" status clearly visible
- ✅ Encouragement to proceed
- ✅ Collapsible JSON section present
- ✅ No violations listed

---

### Test 6: Validate a Plan with Critical Violations

**Objective**: Test validation with critical architectural violations

**Steps**:
1. In Bob IDE, run:
```typescript
use_mcp_tool("archguard", "validate_plan", {
  plan: `
    Create a new user registration endpoint:
    1. Add POST /api/users/register route directly in the UI component
    2. Write SQL query directly in the route handler: INSERT INTO users...
    3. Store password in plain text in database
    4. No authentication required for this endpoint
  `
})
```

**Expected Result**:
```markdown
🚫 **ARCHITECTURAL VALIDATION FAILED**

**Summary:** Found X violation(s). Critical: Y, High: Z

## 🔴 CRITICAL VIOLATIONS (Must Fix)

### 1. Direct Database Access
**Rule ID:** `no-direct-db-access`
**Issue:** The plan proposes direct SQL queries in the route handler...

### 2. Insecure Password Storage
**Rule ID:** `secure-password-storage`
**Issue:** Passwords must be hashed before storage...

## 🟠 HIGH SEVERITY VIOLATIONS (Should Fix)

### 1. Missing Authentication
**Rule ID:** `require-auth-middleware`
**Issue:** All routes must include authentication middleware...

---

## 📋 Next Steps

⚠️ **CRITICAL violations must be resolved before proceeding.**

Please revise your plan to address the critical issues above...
```

**Verification Points**:
- 🚫 Red X emoji appears
- 🔴 Critical violations section present
- 🟠 High severity violations section present
- ⚠️ Clear warning about blocking issues
- 📋 Next steps guidance provided
- Collapsible JSON section present

---

### Test 7: Validate a Plan with Mixed Severity Violations

**Objective**: Test validation with multiple severity levels

**Steps**:
1. In Bob IDE, run:
```typescript
use_mcp_tool("archguard", "validate_plan", {
  plan: `
    Update user profile endpoint:
    1. Add PATCH /api/users/:id route
    2. Access database through UserRepository (good!)
    3. Skip input validation for performance
    4. Use console.log for debugging
    5. No rate limiting on this endpoint
  `
})
```

**Expected Result**:
- Mix of severity levels displayed
- 🟡 Medium severity violations
- 🔵 Low severity violations
- Clear categorization by emoji and headers
- Appropriate "Next Steps" guidance

**Verification Points**:
- All severity levels properly categorized
- Emojis match severity (🔴🟠🟡🔵)
- Each violation has Rule ID and explanation
- Guidance reflects highest severity present

---

### Test 8: Test Error Handling - Missing .bobrules.json

**Objective**: Verify graceful error handling

**Steps**:
1. Temporarily rename `.bobrules.json` to `.bobrules.json.bak`
2. Run validation:
```typescript
use_mcp_tool("archguard", "validate_plan", {
  plan: "Test plan"
})
```

**Expected Result**:
```markdown
🚫 **ARCHITECTURAL VALIDATION FAILED**

**Summary:** Validation failed: Configuration file not found...

## 🔴 CRITICAL VIOLATIONS (Must Fix)

### 1. System Error
**Rule ID:** `system-error`
**Issue:** Validation failed: Configuration file not found in project directory...
```

**Verification Points**:
- Error displayed as critical violation
- Clear explanation of what went wrong
- Helpful troubleshooting guidance
- No server crash

**Cleanup**: Rename `.bobrules.json.bak` back to `.bobrules.json`

---

### Test 9: Test Error Handling - Invalid watsonx.ai Credentials

**Objective**: Verify API error handling

**Steps**:
1. Temporarily set invalid WATSONX_API_KEY in `.env`
2. Run validation with any plan
3. Observe error message

**Expected Result**:
- Error displayed as system error
- Mentions credential/API issues
- Suggests checking environment variables
- No server crash

**Cleanup**: Restore correct WATSONX_API_KEY

---

### Test 10: Test create_bob_rules with Project Context

**Objective**: Verify custom project context is included

**Steps**:
1. Run:
```typescript
use_mcp_tool("archguard", "create_bob_rules", {
  mode: "test-mode",
  project_context: `
    WoRide Project Specifics:
    - Ghana ride-hailing service
    - Mobile Money integration (MTN, Vodafone, AirtelTigo)
    - USSD and mobile app interfaces
    - Real-time driver tracking
  `
})
```

**Expected Result**:
- File created at `.bob/rules-test-mode/AGENTS.md`
- Project context section present in file
- Custom context appears after guardrails
- Success message in chat

**Verification**:
```bash
cat .bob/rules-test-mode/AGENTS.md | grep -A 10 "Project-Specific Context"
```

---

### Test 11: Test Markdown Formatting in Chat

**Objective**: Verify markdown renders correctly in Bob IDE

**Steps**:
1. Run any validation (passing or failing)
2. Observe the chat output

**Expected Result**:
- Headers render as headers (##, ###)
- Bold text (**text**) renders bold
- Code blocks (`) render as code
- Emojis display correctly (✅🚫🔴🟠🟡🔵)
- Collapsible `<details>` section works
- Lists render properly

**Verification Points**:
- Visual hierarchy clear
- Colors/emojis enhance readability
- No raw markdown visible
- Professional appearance

---

### Test 12: Test Validation in Different Bob Modes

**Objective**: Verify validation works across all modes

**Steps**:
1. Switch to **Code mode** in Bob IDE
2. Run validation with any plan
3. Switch to **Plan mode**
4. Run validation with any plan
5. Switch to **Ask mode**
6. Run validation with any plan
7. Switch to **Advanced mode**
8. Run validation with any plan

**Expected Result**:
- Validation works in ALL modes
- Results appear in chat regardless of mode
- Formatting consistent across modes
- No mode-specific errors

---

### Test 13: Test Rapid Successive Validations

**Objective**: Verify server handles multiple requests

**Steps**:
1. Run 5 validations in quick succession:
```typescript
// Validation 1
use_mcp_tool("archguard", "validate_plan", { plan: "Test 1" })

// Validation 2
use_mcp_tool("archguard", "validate_plan", { plan: "Test 2" })

// ... etc
```

**Expected Result**:
- All validations complete successfully
- No timeouts or errors
- Results appear in order
- Server remains stable

---

### Test 14: Test Large Plan Validation

**Objective**: Verify handling of lengthy plans

**Steps**:
1. Create a plan with 50+ lines describing complex architecture
2. Run validation
3. Observe response time and accuracy

**Expected Result**:
- Validation completes (may take longer)
- All violations detected
- Response properly formatted
- No truncation of results

---

### Test 15: Integration Test - Full Workflow

**Objective**: Test complete end-to-end workflow

**Steps**:
1. Generate rules: `create_bob_rules({ mode: "code" })`
2. Switch to code mode in Bob IDE
3. Plan a feature with violations
4. Observe validation failure in chat
5. Revise plan to fix violations
6. Validate again
7. Observe validation success
8. Proceed with implementation

**Expected Result**:
- Seamless workflow from start to finish
- Clear feedback at each step
- No need to leave Bob IDE
- Iterative improvement works smoothly

---

## Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | MCP Server Running | ✅ PASSED | Build successful |
| 2 | List MCP Tools | ⏳ PENDING | Requires Bob IDE |
| 3 | Create Bob Rules (Code) | ⏳ PENDING | Requires Bob IDE |
| 4 | Create Bob Rules (Multiple) | ⏳ PENDING | Requires Bob IDE |
| 5 | Validate Compliant Plan | ⏳ PENDING | Requires watsonx.ai |
| 6 | Validate Critical Violations | ⏳ PENDING | Requires watsonx.ai |
| 7 | Validate Mixed Violations | ⏳ PENDING | Requires watsonx.ai |
| 8 | Error: Missing Config | ⏳ PENDING | Can test locally |
| 9 | Error: Invalid Credentials | ⏳ PENDING | Can test locally |
| 10 | Project Context | ⏳ PENDING | Requires Bob IDE |
| 11 | Markdown Formatting | ⏳ PENDING | Requires Bob IDE |
| 12 | Multiple Modes | ⏳ PENDING | Requires Bob IDE |
| 13 | Rapid Validations | ⏳ PENDING | Requires Bob IDE |
| 14 | Large Plan | ⏳ PENDING | Requires watsonx.ai |
| 15 | Full Workflow | ⏳ PENDING | Requires Bob IDE |

## Next Steps for Testing

### Immediate Tests (Can Do Now)
1. ✅ Verify build compiles (DONE)
2. ✅ Check MCP server starts (DONE)
3. Test error handling with missing config
4. Test error handling with invalid credentials

### Tests Requiring Bob IDE
1. List available MCP tools
2. Create Bob rules for various modes
3. Validate plans and observe chat output
4. Test markdown rendering
5. Test across different modes

### Tests Requiring watsonx.ai
1. Validate compliant plans
2. Validate plans with violations
3. Test large plan validation
4. Verify AI-powered rule checking

## Manual Testing Checklist

- [ ] MCP server starts without errors
- [ ] Both tools (`validate_plan`, `create_bob_rules`) are registered
- [ ] `create_bob_rules` creates files in correct locations
- [ ] Generated AGENTS.md files contain all guardrails
- [ ] Validation results appear in Bob IDE chat
- [ ] Markdown formatting renders correctly
- [ ] Emojis display properly (✅🚫🔴🟠🟡🔵)
- [ ] Severity categorization works (Critical → Low)
- [ ] Collapsible JSON section works
- [ ] Error messages are clear and helpful
- [ ] Works in all Bob modes (code, plan, ask, advanced)
- [ ] No terminal/dashboard needed for validation
- [ ] Iterative validation workflow is smooth

## Automated Testing (Future Enhancement)

Consider adding:
- Unit tests for `formatValidationForIDE()`
- Unit tests for `generateAgentsMarkdown()`
- Integration tests with mock watsonx.ai responses
- End-to-end tests with Bob IDE automation

## Troubleshooting Common Issues

### Issue: MCP tools not appearing in Bob IDE
**Solution**: Restart Bob IDE after adding MCP server configuration

### Issue: Validation returns system error
**Solution**: Check `.env` file has valid WATSONX_API_KEY and WATSONX_PROJECT_ID

### Issue: .bob/rules files not created
**Solution**: Check file permissions, ensure .bob directory is writable

### Issue: Markdown not rendering in chat
**Solution**: Verify Bob IDE supports markdown rendering in chat

## Success Criteria

✅ All tests pass
✅ No errors during normal operation
✅ Clear, actionable feedback in all scenarios
✅ Works seamlessly across all Bob modes
✅ No need to leave Bob IDE for validation
✅ Dashboard is truly optional

---

**Ready to test?** Start with the immediate tests, then move to Bob IDE integration tests!