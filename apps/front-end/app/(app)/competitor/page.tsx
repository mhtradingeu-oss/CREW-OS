import RequirePermission from '../../../components/rbac/RequirePermission';

export default function CompetitorPage() {
  return (
    <RequirePermission code="COMPETITOR_VIEW">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Competitor</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>
    </RequirePermission>
  );
}
