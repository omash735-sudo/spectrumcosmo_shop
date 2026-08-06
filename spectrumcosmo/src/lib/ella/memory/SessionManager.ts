import { getDb } from '@/lib/db';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class SessionManager {
  private sessionId: string;
  private conversationId: string | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async getOrCreateConversation(customerEmail?: string, customerName?: string): Promise<string> {
    const sql = getDb();

    const existing = await sql<{ id: string }[]>`
      SELECT id FROM ella_conversations 
      WHERE session_id = ${this.sessionId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    let conversationId: string;

    if (existing.length > 0) {
      conversationId = existing[0].id;
      this.conversationId = conversationId;
      
      if (customerEmail || customerName) {
        await sql`
          UPDATE ella_conversations 
          SET 
            customer_email = COALESCE(${customerEmail}, customer_email),
            customer_name = COALESCE(${customerName}, customer_name),
            updated_at = NOW()
          WHERE id = ${conversationId}
        `;
      }
    } else {
      const result = await sql<{ id: string }[]>`
        INSERT INTO ella_conversations (session_id, customer_email, customer_name)
        VALUES (${this.sessionId}, ${customerEmail || null}, ${customerName || null})
        RETURNING id
      `;
      
      conversationId = result[0].id;
      this.conversationId = conversationId;
    }

    return conversationId;
  }

  async addMessage(role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    if (!this.conversationId) {
      throw new Error('Conversation not initialized. Call getOrCreateConversation first.');
    }

    const sql = getDb();
    await sql`
      INSERT INTO ella_messages (conversation_id, role, content)
      VALUES (${this.conversationId}, ${role}, ${content})
    `;

    await sql`
      UPDATE ella_conversations SET updated_at = NOW()
      WHERE id = ${this.conversationId}
    `;
  }

  async getHistory(limit: number = 20): Promise<Message[]> {
    if (!this.conversationId) {
      return [];
    }

    const sql = getDb();
    const messages = await sql<{ role: string; content: string }[]>`
      SELECT role, content 
      FROM ella_messages 
      WHERE conversation_id = ${this.conversationId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return messages.reverse();
  }

  async getLastUserMessage(): Promise<string | null> {
    if (!this.conversationId) {
      return null;
    }

    const sql = getDb();
    const result = await sql<{ content: string }[]>`
      SELECT content 
      FROM ella_messages 
      WHERE conversation_id = ${this.conversationId} AND role = 'user'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return result[0]?.content || null;
  }

  async hasUnresolvedIssue(): Promise<boolean> {
    return false;
  }
}
