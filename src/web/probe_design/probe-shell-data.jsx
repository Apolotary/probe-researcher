// Mock data for the Probe shell — recents in the sidebar and the agent-generated
// "suggested directions" on the home view. Pure data; no React imports.

window.PROBE_RECENTS = [
  // group: 'today' | 'yesterday' | 'last7' | 'older'
  {
    id: 'meeting-fatigue',
    title: 'meeting fatigue · remote workers',
    premise: 'How do remote workers stay focused during long video-call days?',
    stage: 'methodology',
    stageLabel: 'methodology',
    group: 'today',
    when: '14:22',
  },
  {
    id: 'code-review-tone',
    title: 'code-review tone · juniors',
    premise: 'What makes a good code-review comment land well with a junior engineer?',
    stage: 'literature',
    stageLabel: 'lit review',
    group: 'today',
    when: '09:48',
  },
  {
    id: 'weeknight-recipes',
    title: 'weeknight repeats',
    premise: 'How do home cooks decide which weeknight recipes are worth repeating?',
    stage: 'evaluation',
    stageLabel: 'evaluation',
    group: 'yesterday',
    when: 'yesterday',
  },
  {
    id: 'standup-rituals',
    title: 'standup rituals · async vs sync',
    premise: 'Do async standups preserve team awareness as well as live ones?',
    stage: 'artifacts',
    stageLabel: 'artifacts',
    group: 'last7',
    when: 'mon',
  },
  {
    id: 'design-crit-feedback',
    title: 'design crit · feedback uptake',
    premise: 'When do designers actually act on feedback they receive in critique?',
    stage: 'report',
    stageLabel: 'report',
    group: 'last7',
    when: 'sun',
  },
  {
    id: 'reading-attention',
    title: 'reading attention · long-form',
    premise: 'What lets some readers finish a 6,000-word essay while others bail at 800?',
    stage: 'done',
    stageLabel: 'done',
    group: 'older',
    when: 'mar 28',
  },
  {
    id: 'chore-distribution',
    title: 'chore distribution · couples',
    premise: 'How do couples renegotiate household chores after a major life event?',
    stage: 'done',
    stageLabel: 'done',
    group: 'older',
    when: 'mar 14',
  },
];

// Suggested directions — three categories, each with three suggestions.
// Each suggestion has a tag, a title, a one-line rationale, and the prompt
// that gets pre-filled into the new-project input when launched.
window.PROBE_SUGGESTIONS = {
  generatedAt: '14:31',     // displayed; refreshed when user hits regenerate
  seed: 'meeting-fatigue · code-review-tone · standup-rituals',
  groups: [
    {
      key: 'continue',
      label: 'continue your work',
      hint: 'follow-ups derived from your last three projects',
      items: [
        {
          tag: 'follow-up · meeting fatigue',
          title: 'Camera-on vs camera-off',
          why:  'You found agenda-less calls hurt focus. The next variable is video presence — does it amplify or absorb the cost?',
          prompt: 'Does turning the camera off during long meetings reduce attentional fatigue, or does it shift the cost elsewhere?',
        },
        {
          tag: 'follow-up · code-review tone',
          title: 'When does praise read as patronising?',
          why:  'Your literature pass surfaced a thread on "false positives" — worth its own study.',
          prompt: 'When does positive feedback in code review come across as condescending to junior engineers?',
        },
        {
          tag: 'follow-up · standup rituals',
          title: 'What async standups quietly drop',
          why:  'Your evaluation flagged "shared context" as the weak signal. Probe what specifically gets lost.',
          prompt: 'What kinds of team awareness disappear when standups move from synchronous to async, and which kinds are unaffected?',
        },
      ],
    },
    {
      key: 'adjacent',
      label: 'adjacent angles',
      hint:  'topics one hop from the spaces you already work in',
      items: [
        {
          tag: 'adjacent',
          title: 'Slack reply latency norms',
          why:  'Sits next to your meeting-fatigue and async-standup work — same axis, different surface.',
          prompt: 'What unspoken norms govern how quickly people feel obligated to reply on Slack?',
        },
        {
          tag: 'adjacent',
          title: 'Onboarding the first PR',
          why:  'Adjacent to code-review tone — the first PR is where the dynamic gets set.',
          prompt: 'What makes the first pull-request a new engineer ships feel like a welcome rather than a hazing?',
        },
        {
          tag: 'adjacent',
          title: 'When 1:1s lose their grip',
          why:  'Calendars, attention, ritualisation — same furniture, different room.',
          prompt: 'Why do recurring 1:1 meetings drift into status updates over time, and what reverses the drift?',
        },
      ],
    },
    {
      key: 'wild',
      label: 'wild cards',
      hint:  'cross-domain provocations — pick one to stretch',
      items: [
        {
          tag: 'wildcard',
          title: 'Reading rooms in libraries',
          why:  'Public space designed for sustained attention. What can knowledge-work spaces borrow?',
          prompt: 'What environmental cues in public reading rooms reliably support sustained attention, and which ones backfire?',
        },
        {
          tag: 'wildcard',
          title: 'How chefs recover a service',
          why:  'High-stakes coordination under time pressure — a different shape of the same problem.',
          prompt: 'How do head chefs detect and recover from a kitchen service that is starting to slip?',
        },
        {
          tag: 'wildcard',
          title: 'Birdwatchers and patient looking',
          why:  'A community organised around the opposite of doom-scroll attention. Worth a look.',
          prompt: 'What does the practice of birdwatching teach novices about patient, unrewarded looking?',
        },
      ],
    },
  ],
};

window.PROBE_GROUP_LABELS = {
  today:     'today',
  yesterday: 'yesterday',
  last7:     'last 7 days',
  older:     'older',
};
