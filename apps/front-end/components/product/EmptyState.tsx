import React from 'react';

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="py-12 text-center text-muted-foreground">
      {message || 'No results found.'}
    </div>
  );
}
