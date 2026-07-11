# PharmaGuard AI Project Audit

## Executive Summary

PharmaGuard AI is a Vite/React/TypeScript frontend backed by FastAPI, Supabase Auth, Supabase Postgres, and a Keras image-classification model. The application had client-side Admin routing, but the trusted backend returned all scan/report rows to every authenticated user and allowed every authenticated user to mutate report review state because service-role database access was not followed by ownership or role enforcement.

This pass adds server-side Admin/Pharmacist enforcement, owner IDs for new records, a private Storage migration and signed-image access, resilient user provisioning, final-admin protection, real scan thumbnails, a compact role-aware operations dashboard, a rebuilt AI model analytics page, a denser user table, shared date/image helpers, and derived model/dataset metrics.

The live Supabase project was inspected after migration. It has three Auth users (two Admin, one Pharmacist), canonical role values, the new ownership/Storage columns on both operational tables, and a private `medicine-scans` bucket with a 10 MB limit. No live user accounts or scan/report rows were changed during this pass.

## Fixed in This Pass

### Authorization and ownership

- **Problem:** Pharmacists could receive every scan and report through backend endpoints.
- **Root cause:** The backend used the Supabase service role and returned unfiltered table queries.
- **Solution:** `pharmacist_id` is written for new records; Admin receives global rows while Pharmacist receives only rows matching the authenticated user ID. Legacy rows without a trustworthy owner ID remain Admin-only rather than using an ambiguous display-name match.
- **Important files:** `backend/app/main.py`, `backend/app/records.py`, `backend/app/auth.py`, `backend/app/roles.py`, `supabase/migrations/20260710_secure_roles_storage.sql`.

### Risk-report review permissions

- **Problem:** Any authenticated user could mark a report under review, edit notes, or resolve it.
- **Root cause:** `PATCH /reports/{id}` used the general authentication dependency.
- **Solution:** The endpoint now requires Admin. Pharmacists can view only their own permitted reports and see a read-only explanation in the report drawer.
- **Important files:** `backend/app/main.py`, `frontend/src/pages/ReportsPage.tsx`.

### User-creation false failure

- **Problem:** An uncertain or timed-out create request could create an Auth user, retry the non-idempotent POST, receive a duplicate error, and surface a false creation failure.
- **Root cause:** User-admin POST requests shared automatic retry behavior with safe GET requests, and refresh state was not explicitly separated from creation state.
- **Solution:** The backend does not blindly retry user-creation POSTs. It checks for an existing email before creation and reconciles an uncertain response by re-querying the user. Typed codes distinguish duplicate email, final-admin protection, upstream rejection, and temporary unavailability. The frontend retains optimistic success if revalidation fails and presents a separate retryable refresh warning.
- **Important files:** `backend/app/users.py`, `backend/app/main.py`, `frontend/src/pages/AdminUsersPage.tsx`, `frontend/src/api/users.ts`.

### Final administrator protection

- **Problem:** Only self-deletion was blocked; the final Admin could still be deleted or demoted by another account.
- **Root cause:** No server-side Admin continuity check existed.
- **Solution:** Delete and role-change operations count current Admin users and return a typed conflict when the target is the final Admin. The user table also disables unsafe deletion.
- **Important files:** `backend/app/users.py`, `backend/app/main.py`, `frontend/src/pages/AdminUsersPage.tsx`.

### Scan image persistence and display

- **Problem:** History and reports showed filename/placeholder content instead of the uploaded medicine image.
- **Root cause:** List queries omitted `image_data_url`; images were stored as legacy database blobs; no Storage bucket or reusable authorized resolver existed.
- **Solution:** The migration creates a private `medicine-scans` bucket and stable `image_bucket`/`image_path` columns. New scans upload through the trusted backend. A role/ownership-checked endpoint returns a one-hour signed URL. `MedicineScanImage` provides shared loading, thumbnail, full-preview, and broken-image states across dashboard, history, scan details, reports, and report details. Legacy data URLs are resolved only through the same backend endpoint.
- **Important files:** `backend/app/records.py`, `frontend/src/components/shared/MedicineScanImage.tsx`, `frontend/src/pages/HistoryPage.tsx`, `frontend/src/pages/ReportsPage.tsx`, `supabase/migrations/20260710_secure_roles_storage.sql`.

### Dashboard redesign

- **Problem:** The dashboard repeated classification totals, nested review/model cards, used decorative sparklines for low-volume data, and consumed excessive vertical space.
- **Root cause:** KPI, overview, review, and model-health surfaces were designed independently rather than around operational priority.
- **Solution:** The dashboard now has a compact header and filter, one KPI strip, a real daily trend with a low-data state, a role-aware urgent queue, compact recent scans with thumbnails, model health, and Admin-only quick actions. Pharmacist labels and data are owner-scoped by the backend.
- **Important files:** `frontend/src/pages/DashboardPage.tsx`, `frontend/src/lib/dashboard-utils.ts`.

### AI Model Performance redesign and consistency

