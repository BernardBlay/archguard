import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Store validation events for SSE
interface ValidationEvent {
  timestamp: string;
  plan: string;
  result: {
    isValid: boolean;
    violations: Array<{
      ruleId: string;
      ruleName: string;
      severity: string;
      explanation: string;
    }>;
    summary: string;
  };
}

const validationEvents: ValidationEvent[] = [];

// Serve static HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to get validation history
app.get('/api/validations', (req, res) => {
  res.json(validationEvents);
});

// API endpoint to receive validation events (for future integration)
app.post('/api/validations', (req, res) => {
  const event: ValidationEvent = {
    timestamp: new Date().toISOString(),
    plan: req.body.plan || '',
    result: req.body.result || { isValid: true, violations: [], summary: '' }
  };
  
  validationEvents.push(event);
  
  // Keep only last 100 events
  if (validationEvents.length > 100) {
    validationEvents.shift();
  }
  
  res.json({ success: true, event });
});

// SSE endpoint for real-time updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Dashboard connected' })}\n\n`);
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`:keepalive\n\n`);
  }, 30000);
  
  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`[Dashboard] Server running on http://localhost:${PORT}`);
  console.log(`[Dashboard] Open http://localhost:${PORT} in your browser`);
});

// Made with Bob
