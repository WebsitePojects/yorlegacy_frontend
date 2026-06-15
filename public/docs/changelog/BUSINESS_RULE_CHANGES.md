# Business Rule & Logic Change Log

---

## 2026-06-15 — GATE-PLACEMENT-TOKEN-PARAM-20260615: fix reserved-slot share link dropping placement

**Rule area:** Binary placement (genealogy position from sponsor share link)
**Gate ID:** `GATE-PLACEMENT-TOKEN-PARAM-20260615`
**Scope:** Frontend registration only (no schema, no money change).

### What changed

The "Active Share Link" reserves a specific binary slot and the backend emits the slot token as the URL param `placementToken=…` (`buildRegistrationUrl`, `frontend-origin.ts`). The registration page was reading `searchParams.get('token')` — the wrong key — so the token resolved to empty and the reservation was **silently dropped**: a prospect registering through the reserved link was auto-placed by the server's default policy instead of landing in the reserved slot. Because placement drives the binary tree (and downstream salesmatch pairing income), this is corrected.

`RegisterPage.tsx` and `RegistrationPageView.tsx` now read `placementToken` first, with the legacy `token` key kept as a fallback so any older links still resolve. No money already paid is affected; only future placements through reserved share links are corrected.

---

## 2026-06-15 — GATE-FS-PV-RECOMPUTE-20260615: PROD binary PV recomputed from eligible sources only (money kept)

**Rule area:** Binary leg PV/points (genealogy + salesmatch legs)
**Gate ID:** `GATE-FS-PV-RECOMPUTE-20260615`
**Scope:** PROD data correction only (no schema change; `schema.sql` unaffected). Migration `db/migrations/0013_recompute_eligible_pv_prod_cleanup.sql`.

### What changed

Prod went live before the pairing/DR eligibility gate existed, so FS and CD-unpaid (ineligible) accounts generated binary PV into uplines and were paid Direct Referral + Salesmatch. Per owner ruling 2026-06-15:

- **Money kept untouched** — `wallet_ledger` (PHP 514,749 total credits) and `salesmatch_balances.matched_sales` are unchanged. No one loses what was already paid; no double-pay (matched stays ahead of recomputed legs).
- **Ineligible PV removed** — every account's `left_points` / `right_points` (network) and `left_points` / `right_points` / `left_sales` / `right_sales` (salesmatch) were recomputed counting **only eligible (PD / settled-CD) source PV**, package-weighted by each member's activation-code `locked_binary_points` (1 PV = PHP 250). FS / CD-unpaid as a **source** now contributes 0.
- FS accounts may still hold large legs (e.g., 22 PV) **as long as those points come from eligible downline**.

Confirmed against Nogatu `services/accountState.js` (FS never an eligible source; CD only when fully paid). Reversible snapshot: `_pv_recompute_backup_20260615` (prod).

---

## 2026-06-15 — GATE-UNI-MONTHLY-20260615: Unilevel is a monthly batch over the sponsor tree with 200-PV maintenance

**Rule area:** Unilevel Bonus
**Gate ID:** `GATE-UNI-MONTHLY-20260615`

### What changed

Unilevel was previously credited **inline** on each product repurchase (walking the sponsor chain up, no maintenance gate). Per the official Yor Unilevel Bonus plan it is now a **monthly batch**:

- **Tree:** sponsor / bloodline tree (`network.sponsorUserId`), **never the binary tree**. Each direct/bloodline ancestor earns at their own level.
- **Base:** downline **repurchase PV** accrued that calendar month (every product = **20 PV**: Perfume, Eyedrops, Perfume Refill). Not the peso price, not the SMB pairing PV.
- **Rates (10 levels):** L1 10%, L2 8%, L3 5%, L4 5%, L5 3%, L6 3%, L7 2%, L8 1%, L9 1%, L10 1%.
- **Maintenance:** an earner must accrue **≥ 200 repurchase PV that month** to earn any unilevel; **resets every month** — a non-maintaining month earns nothing and carries nothing forward.
- **Idempotent** per `(earner, month, level, downline)`; settled by `reconcileMonthlyUnilevel()` (drainer each tick, safe to re-run). `submitProductRepurchase` now records the repurchase PV and credits Lifestyle inline, but **no longer credits unilevel inline**.

