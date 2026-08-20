# EZFINANZ — Personal Loan Application System

A full-stack personal loan application system built for a technical interview
challenge: customer-facing multi-step application flow (KYC → eligibility →
EMI selection → bank details → declaration → selfie verification) plus an
admin review dashboard, with correct EMI/IRR/DTI financial math and
simulated third-party integrations (OTP, credit bureau, bank verification).


## 🚀 Live Demo

**Live Application:**  
https://ezfinanz-personal-loan-a-pllication.vercel.app/


## Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT (access + refresh), bcrypt password hashing, simulated Google OAuth
- **Validation:** Zod, shared shape between client and server

## Project structure

```
ezfinanz/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Data model (User, LoanApplication, + one model per step)
│   │   └── seed.ts            # Creates a demo admin user
│   └── src/
│       ├── controllers/       # auth, application (customer flow), admin
│       ├── services/          # loanCalc.service.ts (EMI/IRR/DTI math), simulated.service.ts
│       ├── middleware/        # auth (JWT + role check), upload (multer)
│       ├── routes/
│       ├── utils/             # prisma client, jwt helpers, zod schemas
│       └── server.ts
└── frontend/
    └── src/
        ├── pages/
        │   ├── customer/steps/  # KycStep, EligibilityStep, EmiStep, BankStep,
        │   │                    # DeclarationStep, SelfieStep, ReviewStatus, RejectedStatus
        │   └── admin/           # AdminDashboard, AdminApplicationDetail
        ├── context/AuthContext.tsx
        ├── api/client.ts        # axios instance + refresh-token interceptor
        └── components/
```

## How the application state machine works

`LoanApplication.status` moves through:

```
KYC_PENDING → ELIGIBILITY_PENDING → EMI_PENDING → BANK_PENDING →
DECLARATION_PENDING → SELFIE_PENDING → ADMIN_REVIEW → APPROVED/REJECTED → DISBURSED
```

**Every step-submission endpoint checks the application's current status on
the server before accepting the request** (see `assertStatus` in
`application.controller.ts`). The frontend wizard is a UX convenience — it is
never trusted as the source of truth for what step a user is allowed to
submit. If eligibility fails (`NOT_ELIGIBLE`), the application short-circuits
straight to `REJECTED`.

## The financial math (and how it was verified)

`backend/src/services/loanCalc.service.ts` is pure, dependency-free
TypeScript so it can be tested in isolation:

- **EMI** — standard reducing-balance formula `EMI = P·r·(1+r)^n / ((1+r)^n - 1)`
- **Net disbursement** — principal minus processing fee minus GST on that fee
- **IRR (effective annual rate)** — solved numerically (bisection) for the
  monthly rate that zeroes the NPV of `netDisbursement` against the EMI
  cash flow stream, then annualized. This is deliberately **higher** than
  the nominal rate, because the customer receives less than the full
  principal up front but repays EMIs calculated on the full principal.
- **DTI** — `(existingDebt + newEMI) / monthlyIncome`
- **Eligibility** — DTI ≤ 40% and score ≥ 700 → Eligible; DTI 40–50% or
  score 650–699 → Partially eligible; otherwise Not eligible (also capped
  by requested amount vs. 20x income)

These were verified against a known reference case before anything was
built on top of them: **₹500,000 at 10% nominal / 24 months → EMI
₹23,072.46** (matches standard EMI calculators), and at 14% nominal with a
2% processing fee + 18% GST, the effective IRR comes out to **17.74%** —
correctly higher than the nominal rate.

## Simulated third-party services

`backend/src/services/simulated.service.ts`:

- **OTP** — generates a 6-digit code, stores it with a 5-minute expiry,
  returns it in the API response (clearly marked `devOnlyCode`, since
  there's no real SMS gateway wired up)
- **Credit score** — deterministic pseudo-random score seeded from the ID
  number, so the same applicant always gets the same score in a demo
- **Bank verification** — simulated penny-drop with a short delay and a
  simple format-based pass/fail rule

All three are written behind plain function signatures so swapping in a
real provider later (Twilio, CIBIL/Experian, a bank's penny-drop API) is a
one-file change.

## Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a connection string to a hosted instance)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string,
# and set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to random strings

npx prisma generate
npx prisma migrate dev --name init

npm run seed        # creates admin@ezfinanz.com / Admin@12345
npm run dev          # starts on http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:4000/api
npm run dev              # starts on http://localhost:5173
```

### 4. Try it out

- Sign up as a customer at `/signup`, complete the 6-step wizard.
- Log in as admin (`admin@ezfinanz.com` / `Admin@12345`) at `/login`,
  review applications under "Under review", approve/reject, then mark
  approved applications as disbursed.
- The OTP screen shows the simulated code directly on screen (no real SMS
  gateway is wired up) — this is intentional and labeled as such.


