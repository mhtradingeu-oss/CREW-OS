import type { ReactNode } from 'react';

export function MDXContent({ children }: { children: ReactNode }) {
  return (
    <article className="prose prose-neutral max-w-none prose-headings:font-semibold prose-code:bg-neutral-100 prose-code:px-1 prose-code:rounded prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:rounded prose-pre:p-4">
      {children}
    </article>
  );
}
