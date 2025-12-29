"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useInventory, useCreateInventoryAdjustment } from '@/lib/api/hooks/inventory';
import { StatusBadge } from '@/components/product/StatusBadge';
import { EmptyState } from '@/components/product/EmptyState';
// import PermissionGuard from '@/components/PermissionGuard'; // Uncomment if exists

export default function InventoryDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { data: item, isLoading, error } = useInventory(id);
  const createAdjustment = useCreateInventoryAdjustment();

  if (!id) {
    return <EmptyState message="Invalid inventory ID." />;
  }

  if (isLoading) return <div className="py-8 text-center">Loading...</div>;
  if (error) return <EmptyState message={error instanceof Error ? error.message : 'Failed to load inventory item.'} />;
  if (!item) return <EmptyState message="Inventory item not found." />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!amount || isNaN(Number(amount))) {
      setFormError('Amount is required and must be a number.');
      return;
    }
    // Permission check should be handled by PermissionGuard if available
    try {
      await createAdjustment.mutateAsync({
        inventoryId: item.id,
        amount: Number(amount),
        reason: reason || undefined,
      });
      setAmount('');
      setReason('');
      // Optionally, show a success message or refresh
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create adjustment.');
    }
  };

  return (
    <main className="max-w-xl mx-auto px-2 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory Item</h1>
        <p className="text-muted-foreground">View details and adjust stock.</p>
      </div>
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="font-semibold text-lg mb-2">{item.name}</div>
        <div className="text-sm text-muted-foreground mb-1">SKU: {item.sku || '--'}</div>
        <div className="text-sm mb-1">Stock: {item.stock ?? '--'}</div>
        <div className="text-sm mb-1">Threshold: {item.threshold ?? '--'}</div>
        <StatusBadge status={item.status || 'active'} />
      </div>
      {/* <PermissionGuard permission="inventory:adjust"> */}
      <form className="bg-white rounded shadow p-6 flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="font-semibold mb-2">Adjust Stock</div>
        <div>
          <label className="block text-sm mb-1">Amount<span className="text-red-500">*</span></label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-full"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Reason</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Optional"
          />
        </div>
        {formError && <div className="text-red-500 text-sm">{formError}</div>}
        <button
          type="submit"
          className="btn btn-primary mt-2"
          disabled={createAdjustment.isLoading}
        >
          {createAdjustment.isLoading ? 'Saving...' : 'Submit Adjustment'}
        </button>
      </form>
      {/* </PermissionGuard> */}
    </main>
  );
}