### Why

Owner compensation-plan slide (2026-06-15) + ruling: unilevel is monthly, maintenance-gated, paid through the bloodline tree.

---

## 2026-06-15 — GATE-SMB-FS-RECIPIENT-20260615: FS/Business/VIP owners earn salesmatch on their own matched volume

**Rule area:** Salesmatch Bonus (SMB) recipient eligibility
**Gate ID:** `GATE-SMB-FS-RECIPIENT-20260615`

### What changed

`applyPlacementSalesItem` (inline) and `reconcileSalesmatchForUserLocked` (sweep) previously gated **whether the owner could receive a pairing payout** on `countsForPairingSource(owner)` — which returns `false` for `FS` and unsettled-`CD` accounts. Because **Business and VIP packages map to account type `FS`**, those owners accumulated volume on both legs but **never paired** — earning zero SMB.

Now the owner earns salesmatch on their own matched volume **regardless of their own account type**. Only two gates remain on match execution:
- the shadow sibling-pair block (`GATE-SHADOW-ACT-20260613`), and
- positive matched volume on both legs (`salesmatchDelta > 0`).

### Why (rule basis)

`countsForPairingSource` (FS / CD-unpaid exclusion) governs whether a **new member's PV feeds uplines as a *source*** — and that is already enforced at registration via `pvEligible` *before any leg accumulates*. Per **BIN-01**, SMB eligibility is "qualified source volume", with no requirement on the recipient's account type. Applying the source rule to the recipient was a Nogatu-parity carry-over not present in Yor's BUSINESSRULE.md, and it produced the nonsensical result that the highest-paid package (VIP, PHP 159,998, 300k/week SMB cap) earned no salesmatch.

### Blast radius

Network-wide: every `FS` / unsettled-`CD` owner with qualified volume on both legs now earns SMB as before any PD owner would. No change to caps, conversion (1 PV = PHP 250), carry-forward, or source eligibility.

### Idempotency / backfill

`processId` (`smb-reconcile:<userId>:<matchedSales×100>`) is unchanged, so the reconcile backfills each owner's outstanding `min(left,right) − matchedSales` delta exactly once on the next encode or trigger — no double-pay.

---

## 2026-06-15 — GATE-SMB-INSTANT-20260615: Salesmatch / binary-cycle compensation runs synchronously on encode

**Rule area:** Salesmatch Bonus (SMB) + Binary Cycle crediting timing
**Gate ID:** `GATE-SMB-INSTANT-20260615`

### What changed

Previously, `submitRegistration` only **enqueued** a `placement-sales` compensation event. Crediting then waited for either the 10-second background drainer or a dashboard page-load `trigger-compensation` call — so SMB/binary-cycle income did not appear immediately after encoding a member.

Now, immediately after enqueueing (when the new member is PV-eligible), `submitRegistration` synchronously calls `processCompensationQueue()` + `reconcileSalesmatchAllEligible()` so PV propagation, SMB pairing, and binary cycle credit at the moment of encode.

- **No calculation change** — same amounts, same caps, same idempotent `processId` locks. Only the execution timing moved earlier.
- Failure is non-fatal: registration is already committed; the background drainer retries.

### Why

Owner/member expectation: encoding an eligible member that completes a left/right pair must credit SMB instantly, not after a delay.

---

## 2026-06-15 — GATE-GLOBAL-BONUS-3PCT-20260615 (amended): 3% net product sales pool reclassified as Lifestyle Bonus (lifestyle_rewards), not Global Bonus

**Rule area:** Lifestyle Bonus income stream
**Gate ID:** `GATE-GLOBAL-BONUS-3PCT-20260615` (amendment — original entry below)

### What changed (amendment 2026-06-15)

The 3% net product sales pool distribution was initially implemented posting to `global_bonus` / `main` wallet. Owner ruling 2026-06-15 clarified: this pool **is** the Lifestyle Bonus mechanism, not a Global Bonus.

