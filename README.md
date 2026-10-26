# Getitresolved — AI-Powered Citizen Complaint Management System

**Getitresolved** is an enterprise-grade municipal citizen complaint management and triage system. It empowers citizens to report civic issues, leverages AI with deterministic fallback for categorization and department routing, scores issues across four objective impact metrics, highlights severe conditions with strictly thresholded star indicators, and provides dedicated role-based operational dashboards for Citizens, Department Staff, and Municipal Administrators.

---

## 1. Architecture & Technologies

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, React Router DOM.
- **Backend:** Node.js, Express, TypeScript, Zod validation, JWT with HTTP-only cookies, Multer (5MB limit, 3 photo max).
- **Database:** PostgreSQL with Prisma ORM, migrations, and idempotent database seeding.
- **AI Classification Engine:** Pluggable AI integration (Gemini/OpenAI) with deterministic keyword & heuristic rule-based fallback when keys are absent or services time out.
- **Single-Origin Production Model:** Express serves both the compiled Vite SPA assets (`dist/client`) and REST API (`/api`), ensuring no CORS issues, proper SPA route fallback, and instant deployment.
- **Testing:** Built-in `node:test` + TypeScript test runner for unit and integration testing; Playwright with headless Chromium for browser journeys.

---

## 2. Seeded Demo Accounts & Credentials

The system comes pre-seeded with realistic fictional data covering all categories, lifecycles, and scoring combinations. You can test each role using these credentials or use the **"Demo Logins"** 1-click fill button in the application navbar:

| Role | Account Name | Email Address | Password | Permissions & Queue Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Elena Rostova | `admin@civicresolve.gov` | `Admin123!` | System overview, all complaints, manual review queue, score overrides, staff assignment, audit history. |
| **Staff (Roads)** | Marcus Vance | `staff.roads@civicresolve.gov` | `Staff123!` | Roads & Public Works queue (potholes, asphalt damage, sidewalks). |
| **Staff (Electrical)** | Sophia Chen | `staff.electrical@civicresolve.gov` | `Staff123!` | Electrical & Streetlighting queue (dark streets, pole damage, wiring). |
| **Staff (Water)** | David Okafor | `staff.water@civicresolve.gov` | `Staff123!` | Water Supply queue (pipe bursts, pressure drops, contamination). |
| **Staff (Drainage)** | Amara Patel | `staff.drainage@civicresolve.gov` | `Staff123!` | Drainage & Sewage queue (clogged catch basins, sewer stench). |
| **Staff (Sanitation)** | Liam O’Connor | `staff.sanitation@civicresolve.gov` | `Staff123!` | Sanitation queue (illegal dumping, overflowing public trash). |
| **Citizen** | Jane Doe | `citizen.jane@example.com` | `Citizen123!` | Submit complaints with photos, track status, view department assignments and progress notes. |
| **Citizen** | John Smith | `citizen.john@example.com` | `Citizen123!` | Submit complaints, track personal complaints. |

---

## 3. Operational Dashboards & Practical Data Visuals

### 3.1. Role-Based Dashboard Architecture

```mermaid
flowchart TD
    subgraph Citizen["Citizen Portal Dashboard"]
        C1["Metrics: Active Reports, Resolved, In Review"]
        C2["Incident Intake Form: Geolocation, Categorization, 3x Photos"]
        C3["Live Tracking Table: Unique Ref, Dynamic Timeline, Star Indicators"]
    end

    subgraph Staff["Department Staff Operational Queue"]
        S1["Jurisdiction Backlog: Filtered by Assigned Department"]
        S2["Triage Prioritization: Sorted by Core Score & Severe Stars"]
        S3["Workflow Actions: Claim -> In Progress -> Resolve with Notes"]
    end

    subgraph Admin["Municipal Administrator Command Center"]
        A1["Executive KPIs: Total Volume, Resolution Rate, Avg SLA"]
        A2["Manual Review Queue: AI Confidence Diverted Issues (< 0.75)"]
        A3["Governance: Staff Management, Score Overrides & Audit Trail"]
    end

    Citizen -->|"REST API (/api/complaints)"| CoreSystem["Getitresolved Core Engine"]
    CoreSystem --> Staff
    CoreSystem --> Admin
```

