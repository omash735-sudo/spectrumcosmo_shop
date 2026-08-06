import { getDb } from '@/lib/db';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export async function searchFAQs(query: string): Promise<FAQ[]> {
  const sql = getDb();

  const faqs = await sql<FAQ[]>`
    SELECT id, question, answer 
    FROM faqs 
    WHERE 
      is_published = true 
      AND is_answered = true
      AND (
        question ILIKE ${'%' + query + '%'} 
        OR answer ILIKE ${'%' + query + '%'}
      )
    ORDER BY 
      CASE WHEN question ILIKE ${query + '%'} THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT 5
  `;

  return faqs;
}
