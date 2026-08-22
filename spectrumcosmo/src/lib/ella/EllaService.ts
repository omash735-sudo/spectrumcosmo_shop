import { getDb } from '@/lib/db';
import { GroqProvider } from './GroqProvider';
import { getSystemPrompt } from './prompts/systemPrompt';
import { searchProducts, formatProductForResponse } from './tools/ProductSearchTool';
import { searchFAQs } from './tools/FAQSearchTool';
import { SessionManager } from './memory/SessionManager';
import { searchStockByQuery, formatStockResponse } from './tools/StockCheckTool';
import { 
  lookupOrderByNumberAndEmail, 
  lookupOrdersByUserId,
  lookupOrderByEmail,
  formatOrderResponse,
  formatMultipleOrdersResponse
} from './tools/OrderLookupTool';
import { sendEscalationEmail } from './escalation/EmailNotifier';
import { 
  CurrencyCode, 
  DEFAULT_CURRENCY, 
  detectCurrencyFromLocale, 
  getExchangeRate,
  COUNTRY_CURRENCY_MAP
} from './types/currency';

const ADMIN_EMAIL = 'spectrumcosmo01@gmail.com';
const OMASH_EMAIL = 'omash735@gmail.com';

interface ChatRequest {
  message: string;
  sessionId: string;
  customerEmail?: string;
  customerName?: string;
  userId?: string;
  currency?: CurrencyCode;
  locale?: string;
  countryCode?: string;
}

interface ChatResponse {
  message: string;
  conversationId: string;
  requiresEscalation: boolean;
  escalationReason?: string;
}

export class EllaService {
  private groqProvider: GroqProvider;

  constructor(groqApiKey: string) {
    this.groqProvider = new GroqProvider(groqApiKey);
  }

