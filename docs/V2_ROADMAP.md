# V2 roadmap — post-submission feature targets

This file captures features out of scope for the hackathon submission window but worth prioritizing for Probe v2.

## 1. Agent-driven browser remote control for prototype testing

**Thesis.** The current simulated walkthrough (Stage 5) is a structured rehearsal — the agent reasons about what would happen without running the prototype. A v2 extension gives the agent remote control of a browser (or a desktop screen reader, or an IDE) so it can actually *exercise* the prototype and observe state.

**Why it matters.** Screen-based interactive research often fails because what the researcher *thinks* happens on click differs from what happens. A browser-driving agent can:
- actually traverse heading hierarchy on the target page with a screen reader
- click-through the task flow and log every observable state
- exercise the prototype's failure modes in `prototype_spec.failure_cases` and verify the wizard fallback plan works
- produce a *demonstrated* walkthrough (still tagged `[SIMULATION_REHEARSAL]` because it is not a participant, but grounded in real observed state)

**Implementation sketch.** Managed Agents with Playwright or Computer Use MCP server. A new `probe test-prototype <run_id> <branch_id>` command opens a session, mounts the prototype spec, and gives the agent a browser to exercise.

**Feasibility.** Computer Use is an existing Anthropic beta. Probably 1-2 weeks of integration work. Non-trivial.

**Failure mode to pre-empt.** The agent's observed state must still be tagged `[AGENT_OBSERVATION]` or similar — not `[TOOL_VERIFIED]` because a browser observation is still rehearsal against a wizard-controlled prototype, not a human user. The provenance linter would need a new tag.

## 2. Screen recording / video-frame analysis (Mode C)

**Thesis.** The original plan's Mode C: give the agent a demo video of the prototype (real interaction or a Figma export), slice it into frames, and analyze behavior frame-by-frame to produce a structured user-study-ready timeline.

**Why it matters.**
- Researchers often have a screen recording of themselves using a prototype long before a WoZ study is designed. Mining that recording for friction points is high-leverage.
- For accessibility research specifically, a video of a BLV user's own screen+audio walkthrough is a rich artifact the researcher currently interprets informally.
- It can also validate that the simulated walkthrough (Mode A) correctly predicted the friction points that show up in real video.

**Implementation sketch.** New stage `5c_video`:
1. User provides a path to a .mp4 or .mov
2. ffmpeg extracts frames at 1fps
3. Each frame goes through Opus 4.7 vision with structured-output instructions
4. A Managed Agent session stitches the per-frame observations into a timeline
5. Output: `video_walkthrough.md` alongside the text-only Mode A rehearsal

**Feasibility.** Vision is already in the Messages API. Session-based orchestration would use Managed Agents. Rough estimate: 3-4 days of work including a good demo video.

**Scope caveat.** This is only in-scope because the project's "screen-based interactive research" boundary allows video-of-interactions. It does NOT open Probe up to ethnographic fieldwork.

## 3. Simulated user interview (Wizard-of-Oz / Chinese Room style) — SHIPPED 2026-04-22

> This was originally planned as v2 but shipped in the submission window as `probe interview <run_id>`. See [`src/managed_agents/simulated_interview.ts`](../src/managed_agents/simulated_interview.ts) and [`agents/simulated-participant.md`](../agents/simulated-participant.md). Section below preserved as design rationale.


**Thesis.** Probe already generates a study protocol. A v2 extension runs a *simulated* interview against that protocol: the researcher enters the interview script, the agent plays a simulated participant answering in-character, and the researcher can see where questions fall flat or produce unhelpful data before recruiting real participants.

**Why it matters.**
- Most qualitative interview scripts have design flaws discovered only in the first 2-3 pilot sessions
- The simulated participant gives the researcher a *low-cost* rehearsal of their own interviewing
- It surfaces interview-script problems (leading questions, loaded phrasing, consent script issues) that would otherwise consume pilot time

**Epistemic claim it does NOT make.** The simulated participant's answers are NOT evidence about what real participants would say. They are rehearsal material — simulation, not findings. Every response carries `[SIMULATION_REHEARSAL]`. This is the same rehearsal-vs-evidence boundary Probe already enforces.

**Implementation sketch.**
- User provides an interview protocol (semi-structured, structured, or open-ended)
- Optional: user provides a participant persona (demographic, domain, experience)
- A Managed Agent opens a session, plays the participant for N rounds
- Output: `simulated_interview.md` with every response tagged `[SIMULATION_REHEARSAL]`
- A second agent can critique the interviewer's script based on the simulated session

