# MARKTOS GENESIS 001

## The 25-Layer Marketing Genome Platform

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███╗   ███╗ █████╗ ██████╗ ██╗  ██╗████████╗ ██████╗ ███████╗             ║
║   ████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝╚══██╔══╝██╔═══██╗██╔════╝             ║
║   ██╔████╔██║███████║██████╔╝█████╔╝    ██║   ██║   ██║███████╗             ║
║   ██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗    ██║   ██║   ██║╚════██║             ║
║   ██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗   ██║   ╚██████╔╝███████║             ║
║   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝             ║
║                                                                              ║
║                    GENESIS 001 | APP v1.1.0 | KERNEL v1.0.0                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Document ID:** VK-MARKTOS-SPEC-2026-001
**Status:** AUTHORIZED
**Classification:** PUBLIC RELEASE

---

## TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [What's New in v1.1](#whats-new-in-v11)
3. [Data Tools Guide](#data-tools-guide)
4. [Kernel Specification](#kernel-specification)
5. [25-Layer Genome Architecture](#25-layer-genome-architecture)
6. [LDS.json File Type Specification](#ldsjson-file-type-specification)
7. [ValidKernel OneShot Command™](#validkernel-oneshot-command)
8. [User Guide](#user-guide)
9. [API Reference](#api-reference)
10. [License](#license)

---

## QUICK START

### Installation

No installation required. Zero dependencies. Zero build step.

```bash
# Clone repository
git clone https://github.com/jenkintownelectricity/fire_proof_assistant.git

# Navigate to MARKTOS
cd fire_proof_assistant/marktos_genesis_001

# Open in browser (Option 1: Direct)
# Double-click index.html

# Open in browser (Option 2: HTTP Server)
python -m http.server 8080
# Visit http://localhost:8080
```

### Windows PowerShell

```powershell
cd D:\APP_CENTRAL\marktos_genesis_001
python -m http.server 8080
```

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Browser | Chrome 90+ / Firefox 88+ / Safari 14+ | Latest stable |
| JavaScript | ES6+ | ES2020+ |
| Screen | 1024x768 | 1920x1080 |
| Network | None (offline capable) | Broadband for CDN |

---

## WHAT'S NEW IN v1.1

### Release: January 17, 2026

MARKTOS v1.1 introduces **Data Tools** - a suite of offline-first data management features:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA TOOLS v1.1                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  📤 Export LDS.json     One-click backup to downloadable file              │
│  📥 Import LDS.json     Restore from backup file                           │
│  💬 Chat Parser         Paste text, auto-extract leads/contacts            │
│  🔗 Share via Link      Generate shareable URL with embedded data          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### New Features

| Feature | Description | Offline |
|---------|-------------|---------|
| **Export LDS.json** | Download complete backup of campaigns, leads, workflows | ✅ Yes |
| **Import LDS.json** | Restore data from backup file | ✅ Yes |
| **Chat Parser** | Paste text (emails, names, companies) to auto-create leads | ✅ Yes |
| **Share via Link** | Generate URL containing encoded data (no server needed) | ✅ Yes |
| **localStorage Persistence** | Data automatically saved locally | ✅ Yes |
| **PWA Support** | Install to home screen on iOS/Android | ✅ Yes |

### Upgrade Notes

- No breaking changes from v1.0
- Data from v1.0 sessions will be preserved
- All new features accessible from **Data Tools** sidebar section

---

## DATA TOOLS GUIDE

### Export LDS.json

Create a complete backup of your MARKTOS data.

**How to use:**
1. Click **📤 Export LDS.json** in the Data Tools sidebar
2. Review data summary (campaigns, leads, workflows count)
3. Click **Download Backup**
4. File saves as `marktos_backup_YYYY-MM-DD.lds.json`

**Export format:**
```json
{
  "$schema": "marktos-lds-v1",
  "version": "1.1.0",
  "exported": "2026-01-17T12:00:00.000Z",
  "kernel": {
    "name": "ValidKernel",
    "version": "1.0.0",
    "trust_level": "L0_GOVERNANCE"
  },
  "campaigns": [...],
  "leads": [...],
  "workflows": [...]
}
```

---

### Import LDS.json

Restore data from a backup file.

**How to use:**
1. Click **📥 Import LDS.json** in the Data Tools sidebar
2. Click the upload area or drag-and-drop your `.lds.json` file
3. Data will be validated and imported
4. Views refresh automatically

**Supported formats:**
- MARKTOS LDS.json exports
- Any JSON with `campaigns`, `leads`, or `workflows` arrays

⚠️ **Warning:** Import replaces current data. Export first if needed.

---

### Chat Parser

Quickly add leads by pasting text from any source (emails, chat logs, spreadsheets).

**How to use:**
1. Click **💬 Chat Parser** in the Data Tools sidebar
2. Paste text containing contact information
3. Click **Parse & Import**
4. Leads are created and added to your pipeline

**Supported formats:**
```
John Doe - Acme Corp
jane.smith@company.com
Mike Wilson, TechStartup Inc
Company: Enterprise Solutions
+1 (555) 123-4567
```

**Parser detects:**
- Email addresses
- Phone numbers
- Names (First Last format)
- Companies (after "-" or "," or "Company:")

---

### Share via Link

Generate a URL containing your data - no server required.

**How to use:**
1. Click **🔗 Share via Link** in the Data Tools sidebar
2. Click **Generate Link**
3. Click **Copy** to copy URL to clipboard
4. Share URL - recipient opens it and data loads automatically

**How it works:**
- Data is Base64 encoded into the URL
- Includes up to 10 campaigns and 50 leads
- Works completely offline
- No server or database required

**Limitations:**
- URLs over 2000 characters may not work in all browsers
- Large datasets should use Export/Import instead

---

### PWA Installation (Mobile)

Install MARKTOS as an app on your phone or tablet.

**iOS (Safari):**
1. Open MARKTOS in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android (Chrome):**
1. Open MARKTOS in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home screen" or "Install app"
4. Tap "Add"

**Desktop (Chrome/Edge):**
1. Look for install icon in address bar
2. Click "Install"

---

## KERNEL SPECIFICATION

### Kernel Identity

| Property | Value |
|----------|-------|
| **Kernel Name** | ValidKernel |
| **Kernel Version** | 1.0.0 |
| **Kernel Type** | Deterministic Trust Infrastructure |
| **Release Date** | January 16, 2026 |
| **Codename** | GENESIS |

### Kernel Invariants

The ValidKernel enforces four immutable invariants:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ IV.01: TRUST HIERARCHY                                                      │
│ ───────────────────────────────────────────────────────────────────────────│
│ Authority flows: L0 → L1 → L2, NEVER upward.                               │
│ L0 (Governance) commands are absolute.                                      │
│ L1 (Kernel) validates and enforces.                                         │
│ L2 (Proposer) executes within boundaries.                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ IV.02: CHECK-THEN-ACT                                                       │
│ ───────────────────────────────────────────────────────────────────────────│
│ Every action is validated before execution.                                 │
│ No action proceeds without explicit permission check.                       │
│ Failed checks result in immediate rejection.                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ IV.03: DETERMINISTIC BOUNDARIES                                             │
│ ───────────────────────────────────────────────────────────────────────────│
│ Same input MUST produce same output.                                        │
│ No hidden state. No side effects outside declared scope.                    │
│ All transformations are traceable and reproducible.                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ IV.04: ROLE-BASED PERMISSIONS                                               │
│ ───────────────────────────────────────────────────────────────────────────│
│ 6 roles with explicit permission matrix.                                    │
│ Permissions are additive, never subtractive.                                │
│ Role escalation requires L0 authorization.                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Trust Levels

| Level | Name | Authority | Scope |
|-------|------|-----------|-------|
| L0 | GOVERNANCE | Absolute | System-wide policy, kernel updates |
| L1 | KERNEL | Enforcement | Invariant enforcement, validation |
| L2 | PROPOSER | Execution | Task execution within boundaries |

### Role Permission Matrix

| Role | Level | Permissions |
|------|-------|-------------|
| `super_admin` | 0 | `*` (all permissions) |
| `admin` | 1 | `campaign:*`, `contact:*`, `settings:read` |
| `manager` | 2 | `campaign:create`, `campaign:send`, `contact:read` |
| `editor` | 3 | `campaign:create`, `template:edit` |
| `analyst` | 4 | `report:*`, `analytics:read` |
| `viewer` | 5 | `read:*` |

### Kernel Technical Specifications

```
KERNEL SPEC SHEET
═══════════════════════════════════════════════════════════════════════════════

IDENTITY
  Name:              ValidKernel
  Version:           1.0.0
  Build:             GENESIS-001
  Architecture:      Deterministic Trust Infrastructure

RUNTIME
  Environment:       Browser (ES6+ JavaScript)
  Dependencies:      0 (zero external runtime dependencies)
  Build Required:    No
  Offline Capable:   Yes

INVARIANTS
  Count:             4
  Enforcement:       Runtime (continuous)
  Violation Policy:  Fail-closed (reject on violation)

TRUST HIERARCHY
  Levels:            3 (L0, L1, L2)
  Direction:         Top-down only
  Escalation:        L0 authorization required

PERMISSIONS
  Model:             Role-Based Access Control (RBAC)
  Roles:             6
  Granularity:       Action-level

SECURITY
  Encryption:        N/A (client-side, no transmission)
  Data Storage:      Local (browser memory / localStorage)
  Session:           Stateless

PERFORMANCE
  Initial Load:      < 100ms
  Time to Interactive: < 150ms
  Memory Footprint:  < 10MB

═══════════════════════════════════════════════════════════════════════════════
```

---

## 25-LAYER GENOME ARCHITECTURE

MARKTOS implements a 25-layer marketing genome architecture:

### Layer Overview

```
LAYER GENOME MAP
═══════════════════════════════════════════════════════════════════════════════

FOUNDATION (L0-L4)
├── L0:  Kernel Monitor        - ValidKernel trust infrastructure
├── L1:  Identity              - Contact genome management
├── L2:  Segmentation          - Audience gene splicing
├── L3:  Data Architecture     - Unified profile proteins
└── L4:  Channels              - Communication cells

CONTENT & AUTOMATION (L5-L8)
├── L5:  Content Engine        - Template RNA
├── L6:  Personalization       - Dynamic enzymes
├── L7:  Campaigns             - Orchestration organs
└── L8:  Automation            - Workflow nervous system

LEAD MANAGEMENT (L9-L12)
├── L9:  Lead Capture          - Circulatory intake
├── L10: Lead Scoring          - Propensity scoring engine
├── L11: A/B Testing           - Optimization immune system
└── L12: Analytics             - Intelligence brain

COMPLIANCE & DELIVERY (L13-L16)
├── L13: Compliance            - Regulatory skeleton
├── L14: Integrations          - Connective tissue
├── L15: Deliverability        - Lymphatic system
└── L16: Audience Intelligence - Cognitive system

REVENUE & STRATEGY (L17-L20)
├── L17: Revenue Intelligence  - Metabolic system
├── L18: Attribution           - Digestive system
├── L19: Journey Orchestration - Choreographic system
└── L20: Account-Based Marketing - Strategic system

PLATFORM (L21-L25)
├── L21: Experiments           - Laboratory system
├── L22: Real-Time Processing  - Reactive system
├── L23: Privacy Management    - Ethical system
├── L24: Governance            - Administrative system
└── L25: Economics             - Financial system

═══════════════════════════════════════════════════════════════════════════════
```

### Layer Health Status Codes

| Status | Color | Meaning |
|--------|-------|---------|
| `healthy` | Green | Operating within normal parameters |
| `warning` | Yellow | Degraded performance or attention needed |
| `critical` | Red | Immediate intervention required |

---

## LDS.JSON FILE TYPE SPECIFICATION

### Overview

LDS (Lightning Data Service) is a deterministic JSON schema for structured data exchange.

```
LDS.JSON SPECIFICATION
═══════════════════════════════════════════════════════════════════════════════

FILE TYPE
  Extension:         .lds.json
  MIME Type:         application/vnd.validkernel.lds+json
  Encoding:          UTF-8
  Version:           1.0.0

STRUCTURE
  Root:              Object
  Required Fields:   name, version, collections
  Optional Fields:   description, author, created, modified

VALIDATION
  Schema:            JSON Schema Draft 2020-12
  Strict Mode:       Enabled (unknown properties rejected)

═══════════════════════════════════════════════════════════════════════════════
```

### Schema Structure

```json
{
  "name": "string (required)",
  "version": "string (semver, required)",
  "description": "string (optional)",
  "author": "string (optional)",
  "created": "ISO 8601 datetime (optional)",
  "modified": "ISO 8601 datetime (optional)",
  "collections": {
    "<collection_name>": {
      "fields": [
        {
          "name": "string (required)",
          "type": "string|number|boolean|date|array|object (required)",
          "required": "boolean (default: false)",
          "unique": "boolean (default: false)",
          "indexed": "boolean (default: false)",
          "default": "any (optional)",
          "validation": "regex pattern (optional)"
        }
      ],
      "relationships": [
        {
          "type": "one-to-one|one-to-many|many-to-many",
          "target": "collection_name",
          "field": "local_field",
          "targetField": "remote_field"
        }
      ]
    }
  }
}
```

### Example LDS.json File

```json
{
  "name": "marktos-marketing-genome",
  "version": "1.0.0",
  "description": "Marketing automation data schema",
  "author": "ValidKernel",
  "created": "2026-01-16T00:00:00Z",
  "collections": {
    "contacts": {
      "fields": [
        { "name": "id", "type": "string", "required": true, "unique": true },
        { "name": "email", "type": "string", "required": true, "indexed": true },
        { "name": "name", "type": "string", "required": true },
        { "name": "company", "type": "string" },
        { "name": "score", "type": "number", "default": 0 },
        { "name": "stage", "type": "string", "default": "new" },
        { "name": "created", "type": "date" }
      ]
    },
    "campaigns": {
      "fields": [
        { "name": "id", "type": "string", "required": true, "unique": true },
        { "name": "name", "type": "string", "required": true },
        { "name": "type", "type": "string", "required": true },
        { "name": "status", "type": "string", "default": "draft" },
        { "name": "sent", "type": "number", "default": 0 },
        { "name": "opens", "type": "number", "default": 0 },
        { "name": "clicks", "type": "number", "default": 0 }
      ]
    },
    "workflows": {
      "fields": [
        { "name": "id", "type": "string", "required": true, "unique": true },
        { "name": "name", "type": "string", "required": true },
        { "name": "trigger", "type": "string", "required": true },
        { "name": "steps", "type": "number", "default": 0 },
        { "name": "active", "type": "boolean", "default": false }
      ]
    }
  }
}
```

### Supported Data Types

| Type | Description | JavaScript Equivalent |
|------|-------------|----------------------|
| `string` | Text data | `String` |
| `number` | Numeric data (integer or float) | `Number` |
| `boolean` | True/false | `Boolean` |
| `date` | ISO 8601 datetime | `Date` |
| `array` | Ordered list | `Array` |
| `object` | Key-value pairs | `Object` |

### LDS.json Best Practices

1. **Always include version** - Enables schema migration
2. **Use lowercase collection names** - Consistency across systems
3. **Index frequently queried fields** - Performance optimization
4. **Define relationships explicitly** - Clear data model
5. **Include created/modified timestamps** - Audit trail

---

## VALIDKERNEL ONESHOT COMMAND™

### Trademark Notice

**ValidKernel OneShot Command™** is a trademark of Valid Kernel.

### Definition

A **ValidKernel OneShot Command™** is a single, authoritative instruction that:

1. Executes a complete task from start to finish
2. Requires no intermediate user input
3. Produces deterministic, reproducible results
4. Adheres to all kernel invariants

### Command Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VALIDKERNEL ONESHOT COMMAND™ STRUCTURE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [AUTHORITY DECLARATION]                                                   │
│   ├── Trust Level (L0/L1/L2)                                               │
│   ├── Role Identifier                                                       │
│   └── Permission Scope                                                      │
│                                                                             │
│   [COMMAND BODY]                                                            │
│   ├── Action Verb (imperative)                                             │
│   ├── Target Object                                                         │
│   ├── Parameters                                                            │
│   └── Constraints                                                           │
│                                                                             │
│   [EXECUTION CONTEXT]                                                       │
│   ├── Environment Variables                                                 │
│   ├── Resource Limits                                                       │
│   └── Timeout                                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Example OneShot Commands

```bash
# Deploy MARKTOS locally
ValidKernel OneShot: Deploy marktos_genesis_001 to localhost:8080

# Generate campaign report
ValidKernel OneShot: Generate Q1 campaign performance report as PDF

# Create automation workflow
ValidKernel OneShot: Create welcome series workflow with 5 emails
```

### OneShot Execution Guarantee

When a ValidKernel OneShot Command™ is issued:

- **Atomicity**: Command executes completely or not at all
- **Consistency**: System state remains valid before and after
- **Isolation**: No interference with concurrent operations
- **Durability**: Results persist after command completion

---

## USER GUIDE

### Navigation

The sidebar provides access to all 25 layers organized into 6 categories:

| Category | Layers | Color Code |
|----------|--------|------------|
| Foundation | L0-L4 | Red |
| Content | L5-L8 | Yellow |
| Leads | L9-L12 | Green |
| Compliance | L13-L16 | Blue |
| Revenue | L17-L20 | Purple |
| Platform | L21-L25 | Pink |

### Command Center (Dashboard)

The default view displays:

1. **Genome Health Grid** - 25 blocks showing layer status
2. **Key Metrics** - Contacts, campaigns, emails, pipeline, kernel health
3. **Active Campaigns** - Currently running campaigns
4. **Lead Pipeline** - Stage distribution
5. **Automation Workflows** - Active workflow status
6. **Real-Time Activity** - Live event feed

### Creating a Campaign

1. Click **+ New Campaign** button
2. Enter campaign name
3. Select campaign type (broadcast, automation, triggered, recurring)
4. Click **Create**

### Managing Leads

1. Navigate to **L9: Lead Capture**
2. Click **+ Capture Lead**
3. Enter lead information
4. Lead appears in pipeline under "New" stage

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close modal |
| `D` | Dashboard |
| `K` | Kernel monitor |
| `C` | Campaigns |
| `L` | Leads |

---

## API REFERENCE

### Global Objects

```javascript
// Trust Levels
TRUST_LEVELS = {
  L0_GOVERNANCE: 0,
  L1_KERNEL: 1,
  L2_PROPOSER: 2
}

// Role Definitions
ROLES = {
  super_admin: { level: 0, permissions: ['*'] },
  admin: { level: 1, permissions: ['campaign:*', 'contact:*', 'settings:read'] },
  manager: { level: 2, permissions: ['campaign:create', 'campaign:send', 'contact:read'] },
  editor: { level: 3, permissions: ['campaign:create', 'template:edit'] },
  analyst: { level: 4, permissions: ['report:*', 'analytics:read'] },
  viewer: { level: 5, permissions: ['read:*'] }
}
```

### Core Functions

```javascript
// Navigation
showLayer(layerId: string): void

// Modals
showModal(type: string): void
closeModal(): void

// Notifications
showToast(message: string, type: 'success'|'error'|'info'): void

// Data Operations
createCampaign(event: Event): void
renderCampaigns(containerId: string, limit?: number): void
renderPipeline(containerId: string): void
renderWorkflows(containerId: string, limit?: number): void
renderGenomeGrid(): void
renderActivityFeed(): void
```

---

## LICENSE

### ValidKernel OneShot Command™ License Agreement

**Effective Date:** January 16, 2026

---

#### GRANT OF LICENSE

##### Personal and Educational Use (FREE)

Valid Kernel grants you a non-exclusive, worldwide, royalty-free license to use, copy, and modify MARKTOS Genesis 001 for:

- Personal projects
- Educational purposes
- Academic research
- Non-profit organizations
- Learning and experimentation

**No attribution required for personal use.**

##### Commercial Use (PAID LICENSE REQUIRED)

Commercial use requires a paid license available at:

**https://ValidKernel.com**

Commercial use includes but is not limited to:

- Use in products or services sold to customers
- Use by for-profit organizations
- Use in client work
- Integration into commercial software
- SaaS or hosted service offerings

---

#### TRADEMARKS

The following are trademarks of Valid Kernel:

- **ValidKernel™**
- **ValidKernel OneShot Command™**
- **MARKTOS™**
- **LDS.json™**

Use of these trademarks requires explicit written permission from Valid Kernel.

---

#### INTELLECTUAL PROPERTY

The following remain the sole and exclusive property of Valid Kernel:

1. **Kernel Architecture** - Trust hierarchy, invariant system
2. **25-Layer Genome** - Layer structure and naming
3. **Command Protocol** - L0-L2 trust model
4. **LDS.json Specification** - File format and schema
5. **Source Code** - All code in this repository
6. **Documentation** - All written materials

---

#### WARRANTY DISCLAIMER

THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.

---

#### LIMITATION OF LIABILITY

IN NO EVENT SHALL VALID KERNEL BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM THE USE OF THIS SOFTWARE.

---

#### CONTACT

**Commercial Licensing:** https://ValidKernel.com
**Support:** support@validkernel.com
**GitHub:** @jenkintownelectricity

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                              VALIDKERNEL                                     ║
║                    Deterministic Trust Infrastructure                        ║
║                                                                              ║
║                        "Boring by Design"                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

**Document ID:** VK-MARKTOS-SPEC-2026-001
**Version:** 1.0.0
**Last Updated:** January 16, 2026
**Author:** Valid Kernel
**Status:** AUTHORIZED FOR PUBLIC DISTRIBUTION
