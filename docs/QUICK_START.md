# Secure Planner - Quick Start

## 🚀 5-Minute Setup

### 1. Configure Credentials
```bash
# Copy example and edit
cp .env.example .env

# Add your watsonx.ai credentials
WATSONX_API_KEY=your_key_here
WATSONX_PROJECT_ID=your_project_id_here
```

### 2. Build & Verify
```bash
npm install
npm run build
```

### 3. Update Bob MCP Config
Edit `.bob/mcp.json` - ensure the path matches your project location:
```json
"args": ["C:/Users/Thinkpad X270/OneDrive/Desktop/archguard/dist/mcp/index.js"]
```

### 4. Restart Bob IDE
Close and reopen Bob IDE to load the MCP server.

### 5. Switch to Secure Planner Mode
Select "Secure Planner" from Bob's mode selector.

## ✅ Test It Works

Try this simple request:
```
"Create a new GET endpoint at /api/health that returns server status"
```

Bob should:
1. Create a plan
2. Automatically validate it with `validate_plan` tool
3. Show validation results

## 📊 Optional: Start Dashboard
```bash
npm run dashboard
# Open http://localhost:3001
```

## 🎯 What Secure Planner Does

### ✅ Validates Plans Against Rules
- Layered architecture (Routes → Services → DB)
- Authentication requirements
- Payment API isolation
- No business logic in routes

### ❌ Blocks Bad Patterns
- Direct database access from routes
- Missing authentication
- Mixed payment provider logic
- Hardcoded credentials

## 🔍 Example Validation

### Good Plan ✅
```
User: "Add user profile endpoint"

Plan:
1. Create GET /api/users/:id route
2. Add auth middleware
3. Create UserService.getProfile()
4. Return user data

Result: APPROVED ✅
```

### Bad Plan ❌
```
User: "Add payment endpoint"

Plan:
1. Create POST /api/payments route
2. Process payment in route handler
3. Access database directly

Result: REJECTED ❌
Violations:
- [CRITICAL] direct-db-access
- [HIGH] no-business-logic-in-routes
```

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Tool not found | `npm run build` + restart Bob |
| Missing credentials | Check `.env` file |
| Wrong path | Update `.bob/mcp.json` |
| No violations detected | Check `config/.bobrules.json` |

## 📚 Full Documentation
See [`SECURE_PLANNER_GUIDE.md`](./SECURE_PLANNER_GUIDE.md) for complete details.

## 🎓 Learning Path

1. ✅ Complete setup above
2. ✅ Try validating a simple plan
3. ✅ Intentionally violate a rule to see rejection
4. ✅ Fix the violation and validate again
5. ✅ Review `config/.bobrules.json` to understand rules
6. ✅ Start dashboard to monitor validations

---

**Ready to build secure, well-architected code with Bob!** 🚀