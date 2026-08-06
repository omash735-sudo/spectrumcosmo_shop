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
  
  const searchPattern = `%${query}%`;
  const startsWithPattern = `${query}%`;

  const products = await sql`
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
        name ILIKE ${searchPattern} 
        OR description ILIKE ${searchPattern}
        OR tags::text ILIKE ${searchPattern}
      )
    ORDER BY 
      name
    LIMIT ${limit}
  `;

  return products as Product[];
}

export async function getProductById(productId: string): Promise<Product | null> {
  const sql = getDb();
  const products = await sql`
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
  
  return (products && products.length > 0) ? products[0] as Product : null;
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
