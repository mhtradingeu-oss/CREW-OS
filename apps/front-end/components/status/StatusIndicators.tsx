import React from 'react';
import { useQuery } from '@tanstack/react-query';

function HealthIndicator() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['platform-health'],
    queryFn: async () => {
      const res = await fetch('/api/v1/platform-ops/health');
      if (!res.ok) throw new Error('Failed to fetch health');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) return <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" title="Loading" />;
  if (error || !data?.healthy) return <span className="w-3 h-3 rounded-full bg-red-500 inline-block" title="Unhealthy" />;
  return <span className="w-3 h-3 rounded-full bg-green-500 inline-block" title="Healthy" />;
}

export default function StatusIndicators() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <HealthIndicator />
        <span className="text-xs text-gray-500">System</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" title="Incidents" />
        <span className="text-xs text-gray-500">Incidents</span>
        <span className="ml-1 text-xs bg-gray-200 rounded px-2">—</span>
      </div>
    </div>
  );
}
