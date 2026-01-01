import React from 'react';
import { NAV_ITEMS } from '../config/nav';
import { useAuth } from '../hooks/useAuth';
import RequirePermission from './rbac/RequirePermission';
import Link from 'next/link';

export default function NavLinks() {
  const { permissions, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <ul className="space-y-1 p-4">
      {NAV_ITEMS.map((item) => (
        <RequirePermission key={item.href} code={item.permissionCode}>
          <li>
            <Link href={item.href} className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-800">
              {item.label}
            </Link>
          </li>
        </RequirePermission>
      ))}
    </ul>
  );
}
