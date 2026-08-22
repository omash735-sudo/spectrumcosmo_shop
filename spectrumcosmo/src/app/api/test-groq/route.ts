// /app/api/test-groq/route.ts
import { NextResponse } from 'next/server';

interface TestResult {
  status: string;
  response?: string;
  error?: string;
  duration?: string;  // ✅ Added this property
}

interface ResultsMap {
  [key: string]: TestResult;
}

export async function GET() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });
  }

  // ✅ Test ONLY currently supported models from Groq documentation
  const modelsToTest = [
    'openai/gpt-oss-20b',        // Production model - Fast, cheap
    'openai/gpt-oss-120b',       // Production model - Higher quality
    'llama-3.3-70b-versatile',   // Production model - Llama 3.3
    'groq/compound',             // Production system - Agentic
    'groq/compound-mini',        // Production system - Lighter agentic
  ];

  const results: ResultsMap = {};

  for (const model of modelsToTest) {
    try {
      console.log(`[Test] Testing model: ${model}`);
      
      const startTime = Date.now();
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Say "working" in one word' }],
          max_tokens: 10,
          temperature: 0.1, // Lower temperature for consistent test
        }),
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        results[model] = {
          status: 'WORKING',
          response: data.choices?.[0]?.message?.content || 'No response',
          duration: `${duration}ms`
        };
      } else {
        const errorText = await response.text();
        let errorMessage = errorText;
        
        // Try to parse JSON error
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch {
          // Keep raw error text
        }
        
        results[model] = {
          status: 'FAILED',
          error: errorMessage.substring(0, 200)
        };
      }
    } catch (error) {
      results[model] = {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Add summary
  const workingModels = Object.keys(results).filter(
    key => results[key].status === 'WORKING'
  );
  
  const summary = {
    total_tested: modelsToTest.length,
    working: workingModels.length,
    working_models: workingModels,
    recommended: workingModels.length > 0 ? workingModels[0] : 'None found'
  };

  return NextResponse.json({
    summary,
    details: results
  });
}