### 3.2. Practical Data Dashboards

#### 👤 Citizen Dashboard (Active Reports & Status Triage)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CITIZEN PORTAL DASHBOARD — Authenticated: Jane Doe (citizen.jane@example.com)                          │
├──────────────────────────┬──────────────────────────┬──────────────────────────┬───────────────────────┤
│ Active Reports: 2        │ In Progress: 1           │ Resolved: 3              │ Total Filed: 5        │
└──────────────────────────┴──────────────────────────┴──────────────────────────┴───────────────────────┘
```

| Reference ID | Incident Description | Department | Filed Date | Priority | Urgency | Duration | Core Score | Star Flags | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `CR-882140` | Deep pothole on 4th Ave bus lane | Roads & Works | 24d ago | 8.2 | 7.5 | 8.0 | **7.9** | 🔴 🟠 🌸 | `IN_PROGRESS` |
| `CR-910442` | Streetlight flickering at Elm St | Electrical | 6d ago | 4.0 | 5.0 | 2.0 | **4.1** | — | `ASSIGNED` |
| `CR-774019` | Water main rupture flooding curb | Water Supply | 32d ago | 9.0 | 9.5 | 10.0 | **9.3** | 🔴 🟠 🌸 | `RESOLVED` |

---

#### 🛠️ Department Staff Queue (Operational Triage & Remediation)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ DEPARTMENT QUEUE — Water Supply Division (David Okafor)                                                │
├──────────────────────────┬──────────────────────────┬──────────────────────────┬───────────────────────┤
│ Assigned Backlog: 8      │ Under Investigation: 4   │ Resolved This Month: 27  │ Median SLA: 4.2 Days  │
└──────────────────────────┴──────────────────────────┴──────────────────────────┴───────────────────────┘
```

| Queue Priority | Reference | Incident Location | Unresolved Age | Severity Flags | AI Confidence | Workflow Action |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **P1 — Critical** | `CR-940112` | 14th & River Blvd | 2d ago | 🔴 Red · 🟠 Orange | 0.94 (Gemini) | `[Claim & Begin Work]` |
| **P2 — Urgent** | `CR-882190` | 822 Maple Ave | 18d ago | 🔴 Red | 0.88 (Gemini) | `[Add Field Inspection]` |
| **P3 — Standard** | `CR-903421` | High Street Hydrant | 4d ago | — | 0.82 (Rule-Based) | `[Update Status / Notes]` |

---

