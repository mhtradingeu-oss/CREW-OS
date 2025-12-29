
// CRM Page (Server Component)
// Architectural: Read-only, no business logic, no mutation
// All imports explicit, ESM, alias-based

export const dynamic = 'force-dynamic';

export default function CrmPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">CRM (Read-Only)</h1>
      <div className="text-gray-600">CRM data is read-only in V1. No editing or automation is available.</div>
      {/* Placeholder for future CRM data table or summary */}
    </div>
  );
}
