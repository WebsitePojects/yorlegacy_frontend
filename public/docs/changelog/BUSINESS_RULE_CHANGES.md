# Business Rule & Logic Change Log

This file is the canonical record of every business rule, compensation logic, or
financial calculation change made to the Yor International platform.

**Format per entry:**
- Date, Gate ID, Rule area, What changed, Files affected, Reason / authority

Only business-rule-level changes are logged here.
Simple UI tweaks, CSS, copy, and config changes are not recorded.

---

## 2026-06-13 — GATE-UNI-20260613: Unilevel Bonus Production Engine (10-level sponsor bloodline)

**Rule area:** Unilevel Bonus — production crediting engine
**Gate ID:** `GATE-UNI-20260613`

### What changed

Implemented the production Unilevel Bonus engine. A member's product repurchase
credits their SPONSOR bloodline up to 10 levels, amplified per level by
10 / 8 / 5 / 5 / 3 / 3 / 2 / 1 / 1 / 1 percent (L1→L10). Sponsor tree only
(`network.sponsor_user_id`), never binary placement. Base = the product's
`repurchasePv` (Perfume/Vision 500, Refill 150). Each level posts at most once per
repurchase event via a deterministic process key (`<ref>:unilevel:L<n>:<recipient>`).

**Before:** unilevel was simulation-only policy text; no production posting.

**After:** `applyRepurchaseUnilevel` + `creditUnilevelForRepurchase` (catalog SKU →
PV) post `unilevel` ledger credits; `getMemberUnilevelData` exposes total + per-level
breakdown; `GET /api/member/unilevel`.

### Decisions / scope

- Per owner sign-off item 8, EVERY sponsor in the bloodline is credited — recipient
  account-type eligibility is intentionally NOT gated (unlike binary pairing).
- Ranking is NOT driven by unilevel points (scrapped) — rank is total income only.
- **Pending (NOT enforced):** the 200-PV monthly maintenance requirement
  (`unilevelMonthlyMaintenanceRequirement`) is recorded but not gated; and the
  production repurchase TRIGGER (the event that calls `creditUnilevelForRepurchase`)
  is shared with the Lifestyle Rewards workstream and not yet wired to a member
  purchase flow.

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` — `applyRepurchaseUnilevel`, `creditUnilevelForRepurchase`, `getMemberUnilevelData`
- `yor_backend/src/routes/member.ts` — `GET /api/member/unilevel`

### Reason / authority

Owner sign-off **item 8** (2026-06-13).

---

## 2026-06-13 — GATE-BIN-CYCLE-NOCAP-20260613: Binary Cycle Bonus Has No Cap

**Rule area:** Binary Cycle Bonus — cap treatment and calculation base
**Gate ID:** `GATE-BIN-CYCLE-NOCAP-20260613`

### What changed

Binary Cycle Bonus is now uncapped. It pays a flat percent (Classic 2% / Standard 3% / Business 4% / VIP 5%) of the **full matched salesmatch movement** for each pairing cycle, independent of the weekly/monthly SMB caps, and it posts even when the SMB payout for that cycle is fully forfeited at the cap.

**Before (wrong — effectively capped):** computed on the SMB-capped `payable` and only inside `if (payable > 0)`, so binary cycle was suppressed once the SMB cap was hit.
```typescript
if (payable > 0) {
  // ...post salesmatch...
  const binaryCredit = (payable * binaryCyclePercent) / 100; // capped base
}
```

**After (correct — uncapped):** computed on the full `salesmatchDelta`, outside the payable gate.
```typescript
if (payable > 0) { /* ...post salesmatch (still capped)... */ }
// GATE-BIN-CYCLE-NOCAP-20260613
const binaryCredit = (salesmatchDelta * binaryCyclePercent) / 100; // full match base
```

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` — `applyPlacementSalesItem`
- `yor_backend/src/modules/production/encoding-service.test.ts` — two cap-scenario assertions updated (binary cycle 4 → 10; capped-out case 0 → 1 entry of 10)

### Reason / authority

Owner sign-off **item 3** (2026-06-13): "There is no cap of binary cycle." Overrides `BUSINESSRULE.md` BIN-02 "Weekly capping applies". The weekly/monthly caps remain in force for the Salesmatch Bonus (SMB) payout only.

