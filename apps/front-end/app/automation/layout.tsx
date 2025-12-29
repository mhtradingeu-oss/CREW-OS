import React from 'react';

export default function AutomationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1>Automation Control Plane</h1>
      <nav>
        {/* Navigation links to subpages will go here */}
      </nav>
      <main>{children}</main>
    </div>
  );
}
