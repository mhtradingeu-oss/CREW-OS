import { useState } from 'react';

export function useGovernanceActions(ruleId: string, versionId: string) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function callAction(action: 'approve' | 'pause' | 'archive') {
    setError(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/automation/rules/${ruleId}/versions/${versionId}/${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setLoading(null);
      return data;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setLoading(null);
      return null;
    }
  }

  return {
    error,
    loading,
    approve: () => callAction('approve'),
    pause: () => callAction('pause'),
    archive: () => callAction('archive'),
  };
}
