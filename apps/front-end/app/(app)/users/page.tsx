import RequirePermission from '../../../components/rbac/RequirePermission';

export default function UsersPage() {
  return (
    <RequirePermission code="USERS_VIEW">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Users</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>
    </RequirePermission>
  );
}
