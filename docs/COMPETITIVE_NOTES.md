# Competitive notes — past Anthropic hackathon winners

Not committed. Reference for demo positioning.

## Past winners (what they built, what landed)

### Crossbeam — Mike Brown (Built with Opus 4.6 winner)
- **Problem**: California ADU permits — months-long cycle.
- **Trick**: orchestrator + sub-agents, each with only the slice of data it needs. Vision over OCR on PDFs. 1M context = stop fighting tokens.
- **Demo lesson**: paint the time saved (months → hours) up front. Single named user.
- **Source**: HACKATHON_PLAYBOOK.md.

### Zenith.chat — David Rodriguez + Affaan Mustaffa (Forum Ventures × Anthropic)
- **Problem**: customer-discovery interviews for founders. Pre-PMF validation.
- **Trick**: chat with **synthetic personas** that push back like real prospects. 8-hour build. Won $15k credits.
- **Why it landed**: the "skeptical, simulated user" feels like a primitive. Founders use it instead of cold-calling.
- **Adjacent to Probe**: the simulated-evaluation stage is the same primitive — but Probe goes further: not just personas, also a peer-review panel.

### Built with Opus 4.6 — five named winners
- A **personal-injury lawyer** automating intake.
- A **cardiologist** building diagnostic aid.
- A **roads specialist** doing infra triage.
- An **electronic musician** building composition tools.
- A **software engineer** with a CLI productivity tool.
- **Pattern**: every winner had a personal scratch-an-itch problem. Domain expertise + Claude = real tool.
- **Source**: https://app.daily.dev/posts/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon-z9ncqehz8

### everything-claude-code — Affaan Mustafa (recent winner)
- 14+ agents, 56+ skills, 33+ commands — packaged as a Claude Code harness.
- Won by going *meta*: not a domain tool, but a system for building domain tools faster.
- **Demo lesson**: the wow moment was the volume of agents working in parallel.

---

## How Probe stacks

| dim                | Probe                                          | typical winner                       |
|--------------------|------------------------------------------------|--------------------------------------|
| problem            | research-design rehearsal (HCI)                | concrete domain task                 |
| time saved framing | months of study design → 5 min                 | months of permits/intake → hours     |
| Opus 4.7 use       | structured outputs across 9 stages, peer-review panel that DISAGREES | varies                |
| moat               | provenance linter, [SIMULATION_REHEARSAL] tags | varies                               |

## Stealable patterns

1. **Open with the "before"** — show how long this would take a researcher without Probe (3-6 months). Burn 5 seconds on the pain.
2. **Single named user** — frame as "your co-author" not "an AI tool". Probe is *helping* a PhD student, not *replacing* them.
3. **Wow moment = disagreement** — the peer-review panel where R1, R2, R3 disagree on verdict is uniquely Probe and uniquely Opus-4.7-shaped (deep reasoning across multiple personas). Land on this hard.
4. **Save once, replay forever** — surface the demo-replay button. Judges will hit it.
5. **Show the markdown rendering** — the artifact bodies (implementation plan, validation protocol) come out structured. Don't show them as raw text.

## Hackathon-rule note
"Built entirely during the hackathon" — Probe's offline pipeline (`probe run`) is older. The new `probe ui` (TUI + web v2) is hackathon work. Frame submission around the new surface; mention the older pipeline only as the engine that powers it.