- Changed `entryType`: `global_bonus` → `lifestyle_rewards`
- Changed `walletType`: `main` → `lifestyle`
- `sourceReference`: `'global-bonus-pool'` → `'lifestyle-pool'`
- `processId` prefix: `'global-bonus:'` → `'lifestyle-pool:'`
- All other mechanics unchanged (3% pool, equal distribution, idempotent `global_bonus_included` flag)

### Original entry (initial implementation 2026-06-15)

Prior rule (BUSINESSRULE.md): Global Bonus was "2% yearly pool with HOF and maintenance qualifiers."

New rule (owner ruling 2026-06-15): **3% of the company's net product sales**, distributed continuously to **all active members in equal portions**.

- Pool = `SUM(repurchases.unit_price WHERE global_bonus_included = false) × 3%`
- Per-member share = `pool ÷ count(active members)`
- Tracked via `repurchases.global_bonus_included` flag (idempotent)
- Drainer runs every 10 seconds

### Reason / authority

Owner ruling 2026-06-15: "it is based on the product sales net and 3% of that will be equally distributed across the whole system — this is lifestyle bonus."

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` (`reconcileGlobalBonus`)
- `yor_backend/src/server.ts` (drainer log label)
- `db/migrations/0011_product_dp_and_global_bonus_tracking.sql` (DB tracking columns unchanged)

---

## 2026-06-15 — GATE-PRODUCT-DP-20260615: Product repurchase unit_price is now tier-based Discounted Price (DP), not SRP

**Rule area:** Product repurchase accounting / `repurchases` ledger
**Gate ID:** `GATE-PRODUCT-DP-20260615`

### What changed

Previously `repurchases.unit_price` stored the SRP (PHP 500 for both Yor Perfume and Yor Vision). This was inaccurate — the company does not collect the SRP from members; it collects the DP (discounted price) which varies by the buyer's package tier.

New behavior: `repurchases.unit_price` = the actual DP charged to the member based on their package tier:

| Package | Yor Perfume DP | Yor Vision DP |
|---------|---------------|--------------|
| Basic   | PHP 350       | PHP 250      |
| Classic | PHP 320       | PHP 240      |
| Standard| PHP 300       | PHP 230      |
| Business| PHP 280       | PHP 220      |
| VIP     | PHP 250       | PHP 210      |

SRP (PHP 500) is stored in the new `repurchases.srp_price` column for audit reference. The retail profit (SRP − DP) accrues to the selling member and remains outside the internal earning engine (Direct Selling is a public-only activity per BUSINESSRULE.md).

Existing rows backfilled: `srp_price = unit_price` (old rows used SRP as unit_price); marked `global_bonus_included = true` to exclude from future pool calculations.

### Reason / authority

Owner image supplied 2026-06-15 showing tier-based DP table. Accounting accuracy requirement: "the company sold to one Basic member at PHP 350 but to a VIP at PHP 250 for the same product."

### Files affected

- `yor_backend/src/modules/compensation/repurchase-product-catalog.ts` (`dpByTier`, `srpPrice`, `getProductDp`)
- `yor_backend/src/modules/production/encoding-service.ts` (`submitProductRepurchase`)
- `db/migrations/0011_product_dp_and_global_bonus_tracking.sql`

---

This file is the canonical record of every business rule, compensation logic, or
financial calculation change made to the Yor International platform.

**Format per entry:**
- Date, Gate ID, Rule area, What changed, Files affected, Reason / authority

Only business-rule-level changes are logged here.
Simple UI tweaks, CSS, copy, and config changes are not recorded.

---

## 2026-06-14 — GATE-PV-GROSS-20260614: Binary leg points are gross lifetime volume; matched is tracked separately (no consume-on-match)

**Rule area:** Binary PV / salesmatch leg accounting
**Gate ID:** `GATE-PV-GROSS-20260614`

### What changed

Binary leg points/sales (`network_accounts.left_points/right_points`, `salesmatch_balances.left_sales/right_sales/left_points/right_points`) are now **gross lifetime accumulated volume** and are **never reduced**. Previously each pairing **consumed** (subtracted) the matched amount from both legs (carry-forward model).

Salesmatch and Binary Cycle now pay on the **increase** in matched volume:
`salesmatchDelta = min(grossLeft, grossRight) - matchedSales(previous)`, and `matched_sales`/`matched_points` hold the **cumulative matched running total**. Payout amounts are unchanged; only the leg bookkeeping changed (gross is preserved so the genealogy tree shows true downline volume bottom-to-top).

This also backfills correctly: see `GATE-PV-BACKFILL-20260614` (db/migrations/0007) which set existing leg points to gross volume — the engine now stays consistent with that on every new registration.

### Reason / authority

Owner ruling 2026-06-14: "don't reduce — separate the gross/lifetime accumulated points vs matched points." Fixes the genealogy tree showing near-zero PV at the roots instead of the accumulated network volume.

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` (`applyPlacementSalesItem` match block)
- `yor_backend/src/modules/production/encoding-service.test.ts`
- `db/migrations/0007_backfill_binary_pv_gross_leg_volume.sql`

