// V1 PLACEHOLDER — EXECUTION DISABLED
// All automation rule detail logic is disabled for V1 read-only build.
export function useRuleDetail() { return { data: undefined, error: null, isLoading: false }; }
import { useSWR } from 'swr';

export function useRuleDetail(ruleId: string) {
  const { data, error, isLoading } = useSWR(ruleId ? `/api/automation/rules/${ruleId}` : null, async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch rule detail');
    return res.json();
  });
  // V1 PLACEHOLDER — EXECUTION DISABLED
  // All automation rule detail logic is disabled for V1 read-only build.
  export function useRuleDetail() { return { data: undefined, error: null, isLoading: false }; }
}
