interface RiskBannerProps {
  riskLevel: "low" | "medium" | "high";
  message: string;
}

const riskColors = {
  low: "bg-emerald-900 text-emerald-300 border-emerald-700",
  medium: "bg-amber-900 text-amber-200 border-amber-700",
  high: "bg-red-900 text-red-200 border-red-700",
};

export default function RiskBanner({ riskLevel, message }: RiskBannerProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 font-semibold ${riskColors[riskLevel]}`}
      role="status"
      aria-live="polite"
    >
      <span className="uppercase tracking-wider">System Risk: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}</span>
      <span className="ml-2">{message}</span>
    </div>
  );
}
