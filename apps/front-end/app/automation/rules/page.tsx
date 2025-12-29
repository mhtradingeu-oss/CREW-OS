import { useRules } from './useRules';

export default function RulesListPage() {
  const { rules, isLoading, isError } = useRules();

  return (
    <div>
      <h2>Rules List</h2>
      {/* Filters UI placeholder */}
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading rules.</div>}
      {!isLoading && !isError && rules.length === 0 && <div>No rules found.</div>}
      {!isLoading && !isError && rules.length > 0 && (
        <ul>
          {rules.map((rule: any) => (
            <li key={rule.id}>
              <strong>{rule.name}</strong> — {rule.state} (Created: {rule.createdAt})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
