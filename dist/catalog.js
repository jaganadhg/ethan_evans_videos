import { recentVideos } from './recent-videos.js';

export const STORAGE_KEY = 'ethan-evans-video-shelf:saved';

const curatedCatalog = [
  {
    id: 'decisive',
    title: 'Leadership Skills to Stay Ahead of AI Job Impact',
    deck: 'Build the human skills that keep compounding when the tools change.',
    topic: 'decision-making',
    topicLabel: 'Decision-making',
    sourceLabel: 'Repeated signal',
    sourceNote: "A direct Level Up video on judgment, decision speed, influence, and managing stakeholders.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/leadership-skills-to-stay-ahead-of',
    watchUrl: 'https://www.youtube.com/watch?v=TnaXL0oGiCk',
    duration: 'Watch on YouTube',
    accent: 'lime',
    featured: true,
  },
  {
    id: 'leadership-self-deception',
    title: 'Executive Presence Masterclass',
    deck: 'Own the room, get credit, and be heard when the stakes are high.',
    topic: 'human-dynamics',
    topicLabel: 'Human dynamics',
    sourceLabel: 'Repeated signal',
    sourceNote: "A direct Level Up masterclass on gravitas, clarity, executive communication, and real-time coaching.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/executive-presence-own-the-room-be',
    watchUrl: 'https://www.youtube.com/watch?v=JC7054i_wXw',
    duration: 'Watch on YouTube',
    accent: 'coral',
    featured: true,
  },
  {
    id: 'magic-loop',
    title: 'This Ex Amazon VP Makes $950K In Retirement',
    deck: 'A long-form conversation about leverage, promotion, and the Magic Loop.',
    topic: 'career-moves',
    topicLabel: 'Career moves',
    sourceLabel: 'Repeated signal',
    sourceNote: "A direct podcast video where Ethan explains the Magic Loop and how he built career leverage.",
    sourceUrl: 'https://www.news.aakashg.com/p/amazon-vp-the-magic-loop-framework',
    watchUrl: 'https://www.youtube.com/watch?v=z95pArx8M_c',
    duration: 'Watch on YouTube',
    accent: 'blue',
    featured: true,
  },
  {
    id: 'almanack-naval',
    title: 'Top Tips to Get Unstuck and Move Up in 2025',
    deck: 'Turn a stalled career into a plan with visible, deliberate moves.',
    topic: 'career-moves',
    topicLabel: 'Career moves',
    sourceLabel: 'Direct source',
    sourceNote: "A direct Level Up video on feedback, visibility, relationships, and getting unstuck.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/get-unstuck-and-move-up-in-2025',
    watchUrl: 'https://www.youtube.com/watch?v=htRr1bgeEUI',
    duration: 'Watch on YouTube',
    accent: 'violet',
  },
  {
    id: 'moved-your-cheese',
    title: 'Why People Get Stuck at Senior Manager',
    deck: 'Five actions for breaking through the senior-manager plateau.',
    topic: 'career-moves',
    topicLabel: 'Career moves',
    sourceLabel: 'Direct source',
    sourceNote: "A direct Level Up video on strategic leadership, skill gaps, and executive readiness.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/3-reasons-why-people-get-stuck-at',
    watchUrl: 'https://www.youtube.com/watch?v=Y_zmC4nNeyY',
    duration: 'Watch on YouTube',
    accent: 'amber',
  },
  {
    id: 'eat-that-frog',
    title: 'Be Visible, Get Executive Sponsorship, & Build Key EQ Skills',
    deck: 'Turn good work into visibility, trust, sponsorship, and opportunity.',
    topic: 'execution',
    topicLabel: 'Execution',
    sourceLabel: 'Direct source',
    sourceNote: "A direct Level Up video on visibility, sponsorship, and high-EQ career growth.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/why-good-work-alone-doesnt-earn-recognition',
    watchUrl: 'https://www.youtube.com/watch?v=PlrnocHSTCw',
    duration: 'Watch on YouTube',
    accent: 'green',
  },
  {
    id: 'never-split-the-difference',
    title: 'Managing Up with Ethan Evans & Ella Irwin',
    deck: 'Decode your manager, clarify decision rights, and rebuild trust after mistakes.',
    topic: 'human-dynamics',
    topicLabel: 'Human dynamics',
    sourceLabel: 'Related talk',
    sourceNote: "A direct Level Up video on manager style, decision authority, and managing up.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/how-to-decode-your-manager?action=share',
    watchUrl: 'https://www.youtube.com/watch?v=amj3BtBSp9A',
    duration: 'Watch on YouTube',
    accent: 'rose',
  },
  {
    id: 'decode-your-manager',
    title: 'Would Jeff Bezos Approve Your Idea?',
    deck: 'Use the executive three-question test to sharpen high-stakes proposals.',
    topic: 'managing-up',
    topicLabel: 'Managing up',
    sourceLabel: 'Direct source',
    sourceNote: "A direct Level Up video on Bezos' proposal test and executive-level influence.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/how-to-win-buy-in-from-ceos?action=share',
    watchUrl: 'https://www.youtube.com/watch?v=ZX5ydxusFEk',
    duration: 'Watch on YouTube',
    accent: 'teal',
  },
  {
    id: 'ask-for-promotion',
    title: 'What Makes a Senior Manager Stand Out',
    deck: 'Find the few high-leverage signals that make executive readiness visible.',
    topic: 'managing-up',
    topicLabel: 'Managing up',
    sourceLabel: 'Direct source',
    sourceNote: "A direct Level Up video on promotion evidence, strategic bets, and next-level scope.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/what-makes-a-senior-manager-stand',
    watchUrl: 'https://www.youtube.com/watch?v=9edvP1wU9qs',
    duration: 'Watch on YouTube',
    accent: 'orange',
  },
  {
    id: 'forty-eight-laws',
    title: 'Executive Presence Killers: What’s Silently Holding You Back',
    deck: 'Cut the habits that make strong ideas sound uncertain or overcomplicated.',
    topic: 'human-dynamics',
    topicLabel: 'Human dynamics',
    sourceLabel: 'Related talk',
    sourceNote: "A direct Level Up video on confidence, brevity, and executive communication habits.",
    sourceUrl: 'https://levelupwithethanevans.substack.com/p/executive-presence-killers-whats',
    watchUrl: 'https://www.youtube.com/watch?v=SZDmv_vWn6A',
    duration: 'Watch on YouTube',
    accent: 'plum',
  },
];

export const catalog = [...curatedCatalog, ...recentVideos];

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
