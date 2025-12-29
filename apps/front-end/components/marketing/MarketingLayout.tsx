import { ReactNode } from "react";
import Link from "next/link";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-30">
        <nav className="container mx-auto flex items-center justify-between py-4 px-4 md:px-8">
          <Link href="/marketing" className="font-bold text-xl tracking-tight text-blue-900">MH-OS SUPERAPP</Link>
          <ul className="flex gap-6 text-base font-medium">
            <li><Link href="/marketing/why" className="hover:text-blue-700">Why MH-OS</Link></li>
            <li><Link href="/marketing/architecture" className="hover:text-blue-700">Architecture</Link></li>
            <li><Link href="/marketing/governance" className="hover:text-blue-700">Governance & Trust</Link></li>
            <li><Link href="/marketing/pricing" className="hover:text-blue-700">Pricing</Link></li>
            <li><Link href="/marketing/contact" className="hover:text-blue-700">Contact</Link></li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8">{children}</main>
      <footer className="border-t bg-gray-50 text-gray-500 text-sm py-6 mt-12">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4 md:px-8">
          <span>&copy; {new Date().getFullYear()} MH-OS SUPERAPP. All rights reserved.</span>
          <span>Built with system thinking. <Link href="/marketing/governance" className="underline hover:text-blue-700">Governance & Trust</Link></span>
        </div>
      </footer>
    </div>
  );
}
