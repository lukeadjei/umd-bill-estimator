# Polish Checklist (Step 14)

Running list for the polish/pre-launch phase — check items off as they land. Unlike `PROGRESS-LOG.md` (append-only history) or `BUILD-REFERENCE.md` (canonical feature status), this file gets edited in place: check boxes, add items, delete ones that turn out not to matter. Started 2026-09-16.

---

## Content & copy

- [x] Redesign the front-page description cards. Done 2026-09-17 (delegated) — consolidated the two competing taglines into one hook, gave the steps card a distinct primary-tinted treatment with numbered circle badges. Also renamed the three preview cards to Dashboard/Bill Page/Saved Scenarios per the user's spec — real screenshots to be dropped in later.
- [x] Full `/privacy` re-read and rewrite. Done 2026-09-17 (delegated) — "portfolio" language removed throughout, `ai_guest_id` cookie and `ai_rate_limits` disclosed (real gaps found by reading the actual code, not assumed), RLS explained in plain language with the technical detail kept as a reader's aside, Google Form embedded as the primary contact method.
- [x] Write the README. Done 2026-09-17 (delegated) — pending the user's own verification pass. One real thing caught and fixed before merging: the agent's own self-verification method (`npx vitest run`) was polluted by nested active-worktree checkouts and reported 354 tests/18 files; corrected to the real count (118 tests/6 files) in both places it appeared. Also normalized "portfolio" language to match the project's established wording.

## Legal / trust

- [x] Add a disclaimer that the estimated total may be inaccurate. Done 2026-09-17 (delegated) — placed in two spots: a persistent small-print line under the live total on the dashboard (`SummaryBar.tsx`), and a fuller footnote on the printable bill document (`BillDocument.tsx`, covers both the live results page and saved-scenario view) since that's the one artifact that leaves the app. Kept distinct from the footer's existing affiliation disclaimer — different concern (accuracy vs. who built it).

## Discoverability / growth

- [ ] Create a feedback Google Form, link it somewhere real users would find it (footer? settings page? the results page after they generate an estimate?). Note: the form itself already exists and is now linked from `/privacy`'s Questions section — this item is about surfacing it more directly in the app too, not creating it from scratch.

## UX gaps

- [x] Standing guest sign-in entry point. Done 2026-09-17 (delegated) — a "Sign in" pill added to `DashboardNav.tsx`, visible whenever a guest is on the dashboard, not just at the moment of trying to save.
- [x] Real mobile-viewport simulation pass. Done 2026-09-17 (delegated) — actually drove the browser at 375px width, not just read code. Fixed two real overflow/cramped-layout bugs: `SummaryBar` caused horizontal page-scroll on mobile (buttons + text didn't wrap), and `ChatBudgetComparison`'s two-column grid never had enough room in either real container it renders in (desktop side panel or mobile sheet), squeezing labels across 4-5 lines.
- [x] `PanelNavArrows.tsx` overlap. Fixed 2026-09-17 — anchored both arrows at a fixed offset from the panel's top edge (level with each panel's heading) instead of vertically centering on the whole container, which is what varied by content height and caused the overlap in the first place. Re-verified live on both originally-broken cases (Meals with a dining tier selected, Aid & Grants) via real `elementFromPoint` hit-testing, not just a visual glance — confirmed clear on both.

## Style & animation

- [x] Dark mode: manual toggle + OS-preference default. Done 2026-09-17 (delegated) — `ThemeToggle.tsx` (site-wide, `localStorage`-persisted, `useSyncExternalStore`-based, no flash) plus a real click-through of every page (dashboard tabs, chat panel, results/print, settings, privacy, about, 404) confirmed nothing looked off; illustration SVGs fixed with `dark:invert`.
- [x] Chat message bubbles have no entrance animation right now (`ChatPanelContent.tsx`). Done 2026-09-17 (delegated) — `animate-fade-in-up` added, confirmed live that only newly-arrived messages animate, not the whole thread re-animating on each render.
- [x] Dashboard panel switching had no transition. Done 2026-09-17 (delegated, not originally listed here but found during the animation brainstorm) — `key={activeTab}` on the panel wrapper replays the existing fade-in on every tab change.
- [x] Live total in `SummaryBar` didn't acknowledge when it changed. Done 2026-09-17 (delegated) — brief scale-pulse on any total change (selection edits, before/after-aid toggle), skipped on initial mount.
- [ ] "Assistant is typing…" is plain italic text — a proper three-dot bounce (CSS-only, no new dependency) would fit the app's existing playful tone better. Still open — not one of the 3 animation items picked from the brainstorm list.
- [ ] Optional/delight: a small celebratory micro-animation the first time a guest reaches a valid, complete plan and hits "Generate" — fits the warm/approachable tone the fonts were chosen for (see `layout.tsx`'s Nunito comment), not required. Still open.

## Technical / meta cleanup

- [ ] No Open Graph/social-preview metadata exists yet — `layout.tsx`'s `metadata` export only has `title`/`description`. Favicon itself is the user's own to create later (deferred, not forgotten) — an OG image is a separate, still-open item.
- [x] `public/` had five default `create-next-app` starter SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) — confirmed unused anywhere in `src/`, deleted 2026-09-17.

## Cross-referenced, not duplicated here

- **Accessibility pass** (keyboard nav, aria labels, color contrast) — already its own line in `BUILD-REFERENCE.md`'s step 14, kept there rather than folded into this list since it's more systematic/checklist-driven than the polish items above.
- **Vercel deploy + env vars** — step 13's own scope (`BUILD-REFERENCE.md`), not repeated here.
