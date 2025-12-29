import { Badge } from "./badge.tsx";

export function BrandBadge({ name = "HAIROTICMEN" }: { name?: string }) {
  return <Badge variant="secondary">{name}</Badge>;
}
