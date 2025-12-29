"use client";
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  {
    label: 'Home',
    href: '/docs',
  },
  {
    label: 'Getting Started',
    href: '/docs/getting-started',
  },
  {
    label: 'Architecture',
    href: '/docs/architecture',
  },
  {
    label: 'Modules',
    children: [
      { label: 'Product OS', href: '/docs/modules/product-os' },
      { label: 'Pricing Engine', href: '/docs/modules/pricing-engine' },
      { label: 'Automation OS', href: '/docs/modules/automation-os' },
      { label: 'AI Systems', href: '/docs/modules/ai-systems' },
    ],
  },
  {
    label: 'Governance',
    href: '/docs/governance',
  },
  {
    label: 'Roadmap',
    href: '/docs/roadmap',
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="py-8 px-4">
      <ul className="space-y-2">
        {nav.map((item) =>
          item.children ? (
            <li key={item.label}>
              <span className="font-semibold text-xs uppercase text-neutral-500 tracking-wider block mb-1">{item.label}</span>
              <ul className="ml-3 border-l border-neutral-200 pl-3 space-y-1">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <Link href={child.href} className={`block py-1 px-2 rounded hover:bg-neutral-100 text-sm ${pathname === child.href ? 'bg-neutral-100 font-bold' : ''}`}>{child.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
          ) : (
            <li key={item.href}>
              <Link href={item.href!} className={`block py-1 px-2 rounded hover:bg-neutral-100 text-sm ${pathname === item.href ? 'bg-neutral-100 font-bold' : ''}`}>{item.label}</Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}