---

## 2026-06-14 — GATE-BIN-CYCLE-UPLINE-A-20260614: Binary Cycle is paid one level down to the upline's A-position member, never self-earned

**Rule area:** Binary Cycle bonus recipient
**Gate ID:** `GATE-BIN-CYCLE-UPLINE-A-20260614` (supersedes `GATE-BIN-CYCLE-ONCE-20260613`)

### What changed

Binary Cycle is **no longer paid on your own matched salesmatch volume**. When any upline `U`
executes a salesmatch pairing, the Binary Cycle percentage flows **one level down** to `U`'s
**A-position member** — the member placed at `U`'s **left-shadow-left** slot
(`findPlacementChild(U, 'left', 'left')`). The percentage is the **A member's own package**
`binaryCyclePercent`, applied to the full matched salesmatch movement (uncapped, per
`GATE-BIN-CYCLE-NOCAP-20260613`).

Consequences:
- A member earns Binary Cycle **solely** from the upline that placed them in the A slot. One
  level only — no cascade, no payout to `U` itself, no B→YOU propagation.
- The prior once-per-event self-payout model (`GATE-BIN-CYCLE-ONCE-20260613`) is retired; each
  paying upline now credits its own distinct A, so no propagation guard is needed.
- Basic A-recipients earn nothing (Basic has no Binary Cycle layer).

### Reason / authority

Owner sign-off 2026-06-14: "the real binary cycle you earn is from your upline that placed you
on A position … when he earned pairing you will receive percent based on your package." Fixes
the reported over-payment where a member self-earned Binary Cycle on their own A/B pairing.

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` (`applyPlacementSalesItem`)
- `yor_backend/src/modules/production/encoding-service.test.ts`
- `yor_backend/src/modules/production/encoding-compensation-matrix.test.ts`

---

## 2026-06-14 — GATE-ENCASH-DIRECT-PAY-20260614: Encashment settles in one Mark-Paid step with no approval/queue and fixed member-submitted values

**Rule area:** Encashment review workflow
**Gate ID:** `GATE-ENCASH-DIRECT-PAY-20260614`

### What changed

Encashment no longer requires a separate approve/queue step. An admin marks a **pending**
request paid directly in one action; CD recovery + settlement fire exactly as before. The
member-submitted breakdown (gross, fee, tax, CD deduction, method) is **fixed and read-only** —
the admin can no longer edit any value. Only already-`paid` or `rejected` requests are blocked
from a Mark-Paid transition.

### Reason / authority

Owner request 2026-06-14: "make the encashment no need approval just mark as paid no more queue
and make it unchangeable values … I shouldn't be able to add tax and anything."

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` (`reviewEncashment`)
- `yor_frontend/src/pages/AdminDashboardPage.tsx` (encashment panel)

---

## 2026-06-13 — GATE-BIN-PV-20260613: Pairing BP locks to Salesmatch ÷ 250 for every registration package

**Rule area:** Salesmatch / binary pairing PV  
**Gate ID:** `GATE-BIN-PV-20260613`

### What changed

