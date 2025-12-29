import { ReactNode } from "react";

export default function Section({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`my-12 ${className}`}>
      {title && <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-blue-900">{title}</h2>}
      <div>{children}</div>
    </section>
  );
}
