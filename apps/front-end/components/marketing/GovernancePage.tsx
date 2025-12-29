import Hero from "./Hero.tsx";
import Section from "./Section.tsx";

export default function GovernancePage() {
  return (
    <>
      <Hero
        title="Governance & Trust"
        subtitle="Transparency, safety, and longevity are at the core of MH-OS."
      />
      <Section title="Transparent Protocols">
        <p className="text-lg text-gray-800 mb-4">
          MH-OS provides clear, auditable protocols for every operation. Our commitment to transparency means you always know how your data and processes are managed.
        </p>
      </Section>
      <Section title="Operational Trust">
        <p className="text-lg text-gray-800 mb-4">
          Trust is built through robust governance, not marketing claims. We provide the tools and clarity your organization needs to operate with confidence.
        </p>
      </Section>
      <Section title="Long-Term Commitment">
        <p className="text-lg text-gray-800">
          MH-OS is designed for organizations that plan for the future. Our focus on maintainability and auditability ensures your investment is protected for the long term.
        </p>
      </Section>
    </>
  );
}