  private detectCurrency(request: ChatRequest): CurrencyCode {
    if (request.currency) {
      return request.currency;
    }
    
    if (request.countryCode) {
      const countryUpper = request.countryCode.toUpperCase();
      if (COUNTRY_CURRENCY_MAP[countryUpper]) {
        return COUNTRY_CURRENCY_MAP[countryUpper].currency as CurrencyCode;
      }
    }
    
    if (request.locale) {
      return detectCurrencyFromLocale(request.locale);
    }
    
    return DEFAULT_CURRENCY as CurrencyCode;
  }

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, sessionId, customerEmail, customerName, userId } = request;

    const currency = this.detectCurrency(request);
    const exchangeRate = getExchangeRate(currency);

    const session = new SessionManager(sessionId);
    const conversationId = await session.getOrCreateConversation(customerEmail, customerName);

    await session.addMessage('user', message);

    const history = await session.getHistory(10);

    let extractedOrderNumber: string | null = null;
    let toolResponse: string | null = null;
    let toolType: string | null = null;

    const productIntent = this.detectProductIntent(message);
    const stockIntent = this.detectStockIntent(message);
    const orderIntent = this.detectOrderIntent(message);
    const faqIntent = this.detectFAQIntent(message);

    // Check for escalation FIRST - these override everything else
    const escalationReason = this.detectEscalationNeeded(message);
    const requiresEscalation = !!escalationReason;

    if (productIntent) {
      const searchQuery = this.extractProductQuery(message);
      const products = await searchProducts(searchQuery, 5);

      if (products.length > 0) {
        toolResponse = `PRODUCT SEARCH RESULTS (REAL DATA FROM DATABASE):\n\n${products.map(p => formatProductForResponse(p, currency, exchangeRate)).join('\n\n---\n\n')}`;
        toolType = 'product';
      } else {
        toolResponse = `PRODUCT SEARCH RESULTS (REAL DATA FROM DATABASE):\n\nNo products found matching "${searchQuery}". Please suggest they try different keywords or check the spelling.`;
        toolType = 'product';
      }
    }

    if (stockIntent && !toolResponse) {
      const searchQuery = this.extractProductQuery(message);
      const stockResults = await searchStockByQuery(searchQuery);

      if (stockResults.length > 0) {
        toolResponse = `STOCK INFORMATION (REAL DATA FROM DATABASE):\n\n${stockResults.map(s => formatStockResponse(s, currency, exchangeRate)).join('\n\n---\n\n')}`;
        toolType = 'stock';
      } else {
        toolResponse = `STOCK INFORMATION (REAL DATA FROM DATABASE):\n\nNo stock information found for "${searchQuery}". The product may not exist in the database.`;
        toolType = 'stock';
      }
    }

    if (orderIntent && !toolResponse) {
      if (userId) {
        const orders = await lookupOrdersByUserId(userId);
        if (orders.length > 0) {
          toolResponse = `ORDER INFORMATION (REAL DATA FROM DATABASE):\n\n${formatMultipleOrdersResponse(orders)}`;
          toolType = 'order';
        } else {
          toolResponse = `ORDER INFORMATION (REAL DATA FROM DATABASE):\n\nNo orders found for this account.`;
          toolType = 'order';
        }
      } else if (customerEmail) {
        const extractedNumber = this.extractOrderNumber(message);
        if (extractedNumber) {
          extractedOrderNumber = extractedNumber;
          const result = await lookupOrderByNumberAndEmail(extractedNumber, customerEmail);
          if (result.order) {
            toolResponse = `ORDER INFORMATION (REAL DATA FROM DATABASE):\n\n${formatOrderResponse(result.order)}`;
            toolType = 'order';
          } else {
            toolResponse = `ORDER INFORMATION (REAL DATA FROM DATABASE):\n\n${result.error || 'No order found matching that number and email.'}`;
            toolType = 'order';
          }
        } else {
          const orders = await lookupOrderByEmail(customerEmail);
          if (orders.length > 0) {
            toolResponse = `ORDER INFORMATION (REAL DATA FROM DATABASE):\n\n${formatMultipleOrdersResponse(orders)}`;
            toolType = 'order';
          } else {
            toolResponse = `ORDER INFORMATION (REAL DATA FROM DATABASE):\n\nNo orders found for this email address.`;
            toolType = 'order';
          }
        }
      } else {
        toolResponse = `ORDER INFORMATION (REAL DATA FROM DATABASE):\n\nCustomer needs to provide their email address to look up orders. Please ask them for the email they used when placing the order.`;
        toolType = 'order';
      }
    }

    if (faqIntent && !toolResponse) {
      const faqs = await searchFAQs(message);
      if (faqs.length > 0) {
        toolResponse = `FAQ INFORMATION (REAL DATA FROM DATABASE):\n\n${faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`;
        toolType = 'faq';
      } else {
        toolResponse = `FAQ INFORMATION (REAL DATA FROM DATABASE):\n\nNo FAQs found matching this question.`;
        toolType = 'faq';
      }
    }

    const systemPrompt = getSystemPrompt();

    let context = systemPrompt;

    // Add customer name to context if available
    if (customerName) {
      context += `\n\nCUSTOMER INFO:\n- The customer's name is ${customerName}. Use their name naturally in conversation.\n`;
    }

    context += `\n\nCurrency Information:\n- The customer's currency is ${currency}.\n- All prices should be shown in ${currency}.\n- The base currency is MWK (Malawian Kwacha).\n- Exchange rate from MWK to ${currency}: ${exchangeRate}`;

    const shippingInfo = `SpectrumCosmo shipping: Nationwide delivery within 3-7 business days. Costs depend on location. Contact us for a quote.`;
    context += `\n\nShipping Information:\n${shippingInfo}`;

    if (toolResponse) {
      context += `\n\n${toolResponse}`;
    }

    let instruction = "";

    if (requiresEscalation) {
      // Escalation instruction
      instruction = `
CUSTOMER REQUEST: ${message}

ESCALATION REQUIRED: ${escalationReason}

INSTRUCTIONS:
1. Acknowledge the customer's request with empathy
2. Explain you are escalating this to Omash for review
3. If applicable, ask for any additional details (order number, etc.)
4. DO NOT approve refunds, cancellations, or discounts yourself
5. Be warm and reassuring

EXAMPLE RESPONSES:
- Refund: "I understand you want a refund. 😕 Let me get Omash on this right away. Can you provide your order number?"
- Cancellation: "I'll stop that order for you! 🚀 Let me escalate this to Omash to make sure it's handled."
- Complaint: "I'm really sorry to hear that! 😔 Let me get this to Omash immediately so we can make it right."
- Investment: "Wow, that's exciting! 🎉 I'll connect you with Omash directly. They handle all partnerships."
- Founder request: "Omash is amazing! 😄 Let me get them to reach out to you personally."
`;
    } else if (toolResponse && toolType) {
      instruction = `
CRITICAL INSTRUCTION:
- The tool response above contains REAL DATA from the SpectrumCosmo database.
- You MUST ONLY use the data provided in the tool response to answer the customer.
- DO NOT make up prices, products, stock levels, or order information.
- DO NOT use your training data or general knowledge about anime merchandise.
- If the tool response says "No products found", tell the customer honestly that you couldn't find what they're looking for.
- If the tool response shows specific products, prices, and stock levels, present exactly that data.
- Be honest: if you don't have information about something, say you don't have that information.
- All prices are already shown in the customer's currency (${currency}). Use the prices as shown.

Customer question: ${message}

Respond based ONLY on the tool data above. DO NOT add information that isn't in the tool response.`;
    } else {
      const generalIntent = this.detectGeneralIntent(message);
      const unknownIntent = this.detectUnknownIntent(message);
      
      if (unknownIntent) {
        instruction = `
Customer question: ${message}

This doesn't seem to be about products, stock, orders, or FAQ topics.

RESPOND WITH ONE OF THESE (depending on the question):
- If you don't understand: "I'm not quite sure what you mean! 🤔 Could you rephrase that? I can help with products, stock, orders, or general store questions."
- If it's not about the store: "That's interesting! 😄 While I'm not an expert on everything, I can definitely help with SpectrumCosmo-related questions."
- If it's off-topic: "I'm just a store assistant, so I'm not sure about that! 😅 Want to ask me about anime merchandise instead?"
- If it's a personal question: "I'm just a virtual assistant, so I don't really have opinions on that! 😂 But I can talk anime merch all day!"

Be friendly and redirect to what you CAN help with. Use emojis naturally.`;
      } else if (generalIntent) {
        instruction = `
Customer question: ${message}

This is a general question about SpectrumCosmo. Use your knowledge of the business (anime merchandise, hoodies, jerseys, accessories, collectibles) to answer naturally.
- If you don't know something, say you'll check and get back to them.
- Never make up specific prices or product details.
- For product-specific questions, ask them to specify what they're looking for.
- If they ask about prices, tell them you'll check and get back to them.
- Use your personality and emojis to keep it engaging!`;
      } else {
        instruction = `
Customer question: ${message}

Respond naturally. You are Ella, the SpectrumCosmo AI assistant. Be helpful, friendly, and professional.
- Use emojis to show personality
- Match the user's energy
- If they're playful, be playful
- If they're serious, be professional
- Keep it fun but helpful!`;
      }
    }

    let aiResponse: string;

    if (requiresEscalation) {
      const escalationContext = `${context}\n\n${instruction}`;
      aiResponse = await this.groqProvider.sendMessageWithContext(
        message,
        escalationContext,
        history
      );
      
      // Add escalation note to response if not already there
      if (!aiResponse.includes('escalate') && !aiResponse.includes('Omash')) {
        aiResponse += '\n\nI\'ll get Omash on this right away! 🚀';
      }
    } else {
      aiResponse = await this.groqProvider.sendMessageWithContext(
        message,
        context + '\n\n' + instruction,
        history
      );
    }

    await session.addMessage('assistant', aiResponse);

    if (requiresEscalation) {
      const escalationData = {
        customerName: customerName || 'Unknown',
        customerEmail: customerEmail || 'Not provided',
        orderNumber: extractedOrderNumber || undefined,
        reason: escalationReason,
        conversationSummary: `Customer: ${customerName || 'Unknown'}\nEmail: ${customerEmail || 'Not provided'}\nCurrency: ${currency}\n\nCustomer message: ${message}\n\nElla response: ${aiResponse}`,
        conversationId: conversationId,
        timestamp: new Date(),
      };

      await this.createEscalation(conversationId, escalationReason, escalationData);

      try {
        await sendEscalationEmail(escalationData);
      } catch (error) {
        console.error('Failed to send escalation email:', error);
      }
    }

    return {
      message: aiResponse,
      conversationId,
      requiresEscalation,
      escalationReason: requiresEscalation ? escalationReason : undefined,
    };
  }

  private detectProductIntent(message: string): boolean {
    const keywords = [
      'product', 'available', 'price', 'cost', 'size', 'color',
      'hoodie', 't-shirt', 'jersey', 'anime', 'merchandise',
      'shirt', 'clothing', 'accessories', 'collectibles'
    ];
    const lower = message.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  private detectStockIntent(message: string): boolean {
    const keywords = [
      'stock', 'in stock', 'available', 'quantity', 'have any',
      'do you have', 'is there', 'any left', 'available stock'
    ];
    const lower = message.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  private detectOrderIntent(message: string): boolean {
    const keywords = [
      'order', 'orders', 'purchased', 'bought', 'placed order',
      'my order', 'order status', 'where is my order'
    ];
    const lower = message.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  private detectFAQIntent(message: string): boolean {
    const keywords = [
      'how', 'what', 'when', 'where', 'why', 'can', 'will',
      'payment', 'delivery', 'shipping', 'return', 'refund',
      'order', 'process', 'time', 'cost', 'fee'
    ];
    const lower = message.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  private detectGeneralIntent(message: string): boolean {
    const keywords = [
      'who', 'are', 'you', 'what', 'is', 'company',
      'about', 'history', 'mission', 'vision'
    ];
    const lower = message.toLowerCase();
    return keywords.some(k => lower.includes(k)) && !this.detectProductIntent(message);
  }

  private detectUnknownIntent(message: string): boolean {
    const hasKnownIntent = 
      this.detectProductIntent(message) ||
      this.detectStockIntent(message) ||
      this.detectOrderIntent(message) ||
      this.detectFAQIntent(message) ||
      this.detectGeneralIntent(message) ||
      this.detectEscalationNeeded(message) !== null;
    
    return !hasKnownIntent;
  }

  private extractOrderNumber(message: string): string | null {
    const match = message.match(/#?\s*([A-Za-z0-9]{6,12})/);
    return match ? match[1] : null;
  }

  private extractProductQuery(message: string): string {
    const stopWords = ['have', 'do', 'you', 'is', 'are', 'there', 'any', 'with', 'for', 'from', 'on', 'at', 'the', 'a', 'an'];
    const words = message.toLowerCase().split(' ');
    const filtered = words.filter(w => !stopWords.includes(w) && w.length > 2);
    return filtered.join(' ') || message;
  }

  private detectEscalationNeeded(message: string): string | null {
    const lower = message.toLowerCase();

    if (lower.includes('refund') || lower.includes('return money')) {
      return 'Refund requested';
    }
    if (lower.includes('cancel order') || lower.includes('stop order')) {
      return 'Order cancellation requested';
    }
    if (lower.includes('invest') || lower.includes('partner') || lower.includes('collaborate')) {
      return 'Investment/Partnership inquiry';
    }
    if (lower.includes('complain') || lower.includes('terrible') || lower.includes('worst')) {
      return 'Complaint detected';
    }
    if (lower.includes('discount') && (lower.includes('special') || lower.includes('extra'))) {
      return 'Special discount requested';
    }
    if (lower.includes('owner') || lower.includes('founder') || lower.includes('omash')) {
      return 'Request to speak with founder';
    }

    return null;
  }

  private async createEscalation(conversationId: string, reason: string, context: any): Promise<void> {
    const sql = getDb();

    await sql`
      INSERT INTO ella_escalations (conversation_id, reason, context)
      VALUES (${conversationId}, ${reason}, ${JSON.stringify(context)})
    `;

    console.log(`Escalation created: ${reason}`);
  }
}
