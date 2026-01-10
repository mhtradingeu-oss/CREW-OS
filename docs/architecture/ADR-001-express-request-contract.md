# ADR-001: Express Request Contract Lock

## Status
ACCEPTED — LOCKED

## Context
The system experienced repeated TypeScript and Express incompatibilities caused by
narrowing the Express Request type using custom interfaces (e.g. AuthenticatedRequest).

This resulted in:
- Route handler signature mismatches
- Middleware incompatibility
- Massive cross-domain failures

## Decision
We adopt a SINGLE, FINAL Express request contract:

- All handlers use Express.Request
- All extensions are applied via declaration merging only
- No custom Request types are allowed

Canonical extension file:
src/types/express.d.ts

## Rules (Hard Constraints)
- AuthenticatedRequest is permanently forbidden
- No generic or narrowed Request types
- No casting hacks
- Applies to ALL domains and future OS

## Consequences
- TypeScript and Express remain aligned
- Middleware pipelines are stable
- New OS can be added safely without refactors

## Change Policy
This decision can ONLY be changed by:
- Explicit Architect approval
- New ADR superseding this one

Unauthorized changes are invalid.
