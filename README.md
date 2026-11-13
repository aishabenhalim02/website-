# Maltese Muslims Society — Muslim Life in Malta

A new responsive site built from the supplied feature brief on an initially empty repository. Navy, gold and ivory branding uses the official logo and family artwork extracted from the supplied MMS presentation. The presentation is reference material, not an executable specification.

## Develop

Requires Node.js 24 and npm. From `/workspace/website-`:

```sh
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run build
npm test
npm start
```

The default port is 3000. Rebuild after editing `public/app.js`. CSS updates need no build. The barcode library is loaded only when the camera is requested. Use the existing isolated checkout; do not create a worktree for cloud setup.

Copy `.env.example` to `.env` only if configuration is needed. Never commit credentials. Server-side settings:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port, default 3000 |
| `ADMIN_PASSWORD` | Unique password of at least 16 characters; enables administrator login |
| `REVIEWER_PASSWORD` | Optional separate password for directory reviewers; configuration publishing remains admin-only |
| `OPENAI_API_KEY` | Optional OpenAI key; without it the assistant reports that it is disconnected |
| `OPENAI_MODEL` | Optional model override, default `gpt-4.1-mini` |
| `NODE_ENV` | Set to `production` behind HTTPS to enable Secure session cookies |
| `MMS_DATA_DIR` | Optional private data directory; defaults to ignored `.data/` |

Use HTTPS in deployment. Node's `--use-env-proxy` enables environment-provided outbound HTTPS proxy configuration without disabling TLS verification. Required destinations are `world.openfoodfacts.org`, `www.openstreetmap.org`, `*.tile.openstreetmap.org`, and (only for AI) `api.openai.com`.

## What works

- Landing page, mobile navigation and floating assistant across pages.
- Adhan library calculations for Valletta (35.8992, 14.5141), Europe/Malta display, monthly timetable, method and Asr convention selection, countdown and optional browser reminders while the prayer page remains open. Sunrise is shown but excluded from the next-prayer countdown. No API credential is required for calculations.
- Mosque and business directories with locality/category filters and an interactive OpenStreetMap view. No invented locations, hours or certification records are seeded. Approved listings include directions and evidence metadata. Facilities remain blank unless supplied by reviewers.
- Business, prayer-space and product-report submissions enter pending review. Documents are private, limited to three files of 5 MB, MIME/signature checked for PDF/JPEG/PNG and served as authenticated downloads. Files are never public static assets.
- Administrator/reviewer sessions use random HttpOnly SameSite cookies, one-hour expiry, login rate limits and same-origin mutation checks. Administrators can publish sourced schedules and knowledge references; both roles can review submissions with an audit note. Rejection removes an existing public listing. Evidence-request decisions do not send email automatically.
- Camera barcode recognition via ZXing (HTTPS or localhost and permission required), manual barcode entry, server-side Open Food Facts v2 lookup, ingredient concern explanations, database attribution and dates. Database-only results remain **Needs Further Verification**. Administrators can review product reports and publish product-specific evidence records for any of the four statuses. Verified Halal requires issuer, product-matched certificate reference and an unexpired expiry date; expired records fall back to database lookup. Database labels are not proof. The four evidence statuses are explained in the interface without simulating verified results.
- Optional server-side OpenAI integration with a restricted introductory source set, scholarly referral instructions and English/Maltese/Arabic prompts. No API key is sent to the browser. MMS does not store conversations; each question is sent without earlier messages and `store:false`. Provider retention may apply. Model answers still require independent checking; a system prompt cannot guarantee religious accuracy.

## Review workflow

Visit Administration in the footer. Sign in using the server-configured role password. Submitted contact information and uploaded documents are private. Public listing JSON is a separate, explicit record: avoid copying unnecessary private information. Fill verification source/date and relevant facilities. Businesses must be labelled `self-declared` or `independently-certified`; independent certification requires issuer and unexpired expiry. Prayer spaces use `verified-location`. Human reviewers remain responsible for validating evidence and matching certificates to the correct business. Optional `logoId` and `imageIds` publish only selected image uploads from the same submission; PDFs remain private. Optional latitude/longitude enable a map marker. Other optional public fields include website, contact, hours, women, wudu, friday and accessibility.

