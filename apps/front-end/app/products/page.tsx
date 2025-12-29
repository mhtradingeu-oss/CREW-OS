// Products Page (Server Component)
// Architectural: Read-only, no business logic
// All imports explicit, ESM, alias-based

import { listProducts } from '@/lib/api/products.ts';
import type { Product } from '@/lib/api/types.ts';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Brand</th>
            <th className="border px-2 py-1">Price</th>
          </tr>
        </thead>
        <tbody>
          {products.items.map((p: Product) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.id}</td>
              <td className="border px-2 py-1">{p.name}</td>
              <td className="border px-2 py-1">{p.brandId}</td>
              <td className="border px-2 py-1">{p.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
