import { getDb } from '@/lib/db';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  size_options: string[];
  color_options: string[];
  category_id: number;
  image_url: string;
}

export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  const sql = getDb();

  const products = await sql<Product[]>`
    SELECT 
      id, 
      name, 
      description, 
      price, 
      stock_quantity,
      size_options,
      color_options,
      category_id,
      image_url
    FROM products 
    WHERE 
      status = 'active' 
      AND (
        name ILIKE ${'%' + query + '%'} 
        OR description ILIKE ${'%' + query + '%'}
        OR tags::text ILIKE ${'%' + query + '%'}
      )
    ORDER BY 
      CASE WHEN name ILIKE ${query + '%'} THEN 1 ELSE 2 END,
      name
    LIMIT ${limit}
  `;

  return products;
}

export async function getProductById(productId: string): Promise<Product | null> {
  const sql = getDb();
  const products = await sql<Product[]>`
    SELECT 
      id, 
      name, 
      description, 
      price, 
      stock_quantity,
      size_options,
      color_options,
      category_id,
      image_url
    FROM products 
    WHERE id = ${productId} AND status = 'active'
    LIMIT 1
  `;
  return products[0] || null;
}

export function formatProductForResponse(product: Product): string {
  let response = `${product.name}\n`;
  response += `Price: MK${product.price.toLocaleString()}\n`;
  response += `Stock: ${product.stock_quantity} available\n`;
  if (product.size_options?.length) {
    response += `Sizes: ${product.size_options.join(', ')}\n`;
  }
  if (product.color_options?.length) {
    response += `Colors: ${product.color_options.join(', ')}\n`;
  }
  if (product.description) {
    response += `\n${product.description}`;
  }
  return response;
}