For official mosque times, publish a `schedules` record with `name`, `month` (`YYYY-MM`), `source`, `verifiedAt` and `days`, each containing `date` and `times` keys `fajr`, `sunrise`, `dhuhr`, `asr`, `maghrib`, `isha` as Malta-local `HH:MM`. These schedules appear separately from calculated times. They do not silently change calculations.

Knowledge-source records require `title`, `url` (HTTPS), `source` and `verifiedAt`. They are stored for review/reference, not automatically injected into AI prompts; the reviewed reference set in `server.js` controls AI grounding.

## Validation and integration status

`npm test` covers monthly calculations, leap years, daylight saving, Asr conventions, invalid configuration, conservative ingredient assessments, authenticated review, evidence validation, private documents, reviewer restrictions, same-origin checks and logout. Integration fixtures use a temporary data directory and do not seed public demo records.

Browser checks cover desktop/mobile routes without horizontal overflow, the monthly timetable, form submission, administrator approval, the resulting public listing, and disconnected-AI messaging without page errors. Test-only records live in temporary data directories. Hardware camera scanning and notifications need a real supported device and user permission; they have not been hardware-validated. The Open Food Facts request was blocked by the cloud network allowlist during development; the required domains were saved to the configuration draft, which does not itself change runtime policy. AI responses are untested without a configured key. Do not describe either external integration as live-verified until its request succeeds.

## Before public launch

This is a functional first implementation, not a production deployment. Supply and verify real listings and schedules, configure credentials securely, and review religious sources with a qualified scholar. Publish MMS's approved privacy policy, retention period and correction/deletion contact; those details were not supplied. Optional ingredient-photo OCR is not implemented. No product-specific certification records are seeded: stronger product statuses require human-reviewed evidence, never AI or keywords alone.

The JSON store supports a single server process. Securely back up `.data/` (contains private uploads and audit records). Before scaled production, use a transactional database, durable sessions, named-user identity/SSO, malware scanning, upload metadata stripping, a retention/deletion workflow and operational monitoring. Do not run multiple instances against the file store. No deployment, publication or Git push is performed automatically.


## Publish on Render

`render.yaml` defines a Node 24 web service with a 1 GB persistent disk. **The Starter service and disk require paid Render hosting.** Review Render's current pricing before creating the service. The disk is required to retain submissions, documents and audit records across restarts/deployments; a free service with ephemeral storage is unsuitable for these features.

1. Connect your GitHub account in Render and create a **New Blueprint** from `aishabenhalim02/website-`, branch `main`. Render reads `render.yaml`.
2. Review the Starter service and disk charges, then create the resources. Render installs dependencies, builds the browser code, runs tests and starts the server.
3. Open the HTTPS `onrender.com` address shown by Render after its health check passes. This is the public website address. A custom domain is optional and can be added later in Render's service settings.
4. In Render's Environment settings, retrieve the generated `ADMIN_PASSWORD` securely to sign in at `/#admin`. Do not paste it into chat or commit it. Add `OPENAI_API_KEY` only if you want AI answers, and optionally a separate `REVIEWER_PASSWORD`.
5. Check the home page, `/#prayers`, `/#halal`, and `/healthz`. Submit a test application and verify it survives a service restart. Check live Open Food Facts lookup and camera access from a real phone over HTTPS.

Render supplies `PORT`. `NODE_ENV=production` enables Secure admin cookies; `TRUST_PROXY_HOPS=1` trusts Render's reverse proxy for rate limiting. Private data lives at `/var/data/mms` on the attached disk. Keep a secure off-site backup and run a single service instance. The cloud development network allowlist is separate from Render networking. Creating an environment draft in Codex does not deploy a public website.

No Render resources are created simply by saving this file. Publication still requires your Render account connection and billing selection. Never send hosting passwords or API tokens in chat.
