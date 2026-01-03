import StatusIndicators from '../status/StatusIndicators';
import React from 'react';

export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b flex items-center px-6 justify-between">
      <StatusIndicators />
      <div className="flex items-center gap-4">
        {/* User info placeholder */}
        <span className="text-gray-700 font-medium">Admin</span>
      </div>
    </header>
  );
}
