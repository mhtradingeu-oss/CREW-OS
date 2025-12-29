import { TableWithToolbar } from "@/components/shell/table-with-toolbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { brands, tenants } from "@/lib/superadmin/mock-data";

export default function SuperAdminBrandsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Brands</h1>
        <p className="text-sm text-muted-foreground">Read-only brand records across tenants.</p>
      </div>
      <TableWithToolbar
        title="Brands"
        columns={["Brand", "Tenant", "Domain", "Status"]}
        rows={brands.map((brand) => {
          const tenant = tenants.find((t) => t.id === brand.tenantId);
          return [
            brand.name,
            tenant?.name ?? brand.tenantId,
            brand.domain,
            <StatusBadge key={brand.id} tone={brand.status === "active" ? "success" : "warning"}>
              {brand.status}
            </StatusBadge>,
          ];
        })}
      />
    </div>
  );
}
