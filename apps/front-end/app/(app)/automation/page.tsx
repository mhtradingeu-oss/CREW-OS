import RequirePermission from '../../../components/rbac/RequirePermission';

export default function AutomationPage() {
  return (
    <RequirePermission code="AUTOMATION_VIEW">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Automation</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>
    </RequirePermission>
  );
}
