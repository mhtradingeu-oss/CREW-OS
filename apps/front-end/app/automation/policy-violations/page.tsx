import { usePolicyViolations } from './usePolicyViolations';

export default function PolicyViolationsPage() {
  const { violations, isLoading, isError } = usePolicyViolations();

  return (
    <div>
      <h2>Policy Violations</h2>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading policy violations.</div>}
      {!isLoading && !isError && violations.length === 0 && <div>No policy violations found.</div>}
      {!isLoading && !isError && violations.length > 0 && (
        <ul>
          {violations.map((v: any) => (
            <li key={v.id}>
              [{v.createdAt}] {v.type} — {v.detail} (Rule: {v.ruleId})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
