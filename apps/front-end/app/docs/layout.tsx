import { SidebarNav } from '@/components/docs/SidebarNav';
import { DocsHeader } from '@/components/docs/DocsHeader';
import { DocsFooter } from '@/components/docs/DocsFooter';
import type { ReactNode } from 'react';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <DocsHeader />
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-white/80">
          <SidebarNav />
        </aside>
        <main className="flex-1 px-8 py-10 max-w-4xl mx-auto">
          {children}
        </main>
      </div>
      <DocsFooter />
    </div>
  );
}