- **Problem:** The production model gradient dominated the page, metrics were nested and duplicated, evaluated count reported only non-production rows, and values were independently hardcoded.
- **Root cause:** Model facts, comparison entries, and confusion-matrix display each owned overlapping metrics.
- **Solution:** The page now uses a compact header/summary strip, one comparison chart, a white production panel, a sortable full-width comparison table, a two-column confusion-matrix/evaluation area, dataset splits, and separate decision configuration. Model count derives from the rendered collection. Accuracy, recall, specificity, precision, F1, FPR, and FNR derive from TP/TN/FP/FN with zero-denominator handling. Dataset total derives from its splits. Landing/login model accuracy uses the same source.
- **Important files:** `frontend/src/pages/ModelsPage.tsx`, `frontend/src/lib/model-metrics.ts`, `frontend/src/lib/constants.ts`, `frontend/src/data/model-data.ts`, `frontend/src/pages/LandingPage.tsx`, `frontend/src/pages/LoginPage.tsx`.

### User Management redesign

- **Problem:** The desktop table wrapped short names, relied on broad horizontal scrolling, lacked search/role filtering and password visibility, and conflated create and refresh messages.
- **Root cause:** Equal page columns left too little width for six table fields and the form had minimal operation-state separation.
- **Solution:** The create form uses a controlled 320px column, password guidance/visibility, duplicate-submit guard, separate success/refresh states, search, role filter, shared compact dates, fixed column proportions, loading/empty states, and accessible action labels.
- **Important files:** `frontend/src/pages/AdminUsersPage.tsx`, `frontend/src/lib/utils.ts`.

### Timestamp clarity

- **Problem:** Timestamp-shaped filenames could look like scan dates, while display timestamps used persisted presentation strings.
- **Root cause:** The UI did not clearly label the original filename and preferred `date_time`/`scan_date` text over canonical `created_at`.
- **Solution:** Details label `Original file` and `Scanned at` separately. API responses include `createdAt`, and shared date formatting prefers that ISO timestamp with legacy text only as fallback.
- **Important files:** `backend/app/records.py`, `frontend/src/lib/utils.ts`, `frontend/src/pages/HistoryPage.tsx`, `frontend/src/pages/ReportsPage.tsx`, `frontend/src/pages/DashboardPage.tsx`.

## Security and Role Audit

| Capability | Admin | Pharmacist |
| --- | --- | --- |
| Dashboard | Global operational view | Owner-scoped work view |
| Authenticate Medicine | Allowed | Allowed |
| Scan History | All scans | New scans owned by authenticated user ID |
| Reports | All reports | Owner-scoped reports, read-only review details |
| Review/resolve cases | Allowed | Denied in UI and backend |
| AI Models | Read-only analytics | Read-only analytics; no administration exists |
| User Management | Allowed | Hidden, route-guarded, and backend-denied |
| Dependency diagnostics | Allowed | Backend-denied |

- **UI restrictions:** User Management is rendered only for Admin; Admin routes redirect Pharmacist; report mutation controls are Admin-only.
- **Route restrictions:** `AdminRoute` protects `/app/users`; `ProtectedRoute` waits for session loading before the authenticated shell appears.
- **Server restrictions:** All user-admin operations, report mutations, and diagnostics require Admin. Scan/report/image reads enforce role and owner ID.
- **RLS findings:** The schema/migration enables RLS with no browser policies because browser code does not query operational tables or Storage directly. The service-role backend remains the only data path and performs authorization before access.
- **Secret audit:** No `.env` file is tracked. No service-role variable or privileged key appears in frontend source. The service role remains backend-only.

## Supabase Audit

### Auth

- Canonical UI/API roles are `Admin` and `Pharmacist`.
- Live metadata already uses only those values.
- The migration safely normalizes recognized case/legacy values without promoting unknown values.
- Auth Admin calls remain in trusted FastAPI code.

### Profiles/users

- This repository does not use a separate public profile table or `auth.users` trigger. Full name and role are stored in Auth user/app metadata, so no duplicate profile-creation system was added.

### Triggers

- No profile trigger exists in the repository schema. Profile synchronization failure is therefore not an applicable create-user step in the current architecture.

### RLS

- RLS is enabled by schema/migration.
- No permissive public operational-table or image policy is introduced.
- Authorization is enforced before service-role queries are returned.

### Storage

- Live verification confirms private `medicine-scans` exists with a 10 MB limit.
- The migration restricts accepted MIME types to JPEG, PNG, and WebP.
- Canonical storage reference is bucket + object path; signed URLs are short-lived read results only.

### Scan image paths and reports

- New scan/report rows share the same stable Storage path and owner ID.
- Failed multi-step scan writes attempt database and Storage compensation to avoid orphaned records/images.
- Legacy base64 images remain readable through the authorized resolver until migrated.
- A safe live ownership backfill matched 11 of 18 legacy scans and 7 of 11 legacy reports to unique Auth users. The unmatched rows remain Admin-only.

## UI/UX Audit

