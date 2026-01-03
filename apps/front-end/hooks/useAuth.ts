import { useQuery } from '@tanstack/react-query';

export interface AuthMe {
  user: { id: string; name: string; email: string; };
  permissions: string[];
  brands: { id: string; name: string; logoUrl?: string; }[];
  currentBrandId: string;
}

export function useAuth() {
  const { data, isLoading, error, refetch } = useQuery<AuthMe>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: data?.user,
    permissions: data?.permissions || [],
    brands: data?.brands || [],
    currentBrandId: data?.currentBrandId,
    isLoading,
    error,
    refetch,
  };
}
