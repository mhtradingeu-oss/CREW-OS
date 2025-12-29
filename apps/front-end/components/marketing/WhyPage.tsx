import Hero from "./Hero.tsx";
import Section from "./Section.tsx";

export default function WhyPage() {
  return (
    <>
      <Hero
        title="Why MH-OS?"
        subtitle="A platform built for organizations that value clarity, trust, and long-term stability."
      />
      <Section>
        <ul className="list-disc pl-6 space-y-3 text-lg text-gray-800">
          <li><strong>System Thinking:</strong> Every aspect of MH-OS is designed for coherence, adaptability, and operational clarity.</li>
          <li><strong>Governance First:</strong> Transparent protocols and clear roles ensure your organization’s safety and compliance.</li>
          <li><strong>Longevity:</strong> Built for the long term, with a focus on maintainability and future-proofing.</li>
          <li><strong>No Hype:</strong> We avoid buzzwords and empty promises. Our value is in what we deliver, not what we claim.</li>
          <li><strong>Trust by Design:</strong> Security, auditability, and transparency are foundational—not afterthoughts.</li>
        </ul>
      </Section>
    </>
  );
}
