import { getDb } from '@/lib/db';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export async function searchFAQs(query: string): Promise<FAQ[]> {
  const sql = getDb();
  
  const searchPattern = `%${query}%`;
  
  const faqs = await sql`
    SELECT id, question, answer 
    FROM faqs 
    WHERE 
      is_published = true 
      AND is_answered = true
      AND (
        question ILIKE ${searchPattern} 
        OR answer ILIKE ${searchPattern}
      )
    ORDER BY 
      created_at DESC
    LIMIT 5
  `;
  
  return faqs as FAQ[];
}
