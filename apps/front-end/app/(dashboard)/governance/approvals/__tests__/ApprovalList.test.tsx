// PHASE 8.1 — GOVERNANCE UI ONLY
// This interface approves ExecutionIntents.
// It NEVER executes or triggers automation.

import { render, screen } from "@testing-library/react";
import { ApprovalList } from "../ApprovalList";
import { AuthProvider } from "@/lib/auth/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("ApprovalList UI", () => {
  it("renders without crashing", () => {
    renderWithProviders(<ApprovalList />);
    expect(screen.getByText(/Governance/i)).toBeInTheDocument();
  });
  // No approve/execute button exists
  it("does not render forbidden actions", () => {
    renderWithProviders(<ApprovalList />);
    expect(screen.queryByText(/Run now|Execute|Apply|Schedule/i)).toBeNull();
  });
});
