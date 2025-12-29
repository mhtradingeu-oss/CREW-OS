// PHASE 8.1 — GOVERNANCE UI ONLY
// This interface approves ExecutionIntents.
// It NEVER executes or triggers automation.

import { render, screen } from "@testing-library/react";
import { ApprovalDetail } from "../ApprovalDetail.tsx";
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

describe("ApprovalDetail UI", () => {
  it("renders without crashing", () => {
    renderWithProviders(<ApprovalDetail />);
    expect(screen.getByText(/Execution Intent Detail/i)).toBeInTheDocument();
  });
  // No approve/execute button exists if not permitted
  it("does not render forbidden actions", () => {
    renderWithProviders(<ApprovalDetail />);
    expect(screen.queryByText(/Run now|Execute|Apply|Schedule/i)).toBeNull();
  });
});
