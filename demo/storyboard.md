# Demo storyboard — 8 frames, 3:00 total

**Goal:** one research premise becomes three git-backed branches; one gets blocked with a specific audit finding and evidence span; one survives adversarial review; the final guidebook passes the provenance linter live.

Rule: each frame has ONE visual verb. If more than 2 frames are "text appears on screen", redesign pacing.

---

## Frame 1 — LIVE TYPING (0:00 – 0:15)

- **Visual verb:** typing
- **On screen:** terminal, large font. Researcher types:
  ```
  probe run "design a screen-reader-aware checkout flow for BLV users"
  ```
- **Audio:** real keystrokes.
- **Establishes:** this is a working tool, not a render.

## Frame 2 — PREMISE INTERROGATION (0:15 – 0:30, replay)

- **Visual verb:** text appears
- **On screen:** premise agent produces a sharp question; the sharpest question highlighted in chalk yellow. The three sharpened options scroll in below.
- **Punch-in:** the sharpest question.

## Frame 3 — THREE BRANCHES SPAWN (0:30 – 0:45, replay)

- **Visual verb:** worktrees created
- **On screen:** three `git worktree add` commands execute in visible succession; split terminal panes for a/b/c begin to fill in with their branch_card JSON.
- **Punch-in:** `git log --graph --all` showing three research-program commits fanning out.

## Frame 4 — PARALLEL EXECUTION (MONEY SHOT, 0:45 – 1:30, replay)

- **Visual verb:** columns fill
- **On screen:** three columns executing in parallel — prototype specs writing themselves, simulated walkthroughs narrating with `[SIMULATION_REHEARSAL]` tags visible in chalk magenta, chalk-colored progress indicators.
- **Held shot (5-8s) on:** `git log --graph --all` filling with commits per stage, per branch.
- **This is where the demo earns its keep.**

## Frame 5 — BRANCH BLOCKED (1:30 – 2:00, replay)

- **Visual verb:** red fires
- **On screen:** three-column comparison view. Branch A's audit fires red — `agency.hides_options_before_review` with the evidence quote highlighted. `WORKSHOP_NOT_RECOMMENDED.md` materializes in the branch A column.
- **Punch-in:** the pattern ID + the quoted evidence span.

## Frame 6 — REVIEWERS DISAGREE (2:00 – 2:30, replay)

- **Visual verb:** two panels split-screen
- **On screen:** methodologist panel left, accessibility advocate panel right. Both produce evidence-backed objections. Meta-reviewer output below shows them as distinct, classified as `legitimate_normative_split`.
- **Cut to:** think-aloud walkthrough — Opus narrating a screenshot with friction points highlighted (if Mode B ships; else hold on reviewer panels).

## Frame 7 — GUIDEBOOK ASSEMBLES (2:30 – 2:45, replay)

- **Visual verb:** document scrolls
- **On screen:** `PROBE_GUIDEBOOK.md` opens. Provenance tags color-coded throughout. Six-section table of contents visible at top; `[HUMAN_REQUIRED]` block at bottom.

## Frame 8 — LIVE LINT (2:45 – 3:00)

- **Visual verb:** live command execution
- **On screen:** `probe lint runs/<id>/PROBE_GUIDEBOOK.md` runs live. Terminal output: `✓ every element carries a provenance tag` / `✓ no forbidden phrases`.
- **Held shot:** completed guidebook + `git log --graph --all`.
- **Voiceover (once, no repeat):** "Rehearsal stage for research. The performance still needs humans."

---

## Required money shots (must be visible in video)

1. Three git worktrees spawn from one premise (Frame 3)
2. Branch cards differ on research question, intervention primitive, human-system relationship, method family (Frame 4, punch-in)
3. One branch blocked with specific pattern ID and evidence span (Frame 5)
4. Adversarial reviewers produce concrete, non-generic objections with evidence quotes (Frame 6)
5. Reviewers disagree (visible in meta-review output) (Frame 6)
6. Final guidebook shows provenance tags on every element (Frame 7)
7. `probe lint` passes LIVE (Frame 8)
8. `git log --graph --all` shows research process as structured commits (Frame 3 + Frame 8)

## Shot time budget (verify sum < 3:00 before recording)

| Frame | Duration | Mode |
|-------|----------|------|
| 1 | 0:15 | LIVE |
| 2 | 0:15 | replay |
| 3 | 0:15 | replay |
| 4 | 0:45 | replay (held) |
| 5 | 0:30 | replay |
| 6 | 0:30 | replay |
| 7 | 0:15 | replay |
| 8 | 0:15 | LIVE |
| **Total** | **3:00** | |

## Recording notes

- Plan digital zoom in post. Do not show full terminal at tiny type.
- Chalk color scheme: red for blocking audits, blue for accessibility, yellow for revision flags, green for passes, magenta for `[SIMULATION_REHEARSAL]`.
- Record twice; keep second take as fallback.
- Never risk running the live full pipeline on camera. The middle is deterministic replay.
