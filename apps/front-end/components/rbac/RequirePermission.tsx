import { useAuth } from '../../hooks/useAuth';
import React from 'react';

interface RequirePermissionProps {
  code: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RequirePermission({ code, children, fallback = null }: RequirePermissionProps) {
  const { permissions, isLoading } = useAuth();

  if (isLoading) return null;
  if (!permissions?.includes(code)) return <>{fallback}</>;
  return <>{children}</>;
}
