import Hero from "./Hero.tsx";
import Section from "./Section.tsx";
import CTAButton from "./CTAButton.tsx";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Hero
        title="MH-OS SUPERAPP"
        subtitle="A system-first platform for organizations that value trust, governance, and longevity."
      >
        <Link href="/marketing/contact">
          <CTAButton>Request a Demo</CTAButton>
        </Link>
      </Hero>
      <Section title="Why MH-OS?">
        <p className="mb-4 text-lg text-gray-800">
          MH-OS is designed for organizations that prioritize clarity, safety, and long-term value. Our approach is grounded in system thinking, not hype. We focus on governance, transparency, and operational trust—empowering you to build on a foundation that lasts.
        </p>
        <Link href="/marketing/why">
          <CTAButton className="mt-4">Learn More</CTAButton>
        </Link>
      </Section>
      <Section title="Architecture Overview">
        <p className="mb-4 text-lg text-gray-800">
          Explore how MH-OS brings together modularity, security, and operational clarity. Our architecture is built for scale and adaptability, with governance at its core.
        </p>
        <Link href="/marketing/architecture">
          <CTAButton className="mt-4">View Architecture</CTAButton>
        </Link>
      </Section>
      <Section title="Governance & Trust">
        <p className="mb-4 text-lg text-gray-800">
          Trust is earned through transparency and robust governance. MH-OS provides clear protocols, auditability, and a commitment to your organization’s safety and longevity.
        </p>
        <Link href="/marketing/governance">
          <CTAButton className="mt-4">Read About Governance</CTAButton>
        </Link>
      </Section>
      <Section title="Pricing & Plans">
        <p className="mb-4 text-lg text-gray-800">
          Simple, transparent pricing. No hidden fees. Plans designed for organizations of all sizes.
        </p>
        <Link href="/marketing/pricing">
          <CTAButton className="mt-4">See Pricing</CTAButton>
        </Link>
      </Section>
    </>
  );
}