| Route | Status | Issues found and fixed |
| --- | --- | --- |
| `/` | Pass | Retained compact landing; accuracy now uses shared model source. |
| `/login` | Pass (desktop/mobile screenshot) | Responsive at 1440×900 and 390×844; no horizontal overflow or console warnings. |
| `/app/dashboard` | Implemented; authenticated screenshot blocked | Replaced oversized/nested design with role-aware operational layout. |
| `/app/authenticate` | Pass by code/build | Preserved inference flow; all accepted images are now eligible for private Storage persistence. |
| `/app/history` | Implemented; authenticated screenshot blocked | Added real thumbnails, shared loading/fallback, compact columns, and two-column details. |
| `/app/reports` | Implemented; authenticated screenshot blocked | Added thumbnails/full image, Admin-only mutation controls, clearer timestamps and IDs. |
| `/app/models` | Implemented; authenticated screenshot blocked | Removed dominant purple production hero and rebuilt analytics hierarchy. |
| `/app/users` | Implemented; authenticated screenshot blocked | Added compact table, filters, password control, structured operation states, and final-Admin safeguards. |

Screenshot-only accessibility limits: screenshots confirm responsive reflow and visible labels on login, but keyboard traversal, focus trapping, screen-reader announcements, slow-network behavior, session expiration, and authenticated modal focus still require a valid signed-in test session.

## Data Consistency Audit

- Removed unused mock dashboard counts.
- `Admin + Pharmacist = total users` derives from the same `users` collection.
- Dashboard classification metrics derive from the same filtered scan collection.
- Evaluated model count derives from `modelPerformances.length` and is six.
- Production accuracy derives from the confusion matrix and is formatted consistently to two decimals where precision matters.
- Fake is explicitly the positive class.
- `TP + TN + FP + FN = 449`, matching the testing split.
- Dataset total derives from `training + validation + testing = 1,563`.
- Dataset percentages derive from split counts.
- Landing, login, dashboard, and model analytics read shared model facts.

## Remaining Issues

### P1 — Authenticated end-to-end browser validation requires test credentials

- **Issue:** The in-app browser had no authenticated Supabase session, and no production account was created or modified for testing.
- **Affected:** Dashboard, scan/save/history, reports/review, models, user management, logout, and session-expiry browser flows.
- **User impact:** Code, authorization tests, typecheck, and build pass, but authenticated visual/runtime behavior was not exercised against the live project.
- **Recommended fix:** Provide a dedicated Admin and Pharmacist test account, then run the full 18-workflow browser matrix.

### P2 — Legacy rows need explicit owner mapping

- **Issue:** Seven historical scans and four reports still have no unique Auth-user match; names alone are not a safe ownership key.
- **Affected:** Pre-migration scan/report visibility for Pharmacists.
- **User impact:** Legacy records are Admin-only until mapped, preventing leakage but hiding old personal history from Pharmacists.
- **Recommended fix:** Review the remaining legacy pharmacist labels and provide an explicit user mapping before backfilling `pharmacist_id`.

### P2 — Frontend lint and automated UI tests are not configured

- **Issue:** `frontend/package.json` has no `lint` or `test` script.
- **Affected:** UI regression automation, double-click/revalidation tests, keyboard checks.
- **User impact:** TypeScript and production compilation catch structural errors, but interaction regressions rely on browser QA.
- **Recommended fix:** Add ESLint plus Vitest/React Testing Library and automate create-user state transitions and responsive tables.

### P2 — Production bundle remains large

- **Issue:** The production JS chunk is about 1.16 MB and two landing PNGs are about 1.5–1.7 MB each.
- **Affected:** Initial load performance.
- **User impact:** Slower first load on constrained connections.
- **Recommended fix:** Add route-level lazy loading and lossless/lossy WebP/AVIF asset optimization.

### P3 — Optional model metadata is not recorded

- **Issue:** Model version, evaluated date, and dataset version are absent from current data.
- **Affected:** AI Model Performance metadata.
- **User impact:** UI correctly shows `Not recorded` rather than invented values.
- **Recommended fix:** Add a versioned evaluation manifest or model-evaluation table during the next ML pipeline pass.

## Commands Executed

- `cd frontend; npm run typecheck` — **passed**.
- `cd frontend; npm run build` — **passed**; Vite reported the existing large-chunk optimization warning.
- `cd backend; python -m pytest -q` — baseline first failed during collection because the local FastAPI/Starlette versions did not match the repository pins; after `python -m pip install -r requirements-dev.txt`, final result **28 passed**.
- `cd backend; python -m compileall -q app` — **passed**.
- `git diff --check` — **passed**.
- Live Supabase REST/Storage verification — **passed**; both tables expose ownership/path columns and `medicine-scans` is private.
- Frontend lint — **not available**; no `lint` script exists.
- Frontend automated tests — **not available**; no `test` script exists.

## Recommended Next Development Pass

1. Run authenticated Admin and Pharmacist browser QA with dedicated test accounts.
2. Backfill reviewed legacy ownership IDs.
3. Add frontend lint/unit/integration test infrastructure.
4. Optimize route chunks and image assets.
5. Add a versioned ML evaluation manifest for model/dataset metadata.
