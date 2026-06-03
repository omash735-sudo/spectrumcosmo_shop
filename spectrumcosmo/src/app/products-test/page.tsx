// app/products-test/page.tsx
import { getDb } from '@/lib/db';

export default async function ProductsTestPage() {
  let error = null;
  let products = [];
  let categories = [];

  try {
    const sql = getDb();
    
    // Test categories query
    try {
      categories = await sql`
        SELECT name, slug FROM categories WHERE is_active = true ORDER BY sort_order ASC
      `;
    } catch (err: any) {
      error = `Categories query error: ${err.message}`;
    }

    // Test products query
    try {
      products = await sql`
        SELECT * FROM products WHERE status = 'in_stock' LIMIT 5
      `;
    } catch (err: any) {
      error = `Products query error: ${err.message}`;
    }

  } catch (err: any) {
    error = `Database connection error: ${err.message}`;
  }

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">🔧 Products Page Diagnostic</h1>
      
      {error ? (
        <div className="bg-red-100 border-2 border-red-500 p-4 rounded mb-4">
          <h2 className="font-bold text-red-800 mb-2">❌ Error Found:</h2>
          <pre className="bg-white p-3 rounded overflow-auto whitespace-pre-wrap">{error}</pre>
        </div>
      ) : (
        <div className="bg-green-100 border-2 border-green-500 p-4 rounded mb-4">
          <h2 className="font-bold text-green-800 mb-2">✅ No database errors</h2>
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">📊 Categories ({categories.length}):</h2>
        <pre className="bg-white p-2 rounded text-xs overflow-auto">{JSON.stringify(categories, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">📦 Products ({products.length}):</h2>
        <pre className="bg-white p-2 rounded text-xs overflow-auto">{JSON.stringify(products, null, 2)}</pre>
      </div>

      <div className="mt-6 bg-yellow-100 p-4 rounded">
        <h2 className="font-bold mb-2">📋 Send this entire page screenshot to developer</h2>
      </div>
    </div>
  );
}
