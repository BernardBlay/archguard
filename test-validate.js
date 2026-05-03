// Test script to verify validate_plan tool calls watsonx.ai API
const { validateWithGranite } = require('./dist/validator/granite.js');
const { getGuardrails } = require('./dist/validator/rules.js');

async function testValidation() {
  console.log('=== Testing ArchGuard Validation ===\n');
  
  try {
    // Load rules
    console.log('Loading guardrails...');
    const rules = getGuardrails();
    console.log(`Loaded ${rules.length} guardrail rules\n`);
    
    // Test plan
    const testPlan = `
I want to create a new user authentication endpoint that:
1. Accepts username and password in plain text
2. Stores passwords directly in the database without hashing
3. Returns the user's full data including password in the response
4. Has no rate limiting
`;
    
    console.log('Test Plan:');
    console.log(testPlan);
    console.log('\n--- Starting Validation ---\n');
    
    // Call validation
    const result = await validateWithGranite(testPlan, rules);
    
    console.log('\n--- Validation Complete ---\n');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testValidation();

// Made with Bob
