import Hero from "./Hero.tsx";
import Section from "./Section.tsx";
import CTAButton from "./CTAButton.tsx";

export default function ContactPage() {
  return (
    <>
      <Hero
        title="Contact & Demo Request"
        subtitle="Get in touch to learn how MH-OS can help your organization."
      />
      <Section>
        <form className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow flex flex-col gap-6" onSubmit={e => e.preventDefault()}>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Name</label>
            <input type="text" className="w-full border rounded-lg px-4 py-2" required disabled placeholder="Your Name" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input type="email" className="w-full border rounded-lg px-4 py-2" required disabled placeholder="you@company.com" />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Message</label>
            <textarea className="w-full border rounded-lg px-4 py-2" rows={4} required disabled placeholder="How can we help?" />
          </div>
          <CTAButton type="submit" className="w-full opacity-70 cursor-not-allowed" disabled>Submit (Demo Only)</CTAButton>
        </form>
      </Section>
    </>
  );
}
