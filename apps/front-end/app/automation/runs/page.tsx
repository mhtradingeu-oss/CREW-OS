import { useRuns } from './useRuns';

export default function RunsListPage() {
  const { runs, isLoading, isError } = useRuns();

  return (
    <div>
      <h2>Runs List</h2>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading runs.</div>}
      {!isLoading && !isError && runs.length === 0 && <div>No runs found.</div>}
      {!isLoading && !isError && runs.length > 0 && (
        <ul>
          {runs.map((run: any) => (
            <li key={run.id}>
              <strong>{run.id}</strong> — {run.status} (Started: {run.startedAt})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
