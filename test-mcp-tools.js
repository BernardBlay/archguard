#!/usr/bin/env node

/**
 * Simple test script to verify MCP tools work correctly
 * This simulates what Bob IDE would do when calling the tools
 */

const { spawn } = require('child_process');
const path = require('path');

// Start the MCP server
const mcpServer = spawn('node', [path.join(__dirname, 'dist/mcp/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';

mcpServer.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Try to parse complete JSON-RPC messages
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop(); // Keep incomplete line in buffer
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        console.log('\n📨 Received from MCP server:');
        console.log(JSON.stringify(message, null, 2));
      } catch (e) {
        console.log('Raw output:', line);
      }
    }
  });
});

mcpServer.stderr.on('data', (data) => {
  console.error('❌ Error:', data.toString());
});

mcpServer.on('close', (code) => {
  console.log(`\n✅ MCP server exited with code ${code}`);
  process.exit(code);
});

// Helper to send JSON-RPC request
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };
  
  console.log('\n📤 Sending request:');
  console.log(JSON.stringify(request, null, 2));
  
  mcpServer.stdin.write(JSON.stringify(request) + '\n');
}

// Wait a bit for server to initialize
setTimeout(() => {
  console.log('\n🧪 Starting MCP Tools Test Suite\n');
  console.log('=' .repeat(60));
  
  // Test 1: Initialize connection
  console.log('\n📋 Test 1: Initialize MCP connection');
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });
  
  // Test 2: List available tools
  setTimeout(() => {
    console.log('\n📋 Test 2: List available tools');
    sendRequest('tools/list');
  }, 1000);
  
  // Test 3: Call create_bob_rules tool
  setTimeout(() => {
    console.log('\n📋 Test 3: Call create_bob_rules tool');
    sendRequest('tools/call', {
      name: 'create_bob_rules',
      arguments: {
        mode: 'test-mode',
        project_context: 'This is a test context for automated testing'
      }
    });
  }, 2000);
  
  // Test 4: Call validate_plan tool with compliant plan
  setTimeout(() => {
    console.log('\n📋 Test 4: Call validate_plan with compliant plan');
    sendRequest('tools/call', {
      name: 'validate_plan',
      arguments: {
        plan: `
          Create a new user service:
          1. Add UserService class in services/
          2. Implement methods that call UserRepository
          3. Add proper error handling
          4. Include authentication checks
        `
      }
    });
  }, 3000);
  
  // Test 5: Call validate_plan tool with violations
  setTimeout(() => {
    console.log('\n📋 Test 5: Call validate_plan with violations');
    sendRequest('tools/call', {
      name: 'validate_plan',
      arguments: {
        plan: `
          Create user registration:
          1. Add route directly in UI component
          2. Write SQL query directly: INSERT INTO users...
          3. Store password in plain text
          4. No authentication required
        `
      }
    });
  }, 4000);
  
  // Close after all tests
  setTimeout(() => {
    console.log('\n\n' + '='.repeat(60));
    console.log('🎉 All tests completed!');
    console.log('=' .repeat(60));
    mcpServer.kill();
  }, 10000);
  
}, 500);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  mcpServer.kill();
  process.exit(0);
});

// Made with Bob