#### 🏛️ Municipal Administrator Command Center (Executive Governance)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MUNICIPAL EXECUTIVE DASHBOARD — System Overview & Governance (Elena Rostova)                           │
├──────────────────────────┬──────────────────────────┬──────────────────────────┬───────────────────────┤
│ Total Municipal Issues   │ Manual Review Queue      │ Dept Resolution Rate     │ Active Staff Members  │
│ 1,482                    │ 7 Pending Review         │ 91.4% (30-day window)    │ 34 Personnel          │
└──────────────────────────┴──────────────────────────┴──────────────────────────┴───────────────────────┘
```

##### AI Manual Review & Triage Diverted Issues
| Incident Ref | Citizen Input Summary | Detected Keywords | Confidence | Fallback Diagnostic Reason | Admin Action |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `CR-951004` | "Strange chemical odor near playground fence" | `smell`, `ground` | **0.61** | Ambiguous category (`< 0.75`) | `[Assign: Sanitation]` |
| `CR-951012` | "Metal box buzzing loudly near sidewalk" | `buzzing`, `box` | **0.58** | Unmapped municipal asset | `[Assign: Electrical]` |

---

### 3.3. Relational Entity-Relationship Data Model

```mermaid
erDiagram
    USER ||--o{ COMPLAINT : "files"
    USER ||--o{ AUDIT_LOG : "triggers"
    USER ||--o{ SCORE_OVERRIDE : "authorizes"
    DEPARTMENT ||--o{ USER : "employs"
    DEPARTMENT ||--o{ COMPLAINT : "handles"
    COMPLAINT ||--o{ ATTACHMENT : "contains"
    COMPLAINT ||--o{ AUDIT_LOG : "generates"
    COMPLAINT ||--o{ SCORE_OVERRIDE : "receives"

    USER {
        string id PK
        string email UK
        string name
        string role
        string departmentId FK
        datetime createdAt
    }

    DEPARTMENT {
        string id PK
        string name UK
        string code UK
        string description
    }

    COMPLAINT {
        string id PK
        string referenceNumber UK
        string title
        string description
        string address
        string category
        string status
        float priorityScore
        float urgencyScore
        float durationScore
        float feasibilityScore
        float coreScore
        boolean isFlaggedForReview
        string userId FK
        string departmentId FK
        datetime resolvedAt
        datetime createdAt
    }

    ATTACHMENT {
        string id PK
        string complaintId FK
        string fileUrl
        string originalName
        int sizeBytes
        string mimeType
    }

    AUDIT_LOG {
        string id PK
        string complaintId FK
        string actorId FK
        string action
        string details
        datetime timestamp
    }

    SCORE_OVERRIDE {
        string id PK
        string complaintId FK
        string adminId FK
        string factor
        float originalScore
        float overriddenScore
        string reason
        datetime timestamp
    }
```

---

### 3.4. Complaint Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Citizen submits complaint
    SUBMITTED --> ASSIGNED : AI or Deterministic match (Confidence >= 0.75)
    SUBMITTED --> MANUAL_REVIEW : Low confidence (< 0.75) or Category OTHER
    MANUAL_REVIEW --> ASSIGNED : Administrator assigns department
    ASSIGNED --> IN_PROGRESS : Department staff claims issue
    IN_PROGRESS --> RESOLVED : Staff completes remediation & enters notes
    IN_PROGRESS --> ASSIGNED : Department reassignment
    RESOLVED --> CLOSED : Administrative archive or citizen acknowledgment
    CLOSED --> [*]
```

---

### 3.5. End-to-End Data Transaction Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Client as Frontend SPA
    participant API as Express API Server
    participant AI as Gemini or Rule Engine
    participant DB as PostgreSQL (Prisma)
    actor Staff as Dept Staff

    Citizen->>Client: Fill complaint and attach photos
    Client->>API: POST /api/complaints
    API->>API: Zod schema and attachment validation
    API->>AI: Classify(title, description, photos)
    alt High Confidence (>= 0.75)
        AI-->>API: Category + Priority + Urgency
        API->>DB: Persist with status ASSIGNED
    else Low Confidence (< 0.75) or OTHER
        AI-->>API: Ambiguous categorization
        API->>DB: Persist with status SUBMITTED (Review Required)
    end
    API-->>Client: Return 201 Created (Reference CR-XXXXXX)
    Client-->>Citizen: Display Confirmation and Tracking Link
    Staff->>API: GET /api/complaints?department=Water
    API->>DB: Query department records
    DB-->>API: Return scoped complaints
    API-->>Staff: Render Staff Queue
```

---

## 4. Quick Start & Startup Commands

### Prerequisites
- Node.js 20+ (Node 22 recommended)
- PostgreSQL 15+

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Setup database (apply migrations and seed demonstration accounts/complaints)
npm run db:setup

# 3. Build application (client and server)
npm run build

# 4. Start production server
npm start
```

The application will start on `http://0.0.0.0:5000` (or the port specified in `PORT`).

### Development Mode

```bash
# Start backend dev server with tsx watch
npm run dev:server

# In a separate terminal, start frontend Vite dev server
npm run dev:client
```

### Docker Compose (Optional)

```bash
# Start PostgreSQL and Getitresolved app container
docker compose up -d

# Check logs
docker compose logs -f app
```

---

## 5. Scoring Formulas, Rubrics & Star Indicators

Getitresolved implements four objective scores on a 0–10 scale:

1. **Priority (0–10):** Measures overall civic disruption, breadth of impacted citizens, and impact on essential municipal services (water, power, sanitation, roadways).
2. **Urgency (0–10):** Measures the speed required for intervention based on imminent pedestrian or vehicular accident risks, dark intersections, or progressive damage.
3. **Duration (0–10):** Quantifies unresolved complaint age. Calculated dynamically on the server:
   $$\text{durationScore} = \min(10, \lfloor \text{unresolvedAgeInDays} / 3 \rfloor)$$
   *(1 point per 3 days elapsed, capped at 10 points after 30 days. For resolved complaints, age is permanently frozen at `resolvedAt`).*
4. **Feasibility (0–10):** A provisional estimate of resolution ease. **Excluded from core score** so difficult, complex problems are not deprioritized.

### Overall Core Impact Score Formula:
$$\text{coreScore} = \text{round}(0.45 \times \text{priority} + 0.40 \times \text{urgency} + 0.15 \times \text{durationScore}, 1)$$

### Strict Colored Star Indicators ($> 7.0$)
A star is awarded **strictly when a score exceeds 7.0** ($> 7.0$). A score of exactly $7.0$ triggers no star:
- 🔴 **Red Star:** `effectivePriority > 7.0` (Severe public disruption / essential service outage)
- 🌸 **Pink Star:** `durationScore > 7.0` (Unresolved for more than 21 days)
- 🟠 **Orange Star:** `effectiveUrgency > 7.0` (Active accident risk / pitch-black street / emergency)
- 🟢 **Green Star:** `effectiveFeasibility > 7.0` (Provisional estimate of straightforward resolution)

*Note: Star indicators are objective triage assessment thresholds, not citizen satisfaction ratings.*

---

## 6. Department Routing & AI Fallback

- **Deterministic Routing Table:** Mapped via `Category + Service Area -> Department`. Routing logic is strictly decoupled from AI inference.
- **Predefined Categories:**
  - Roads and potholes (`ROADS`) &rarr; Roads and Public Works
  - Streetlights (`STREETLIGHTS`) &rarr; Electrical / Streetlighting
  - Water supply (`WATER`) &rarr; Water Supply
  - Drainage and sewage (`DRAINAGE`) &rarr; Drainage and Sewage
  - Garbage and sanitation (`SANITATION`) &rarr; Sanitation
  - Other / uncertain (`OTHER`) &rarr; Manual Review Queue
- **AI Fallback & Manual Triage:**
  - Real Gemini provider supported via `GEMINI_API_KEY`.
  - Transparent rule-based fallback executes when keys are absent or if the provider times out.
  - Complaints with confidence $< 0.75$, category "Other / uncertain", or missing routing mappings automatically divert to the **Administrator Manual Review Queue** with a diagnostic reason.

---

## 7. Testing & Quality Verification

Run the complete test suite:

```bash
# Run 30 Unit & Integration Tests
npm test

# Run End-to-End Browser Journeys (Playwright & Headless Chromium)
npx tsx --test tests/e2e/e2e-browser.test.ts
```

All 30 backend tests and 4 end-to-end browser journeys verify:
- Accurate duration scoring and resolved age freezing.
- Strict $> 7.0$ star threshold boundary logic.
- Cross-user and cross-department access restrictions.
- Mandatory resolution notes and explainability for state reversals.
- Automated AI fallback and manual review diversion.
- Full citizen submission &rarr; staff progress &rarr; resolution lifecycle.
- Production storage hardening, pre-uploaded attachment scoping, and credentialed CORS restriction.

---

## 8. System Architecture & Workflows

### 8.1. Complaint Lifecycle Workflow

```mermaid
flowchart TD
    A["Citizen Submits Complaint"] --> B["Validate Input (Zod, max 3 photos, 5MB)"]
    B --> C["Persist Complaint (status: SUBMITTED, analysis: PENDING)"]
    C --> D{"AI Analysis Mode"}
    D -->|"Gemini Configured"| E["Gemini Multimodal API (Structured JSON)"]
    D -->|"Key Absent / Timeout"| F["Deterministic Rule Engine (Keyword Heuristics)"]
    E --> G{"Confidence >= 0.75 & Mapped?"}
    F --> G
    G -->|"Yes"| H["Assign Department (status: ASSIGNED)"]
    G -->|"No / 'Other'"| I["Divert to Admin Manual Review Queue (review: REQUIRED)"]
    I --> J["Administrator Assigns Category & Department"]
    J --> H
    H --> K["Department Staff Claims / Updates (status: IN_PROGRESS)"]
    K --> L["Resolution with Citizen-Visible Notes (status: RESOLVED)"]
```

#### Lifecycle Stage Transitions & Data Requirements

| Stage | Trigger Actor / Engine | Invariants & Business Logic | Audit Logging |
| :--- | :--- | :--- | :---: |
| `SUBMITTED` | Citizen | Zod validated payload; $\le 3$ images; $\le 5\text{MB}$ each | Initial record created |
| `MANUAL_REVIEW` | AI Classifier / Rule Engine | Triggers if confidence $< 0.75$ or category is `OTHER` | `REVIEW_TRIGGERED` |
| `ASSIGNED` | Router or Administrator | Assigned strictly to valid department service area | `DEPARTMENT_ASSIGNED` |
| `IN_PROGRESS` | Department Staff | Status transition locked to assigned department staff | `STATUS_UPDATED` |
| `RESOLVED` | Department Staff | Mandatory citizen-visible remediation notes required | `STATUS_UPDATED` + Notes |
| `CLOSED` | Admin or Citizen | Age calculation frozen at `resolvedAt` permanently | `COMPLAINT_CLOSED` |

### 8.2. Multi-Factor Scoring & Strict Star Thresholds

```mermaid
flowchart LR
    subgraph Inputs["Scoring Inputs (0-10)"]
        P["Priority (Civic Disruption)"]
        U["Urgency (Safety / Accident Risk)"]
        D["Duration Score: min(10, floor(days / 3))"]
        F["Feasibility (Provisional Assessment)"]
    end

    subgraph Calculation["Core Formula"]
        Core["Core Score = round(0.45*P + 0.40*U + 0.15*D, 1)"]
    end

    subgraph Stars["Objective Star Badges (> 7.0 strictly)"]
        SP["Priority > 7.0: Red Star"]
        SU["Urgency > 7.0: Orange Star"]
        SD["Duration > 7.0: Pink Star"]
        SF["Feasibility > 7.0: Green Star"]
    end

    P --> Core
    U --> Core
    D --> Core
    P --> SP
    U --> SU
    D --> SD
    F --> SF
```

#### Multi-Factor Weighting & Star Trigger Matrix

| Score Dimension | Weight in Core Score | Computation Rule | Threshold for Star Indicator | Color Badge |
| :--- | :---: | :--- | :---: | :---: |
| **Priority ($P$)** | **45%** ($0.45 \times P$) | Severity of civic disruption & public impact (0–10) | Strictly $> 7.0$ | 🔴 Red Star |
| **Urgency ($U$)** | **40%** ($0.40 \times U$) | Immediate safety hazard / accident risk (0–10) | Strictly $> 7.0$ | 🟠 Orange Star |
| **Duration ($D$)** | **15%** ($0.15 \times D$) | Server calculated: $\min(10, \lfloor \text{days} / 3 \rfloor)$ | Strictly $> 7.0$ (Day 24+) | 🌸 Pink Star |
| **Feasibility ($F$)** | *0% (Excluded)* | Provisional resolution ease estimate (0–10) | Strictly $> 7.0$ | 🟢 Green Star |

$$\mathbf{Core\ Score} = \mathrm{round}\left(0.45 \times P + 0.40 \times U + 0.15 \times \min(10, \lfloor \text{days} / 3 \rfloor),\ 1\right)$$

### 8.3. Vercel Cloud Serverless Architecture

```mermaid
flowchart TD
    Client["Browser (React 18 + Tailwind SPA)"] --> Edge["Vercel Edge Network / CDN"]
    Edge -->|"Static Assets (*.js, *.css, *.html)"| Dist["Static Client Build (dist/client)"]
    Edge -->|"/api/* Requests"| Lambda["Express Serverless Function (api/index.ts)"]
    Lambda -->|"Connection Pool (DATABASE_URL)"| PgPool["Managed PostgreSQL (Neon / Supabase)"]
    Lambda -->|"Direct Access (DIRECT_URL)"| Migrations["Prisma Migrate Deploy"]
    Lambda -->|"Private Token (BLOB_READ_WRITE_TOKEN)"| BlobStore["Private Vercel Blob Store"]
    Client -->|"Direct Upload (Bypassing 4.5MB limit)"| BlobStore
```

---

## 9. Production Deployment & Security Configuration

Getitresolved is configured for high-performance serverless deployment on Vercel:

- **Single-Origin Deployment:** Express handles API routes under `/api`, while Vite SPA assets (`dist/client`) and client routes are served from the edge with fallback to `/index.html`.
- **Database Connection Pooling:** Managed PostgreSQL (Neon, Supabase, or AWS RDS) uses transaction-mode pooling via `DATABASE_URL` for serverless functions, alongside `DIRECT_URL` for running migrations (`npx prisma migrate deploy`).
- **Private Object Storage:** Photos are stored in a Private Vercel Blob store (`access: 'private'`). Files are never accessible via raw unauthenticated URLs; all access is authorized and streamed through Express endpoints with strict role-based controls.
- **Direct-to-Storage Uploads:** Direct client uploads to Vercel Blob bypass the serverless 4.5 MB request payload limit while enforcing user ownership and strict file limits (max 3 images, 5 MB each).
- **Environment Isolation:** Separate Preview and Production databases, distinct session secrets, and isolated storage tokens ensure complete staging/production safety.

---

## 10. Production Environment Variables & Operational Commands

### 10.1. Required Vercel Environment Variables
Configure these in **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Description | Example / Format |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection pool URL (transaction pooling mode) | `postgresql://user:pass@pooler.neon.tech/db?pgbouncer=true` |
| `DIRECT_URL` | Direct connection URL for running Prisma migrations | `postgresql://user:pass@ep-host.neon.tech/db` |
| `JWT_SECRET` | Cryptographically strong secret key (minimum 32 characters) | `openssl rand -base64 36` |
| `BLOB_READ_WRITE_TOKEN` | Private Vercel Blob storage access token | `vercel_blob_rw_...` |
| `GEMINI_API_KEY` | Optional: Gemini API Key for AI triage classification | `AIzaSy...` (fallback rule engine runs if absent) |

### 10.2. Municipal Operations CLI Reference

```bash
# Verify production database connectivity and essential metadata readiness
npm run db:verify

# Initialize core municipal departments, categories, and wards without demo complaints
npm run db:init-meta

# Provision initial secure municipal administrator account
ADMIN_EMAIL="admin@civicresolve.gov" ADMIN_PASSWORD="YourStrongPassword123!" npm run admin:init

# Run all 37 automated unit and integration tests
npm run test

# Run build pipeline (compiles client, server, and serverless Lambda bundle)
npm run vercel-build
```


