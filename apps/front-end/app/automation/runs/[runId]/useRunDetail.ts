// V1 PLACEHOLDER — EXECUTION DISABLED
// All automation run detail logic is disabled for V1 read-only build.
export function useRunDetail() { return { data: undefined, error: null, isLoading: false }; }
import { useSWR } from 'swr';

export function useRunDetail(runId: string) {
  const { data, error, isLoading } = useSWR(runId ? `/api/automation/runs/${runId}` : null, async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch run detail');
    return res.json();
  });
  // V1 PLACEHOLDER — EXECUTION DISABLED
  // All automation run detail logic is disabled for V1 read-only build.
  export function useRunDetail() { return { data: undefined, error: null, isLoading: false }; }
}