---

## 2026-06-13 — GATE-GYF-WINDOW-20260613: Get Yor Five 3-Month Group Window

**Rule area:** Get Yor Five Bonus — qualification window, crediting, and void lifecycle
**Gate ID:** `GATE-GYF-WINDOW-20260613`

### What changed

Get Yor Five now groups qualified same-package directs into batches of five inside a 3-month window measured from each group's first direct. A group that reaches five within its window auto-credits once (company-funded, = package price). A group whose window lapses with fewer than five is VOIDED — its directs are kept for history/monitoring but can never credit again, and a fresh group starts from the next direct.

**Before (wrong — date-blind):** credited whenever the running count of qualified same-package directs hit a multiple of five (`count % 5 === 0`), with no time window and no void concept.

**After (correct — windowed):** crediting is driven by `computeGetYorFiveGroups(...)`; only `complete` groups post, keyed by completed-group index (idempotent via `postLedgerIfNeeded`). The member display surfaces, per package, the open group's remaining invites + remaining days, and voided-group history.

### Files affected

- `yor_backend/src/modules/compensation/get-yor-five.ts` (new) + `get-yor-five.test.ts` (new)
- `yor_backend/src/modules/compensation/cap-windows.ts` — `addManilaMonths` helper
- `yor_backend/src/modules/production/encoding-service.ts` — `postRegistrationDirectAndGetFive`, `getMemberGetYorFiveData`, `listQualifiedSamePackageGyfDirects` (removed date-blind `countQualifiedDirectsBySponsorAndPackage`)
- `yor_backend/src/routes/member.ts` — Days Left column + Voided Groups metric

### Reason / authority

Owner sign-off **item 5** (2026-06-13). Resolves the previously-open Get Yor Five reset/repeatability decision. **Migration note:** keyed by completed-group index — verify no `get_five` ledger rows exist before applying to production data, as a void earlier in a sponsor's history can shift indices.

---

## 2026-06-12 â€” GATE-BIN-PV-FS-2026-06-12: FS Paid Accounts Now Eligible for Binary Pairing

**Rule area:** Binary PV gate â€” eligible account types for salesmatch/pairing propagation  
**Gate ID:** `GATE-BIN-PV-FS-2026-06-12`

### What changed

The binary PV eligibility gate was widened. Previously, FS accounts (Business/VIP free-slot or stockist-settled) were unconditionally excluded from generating binary PV to uplines, regardless of payment status.

**Before (wrong):**
```typescript
const eligibleForBinaryPV = matchingCode.accountType !== 'FS' && matchingCode.paymentStatus !== 'unpaid';
```

**After (correct):**
```typescript
const eligibleForBinaryPV = matchingCode.paymentStatus !== 'unpaid';
```

### Eligible pairings now active

| Left leg | Right leg | Pairs? |
|---|---|---|
| PD Paid | PD Paid | âœ… |
| FS Paid / Ext-Paid | FS Paid / Ext-Paid | âœ… |
| CD Paid | FS Paid / Ext-Paid | âœ… |
| CD Paid | CD Paid | âœ… |
| PD Paid | FS Paid / Ext-Paid | âœ… |
| Any | CD Unpaid | âŒ |
| Any | Any Unpaid | âŒ |

### What did NOT change

