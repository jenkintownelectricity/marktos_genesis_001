# Roofio Data Central

**Documents ARE the data.** Single source of truth for roofing project management.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA CENTRAL ARCHITECTURE                          │
│                                                                              │
│   DOCUMENTS ──────▶ AI PARSER ──────▶ EVENT BUS ──────▶ 13 AI ROLES         │
│   (Source)         (Extraction)       (Propagation)     (Consumers)          │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Core Concept

Instead of 13 separate data entry points, Roofio uses:
- **Parsed documents** that feed the entire system
- **Event-driven propagation** that instantly updates all roles
- **Version control** with AI-powered diff detection
- **Role-based views** showing relevant data per user

## The 13 AI Roles

| Role | Priority Documents | Key Metrics |
|------|-------------------|-------------|
| **Estimator** | Scope, Drawings | Budget, SF, CO Impact |
| **Project Manager** | Scope, Assembly, Submittals | Pending Items, Schedule |
| **Detailer** | Drawings, Assembly | SF, Penetrations, Drains |
| **Superintendent** | Specs, Assembly | Install Sequence, Crew |
| **Safety Officer** | Specs, MSDS | Hazards, PPE, Incidents |
| **QC** | Specs, Assembly | Components, Checklist |
| **Accounts** | Contract, SOV, Pay Apps | Billing, Retainage |
| **HR/Workforce** | Daily Logs | Crew Counts, Certs |
| **Foreman** | Daily Logs, Specs | Daily Work, Materials |
| **Sales** | Contracts, Warranty | Pipeline, Wins |
| **Marketing** | Photos, Closeout | Portfolio, Case Studies |
| **Warranty** | Warranty Docs | Claims, Expirations |
| **Owner** | All Financials | Budget, Schedule, % Complete |

## Document Types & What They Feed

```typescript
const DOCUMENT_TYPES = {
  contract:        ['estimator', 'pm', 'accounts', 'owner'],
  scope:           ['estimator', 'pm', 'detailer', 'superintendent', 'qc'],
  drawing:         ['estimator', 'detailer', 'superintendent', 'qc'],
  specification:   ['qc', 'safety', 'detailer', 'pm'],
  assembly_letter: ['pm', 'superintendent', 'qc', 'detailer'],
  submittal:       ['pm', 'detailer', 'qc'],
  change_order:    ['estimator', 'pm', 'accounts', 'superintendent', 'owner'],
  daily_log:       ['superintendent', 'foreman', 'safety', 'pm', 'hr'],
  pay_application: ['accounts', 'pm', 'owner'],
  bond:            ['accounts', 'pm'],
  insurance:       ['accounts', 'pm', 'safety'],
  msds:            ['safety', 'superintendent', 'foreman'],
  warranty:        ['warranty', 'pm', 'owner'],
  closeout:        ['pm', 'accounts', 'owner'],
};
```

## Quick Start

```bash
# Clone repository
git clone https://github.com/jenkintownelectricity/fire_proof_assistant.git
cd fire_proof_assistant/roofio

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Project Structure

```
roofio/
├── src/
│   ├── core/
│   │   ├── types.ts              # Core type definitions
│   │   ├── parser/
│   │   │   └── documentParser.ts # AI document extraction
│   │   ├── events/
│   │   │   └── eventBus.ts       # Event propagation system
│   │   └── diff/
│   │       └── versionDiff.ts    # Version comparison engine
│   ├── roles/
│   │   ├── estimator/
│   │   ├── pm/
│   │   ├── detailer/
│   │   ├── superintendent/
│   │   ├── safety/
│   │   ├── qc/
│   │   ├── accounts/
│   │   ├── hr/
│   │   ├── foreman/
│   │   ├── sales/
│   │   ├── marketing/
│   │   ├── warranty/
│   │   └── owner/
│   ├── data/
│   │   ├── schemas/
│   │   └── migrations/
│   │       ├── 001_core_tables.sql
│   │       └── 002_role_views.sql
│   ├── api/
│   └── ui/
│       ├── components/
│       └── views/
├── docs/
├── tests/
└── README.md
```

## Event Propagation

When a document is uploaded or changed, events propagate automatically:

```typescript
// Example: Scope Rev 2 uploaded
await eventBus.emitDocumentEvent(
  EventType.DOCUMENT_VERSION_CHANGED,
  projectId,
  'scope',
  documentId,
  userId,
  {
    oldVersion: 'Rev 1',
    newVersion: 'Rev 2',
    changesSummary: 'R-30 insulation (was R-25), 4 additional drains'
  }
);

// Automatically notifies: estimator, pm, detailer, superintendent, accounts, owner
```

## Version Diff Engine

AI-powered comparison between document versions:

```typescript
const diff: VersionDiff = {
  oldVersion: 'Rev 1',
  newVersion: 'Rev 2',
  changes: [
    {
      type: 'modified',
      field: 'contract_sum',
      oldValue: 1185000,
      newValue: 1247500,
      impact: 'high',
      affectedData: ['sov.total', 'estimates.budget']
    },
    {
      type: 'modified',
      field: 'insulation_r_value',
      oldValue: 'R-25',
      newValue: 'R-30',
      impact: 'medium',
      affectedData: ['specs.insulation', 'qc.checklist']
    }
  ],
  summary: 'Rev 2 increases contract sum by 5.3% due to R-30 upgrade',
  affectedRoles: ['estimator', 'pm', 'accounts', 'detailer', 'qc']
};
```

## Role-Based Views (SQL)

Each role has a dedicated database view showing only relevant data:

- `pm_project_view` - Pending submittals, COs, priority docs
- `accounts_project_view` - SOV, billing, retainage, blockers
- `estimator_project_view` - Budget analysis, SF, CO impact
- `detailer_project_view` - Drawings, dimensions, version changes
- `superintendent_project_view` - Specs, install sequence, daily logs
- `safety_project_view` - MSDS data, incidents, PPE requirements
- `qc_project_view` - Spec requirements, components, submittals
- `owner_project_view` - Financial summary, schedule status

## Missing Document Detection

The system blocks workflows when required documents are missing:

```typescript
const requirements = [
  { doc: 'bond', blocks: ['pay_app_1'], roles: ['accounts'], level: 'critical' },
  { doc: 'insurance', blocks: ['mobilization'], roles: ['superintendent'], level: 'critical' },
  { doc: 'assembly_letter', blocks: ['submittal_package'], roles: ['pm'], level: 'warning' },
];
```

## Key Competitive Advantages

1. **Documents ARE the Database** - No duplicate data entry
2. **AI-Powered Extraction** - 95%+ accuracy on structured docs
3. **Instant Propagation** - Change contract sum → ALL roles updated
4. **Version Intelligence** - AI detects what changed between revisions
5. **Role-Based Simplicity** - Each user sees only what they need

---

**Roofio** - The World's Smartest Roofer starts at the source of truth: the documents.
