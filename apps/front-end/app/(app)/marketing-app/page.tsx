import RequirePermission from '../../../components/rbac/RequirePermission';

export default function MarketingPage() {
  return (
    <RequirePermission code="MARKETING_VIEW">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Marketing</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>
    </RequirePermission>
  );
}
