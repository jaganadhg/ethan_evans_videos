export const STORAGE_KEY = 'ethan-evans-video-shelf:saved';

const channelSearch = (term) =>
  `https://www.youtube.com/channel/UC-BAdkBGjOIlccGLZ3jbLiA/search?query=${encodeURIComponent(term)}`;

export const catalog = [
  {
    id: 'decisive',
    title: 'Decisive',
    deck: 'Make better calls when the stakes are real.',
    topic: 'decision-making',
    topicLabel: 'Decision-making',
    sourceLabel: 'Repeated signal',
    sourceNote: "Ethan calls it his number-one recommendation for better decisions in work and life.",
    sourceUrl: 'https://www.ethanevans.com/books',
    watchUrl: channelSearch('Decisive Ethan Evans'),
    duration: '12 min shelf cut',
    accent: 'lime',
    featured: true,
  },
  {
    id: 'leadership-self-deception',
    title: 'Leadership & Self-Deception',
    deck: 'See the human before you try to solve the problem.',
    topic: 'human-dynamics',
    topicLabel: 'Human dynamics',
    sourceLabel: 'Repeated signal',
    sourceNote: "It appears on Ethan's official list and in multiple public interviews as a favorite recommendation.",
    sourceUrl: 'https://podcasts.highsignal.app/people/ethan-evans',
    watchUrl: channelSearch('Leadership and Self-Deception Ethan Evans'),
    duration: '18 min shelf cut',
    accent: 'coral',
    featured: true,
  },
  {
    id: 'magic-loop',
    title: 'The Magic Loop',
    deck: 'A repeatable path from strong execution to the next role.',
    topic: 'career-moves',
    topicLabel: 'Career moves',
    sourceLabel: 'Direct source',
    sourceNote: "Ethan's signature five-step framework for building trust, scope, and momentum.",
    sourceUrl: 'https://www.news.aakashg.com/p/amazon-vp-the-magic-loop-framework',
    watchUrl: channelSearch('The Magic Loop Ethan Evans'),
    duration: '11 min shelf cut',
    accent: 'blue',
    featured: true,
  },
  {
    id: 'almanack-naval',
    title: 'The Almanack of Naval Ravikant',
    deck: 'Build a career around what only you can do.',
    topic: 'career-moves',
    topicLabel: 'Career moves',
    sourceLabel: 'Direct source',
    sourceNote: 'Ethan names it as a recent recommendation for finding a uniquely defensible career value.',
    sourceUrl: 'https://podcasts.highsignal.app/people/ethan-evans',
    watchUrl: channelSearch('Almanack Naval Ravikant Ethan Evans'),
    duration: '09 min shelf cut',
    accent: 'violet',
  },
  {
    id: 'moved-your-cheese',
    title: 'I Moved Your Cheese',
    deck: "Stop waiting for someone else's maze to make sense.",
    topic: 'career-moves',
    topicLabel: 'Career moves',
    sourceLabel: 'Direct source',
    sourceNote: "One of the books recorded in a public profile of Ethan's recommendations.",
    sourceUrl: 'https://www.winningspeechmoments.com/blog-posts/five-questions-for-ethan-evans-host-of-ethan-evans-podcast-and-former-vp-at-amazon',
    watchUrl: channelSearch('I Moved Your Cheese Ethan Evans'),
    duration: '07 min shelf cut',
    accent: 'amber',
  },
  {
    id: 'eat-that-frog',
    title: 'Eat That Frog',
    deck: 'Start with the highest-leverage task, not the easiest one.',
    topic: 'execution',
    topicLabel: 'Execution',
    sourceLabel: 'Direct source',
    sourceNote: "A practical recommendation listed in a public profile of Ethan's career resources.",
    sourceUrl: 'https://www.winningspeechmoments.com/blog-posts/five-questions-for-ethan-evans-host-of-ethan-evans-podcast-and-former-vp-at-amazon',
    watchUrl: channelSearch('Eat That Frog Ethan Evans'),
    duration: '06 min shelf cut',
    accent: 'green',
  },
  {
    id: 'never-split-the-difference',
    title: 'Never Split the Difference',
    deck: 'Negotiate with the psychology in the room, not the script in your head.',
    topic: 'human-dynamics',
    topicLabel: 'Human dynamics',
    sourceLabel: 'Related talk',
    sourceNote: 'Ethan pairs it with Leadership and Self-Deception when discussing power dynamics and negotiation.',
    sourceUrl: 'https://www.developing.dev/p/e068-ethan-evans?open=false',
    watchUrl: channelSearch('Never Split the Difference Ethan Evans'),
    duration: '14 min shelf cut',
    accent: 'rose',
  },
  {
    id: 'decode-your-manager',
    title: 'How to decode your manager',
    deck: 'Ask better questions before you try to manage up.',
    topic: 'managing-up',
    topicLabel: 'Managing up',
    sourceLabel: 'Direct source',
    sourceNote: "A public Level Up video resource covering manager style, decision rights, and mistakes.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/how-to-decode-your-manager?action=share',
    watchUrl: channelSearch('How to decode your manager Ethan Evans'),
    duration: '22 min watch',
    accent: 'teal',
  },
  {
    id: 'ask-for-promotion',
    title: 'How to ask for a promotion',
    deck: 'Turn a vague ambition into a conversation your manager can act on.',
    topic: 'managing-up',
    topicLabel: 'Managing up',
    sourceLabel: 'Direct source',
    sourceNote: 'A public explainer of Ethan’s Magic Loop, including the exact ask at the centre of step four.',
    sourceUrl: 'https://work.coach/playbooks/how-to-ask-for-a-promotion',
    watchUrl: channelSearch('ask for a promotion Ethan Evans'),
    duration: '13 min watch',
    accent: 'orange',
  },
  {
    id: 'forty-eight-laws',
    title: 'The 48 Laws of Power',
    deck: 'Learn to recognize influence tactics without romanticizing them.',
    topic: 'human-dynamics',
    topicLabel: 'Human dynamics',
    sourceLabel: 'Related talk',
    sourceNote: 'Ethan recommends it as a catalog of manipulative patterns worth recognizing with care.',
    sourceUrl: 'https://www.developing.dev/p/e068-ethan-evans?open=false',
    watchUrl: channelSearch('48 Laws of Power Ethan Evans'),
    duration: '16 min shelf cut',
    accent: 'plum',
  },
];

export function filterCatalog(items, { query = '', topic = 'all', savedIds } = {}) {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesTopic = topic === 'all' || item.topic === topic;
    const matchesSaved = !(savedIds instanceof Set) || savedIds.has(item.id);
    const haystack = [item.title, item.deck, item.topicLabel, item.sourceLabel, item.sourceNote]
      .join(' ')
      .toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

    return matchesTopic && matchesSaved && matchesQuery;
  });
}

export function getTopicCounts(items) {
  return items.reduce(
    (counts, item) => {
      counts.all += 1;
      counts[item.topic] = (counts[item.topic] ?? 0) + 1;
      return counts;
    },
    { all: 0 },
  );
}

export function readSavedIds(store) {
  try {
    const raw = store?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeSavedIds(store, ids) {
  store?.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}
