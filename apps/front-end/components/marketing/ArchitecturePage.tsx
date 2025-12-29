import Hero from "./Hero.tsx";
import Section from "./Section.tsx";

export default function ArchitecturePage() {
  return (
    <>
      <Hero
        title="Architecture Overview"
        subtitle="A modular, governed system for organizations that demand clarity and control."
      />
      <Section title="System Structure">
        <p className="text-lg text-gray-800 mb-4">
          MH-OS is built on a modular architecture, enabling organizations to scale and adapt without sacrificing governance or security. Each module is designed for clear boundaries, auditability, and operational trust.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Modular domains for CRM, Marketing, Sales, Inventory, Finance, and more</li>
          <li>Unified governance and permission model</li>
          <li>Transparent event-driven architecture</li>
          <li>Security and compliance by default</li>
        </ul>
      </Section>
      <Section title="Governance at Every Layer">
        <p className="text-lg text-gray-800">
          Governance is not an add-on. It’s embedded in every layer—from authentication to automation—ensuring your organization’s safety and operational clarity.
        </p>
      </Section>
    </>
  );
}