**Feasibility.** Simplest of the three. Probably 2-3 days. Main risk: the "participant" agent needs to resist supplying the answers the interviewer hopes to hear — the same flattery-resistance problem the adversarial reviewers face. Can reuse the same forbidden-phrases + default-skeptical-stance pattern.

**Key open design question.** How does a researcher resist treating the simulated interview as a preview of what real participants will say? The `[SIMULATION_REHEARSAL]` tag is the linter answer. The cultural answer is: the simulator should produce intentionally *noisy* personas that surface script problems, not produce consistent plausible answers.

## 4. Agent symposium — multi-agent position paper generation

**Thesis.** A single Probe run produces one surviving branch per premise. Scale this: run N Probe instances on related premises, have each produce a position-paper-sized contribution (1-4 pages), then convene the agents in a simulated workshop where they read each other's positions, argue, and co-author a group paper.

**Why it matters.**
- Real workshops (CHI, ASSETS, design fictions) often have this structure: 8-12 position papers, discussion, synthesis into a workshop report
- A Probe-symposium could produce a *rehearsal* of what a real workshop might argue about, before the workshop is even proposed
- The disagreements between simulated Probe-instances would be more interesting than any single branch's output

**Epistemic claim it does NOT make.** The symposium output is not evidence about what researchers would argue. It is a structured rehearsal of the *argumentative space* a workshop might occupy. Every claim carries `[SIMULATION_REHEARSAL]` or `[AGENT_INFERENCE]`.

**Implementation sketch.**
- `probe symposium <premises.yaml>` takes N premises and spawns N Probe runs
- Each Probe run produces a "position paper" view of its surviving branch (new Stage 9)
- A convener agent reads all N position papers and generates disagreement + agreement maps
- An editor agent drafts a group paper with each author's position preserved as tagged sections
- Provenance: every paragraph tagged with which Probe-instance authored it

**Feasibility.** Substantial — uses Managed Agents multi-agent features (currently research preview, access-gated). 1-2 weeks of focused work for a 4-agent symposium demo.

**Research question it opens.** Does a symposium of agents argue *differently* from a single agent with extended context? The hypothesis is yes — each agent's divergent-branch commitments shape what they argue for — and this produces more decision-useful output than one long monologue.

## 5. Codesign-with-Probe — agents as simulated design partners

**Thesis.** Inverting the relationship: instead of the researcher giving Probe a premise and getting a triaged study plan, the researcher brings a half-built prototype to Probe, and a population of simulated-user agents gives structured feedback from different demographic/use-case perspectives. The researcher is the maker; Probe's agents are the critics.

**Why it matters.**
- Codesign with disabled users is expensive, rate-limited by recruitment, and hard to iterate on rapidly
- A simulated-codesign phase lets researchers *rehearse* the feedback loop before burning real-participant sessions
- Combined with feature #1 (agent browser control), simulated participants can actually use the prototype and flag friction

**Epistemic claim it does NOT make.** The simulated users are not real users. Their feedback is NOT evidence about what real users would think. It is *scaffolding for the researcher's own imagination*. Tag: `[SIMULATION_REHEARSAL]`. The researcher must always run at least one real-participant session before shipping any claim about user response.

**Implementation sketch.**
- `probe codesign <prototype_path> <persona_deck.yaml>` takes a prototype + a deck of personas
- Each persona becomes a Managed Agent with a distinctive stance (e.g., "longtime NVDA user, prefers verbose mode", "low-vision user who uses ZoomText", "aging user acquired late blindness, slower typist")
- Each persona agent reviews the prototype via the Computer Use browser control, produces structured feedback
- A convener agent identifies feedback that is unanimous vs. persona-specific vs. contradictory
- Output: `codesign_report.md` with per-persona observations tagged by persona ID

**Feasibility.** Depends on #1 (browser control) being implemented first. 2-3 weeks once #1 exists.

**Key risk to pre-empt.** This could degenerate into a flattering-mirror: the personas give feedback the designer wants to hear. The forbidden-phrase + default-skeptical-stance pattern from the adversarial reviewers has to carry over — the simulated personas should be as critical as the methodologist. In particular, every persona should have a `resistance_profile` that determines what they push back on regardless of what the designer wants.

## Why these are v2 and not submission-scope

The hackathon has three days left as of this writing. Each of these features is 3-10 days of focused work. Shipping any of them half-done would:
- Weaken the current demo (which depends on predictable replay)
- Break the deterministic-replay commitment
- Dilute the "structured adversarial review with provenance discipline" story

Capturing them here so they are visible as roadmap without competing for the submission-window build time.
