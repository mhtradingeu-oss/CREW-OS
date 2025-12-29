import { BrandThemeProvider } from '@/components/white-label/BrandThemeProvider';
import { Badge, Button, Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';

const brand = {
  name: 'Orbit Phase',
  logo: '', // Placeholder
  primary: '#2563eb',
  secondary: '#f59e42',
  surface: '#f7f8fa',
  text: '#1e293b',
};

export default function WhiteLabelPreviewPage() {
  return (
    <BrandThemeProvider brand={brand}>
      <div className="min-h-screen bg-[var(--brand-surface)] text-[var(--brand-text)] p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold text-2xl">
            {/* Logo Placeholder */}
            {brand.name[0]}
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>{brand.name}</div>
            <Badge className="ml-2" style={{ background: 'var(--brand-secondary)', color: 'white' }}>Brand Context</Badge>
          </div>
        </div>
        <div className="mb-4 rounded-lg bg-amber-100 text-amber-800 px-4 py-2 font-semibold">
          White-label preview only (V1)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-[var(--brand-primary)] text-white">
            <CardHeader>
              <CardTitle>Primary Button</CardTitle>
            </CardHeader>
            <CardContent>
              <Button style={{ background: 'var(--brand-primary)', color: 'white' }}>Primary</Button>
            </CardContent>
          </Card>
          <Card className="bg-[var(--brand-secondary)] text-white">
            <CardHeader>
              <CardTitle>Secondary Button</CardTitle>
            </CardHeader>
            <CardContent>
              <Button style={{ background: 'var(--brand-secondary)', color: 'white' }}>Secondary</Button>
            </CardContent>
          </Card>
        </div>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Badge style={{ background: 'var(--brand-primary)', color: 'white' }}>Primary</Badge>
            <Badge style={{ background: 'var(--brand-secondary)', color: 'white' }}>Secondary</Badge>
            <Badge variant="success">Governance</Badge>
            <Badge variant="warning">Execution Restricted</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Table Example</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Included</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>User Management</TableCell>
                  <TableCell>
                    <Badge style={{ background: 'var(--brand-primary)', color: 'white' }}>Yes</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Custom Branding</TableCell>
                  <TableCell>
                    <Badge variant="warning">Restricted</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </BrandThemeProvider>
  );
}
