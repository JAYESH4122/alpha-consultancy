# Alpha Consultancy

Alpha Consultancy is a mobile-friendly, privacy-first recruitment web app for candidates, employers, and an admin screening team. Employers and candidates remain anonymous to one another until screening, consent, employer data-use acceptance, and an admin-controlled interview handoff are complete.

## Working local product

The repository includes an interactive browser-persisted demo so the complete three-role workflow can be tested locally without external credentials. Choose a workspace at `/login`; state is shared across the candidate, employer, and admin views through `localStorage`. Use **Reset demo data** in the sidebar to restart the journey.

### Employer

- Organization and verification status
- Detailed job requirement form covering role, skills, education, location, work mode, compensation, documents, questions, and interview availability
- `submitted → under_review → changes_requested/approved/rejected` status tracking
- Search and status filtering
- Anonymous candidate-pipeline totals
- Controlled candidate identity, contact, resume, and interview details only after release

### Candidate

- Editable profile, preferences, availability, terms acceptance, and automatic match recalculation
- PDF/DOCX resume validation and replacement (10 MB maximum)
- Explainable rule-based job matching with hard availability, location, and employment-type filters
- In-app notification drawer and read state
- Application-specific consent, resume selection, and required screening answers
- Application tracking, withdrawal, handoff consent, and released interview details
- Export, correction, deletion, and consent-withdrawal request flows

### Admin

- Queues for employer checks, jobs, screening, missing information, handoffs, overdue follow-ups, and privacy requests
- Employer verification decisions and private notes
- Job review, changes, approval/matching, rejection, pause, fill, and close controls
- Identity, resume, and eligibility checks; private notes; information requests; rejection; privacy-safe WhatsApp links
- Interview scheduling, rescheduling, cancellation, completion, and controlled identity release
- Immutable versioned legal-document publishing
- Privacy-request processing and automatic audit events

## Architecture and security

- Next.js App Router, React, TypeScript, Zod, and responsive CSS
- Supabase Auth phone OTP for candidates/employers when configured
- Provisioned admin email sign-in with enforced TOTP MFA (time-based one-time password)
- PostgreSQL migrations for all core records, indexes, transactional commands, and matching
- RLS on every exposed table. **RLS (Row-Level Security)** means PostgreSQL itself restricts which records each signed-in role may read or change.
- Private resume/document storage with owner/admin policies and a 10 MB MIME-type allowlist
- Anonymized candidate job catalog and employer pipeline views
- Identity/profile/document access for an employer only after `identity_released = true`
- Idempotent in-app/email delivery records and a secret-protected Resend worker. **Idempotency** means a retry cannot create a duplicate email.
- Immutable admin audit history. An **audit trail** records who performed a sensitive action, the target, and the time.
- Production proxy authorization by active database role; admin routes additionally require MFA assurance level `aal2`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production-style local build:

```bash
npm run build
npm run start
```

## Supabase and provider setup

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Add the Supabase URL and publishable key. Keep the service-role key and worker secret server-only.
3. Apply the migrations with the Supabase CLI:

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

4. Configure an SMS provider, CAPTCHA, authentication rate limits, and India DLT requirements before enabling phone OTP publicly.
5. Provision admins directly in Supabase, set their `profiles.role` to `admin`, and enroll a verified TOTP factor.
6. Add a verified Resend sender and invoke `POST /api/notifications/email` from a trusted scheduled worker using `Authorization: Bearer <NOTIFICATION_WORKER_SECRET>`.
7. Set the admin WhatsApp number in international digits without `+`.

The local demo remains usable with no environment file. External SMS, email, and production database delivery require the corresponding provider credentials.

## Verification

```bash
npm test
npm run lint
npm run build
npm audit
```

Tests cover matching and deduplication, hard filters, job validation, workflow state transitions, identity-release preconditions, RLS/privacy schema controls, MFA route enforcement, and email idempotency.

## Launch requirements

- Replace the operational legal text with counsel-approved Candidate Terms, Employer Terms, Privacy Notice, Application Consent, and Interview Handoff Consent.
- Confirm retention periods, grievance handling, supported sectors/locations, the SMS provider, and the WhatsApp number.
- Configure CAPTCHA/rate limits, monitoring, database backups, and separate storage-object recovery.
- Run accessibility, security, and Indian legal reviews before public launch. The included UI targets WCAG 2.2 AA behavior, but production certification requires an independent review.
