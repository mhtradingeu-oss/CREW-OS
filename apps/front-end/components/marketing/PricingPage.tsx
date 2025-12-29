import Hero from "./Hero.tsx";
import Section from "./Section.tsx";

const plans = [
  {
    name: "Foundation",
    price: "$500/mo",
    description: "Core platform access for organizations starting their system journey.",
    features: [
      "All core modules",
      "Unified governance",
      "Standard support",
      "Up to 100 users",
    ],
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    description: "For organizations with advanced needs, custom governance, and scale.",
    features: [
      "All Foundation features",
      "Custom modules",
      "Advanced governance",
      "Priority support",
      "Unlimited users",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <Hero
        title="Pricing & Plans"
        subtitle="Simple, transparent pricing. No hidden fees."
      />
      <Section>
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="border rounded-xl p-8 bg-white shadow-sm flex flex-col">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-blue-900 mb-4">{plan.price}</div>
              <p className="mb-4 text-gray-700">{plan.description}</p>
              <ul className="mb-6 space-y-2 text-gray-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center"><span className="w-2 h-2 bg-blue-900 rounded-full mr-2 inline-block" />{f}</li>
                ))}
              </ul>
              <button className="mt-auto bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold opacity-70 cursor-not-allowed" disabled>Contact Sales</button>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