Generated registration codes now lock binary pairing BP from the approved Salesmatch Bonus value using **1 BP/PV = PHP 250 SMB**. This keeps Basic, Classic, Standard, Business, and VIP aligned to the owner-supplied pairing image:

| Package | SMB value | Locked pairing BP |
| --- | ---: | ---: |
| Basic | PHP 250 | 1 |
| Classic | PHP 500 | 2 |
| Standard | PHP 2,500 | 10 |
| Business | PHP 5,000 | 20 |
| VIP | PHP 15,000 | 60 |

Basic is included in pairing propagation when the encoded source account is eligible under BIN-01 (`PD` paid / settled `CD`). Basic still has no Binary Cycle percentage layer.

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts`
- `yor_backend/src/modules/sandbox/dev-sandbox-store.ts`
- `yor_frontend/src/components/pages/RegistrationPageView.tsx`
- `yor_frontend/src/components/ops/GenealogyTree.tsx`
- `yor_frontend/src/pages/MemberDashboardPage.tsx`
- `BUSINESSRULE.md`

### Reason / authority

Direct owner instruction and supplied package-pairing image on 2026-06-13. This preserves BIN-01 and removes drift between package catalog PV language and executable pairing BP.

## 2026-06-13 — GATE-LFR-20260613: Lifestyle Repurchase Trigger — production posting engine wired

**Rule area:** Lifestyle Rewards — production posting engine  
**Gate ID:** `GATE-LFR-20260613`

### What changed

Lifestyle production posting engine is now wired to the member maintenance/refill code-use flow.

**Before:** `runMemberMaintenanceCode` returned a `buildGatedParityAction` stub in production mode — no lifestyle credits or unilevel credits were posted when a member consumed a maintenance or refill code.

**After:** `runMemberMaintenanceCode` in production mode calls `svc.consumeMaintenanceCode` → `submitProductRepurchase`, which fires both:
- `applyRepurchaseLifestyle` (credits **1%** of product repurchase price to the BUYER's lifestyle wallet, subject to daily/monthly package caps)
- `creditUnilevelForRepurchase` (credits the sponsor bloodline up to 10 levels)

### Key parameters

| Item | Value |
| --- | --- |
| Backend payable rate | **1%** (3% is the public marketing rate shown to members) |
| Perfume (YOR MAINTENANCE) lifestyle credit | PHP 5.00 per purchase |
| Refill (YOR REFILL) lifestyle credit | PHP 1.50 per purchase |
| Classic daily / monthly cap | PHP 1,000 / PHP 30,000 |
| Standard daily / monthly cap | PHP 2,000 / PHP 60,000 |
| Business daily / monthly cap | PHP 3,000 / PHP 90,000 |
| VIP daily / monthly cap | PHP 5,000 / PHP 150,000 |
| Basic package | **Not eligible** — no lifestyle credit |
| Idempotency | Process key `LFR:<memberUserId>:<repurchaseRef>` |

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` — `applyRepurchaseLifestyle`, `submitProductRepurchase`, `consumeMaintenanceCode`, `findOwnedMaintenanceCode`; `CodeFamily` union extended with `'YOR REFILL'`
- `yor_backend/src/modules/operations/legacy-parity-service.ts` — `runMemberMaintenanceCode` production path
- `yor_backend/src/modules/production/supabase-encoding-repository.ts` — `insertRepurchase`, `sumLifestyleCreditsForUserToday`, `sumLifestyleCreditsForUserThisMonth`
- `yor_backend/src/modules/compensation/repurchase-product-catalog.ts` — `lifestyleDailyCapByPackage`, `lifestyleMonthlyCapByPackage`, `findProductByCodeFamily`
- `yor_backend/src/modules/production/lifestyle-repurchase.test.ts` — 6 new tests (193 total, all green)

### Reason / authority

Owner sign-off (2026-06-13): lifestyle production posting engine approved. Backend rate is 1% (not 3% public-facing). Daily + monthly caps per package.

---

## 2026-06-13 — GATE-GYF-TIER-20260613: Get Yor Five — Groups keyed by direct's tier, not sponsor's tier