Binary cycle logic is unchanged. The salesmatch/binary cycle still fires based on delta â€” the only gate is whether the registering account's code is paid.

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` â€” line ~1274, gate condition + detail message
- `yor_backend/src/modules/sandbox/dev-sandbox-store.ts` â€” added missing gate before `settleSandboxPlacementCompensation` (sandbox previously had NO gate â€” unpaid codes were incorrectly generating PV in sandbox)

### Reason / Authority

User instruction 2026-06-12: "activate binary pairing for eligible accounts, cd and fs, fs and fs, cd and cd all unpaid wont pair and generate income activate it if it is closed"

---

## 2026-06-11 â€” BIN-CYCLE-ROOT-CAUSE-2026-06-11: Binary Cycle Root Cause Identified and Fixed via PV Gate

**Rule area:** Binary Cycle Bonus (Way 4) â€” root cause fix
**Gate ID:** N/A (root cause was the binary PV gate; binary cycle logic is correct)

### What was reported
User report: "binary cycle naten tuloy tuloy yung palo kahit wala pa syang katapat
na leaders sa kabila at hindi pa nagpapairing" â€” cycle was apparently firing even
without qualifying paired leaders.

### Root cause
FS accounts (Business/VIP free-slot) and CD Unpaid accounts were generating binary
PV to uplines on every registration, causing the salesmatch delta to accumulate.
The binary cycle is computed from the salesmatch delta, so it was being triggered
by PV from ineligible accounts.

### Fix applied
The upstream binary PV eligibility gate (BIN-PV-GATE-2026-06-11, see below)
prevents FS and CD Unpaid accounts from ever entering the compensation queue.
Since no PV flows up from ineligible accounts, no salesmatch delta is produced for
those registrations, and therefore binary cycle is never triggered from them.

**Binary cycle logic itself remains unchanged and correct.**

### Files affected (via BIN-PV-GATE-2026-06-11)
- `yor_backend/src/modules/production/encoding-service.ts` â€” `submitRegistration()` eligibility gate

---

## 2026-06-11 â€” BIN-PV-GATE-2026-06-11: Binary PV Eligibility Gate

**Rule area:** Binary PV / Salesmatch propagation
**Gate ID:** `BIN-PV-GATE-2026-06-11`

### What changed
FS accounts (Business/VIP on free-slot/credit) and unpaid-code accounts
(activation code with `paymentStatus: 'unpaid'`) no longer propagate binary
PV to any upline node up to root.

Previously, every registration unconditionally enqueued a `placement-sales`
compensation item regardless of account type or code payment status.

### Condition
```typescript
const eligibleForBinaryPV =
  matchingCode.accountType !== 'FS' && matchingCode.paymentStatus !== 'unpaid';
