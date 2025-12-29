// Brands Page (Server Component)
// Architectural: Read-only, no business logic
// All imports explicit, ESM, alias-based

import { listBrands } from '@/lib/api/brands.ts';
import type { Brand } from '@/lib/api/types.ts';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const brands = await listBrands();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Brands</h1>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Logo</th>
          </tr>
        </thead>
        <tbody>
          {brands.items.map((b: Brand) => (
            <tr key={b.id}>
              <td className="border px-2 py-1">{b.id}</td>
              <td className="border px-2 py-1">{b.name}</td>
              <td className="border px-2 py-1">{b.logoUrl ? <img src={b.logoUrl} alt={b.name} className="h-6" /> : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
