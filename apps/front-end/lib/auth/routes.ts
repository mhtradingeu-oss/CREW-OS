const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: "/dashboard/admin",
  admin: "/dashboard/admin",
  company_admin: "/dashboard",
  brand_admin: "/dashboard/brand",
  dealer: "/dashboard/dealer",
  stand_partner: "/dashboard/stand",
  sales_rep: "/dashboard/sales",
  affiliate: "/dashboard/affiliate",
};

export function getDashboardRouteForRole(role?: string) {
  if (!role) return "/dashboard";
  return ROLE_REDIRECTS[role.toLowerCase()] ?? "/dashboard";
}
