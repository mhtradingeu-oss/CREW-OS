import { BrandThemeProvider, BrandTheme, BrandBadge } from "@/components/white-label";
import { Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import React from "react";

const demoBrand: BrandTheme = {
  name: "Acme Widgets",
  logoUrl: undefined, // Placeholder
  primary: "#2563eb",
  secondary: "#f59e42",
  surface: "#f7f8fa",
  text: "#1e293b",
};

export default function WhiteLabelPreviewPage() {
  return (
    <BrandThemeProvider brand={demoBrand}>
      <div className="min-h-screen flex flex-col bg-[var(--brand-surface)] text-[var(--brand-text)]">
        <div className="w-full bg-[var(--brand-primary)] text-white py-2 px-4 text-center font-semibold">
          White-label preview only (V1)
        </div>
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-64 bg-[var(--brand-secondary)] text-[var(--brand-text)] flex flex-col items-center py-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-[var(--brand-primary)]">
              {/* Logo placeholder */}
              <span className="text-2xl font-bold text-[var(--brand-primary)]">Logo</span>
            </div>
            <BrandBadge brand={demoBrand} />
            <nav className="mt-8 space-y-2 w-full px-4">
              <Button className="w-full mb-2" style={{ background: "var(--brand-primary)", color: "#fff" }}>Dashboard</Button>
              <Button className="w-full" variant="outline" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}>Settings</Button>
            </nav>
          </aside>
          {/* Main content */}
          <main className="flex-1 p-8 space-y-8">
            <div className="flex items-center space-x-4">
              <Button style={{ background: "var(--brand-primary)", color: "#fff" }}>Primary Button</Button>
              <Button variant="outline" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}>Secondary Button</Button>
              <Badge style={{ background: "var(--brand-secondary)", color: "#fff" }}>Brand Badge</Badge>
            </div>
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Jane Doe</TableCell>
                    <TableCell><Badge style={{ background: "var(--brand-primary)", color: "#fff" }}>Active</Badge></TableCell>
                    <TableCell>Admin</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>John Smith</TableCell>
                    <TableCell><Badge style={{ background: "var(--brand-secondary)", color: "#fff" }}>Invited</Badge></TableCell>
                    <TableCell>User</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </main>
        </div>
      </div>
    </BrandThemeProvider>
  );
}
