# Design QA

- Reference screenshots: `codex-clipboard-b13dd8f3-86f4-411a-95ff-40e002e8017f.png`, `codex-clipboard-f08eac1e-c83d-45f9-b916-baa8a43c8498.png`, `codex-clipboard-48adab71-fafd-477c-b179-5c6dd9ea2d47.png`
- Implementation screenshot: `design-qa-encode-modal.png`
- Viewport: 1074 x 687
- State: authenticated member office, light mode, genealogy open-slot registration

## Comparison

- Package tiers now use compact rectangular metallic badges with tier-specific color, gradient depth, and a visible inset edge.
- The encode-member dialog now uses a light-native raised surface, dark readable typography, neutral fields, clearer section grouping, and a restrained blurred backdrop.
- The dialog is rendered through a document-level portal so dashboard transforms and the fixed sidebar cannot crop it.
- Amber, blue, emerald, and violet utility colors resolve through shared theme-aware metallic tokens across member and admin surfaces.

## Focused Evidence

- Package badge computed style: `border-radius: 8px`, `min-height: 28px`, metallic text color, gradient background, and colored inset shadow.
- Encode dialog computed colors: title `rgb(31, 25, 18)`, field background near-white, field text `rgb(31, 25, 18)`, raised section shadow.
- Browser capture confirms the full dialog is centered, readable, and unobstructed at the tested viewport.

## Findings

- No P0, P1, or P2 visual defects found in the requested states.
- P3: the activation-code inventory is intentionally long; browser full-page capture timed out, so its badge treatment was verified using live DOM and computed-style inspection.

## Verification

- `npm run build`: passed
- `git diff --check`: passed

final result: passed
