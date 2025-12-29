import { MDXContent } from '@/components/docs/MDXContent';

export default function DocsHome() {
  return (
    <MDXContent>
      {`
# MH-OS SUPERAPP Documentation

MH-OS is an enterprise-grade, governance-first operating system for modern organizations. It provides a unified control plane, modular architecture, and strict governance protocols for mission-critical business processes.

## Core Principles
- **Governance-first:** Every action is auditable, approvable, and risk-aware.
- **Modular:** Each domain is isolated, composable, and upgradable.
- **Enterprise Trust:** Security, compliance, and transparency are non-negotiable.

## Governance Philosophy
MH-OS enforces decision authority, audit trails, and risk management at every layer. The system is designed for organizations where trust, compliance, and operational clarity are paramount.
      `}
    </MDXContent>
  );
}
