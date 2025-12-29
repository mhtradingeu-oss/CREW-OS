import { useAuditLog } from './useAuditLog';

export default function AuditLogPage() {
  const { auditLog, isLoading, isError } = useAuditLog();

  return (
    <div>
      <h2>Audit Log</h2>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading audit log.</div>}
      {!isLoading && !isError && auditLog.length === 0 && <div>No audit log entries found.</div>}
      {!isLoading && !isError && auditLog.length > 0 && (
        <ul>
          {auditLog.map((log: any) => (
            <li key={log.id}>
              [{log.createdAt}] {log.action} — {log.entityType} ({log.entityId})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