**Rule area:** Get Yor Five — group qualification scope
**Gate ID:** `GATE-GYF-TIER-20260613`

### What changed

Owner clarification: Get Yor Five groups are keyed by the **DIRECT's package tier**, not the sponsor's own package tier. A sponsor of any tier earns the corresponding bonus for every 5 eligible directs of a given tier.

**Before (description only — code was already correct):** UI said "same package tier as you" implying the sponsor must share the same tier.

**After:** Any sponsor earns a Classic bonus for 5 eligible Classic directs, Standard for 5 Standard, etc., regardless of their own package.

### Eligibility rule (confirmed, already in code)

- FS (Free Slot) accounts do NOT count toward any group
- Unpaid/outstanding CD accounts do NOT count (only fully-settled CD counts)
- PD accounts with settled payment count
- Grouping is 5 per tier across all ELIGIBLE_TIERS: Classic, Standard, Business, VIP
- Basic does not participate (getFiveAmount = 0)

### Files affected

- `yor_frontend/src/pages/GetYorFivePage.tsx` — updated "How Get Yor Five Works" descriptions
- `BUSINESSRULE.md` — GYF-01 Eligibility and clarification section updated

### Authority

Owner directive 2026-06-13

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

## 2026-06-13 — PD Codes Are Paid; Only CD Uses Paid/Unpaid State

**Rule area:** Activation code lifecycle, registration eligibility, pairing/direct-referral qualification
**Gate ID:** `GATE-PD-PAID-20260613`

### What changed

1. **PD activation codes are now treated as paid by rule**, even if older data still carried an `unpaid` flag.
2. **Only CD keeps paid/unpaid settlement behavior.** CD still defers direct-referral and pairing eligibility until the obligation is fully settled.
3. **Production code generation now creates PD codes with `payment_status = 'paid'`** while CD remains `unpaid` until settlement.
4. **Dev database parity was repaired** so activation-code inventory can store `unreleased` status and existing PD rows are normalized to `paid`.

**Files:** `yor_backend/src/modules/compensation/account-state.ts`,
`yor_backend/src/modules/production/encoding-service.ts`,
`yor_backend/src/modules/sandbox/dev-sandbox-store.ts`,
`yor_backend/supabase/schema.sql`,
`yor_backend/supabase/migrations/20260613075106_dev_pd_paid_and_activation_status_parity.sql`

**Reason:** Owner clarification on 2026-06-13 that PD literally means paid code; only CD can remain unpaid and require later settlement.

---

*Last updated: 2026-06-13*

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

---

## 2026-06-13 — GATE-SHADOW-ACT-20260613: Shadow Accounts Auto-Activate at Encoding with Owner Package Tier

**Rule area:** Shadow accounts — activation lifecycle, package inheritance, sibling-pair block  
**Gate ID:** `GATE-SHADOW-ACT-20260613`

### What changed

**Before:** Shadow accounts were created in state `reserved_shadow` (no package tier, no PV, no salesmatch value). A separate activation code had to be manually applied to move them to `activated_shadow`.

**After:** Shadow accounts are created in state `activated_shadow` **immediately when the owner member is encoded**. They inherit the owner's package tier at creation (Business member → two Business shadows). PV and salesmatch value remain 0 until an upgrade code is applied.

#### Activation status semantics (changed)

| Field | Old meaning | New meaning |
|---|---|---|
| `activationStatus = 'inactive'` | `state === 'reserved_shadow'` | `pvValue === 0` (auto-activated but no upgrade code yet) |
| `activationStatus = 'activated'` | `state === 'activated_shadow'` | `pvValue > 0` (upgrade code applied) |
| `canActivate` | `state === 'reserved_shadow'` | `pvValue === 0` |
| `canUpgrade` | `state !== 'reserved_shadow'` | `pvValue > 0` |

#### Sibling-pair block (new)

When a shadow upgrade code is applied and a `placement-sales` event is enqueued, the payload now carries `shadowPairBlockOwnerUserId = ownerUserId`. During compensation processing (`applyPlacementSalesItem`), when the walk-up reaches the blocked owner's userId, the leg **accumulates normally** but **match execution is suppressed at that level**. The PV continues walking up to the owner's placement parent and above.

