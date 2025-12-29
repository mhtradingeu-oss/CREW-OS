export const AUTONOMY_LEVELS = ["viewer", "advisor", "operator"] as const;
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

export const DEFAULT_AUTONOMY_LEVEL: AutonomyLevel = "viewer";

export type AutonomyLevelInput =
  | AutonomyLevel
  | "manual"
  | "assisted"
  | "copilot"
  | "autonomous"
  | "operator";

const AUTONOMY_ALIAS_MAP: Record<string, AutonomyLevel> = {
  viewer: "viewer",
  advisor: "advisor",
  operator: "operator",
  manual: "viewer",
  assisted: "advisor",
  copilot: "advisor",
  autonomous: "operator",
};

export function normalizeAutonomyLevel(input?: AutonomyLevelInput): AutonomyLevel {
  if (!input) {
    return DEFAULT_AUTONOMY_LEVEL;
  }
  return AUTONOMY_ALIAS_MAP[input.toLowerCase()] ?? DEFAULT_AUTONOMY_LEVEL;
}

export const ALLOWED_PRIORITY_ONE_LEVELS = new Set<AutonomyLevel>(["viewer", "advisor"]);

export function isOperatorLevel(level: AutonomyLevel): boolean {
  return level === "operator";
}
