import * as dotenv from 'dotenv';
import { GuardrailRule } from './rules';

// Load environment variables
dotenv.config();

export interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
  summary: string;
}

export interface ValidationViolation {
  ruleId: string;
  ruleName: string;
  severity: string;
  explanation: string;
}

/**
 * Validate a code plan against architectural guardrails using IBM Granite-3-8b-instruct
 * @param plan - The code plan/description from Bob
 * @param rules - Array of guardrail rules to validate against
 * @returns Validation result with any violations found
 */
export async function validateWithGranite(
  plan: string,
  rules: GuardrailRule[]
): Promise<ValidationResult> {
  console.error('[ArchGuard] validateWithGranite called');
  console.error('[ArchGuard] Plan length:', plan.length, 'characters');
  console.error('[ArchGuard] Rules count:', rules.length);
  
  const apiKey = process.env.WATSONX_API_KEY;
  const projectId = process.env.WATSONX_PROJECT_ID;
  const endpoint = process.env.WATSONX_ENDPOINT || 'https://us-south.ml.cloud.ibm.com';

  console.error('[ArchGuard] Environment check:');
  console.error('  - API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  console.error('  - Project ID:', projectId ? `${projectId.substring(0, 10)}...` : 'MISSING');
  console.error('  - Endpoint:', endpoint);

  if (!apiKey || !projectId) {
    console.error('[ArchGuard] ERROR: Missing required environment variables');
    throw new Error('Missing required environment variables: WATSONX_API_KEY and WATSONX_PROJECT_ID');
  }

  // Construct the prompt for Granite-3-8b-instruct
  const prompt = buildValidationPrompt(plan, rules);
  console.error('[ArchGuard] Prompt built, length:', prompt.length, 'characters');

  try {
    // Get IBM Cloud IAM token
    console.error('[ArchGuard] Requesting IAM token from IBM Cloud...');
    const iamToken = await getIAMToken(apiKey);
    console.error('[ArchGuard] IAM token received:', iamToken ? `${iamToken.substring(0, 20)}...` : 'NONE');

    // Call watsonx.ai API
    const apiUrl = `${endpoint}/ml/v1/text/generation?version=2023-05-29`;
    console.error('[ArchGuard] Calling watsonx.ai API:', apiUrl);
    console.error('[ArchGuard] Model: ibm/granite-3-8b-instruct');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${iamToken}`
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.1,
          top_p: 0.95,
          repetition_penalty: 1.1
        },
        project_id: projectId
      })
    });

    console.error('[ArchGuard] API Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ArchGuard] API Error Response:', errorText);
      throw new Error(`watsonx.ai API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as {
      results?: Array<{ generated_text?: string }>;
    };
    console.error('[ArchGuard] API Response received');
    console.error('[ArchGuard] Results array length:', data.results?.length || 0);
    
    const generatedText = data.results?.[0]?.generated_text || '';
    console.error('[ArchGuard] Generated text length:', generatedText.length, 'characters');
    console.error('[ArchGuard] Generated text preview:', generatedText.substring(0, 200));

    // Parse the response to extract violations
    const validationResult = parseValidationResponse(generatedText, rules);
    console.error('[ArchGuard] Validation complete. Valid:', validationResult.isValid, 'Violations:', validationResult.violations.length);
    
    return validationResult;
  } catch (error) {
    console.error('[ArchGuard] ERROR in validateWithGranite:', error);
    console.error('[ArchGuard] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

/**
 * Get IBM Cloud IAM token using API key
 */
async function getIAMToken(apiKey: string): Promise<string> {
  console.error('[ArchGuard] getIAMToken: Requesting token from IBM Cloud IAM...');
  
  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`
  });

  console.error('[ArchGuard] getIAMToken: Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ArchGuard] getIAMToken: Error response:', errorText);
    throw new Error(`Failed to get IAM token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json() as { access_token: string };
  console.error('[ArchGuard] getIAMToken: Token received successfully');
  return data.access_token;
}

/**
 * Build the validation prompt for Granite-3-8b-instruct
 */
function buildValidationPrompt(plan: string, rules: GuardrailRule[]): string {
  const rulesText = rules.map(rule => 
    `- [${rule.severity.toUpperCase()}] ${rule.name} (ID: ${rule.id}): ${rule.description}`
  ).join('\n');

  return `You are an architectural validator for a software project. Analyze the following code plan and check if it violates any of the architectural guardrails.

ARCHITECTURAL GUARDRAILS:
${rulesText}

CODE PLAN TO VALIDATE:
${plan}

INSTRUCTIONS:
1. Carefully analyze the code plan against each guardrail
2. Identify any violations
3. For each violation, provide:
   - The rule ID that was violated
   - A clear explanation of how the plan violates the rule
4. If no violations are found, state "NO VIOLATIONS"

FORMAT YOUR RESPONSE AS:
VIOLATIONS:
[If violations found, list each as: RULE_ID: explanation]
[If no violations: NO VIOLATIONS]

RESPONSE:`;
}

/**
 * Parse the Granite model's response to extract violations
 */
function parseValidationResponse(response: string, rules: GuardrailRule[]): ValidationResult {
  const violations: ValidationViolation[] = [];
  
  console.error('[ArchGuard] parseValidationResponse: Parsing response...');
  console.error('[ArchGuard] Full response text:', response);
  
  // Parse violations from the response FIRST
  // Granite returns format: "- rule-id: explanation"
  const lines = response.split('\n');
  console.error('[ArchGuard] Parsing', lines.length, 'lines');
  
  for (const line of lines) {
    // Look for patterns like "- rule-id: explanation" or "- RULE_ID: explanation"
    const match = line.match(/^-\s*([a-z-]+):\s*(.+)$/i);
    if (match) {
      const ruleId = match[1].toLowerCase();
      const explanation = match[2].trim();
      
      console.error('[ArchGuard] Found potential violation:', ruleId);
      
      // Find the corresponding rule
      const rule = rules.find(r => r.id === ruleId);
      if (rule) {
        console.error('[ArchGuard] Matched rule:', rule.name, '(severity:', rule.severity + ')');
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          explanation
        });
      } else {
        console.error('[ArchGuard] No matching rule found for ID:', ruleId);
      }
    }
  }

  console.error('[ArchGuard] Total violations found:', violations.length);

  // Only check for "NO VIOLATIONS" if we didn't find any violations
  // This handles cases where Granite says "NO VIOLATIONS were found related to X"
  // but still lists violations for other rules
  if (violations.length === 0) {
    if (response.includes('NO VIOLATIONS') || response.includes('no violations')) {
      console.error('[ArchGuard] Response indicates NO VIOLATIONS and none were parsed');
      return {
        isValid: true,
        violations: [],
        summary: 'All architectural guardrails passed. No violations detected.'
      };
    }
  }

  const isValid = violations.length === 0;
  const summary = isValid
    ? 'All architectural guardrails passed.'
    : `Found ${violations.length} violation(s). Critical: ${violations.filter(v => v.severity === 'critical').length}, High: ${violations.filter(v => v.severity === 'high').length}`;

  return {
    isValid,
    violations,
    summary
  };
}

// Made with Bob
