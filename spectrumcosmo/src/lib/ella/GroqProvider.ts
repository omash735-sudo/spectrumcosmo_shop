// /lib/ella/GroqProvider.ts

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';  // Working model from test results

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessageWithContext(
    message: string,
    context: string,
    conversationHistory: Message[] = []
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: context,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Groq API error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage += ` - ${errorJson.error.message}`;
          }
        } catch {
          errorMessage += ` - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from Groq API');
      }

      const responseContent = data.choices[0]?.message?.content;
      
      if (!responseContent) {
        return 'I apologize, but I was unable to generate a response. Please try again.';
      }

      return responseContent;
      
    } catch (error) {
      console.error('[GroqProvider] Error:', error);
      throw error;
    }
  }
}
