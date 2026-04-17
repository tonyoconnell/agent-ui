export type DropdownItem = {
  text: string
  /** Pre-canned answer — served instantly, no LLM call */
  answer: string
  /** Substrate tags — seed pheromone paths to the right agent */
  tags: string[]
  /** Target agent UID for routing */
  receiver: string
}

export type DropdownGroup = {
  label: 'Learn' | 'Programs' | 'About'
  items: DropdownItem[]
}

export const dropdownGroups: DropdownGroup[] = [
  {
    label: 'Learn',
    items: [
      {
        text: 'I want to improve my English for work',
        answer:
          "That's a great goal. A lot of our students come to Elevare for exactly this — they're good at their job but feel held back when the meeting switches to English.\n\nWhat kind of work do you do? That helps me suggest whether live coaching, AI practice, or our intensive program would fit best.",
        tags: ['debby', 'lingua', 'professional', 'placement'],
        receiver: 'debby:concierge',
      },
      {
        text: 'I have a job interview coming up',
        answer:
          "Interview prep is one of the things we do best. Debby has coached dozens of people through English-language interviews — from tech companies to universities.\n\nOur Flex Nexus Intensive ($497, 30 days) is designed for exactly this: daily 1:1 coaching plus practice with Amara, our AI tutor, so you're rehearsing every day. How soon is your interview?",
        tags: ['debby', 'flex-nexus', 'interview', 'urgent', 'enrollment'],
        receiver: 'debby:enrollment',
      },
      {
        text: 'I want to practice conversation every day',
        answer:
          "That's where Amara comes in. She's our AI practice buddy — warm, patient, remembers your mistakes and celebrates your wins. You get 20-30 minutes of conversation practice daily.\n\nFour modes: freeform chat, lesson-guided practice, pronunciation drills, and real-world scenario rehearsal (like ordering coffee or giving a presentation). $29-49/mo. Want to try a session?",
        tags: ['debby', 'amara', 'practice', 'daily', 'tutor'],
        receiver: 'debby:amara',
      },
      {
        text: 'I need help with pronunciation',
        answer:
          "Pronunciation is tricky because you can't always hear your own mistakes. Amara has a dedicated pronunciation mode — she'll give you targeted drills, score your attempts, and repeat until the sound clicks.\n\nIt works best alongside live coaching where Debby or a tutor can hear the subtleties. What's your first language? That tells us which sounds to focus on.",
        tags: ['debby', 'amara', 'pronunciation', 'drill', 'education'],
        receiver: 'debby:amara',
      },
    ],
  },
  {
    label: 'Programs',
    items: [
      {
        text: 'How does the AI tutor Amara work?',
        answer:
          "Amara is your daily English practice buddy. She's not a teacher — she's the friend you practice with between lessons.\n\nEvery session follows a rhythm: warm-up, practice, gentle correction, one specific win celebrated, and a summary of what to work on next. She remembers your vocabulary, tracks your mistakes, and adjusts to your level.\n\nFour modes: freeform conversation, lesson-guided practice, pronunciation drills, and real-world scenarios. 20-30 minutes a day, $29-49/mo.",
        tags: ['debby', 'amara', 'tutor', 'ai', 'education'],
        receiver: 'debby:amara',
      },
      {
        text: 'What is Flex Nexus Intensive?',
        answer:
          "Flex Nexus is our 30-day intensive. $497 one-time.\n\nYou get daily 1:1 coaching with Debby or a senior tutor, plus daily practice with Amara. It's designed for people with a deadline — an interview, a presentation, a move to an English-speaking country.\n\nMost students see a noticeable shift in confidence by week 2. By day 30, you're not just better at English — you own it. Interested?",
        tags: ['debby', 'flex-nexus', 'intensive', 'enrollment', 'premium'],
        receiver: 'debby:enrollment',
      },
      {
        text: 'How much does it cost?',
        answer:
          "Here's the full picture:\n\n• Lingua — $149-179/mo. Live 1:1 and group coaching. The core program.\n• Flex Nexus — $497 one-time. 30-day intensive with daily coaching + AI practice.\n• AI Tutor (Amara) — $29-49/mo. Daily practice on your own schedule.\n• Rise — coming soon. Confidence coaching for presentations and interviews.\n\nAmara is included with Flex Nexus. Everything else is separate. What fits your situation?",
        tags: ['debby', 'pricing', 'enrollment', 'sales'],
        receiver: 'debby:enrollment',
      },
      {
        text: 'Can I try a free session?',
        answer:
          "Yes. Your first session with Amara is free — no card, no commitment. You'll get a taste of how the practice works: a short conversation, a pronunciation check, and a summary of where you're at.\n\nIf you want to try live coaching, Debby does free 15-minute discovery calls where she listens to your English, understands your goals, and tells you honestly whether Elevare is the right fit. Want to book one?",
        tags: ['debby', 'trial', 'amara', 'enrollment', 'concierge'],
        receiver: 'debby:concierge',
      },
    ],
  },
  {
    label: 'About',
    items: [
      {
        text: 'Who is Debby?',
        answer:
          'Debby is the founder of Elevare. She\'s been teaching English for over 10 years — classrooms, online, one-on-one. Currently based in Chiang Mai, working with students all over the world.\n\nHer thing: the moment someone stops apologising for their English and starts owning it. That\'s the shift she coaches for. Elevare means "to rise" — the name is the mission.',
        tags: ['debby', 'about', 'founder', 'brand'],
        receiver: 'debby:concierge',
      },
      {
        text: 'What makes Elevare different?',
        answer:
          "Most English courses teach AT you. Elevare practices WITH you.\n\nThree things make it different: Debby's 10+ years of real teaching (not a startup selling an app), Amara the AI tutor who remembers YOUR mistakes and adapts to YOUR level, and the confidence-first approach — we don't just teach grammar, we help you stop feeling small in rooms where you shouldn't.\n\nWant to see for yourself?",
        tags: ['debby', 'about', 'brand', 'differentiator'],
        receiver: 'debby:concierge',
      },
      {
        text: 'Where are you based?',
        answer:
          'Debby is in Chiang Mai, Thailand. But Elevare is fully online — students join from everywhere. Live sessions happen over video call, and Amara (AI tutor) is available 24/7.\n\nTime zones work out well: Debby typically coaches mornings and evenings Chiang Mai time (GMT+7), which covers Asia, Europe, and Americas across the day.',
        tags: ['debby', 'about', 'location', 'online'],
        receiver: 'debby:concierge',
      },
    ],
  },
]

/** Look up a pre-canned answer by exact question text */
export function findCannedAnswer(text: string): DropdownItem | undefined {
  for (const group of dropdownGroups) {
    const item = group.items.find((i) => i.text === text)
    if (item) return item
  }
}