This means: a member's left shadow and right shadow can NEVER pair each other to generate a salesmatch bonus for the owner. Pairing at the owner's level is only possible when a **real member's** placement-sales event (which carries no `shadowPairBlockOwnerUserId`) contributes to one of the legs.

### Package inheritance table

| Owner package | Left shadow package | Right shadow package |
|---|---|---|
| Basic | Basic | Basic |
| Classic | Classic | Classic |
| Standard | Standard | Standard |
| Business | Business | Business |
| VIP | VIP | VIP |

Shadows can be upgraded (e.g., Basic → Standard) by applying a higher-value code through the existing `activateShadowAccount` flow.

### What did NOT change

- Shadow accounts still cannot earn wallet, unilevel, or binary cycle bonuses (`walletEnabled`, `unilevelEnabled`, `binaryCycleEnabled` all remain `false`)
- Shadows are still excluded from sponsor-tree (unilevel) crediting
- The upgrade flow (applying a higher-tier code to increase PV) works identically
- The `hasQualifiedPersonalDirectInSubtree` gate for first pairing unlock is unchanged

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts`
  - `ProductionCompensationQueueItem.payload`: added `shadowPairBlockOwnerUserId?: string | null`
  - `createDefaultShadowAccount`: state changed to `'activated_shadow'`, packageTier auto-set from owner
  - `toGenealogyShadowSlot`: `activationStatus` now derived from `pvValue`
  - Member shadow account listing: `activationStatus`, `canActivate`, `canUpgrade` re-derived from `pvValue`
  - `activateShadowAccount`: upgrade-block guard now checks `previousSalesmatchValue > 0` instead of `state !== 'reserved_shadow'`; enqueued payload gains `shadowPairBlockOwnerUserId`
  - `applyPlacementSalesItem`: sibling-pair block check added before match execution

### Reason / authority

Owner instruction 2026-06-13: "shadow accounts must be activated as soon as youre encoded but they are considered inactive when theres nothing in your downline … if you are a business package account then your 2 shadows also business … they cant pair to each other you left shadow cant pair to right shadow."

---

## 2026-06-13 — GATE-RETAINER-EXEMPT-20260613: PrinceI.T System Retainer Exemption

**Rule area:** Encashment — system retainer charge  
**Gate ID:** `GATE-RETAINER-EXEMPT-20260613`

### What changed

Account `PrinceI.T` (system operator) is permanently exempt from the 5% system retainer on all encashment requests. The exemption is keyed by **immutable userId** (`0f0464cf-9886-471f-9adf-5a4255a8043f`), so name or username changes never affect it. The preview API returns `retainerExempt: true`; the frontend shows "system retainer waived."

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts` — `SYSTEM_RETAINER_EXEMPT_USER_IDS`, `submitEncashment`, `buildMemberWalletData`
- `yor_frontend/src/types/auth.ts`, `yor_frontend/src/pages/MemberDashboardPage.tsx`

### Reason / authority

Owner instruction 2026-06-13.

---

## 2026-06-13 — GATE-SHADOW-WALLET-20260613: Shadow Wallets Enabled; activationStatus Removed

**Rule area:** Shadow accounts — wallet enablement and status model  
**Gate ID:** `GATE-SHADOW-WALLET-20260613`

### What changed

- Shadow `walletEnabled` set to `true` when an upgrade code is applied (was always `false`).
- Upgrading main account does NOT auto-upgrade shadows; shadows need their own codes.
- `activationStatus: 'inactive' | 'activated'` removed from API and UI, replaced by `hasUpgradeCode: boolean`.
- Genealogy tree popover now shows package tier and upgrade code, always offers upgrade codes.
- All "Activate Shadow" copy replaced with "Upgrade Shadow."

### Files affected

- `yor_backend/src/modules/production/encoding-service.ts`, `yor_frontend/src/types/auth.ts`, `yor_frontend/src/components/ops/GenealogyTree.tsx`, `yor_frontend/src/pages/MemberDashboardPage.tsx`, test fixtures

