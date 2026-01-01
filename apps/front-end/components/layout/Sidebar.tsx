import NavLinks from '../NavLinks';
import BrandSwitcher from '../brand/BrandSwitcher';
import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <BrandSwitcher />
      </div>
      <nav className="flex-1 overflow-y-auto">
        <NavLinks />
      </nav>
    </aside>
  );
}
