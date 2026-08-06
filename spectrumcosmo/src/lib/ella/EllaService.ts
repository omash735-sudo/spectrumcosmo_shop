import { getDb } from '@/lib/db';
import { GroqProvider } from './GroqProvider';
import { getSystemPrompt } from './prompts/systemPrompt';
import { searchProducts, formatProductForResponse } from './tools/ProductSearchTool';
import { searchFAQs } from './tools/FAQSearchTool';
import { SessionManager } from './memory/SessionManager';

const ADMIN_EMAIL = 'spectrumcosmo01@gmail.com';
const OMASH_EMAIL = 'omash735@gmail.com';
const OMASH_PHONE = '+265893160202';

interface ChatRequest {
  message: string;
  sessionId: string;
  customerEmail?: string;
  customerName?: string;
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

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, sessionId, customerEmail, customerName } = request;

    const session = new SessionManager(sessionId);
    const conversationId = await session.getOrCreateConversation(customerEmail, customerName);

    await session.addMessage('user', message);

    const history = await session.getHistory(10);

    const productIntent = this.detectProductIntent(message);
    let productResponse: string | null = null;

    if (productIntent) {
      const searchQuery = this.extractProductQuery(message);
      const products = await searchProducts(searchQuery, 5);

      if (products.length > 0) {
        productResponse = `I found these products:\n\n${products.map(formatProductForResponse).join('\n\n---\n\n')}`;
      } else {
        productResponse = "I couldn't find any products matching your search. Could you try different keywords?";
      }
    }

    const faqIntent = this.detectFAQIntent(message);
    let faqResponse: string | null = null;

    if (faqIntent) {
      const faqs = await searchFAQs(message);
      if (faqs.length > 0) {
        faqResponse = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      }
    }

    const systemPrompt = getSystemPrompt();

    let context = systemPrompt;

    if (productResponse) {
      context += `\n\nProduct search results:\n${productResponse}`;
    }

    if (faqResponse) {
      context += `\n\nFAQ results:\n${faqResponse}`;
    }

    const shippingInfo = `SpectrumCosmo shipping: Nationwide delivery within 3-7 business days. Costs depend on location. Contact us for a quote.`;
    context += `\n\nShipping Information:\n${shippingInfo}`;

    const escalationReason = this.detectEscalationNeeded(message);
    const requiresEscalation = !!escalationReason;

    let aiResponse: string;

    if (requiresEscalation) {
      const escalationContext = `${context}\n\nIMPORTANT: The customer has requested something that requires human approval (${escalationReason}). Acknowledge their request, explain you'll escalate it, and collect necessary details. Do NOT approve it yourself.`;
      aiResponse = await this.groqProvider.sendMessageWithContext(
        message,
        escalationContext,
        history
      );
    } else {
      aiResponse = await this.groqProvider.sendMessageWithContext(
        message,
        context,
        history
      );
    }

    await session.addMessage('assistant', aiResponse);

    if (requiresEscalation) {
      await this.createEscalation(conversationId, escalationReason!, {
        customerName: customerName || 'Unknown',
        customerEmail: customerEmail || 'Unknown',
        message,
        aiResponse,
      });
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

  private extractProductQuery(message: string): string {
    const stopWords = ['have', 'do', 'you', 'is', 'are', 'there', 'any', 'with', 'for', 'from', 'on', 'at'];
    const words = message.toLowerCase().split(' ');
    const filtered = words.filter(w => !stopWords.includes(w) && w.length > 2);
    return filtered.join(' ') || message;
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

    console.log(`ESCALATION: ${reason}`, context);
  }
}