```

### Files affected
- `yor_backend/src/modules/production/encoding-service.ts` â€” `submitRegistration()` ~L(gate added before queue creation)

### Reason
Business rule BIN-01: "Only PD (paid) and CD Paid accounts generate binary PV
to uplines. FS and Unpaid-CD do NOT propagate binary points."
User instruction: "only eligible to pair is Paid and Paid CD accounts"

### Authority
BUSINESSRULE.md BIN-01 + direct user instruction 2026-06-11.

---

## 2026-06-11 â€” CD-DEDUCTION-2026-06-11: CD Deduction Changed to 100%

**Rule area:** Encashment deduction stack â€” CD recovery
**Gate ID:** `CD-DEDUCTION-2026-06-11`

### What changed
CD (Credit-Deferred) balance deduction on encashment changed from a 5% cap
per encashment to 100% of the encashment amount (up to the outstanding CD balance).

| Before | After |
|---|---|
| `Math.min(cdBalance, amount * 0.05)` | `Math.min(cdBalance, amount)` |

### Files affected
- `yor_backend/src/modules/production/encoding-service.ts` â€” `buildMemberWalletData()`
- `yor_backend/src/modules/operations/legacy-parity-service.ts` â€” encashment preview ~L519
- `yor_backend/src/modules/sandbox/dev-sandbox-store.ts` â€” `submitSandboxEncashment()` and `getSandboxWalletSummary()` preview

### Reason
User instruction: "make the cd deduction 100% on all encashment"
The outstanding CD balance must be recovered from the member's encashment
at 100% of the encashment amount until the debt is cleared.

### Authority
BUSINESSRULE.md ENC-01 + direct user instruction 2026-06-11.

---

## 2026-06-11 â€” CASHIER-AUTH-FIX-2026-06-11: Cashier Login Auth Fallback Added

**Rule area:** Authentication / Staff account lookup
**Gate ID:** N/A (bug fix, not a rule change)

### What changed
Added a 4th fallback lookup path in `findAppUserByUsername` to match staff
accounts stored with a plain username string in the `email` column (no domain).

The existing 3rd fallback only matched `username@*` (prefix match), which missed
accounts like `yorcashier` stored directly as the email value.

### Files affected
- `yor_backend/src/modules/auth/app-users.ts` â€” `findAppUserByUsername()` fallback #4

### Reason
Cashier account `yorcashier` (stored as email='yorcashier' with no domain) was
returning 401 because none of the 3 existing lookup paths matched it.

---

## 2026-06-12 — GATE-BIN-PV-PDCD-20260612: PD/Paid-CD-Only DR and Binary PV (Reverts GATE-BIN-PV-FS-2026-06-12)

**Rule area:** Direct Referral and binary PV source eligibility
**Gate ID:** `GATE-BIN-PV-PDCD-20260612`

### What changed

Owner ruling (2026-06-12): **FS stays FS forever** and never generates Direct
Referral or binary PV, even when its package payment is settled. Only PD
(settled payment) and fully-settled CD accounts are eligible sources. This
reverts the 2026-06-12 widening that allowed paid FS entries.

- Eligibility now flows through the shared Nogatu-parity module
  `src/modules/compensation/account-state.ts` (`countsForPairingSource`,
  `countsForDirectReferralSource`), mirroring
  `NogatuMLM/Nogatu_Backend/services/accountState.js`.
- Unpaid (PD or CD) entries defer DR and PV to the settlement trigger instead
  of dropping them.
- CD registrations now record the Commission Deduction obligation on the
  network account (`cd_amount` = package price, `cd_status` outstanding).
- Get Yor Five counting now includes only eligibility-qualified directs, and
  its process key now carries a per-group index (previously the 10th, 15th, …
  payouts would have been silently blocked by the key of the 5th).

**Files:** `yor_backend/src/modules/compensation/account-state.ts`,
`yor_backend/src/modules/production/encoding-service.ts`

**Authority:** Owner chat ruling 2026-06-12; Nogatu reference logic.

---

## 2026-06-12 — GATE-CD-SETTLE-20260612: Code Settlement Fires Deferred DR + Binary PV

**Rule area:** CD/unpaid entry settlement
**Gate ID:** `GATE-CD-SETTLE-20260612`

### What changed

New settlement trigger (`settleActivationCode`, admin/BOD/superadmin only —
not cashier). When a consumed, non-FS code is marked `paid` /
`externally-paid`, or when a CD obligation is cleared through encashment
recovery, the deferred Direct Referral posts to the sponsor and binary PV is
queued bottom-up from the settled account — using the same deterministic
process keys as registration, so each posting happens at most once.

**Files:** `yor_backend/src/modules/production/encoding-service.ts`,
`yor_backend/src/routes/admin.ts` (`POST /api/admin/activation-codes/settle`)

**Authority:** Owner chat ruling 2026-06-12 ("when that cd account became paid
it will generate PV binary points to its upline"); Nogatu effective-state logic.

---

## 2026-06-12 — GATE-BIN-PAIR-20260612: Pairing Recipient Eligibility + Qualified-Direct Unlock

**Rule area:** Salesmatch pairing payout eligibility (recipient side)
**Gate ID:** `GATE-BIN-PAIR-20260612`

### What changed

1. Leg volume always accumulates (strong-leg carry preserved), but a match is
   executed and paid only when the recipient is an eligible account (PD /
   fully-settled CD). FS and unpaid-CD recipients hold volume until eligible.
2. Nogatu parity: the first pairing payout unlocks only after the recipient
   has personally sponsored at least one qualified direct placed inside their
   own binary subtree. Spillover alone never unlocks pairing.

**Deviation recorded for company confirmation:** Nogatu lets an unpaid-CD
*owner* receive pairing from eligible downlines; the owner ruling ("only PD
and Paid CD accounts should pair") is implemented instead. Volume is held, not
forfeited, so a later policy change loses nothing.

**Files:** `yor_backend/src/modules/production/encoding-service.ts`
(`processCompensationQueue`)

**Authority:** Owner chat ruling 2026-06-12;
`NogatuMLM/Nogatu_Backend/services/binaryEligibility.js`, `income/pairing.js`.

---

## 2026-06-12 — GATE-SMB-CAP-20260612: Weekly/Monthly Salesmatch Caps with Forfeiture

**Rule area:** Salesmatch Bonus caps (BIN-01)
**Gate ID:** `GATE-SMB-CAP-20260612`

### What changed

Package weekly and monthly SMB caps (BUSINESSRULE.md package catalog) are now
enforced at payout time in the production pairing engine. Matched volume above
the cap is **forfeited** (legs still consumed) per owner ruling. Binary Cycle
percent is computed on the capped (paid) salesmatch amount, not the raw match.
Weeks run Monday 00:00 Asia/Manila; months are Manila calendar months (window
definition pending company confirmation). Per-day pairing snapshots record
matched, paid, and forfeited amounts.

**Files:** `yor_backend/src/modules/compensation/cap-windows.ts`,
`yor_backend/src/modules/production/encoding-service.ts`,
`yor_backend/supabase/migrations/0002_encashments_and_settlement.sql`

**Authority:** BUSINESSRULE.md package catalog caps; owner ruling 2026-06-12
(forfeiture option).

---

## 2026-06-12 — ENC-01 Production Encashment Workflow (Ledger-Backed)

**Rule area:** Encashment request/review workflow
**Gate ID:** `GATE-ENC-PROD-20260612`

### What changed

Production mode now has a real encashment workflow (previously the submit
route silently fell through to the sandbox engine):

- `POST /api/member/wallet/encash` writes an `encashments` row plus an
  idempotent gross ledger debit (`encashment-submit:<user>:<request>:debit`).
- Deduction stack unchanged: PHP 50 fee, 10% tax, 5% System Retainer, then CD
  recovery at 100% of the remaining net until the obligation clears.
- CD recovery that clears the obligation triggers the settlement path
  (deferred DR + PV).
- Admin review: approve → mark-paid; reject posts a compensating ledger credit
  restoring the gross (append-only corrections, AUD-01).
- Production routes no longer fall back to sandbox/demo data on error; they
  return real errors (preview-encash, encashments list, approve/review).

**Files:** `yor_backend/src/modules/production/encoding-service.ts`,
`yor_backend/src/routes/member.ts`, `yor_backend/src/routes/admin.ts`,
`yor_backend/supabase/migrations/0002_encashments_and_settlement.sql`

**Authority:** ENC-01 (BUSINESSRULE.md); owner ruling 2026-06-12 (CD = 100%
recovery per encashment).

---

*Last updated: 2026-06-12*

## 2026-06-12 — Review-Gate Fixes: CD Recovery Timing + Money-Path Atomicity

**Rule area:** Encashment workflow, settlement timing, pairing queue
**Gate ID:** `GATE-ENC-PAID-RECOVERY-20260612`

### What changed (cross-model adversarial review findings, all fixed)

1. **CD recovery and its settlement side effects now fire at `mark-paid`,
   not at submit.** Previously a rejected encashment refunded the gross while
   leaving the CD obligation cleared and the deferred DR/PV permanently fired —
   a money-creation path. Now submit only reserves funds; reject leaves zero
   side effects; over-withheld recovery (obligation settled by other means
   between submit and payout) is refunded by compensating credit.
2. **One open encashment request per member** (pending/queued/approved blocks
   a new submit) — prevents double-reserving the CD obligation and shrinks the
   balance-check race surface.
3. **Per-key money locks** serialize submit, review, settle, and queue
   processing in the single-process deployment (TOCTOU double-spend guard).
   Multi-node deployment requires a DB-level lock — recorded in the decision log.
4. **Compensation queue is at-most-once**: items are marked processed before
   application; a mid-walk crash logs `COMPENSATION_ITEM_FAILED` for manual
   replay instead of silently double-crediting legs on the next run.
5. **Idempotent replays no longer throw**: unique-violation (23505) on
   wallet-ledger/encashment inserts is treated as a no-op replay.
6. Preview now computes CD recovery against the post-fee net, matching submit.

**Files:** `yor_backend/src/modules/production/encoding-service.ts`,
`supabase-encoding-repository.ts`, `src/routes/member.ts`, `src/routes/admin.ts`

**Authority:** gstack /review verification gate (security specialist + adversarial
cross-check), 2026-06-12. ENC-01 deduction values unchanged.

---

*Last updated: 2026-06-12*
