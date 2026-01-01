import RequirePermission from '../../../components/rbac/RequirePermission';

export default function SecurityPage() {
  return (
    <RequirePermission code="SECURITY_VIEW">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Security</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>
    </RequirePermission>
  );
}
