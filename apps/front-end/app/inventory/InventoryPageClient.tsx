"use client";
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInventories, useInventoryInsights } from '@/lib/api/hooks/inventory';
import { DataTable } from '@/components/product/DataTable';
import { EmptyState } from '@/components/product/EmptyState';
import { Pagination } from '@/components/product/Pagination';
import { StatusBadge } from '@/components/product/StatusBadge';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
// import PermissionGuard from '@/components/PermissionGuard'; // Uncomment if exists

const PAGE_SIZE = 20;

export default function InventoryPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const page = Number(params.get('page') || 1);
  const search = params.get('search') || '';
  const stockFilter = params.get('stock') || 'all';
  const isMobile = useMediaQuery('(max-width: 768px)');

  // TODO: If backend does not support search/stock, filter client-side and mark as TODO
  const { data: inventories, isLoading, error } = useInventories({
    page,
    limit: PAGE_SIZE,
    search, // TODO: Remove if backend does not support
    status: stockFilter !== 'all' ? stockFilter : undefined, // TODO: Remove if not supported
    // lowStock: stockFilter === 'low' ? true : undefined, // TODO: Uncomment if supported
  });
  const { data: insights } = useInventoryInsights();

  // Debounced search state
  const [searchInput, setSearchInput] = useState(search);
  // Debounce logic (simple)
  useMemo(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) {
        const q = new URLSearchParams(params.toString());
        if (searchInput) q.set('search', searchInput); else q.delete('search');
        q.set('page', '1');
        router.replace(`?${q.toString()}`);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [searchInput]);

  // Table columns
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'stock', label: 'Stock' },
    { key: 'threshold', label: 'Threshold' },
    { key: 'status', label: 'Status', render: (row: any) => <StatusBadge status={row.status || 'active'} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex gap-2">
          <a href={`/inventory/${row.id}`} className="text-primary underline text-sm">View</a>
          {/* <PermissionGuard permission="inventory:adjust">
            <button className="text-xs underline" onClick={() => openAdjustmentModal(row.id)}>Adjust</button>
          </PermissionGuard> */}
        </div>
      ),
    },
  ];

  // Filtered data fallback if backend does not support search/stock
  // TODO: Remove this block if backend supports filtering
  let filtered = inventories?.items || [];
  if (!filtered && isLoading) filtered = [];
  // TODO: If backend does not support search, filter here
  // if (!backendSupportsSearch && searchInput) {
  //   filtered = filtered.filter(item => item.name?.toLowerCase().includes(searchInput.toLowerCase()));
  // }
  // TODO: If backend does not support stock filter, filter here
  // if (!backendSupportsStock && stockFilter !== 'all') {
  //   filtered = filtered.filter(item => ...);
  // }

  return (
    <main className="max-w-6xl mx-auto px-2 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Manage your inventory items and stock levels.</p>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-lg font-semibold">{insights?.totalItems ?? '--'}</div>
          <div className="text-xs text-muted-foreground">Total Items</div>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-lg font-semibold">{insights?.lowStockCount ?? '--'}</div>
          <div className="text-xs text-muted-foreground">Low Stock</div>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-lg font-semibold">{insights?.outOfStockCount ?? '--'}</div>
          <div className="text-xs text-muted-foreground">Out of Stock</div>
        </div>
        {/* Add more cards as needed */}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full md:w-64"
          placeholder="Search inventory..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={stockFilter}
          onChange={e => {
            const q = new URLSearchParams(params.toString());
            if (e.target.value !== 'all') q.set('stock', e.target.value); else q.delete('stock');
            q.set('page', '1');
            router.replace(`?${q.toString()}`);
          }}
        >
          <option value="all">Stock: All</option>
          <option value="low">Low</option>
          <option value="out">Out</option>
        </select>
        {/* <PermissionGuard permission="inventory:create">
          <button className="ml-auto btn btn-primary">Add Item</button>
        </PermissionGuard> */}
      </div>

      {/* Table or Cards */}
      {error ? (
        <EmptyState message={error instanceof Error ? error.message : 'Failed to load inventory.'} />
      ) : isMobile ? (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && !isLoading ? (
            <EmptyState message="No inventory items found." />
          ) : filtered.map((item: typeof filtered extends (infer U)[] ? U : unknown) => (
            <div key={item.id} className="bg-white rounded shadow p-4 flex flex-col gap-1">
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-muted-foreground">SKU: {item.sku || '--'}</div>
              <div className="text-xs">Stock: {item.stock ?? '--'}</div>
              <div className="text-xs">Threshold: {item.threshold ?? '--'}</div>
              <StatusBadge status={item.status || 'active'} />
              <div className="flex gap-2 mt-2">
                <a href={`/inventory/${item.id}`} className="text-primary underline text-sm">View</a>
                {/* <PermissionGuard permission="inventory:adjust">
                  <button className="text-xs underline">Adjust</button>
                </PermissionGuard> */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          empty={<EmptyState message="No inventory items found." />}
        />
      )}

      {/* Pagination */}
      {inventories && inventories.total > PAGE_SIZE && (
        <Pagination
          page={page}
          total={inventories.total}
          limit={PAGE_SIZE}
          onPageChange={p => {
            const q = new URLSearchParams(params.toString());
            q.set('page', String(p));
            router.replace(`?${q.toString()}`);
          }}
        />
      )}
    </main>
  );
}
