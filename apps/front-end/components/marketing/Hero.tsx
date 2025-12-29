import { ReactNode } from "react";

export default function Hero({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white text-center rounded-xl shadow-sm mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">{title}</h1>
      {subtitle && <p className="text-lg md:text-xl text-gray-700 mb-6 max-w-2xl mx-auto">{subtitle}</p>}
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </section>
  );
}
