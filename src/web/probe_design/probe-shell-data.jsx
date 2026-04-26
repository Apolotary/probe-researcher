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
      key: 'workplace',
      label: 'workplace & focus',
      hint: 'starter prompts for studies of attention, meetings, and remote work',
      items: [
        {
          tag: 'attention',
          title: 'Camera-on vs camera-off',
          why:  'A standing question for video-call research. Does video presence amplify or absorb the focus cost?',
          prompt: 'Does turning the camera off during long meetings reduce attentional fatigue, or does it shift the cost elsewhere?',
        },
        {
          tag: 'feedback',
          title: 'When praise reads as patronising',
          why:  'Tone calibration in code review — false positives can hurt as much as false negatives.',
          prompt: 'When does positive feedback in code review come across as condescending to junior engineers?',
        },
        {
          tag: 'team-awareness',
          title: 'What async standups quietly drop',
          why:  'Async ritualisation tradeoffs. Which kinds of team awareness survive the format shift, and which evaporate?',
          prompt: 'What kinds of team awareness disappear when standups move from synchronous to async, and which kinds are unaffected?',
        },
      ],
    },
    {
      key: 'adjacent',
      label: 'communication norms',
      hint:  'starter prompts for studies of how people coordinate at a distance',
      items: [
        {
          tag: 'response-norms',
          title: 'Slack reply latency norms',
          why:  'The unspoken rules around when a reply is "fast enough" to count as responsive.',
          prompt: 'What unspoken norms govern how quickly people feel obligated to reply on Slack?',
        },
        {
          tag: 'onboarding',
          title: 'Onboarding the first PR',
          why:  'A new engineer\'s first pull-request sets the tone for everything that follows.',
          prompt: 'What makes the first pull-request a new engineer ships feel like a welcome rather than a hazing?',
        },
        {
          tag: 'meeting-drift',
          title: 'When 1:1s lose their grip',
          why:  'Recurring meetings drift toward status updates over time. What reverses the drift?',
          prompt: 'Why do recurring 1:1 meetings drift into status updates over time, and what reverses the drift?',
        },
      ],
    },
    {
      key: 'wild',
      label: 'wild cards',
      hint:  'cross-domain provocations — pick one to stretch your sample',
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
