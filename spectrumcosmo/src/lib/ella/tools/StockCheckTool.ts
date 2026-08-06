import { getDb } from '@/lib/db';

interface StockResult {
  productId: string;
  name: string;
  stockQuantity: number;
  reservedStock: number;
  availableStock: number;
  sizeOptions: string[];
  colorOptions: string[];
  isLowStock: boolean;
}

export async function checkStock(productId: string): Promise<StockResult | null> {
  const sql = getDb();

  const result = await sql`
    SELECT 
      id,
      name,
      stock_quantity,
      reserved_stock,
      size_options,
      color_options
    FROM products 
    WHERE id = ${productId} AND status = 'active'
    LIMIT 1
  `;

  if (!result || result.length === 0) {
    return null;
  }

  const product = result[0];
  const stockQuantity = Number(product.stock_quantity) || 0;
  const reservedStock = Number(product.reserved_stock) || 0;
  const availableStock = stockQuantity - reservedStock;

  return {
    productId: product.id,
    name: product.name,
    stockQuantity,
    reservedStock,
    availableStock,
    sizeOptions: product.size_options || [],
    colorOptions: product.color_options || [],
    isLowStock: availableStock < 5,
  };
}

export async function searchStockByQuery(query: string): Promise<StockResult[]> {
  const sql = getDb();

  const results = await sql`
    SELECT 
      id,
      name,
      stock_quantity,
      reserved_stock,
      size_options,
      color_options
    FROM products 
    WHERE 
      status = 'active' 
      AND name ILIKE ${'%' + query + '%'}
    LIMIT 10
  `;

  if (!results || results.length === 0) {
    return [];
  }

  return results.map((product: any) => {
    const stockQuantity = Number(product.stock_quantity) || 0;
    const reservedStock = Number(product.reserved_stock) || 0;
    const availableStock = stockQuantity - reservedStock;

    return {
      productId: product.id,
      name: product.name,
      stockQuantity,
      reservedStock,
      availableStock,
      sizeOptions: product.size_options || [],
      colorOptions: product.color_options || [],
      isLowStock: availableStock < 5,
    };
  });
}

export function formatStockResponse(stock: StockResult): string {
  let response = `${stock.name}\n`;
  response += `Availability: ${stock.availableStock > 0 ? 'In Stock' : 'Out of Stock'}\n`;
  
  if (stock.availableStock > 0) {
    response += `Available: ${stock.availableStock} units\n`;
    
    if (stock.isLowStock) {
      response += `Low stock alert. Only ${stock.availableStock} remaining.\n`;
    }
    
    if (stock.sizeOptions && stock.sizeOptions.length > 0) {
      response += `Sizes available: ${stock.sizeOptions.join(', ')}\n`;
    }
    
    if (stock.colorOptions && stock.colorOptions.length > 0) {
      response += `Colors available: ${stock.colorOptions.join(', ')}\n`;
    }
  }
  
  return response;
}
