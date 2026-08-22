// /app/api/test-groq/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });
  }

  // Test the most common working models
  const modelsToTest = [
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'llama3-70b-8192',
    'llama-3.1-70b-versatile'
  ];

  const results = {};

  for (const model of modelsToTest) {
    try {
      console.log(`[Test] Testing model: ${model}`);
      
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
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        results[model] = {
          status: '✅ WORKING',
          response: data.choices?.[0]?.message?.content || 'No response'
        };
      } else {
        const error = await response.text();
        results[model] = {
          status: '❌ FAILED',
          error: error.substring(0, 150) // Truncate for readability
        };
      }
    } catch (error) {
      results[model] = {
        status: '❌ ERROR',
        error: error.message
      };
    }
  }

  return NextResponse.json(results);
}