### Reason / authority

Owner instruction 2026-06-13: "inactive and active is not needed as part of the system now since shadow accounts can be upgraded in order to weekly/monthly limit of their each wallet … they will be needing separate activation codes."

---

## 2026-06-13 — GATE-FS-RESET-20260613: FS Account Binary Left/Right Points Reset to Zero

**Rule area:** Binary accumulation — FS accounts  
**Gate ID:** `GATE-FS-RESET-20260613`

### What changed

Binary `left_points` and `right_points` on `network_accounts` for 12 FS (Free Slot) accounts were reset to 0 in the production DB. Salesmatch `matched_sales`, `matched_points` are preserved. The reset eliminates erroneously accumulated binary PV generated by FS-to-FS and FS-to-direct-referral pairings that occurred before the `GATE-BIN-PV-PDCD-20260612` eligibility gate was enforced.

**Authority:** Owner directive 2026-06-13. Production write authorized by owner.

---

## 2026-06-13 — GATE-BIN-CYCLE-ONCE-20260613: Binary Cycle Fires at Most Once Per Placement Event

**Rule area:** Binary Cycle Bonus — propagation limit per registration  
**Gate ID:** `GATE-BIN-CYCLE-ONCE-20260613`

### What changed

The binary cycle bonus now fires **at most once** per placement event walk-up. Previously, the cycle could fire at every ancestor level where a salesmatch match occurred (B→YOU chain). A `binaryCycleConsumed` boolean flag stops re-firing after the first eligible credit.

**File:** `yor_backend/src/modules/production/encoding-service.ts` — `applyPlacementSalesItem`

**Authority:** Owner clarification 2026-06-13.

---

## 2026-06-13 — GATE-CASHIER-CODES-20260613: Cashier Cannot Generate Activation Codes

**Rule area:** Activation code workflow — cashier permissions  
**Gate ID:** `GATE-CASHIER-CODES-20260613`

### What changed

Cashier removed from code generation route guard. Admin generates → transfers to cashier → cashier sees only `assignedUserId === cashier.id` codes. Cashier's sole function is to release or transfer their assigned codes.

**Files:** `yor_backend/src/routes/admin.ts`, `yor_backend/src/modules/production/encoding-service.ts`

**Authority:** Owner instruction 2026-06-13.

---

## 2026-06-13 — GATE-REPURCHASE-PV-20260613: Repurchase PV Updated for Perfume and Vision Eyedrops

**Rule area:** Product repurchase — PV per product  
**Gate ID:** `GATE-REPURCHASE-PV-20260613`

### What changed

| Product | Old PV | New PV |
|---|---:|---:|
| Perfume (all 6 SKUs) | 500 | **20** |
| Vision Mineral Drops | 500 | **20** |
| Refill | 150 | 150 (unchanged, pending confirmation) |

**File:** `yor_backend/src/modules/compensation/repurchase-product-catalog.ts`

**Authority:** Owner ruling 2026-06-13.

---

## 2026-06-13 — GATE-GLOBAL-BONUS-STOCKIST-20260613: Stockist Level System and Global Bonus Pool

**Rule area:** Global Bonus — stockist designation and pool qualification  
**Gate ID:** `GATE-GLOBAL-BONUS-STOCKIST-20260613`

### What changed

New `stockist_level` column on `member_profiles` with values `none | mobile_kiosk | city_center | mega_center`. Any non-`none` level = 1 portion of the annual Global Bonus pool. Admin-only tagging. Global Bonus page on both admin and member dashboards.

**Production migration:** `add_stockist_level_to_member_profiles` applied to `Yorinternationalprod` and dev `hcrsrxdroldfvbplbuuz`.

**Files:** `yor_backend/src/types/db.ts`, `supabase-encoding-repository.ts`, `encoding-service.ts`, `yor_backend/src/routes/admin.ts`, `yor_frontend/src/lib/api.ts`, `GlobalBonusPanel.tsx`, `AdminDashboardPage.tsx`

**Authority:** Owner instruction 2026-06-13.

---

*Last updated: 2026-06-13*
