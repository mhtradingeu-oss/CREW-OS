# MH-OS SUPERAPP  
## Frontend Architecture & Visual System Blueprint  
### Phase 4 — Unified Architecture (FINAL)

---

# 0. Purpose
This document defines the **official, unified, canonical frontend architecture** for the MH-OS SUPERAPP.  
Every engineer, AI agent, designer, and PM must follow this blueprint.

---

# 1. Global Constraints
- Work ONLY inside:  
  - `apps/front-end`  
  - `packages/shared`  
  - `docs/`  
- DO NOT change backend routes, schemas, or business logic.  
- All frontend must be **TypeScript strict**.  
- Must support:  
  - Tenants, Brands, Plans, Personas  
  - All OS modules  
  - AI Layer (agents, autonomy, safety)  
  - Virtual Office (2D)  
  - SuperAdmin control-plane  
- Build must remain **green**.

---

# 2. Workspace & Framework
- Workspace: `mh-os-admin`  
- Framework: Next.js 16 App Router  
- State: React Query + Context  
- Styling: TailwindCSS  
- API: axios client with JWT interceptors  

---

# 3. Directory & Routing Strategy
```
apps/front-end/app/
  (public)        → Public pages
  (auth)          → Login/Register/Forgot
  (dashboard)     → TenantAppLayout (main shell)
  superadmin/     → SuperAdminLayout
```

### Layout Hierarchy
- `app/layout.tsx` → Providers  
- `(public)` → PublicLayout  
- `(auth)` → AuthLayout  
- `(dashboard)` → TenantAppLayout (unified shell)  
- `/superadmin/*` → SuperAdminLayout  

---

# 4. Tenant App Shell (Main UX)

### Sidebar Modules
- Dashboard  
- Pricing OS  
- Marketing OS  
- CRM  
- Partner/Dealer/Stand  
- Inventory  
- Loyalty  
- Media Studio  
- Support/Knowledge  
- Virtual Office  
- Settings  

### Topbar
- Tenant switcher  
- Breadcrumb  
- Search  
- Command Palette hotkey (Ctrl/Cmd+K)  
- Ask Hairo (global assistant drawer, safe-mode)  
- Notifications  
- Theme toggle  
- User Menu  

---

# 5. UI Components (Standardized)
- PageHeader  
- StatCard  
- ModuleScaffold  
- TableWithToolbar (all tables must use toolbar/search/filters)  
- Tabs  
- Modal + Drawer (with motion)  
- Form primitives  
- AI Panels + AI Recommendation blocks  
- EmptyState / LoadingState / ErrorState  

---

# 6. OS Module Blueprint (Universal)
Each module must implement:

### 1) Dashboard
- KPIs  
- AI Insights  
- Activity  
- Quick actions  

### 2) List View
- Table + search + filters  

### 3) Detail View (Tabs)
- Overview  
- AI  
- Activity  
- Settings  

### 4) AI Requirements
- Ask AI Button  
- AI Drawer  
- AI Tab  
- AI Insights  

---

# 7. Virtual Office (2D)
Mandatory components:
- 2D office map (hover states, tooltips, subtle motion)  
- Meeting room (table + chairs + AI participants, voice-mode placeholder)  
- AI Team Board (cards for every agent)  
- AI Journal (timeline)  
- Voice/chat controls (safe-mode until IVR backend)  

---

# 8. Stand Program UI
- Stand cards with stock indicators (Green/Yellow/Red)  
- 2D stand rack layout  
- Tabs: Inventory, Sales, AI Suggestions, Activity  

---

# 9. SuperAdmin Control Plane
Required pages:
- Overview  
- Tenants  
- Plans  
- Brands  
- Users  
- AI Agents  
- AI Safety  
- AI Monitoring  
- System Health  

---

# 10. State Management
React Query for server state  
AuthProvider for roles/features  
OnboardingStoreProvider for onboarding  

---

# 11. API Client Architecture
Never bypass `lib/api/client`.  
Modules must live under `lib/api/<domain>.ts`.

---

# 12. Plan & Role Gating
Use:
```
hasRole()
hasPermission()
hasFeature()
```

---

# 13. Visual Identity
- Clean SaaS  
- Predictable layouts  
- Consistent components  
- AI-visible-but-safe  
- Virtual HQ as centerpiece  
- SuperAdmin as "Platform Cockpit"  

---

# 14. Roadmap (F0→F6)
- F0 Audit  
- F1 Architecture + Shell  
- F2 Auth + Onboarding  
- F3 OS Modules  
- F4 Virtual Office  
- F5 SuperAdmin  
- F6 Polish + Global AI (Command Palette + Ask Hairo + safe-mode AI actions)  

---

# END OF DOCUMENT (FINAL)
