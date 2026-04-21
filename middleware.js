/* ───────────────────────────────────────────────────────────
   middleware.js — Vercel Edge Middleware for OG social previews
   Hubbell Civil War Letters Project

   Intercepts bot/crawler requests, reads query params, and
   injects dynamic <meta> tags for rich link previews in
   Slack, Discord, Twitter/X, Facebook, iMessage, WhatsApp.
   Real users get the unmodified page.
   ─────────────────────────────────────────────────────────── */

let _ogDataCache = null;

async function getOgData(origin) {
  if (_ogDataCache) return _ogDataCache;
  try {
    const res = await fetch(origin + '/_og-data.json');
    if (res.ok) _ogDataCache = await res.json();
  } catch (e) { /* fallback to empty */ }
  return _ogDataCache || {};
}

export const config = {
  matcher: [
    '/',
    '/hubbell-dashboard',
    '/search',
    '/brother-henry',
    '/brother-alexander',
    '/brother-james',
    '/brother-charles',
    '/mother-frances',
    '/who-they-were',
    '/viz-emotional-arcs',
    '/viz-map-fullwar',
    '/viz-health-ledger',
    '/viz-money-story',
    '/viz-people-web',
    '/viz-what-they-didnt-know',
    '/viz-what-they-wrote-about',
    '/the-collection',
    '/index',
  ],
};

// Bot User-Agent patterns (social crawlers that need OG tags)
const BOT_PATTERN = /Slackbot|Twitterbot|facebookexternalhit|LinkedInBot|Discordbot|WhatsApp|Applebot|TelegramBot|Googlebot|bingbot/i;

const SITE_NAME = 'Hubbell Civil War Letters';
const DEFAULT_DESC = '274 letters from four brothers and their mother, 1861–1870 — an interactive exploration of the American Civil War through one family\'s words.';
const OG_IMAGE = 'https://hubbell-civil-war.vercel.app/og-image.png'; // Static hero image

// Page-specific default titles
const PAGE_TITLES = {
  '/': 'Parallel Lives — Hubbell Civil War Letters',
  '/hubbell-dashboard': 'Parallel Lives — Hubbell Civil War Letters',
  '/search': 'Search — Hubbell Civil War Letters',
  '/brother-henry': 'Henry Hubbell — 34th NY Infantry',
  '/brother-alexander': 'Alexander F. Hubbell — 60th NY Infantry',
  '/brother-james': 'James Hubbell — 16th NY Heavy Artillery',
  '/brother-charles': 'Charles F. Hubbell — Home Front',
  '/mother-frances': 'Frances Hubbell — A Mother\'s War',
  '/who-they-were': 'Who They Were — The Hubbell Family',
  '/viz-emotional-arcs': 'Emotional Arcs — Civil War Letters',
  '/viz-map-fullwar': 'A Map That Moves — Following the Hubbells',
  '/viz-health-ledger': 'The Wellness Ledger — Physical Well-Being in the Civil War',
  '/viz-money-story': 'The Money Story — Wartime Finances',
  '/viz-people-web': 'The People Web — Connections Across 274 Letters',
  '/viz-what-they-didnt-know': 'What They Didn\'t Know — Dramatic Irony',
  '/viz-what-they-wrote-about': 'What They Wrote About — Topic Landscape',
  '/the-collection': 'The Collection — Five Generations of Stewardship',
  '/index': 'Hubbell Civil War Letters',
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const month = MONTH_NAMES[parseInt(parts[1])] || parts[1];
  return `${month} ${parseInt(parts[2])}, ${parts[0]}`;
}

function generateOgMeta(pathname, params, ogData) {
  let title = PAGE_TITLES[pathname] || SITE_NAME;
  let description = DEFAULT_DESC;

  const letterId = params.get('letter');
  const personParam = params.get('person');
  const linkParam = params.get('link');
  const queryParam = params.get('q');
  const brotherParam = params.get('brother');
  const dateParam = params.get('date');
  const eventParam = params.get('event');

  // Letter-specific preview (works on any page)
  if (letterId && ogData[letterId]) {
    const l = ogData[letterId];
    title = `Letter from ${l.an}, ${formatDate(l.d)}`;
    description = l.loc ? `Written from ${l.loc}` : '';
    if (l.ex) {
      description += description ? ' — ' : '';
      description += `"${l.ex}"`;
    }
    if (l.r) {
      description += ` (to ${l.r})`;
    }
  }

  // People Web: linked pair
  else if (linkParam && pathname === '/viz-people-web') {
    const names = linkParam.split(',').map(n => n.trim());
    if (names.length === 2) {
      title = `${names[0]} & ${names[1]} — Connected`;
      description = `Explore the relationship between ${names[0]} and ${names[1]} across the Hubbell Civil War letters.`;
    }
  }

  // People Web: single person
  else if (personParam && pathname === '/viz-people-web') {
    title = `${personParam} — People Web`;
    description = `${personParam} in the Hubbell Civil War letter network — connections, mentions, and shared letters.`;
  }

  // Search query
  else if (queryParam && pathname === '/search') {
    title = `Search: ${queryParam} — ${SITE_NAME}`;
    description = `Search results for "${queryParam}" across 274 Civil War letters from the Hubbell family.`;
  }

  // Map: brother + date
  else if (pathname === '/viz-map-fullwar') {
    if (brotherParam && dateParam) {
      const brotherNames = { henry: 'Henry Hubbell', alexander: 'Alexander F. Hubbell', james: 'James Hubbell', charles: 'Charles F. Hubbell' };
      const name = brotherNames[brotherParam] || brotherParam;
      title = `${name} — ${formatDate(dateParam)}`;
      description = `Follow ${name}'s Civil War journey on ${formatDate(dateParam)}.`;
    } else if (brotherParam) {
      const brotherNames = { henry: 'Henry Hubbell', alexander: 'Alexander F. Hubbell', james: 'James Hubbell', charles: 'Charles F. Hubbell' };
      title = `Following ${brotherNames[brotherParam] || brotherParam}`;
      description = `Track ${brotherNames[brotherParam] || brotherParam}'s movements through the Civil War.`;
    } else if (dateParam) {
      title = `The War on ${formatDate(dateParam)}`;
      description = `Where were the Hubbell brothers on ${formatDate(dateParam)}?`;
    }
  }

  // What They Didn't Know: event index
  else if (eventParam && pathname === '/viz-what-they-didnt-know') {
    title = `Dramatic Irony #${parseInt(eventParam) + 1} — What They Didn't Know`;
    description = `Explore moments of dramatic irony in the Hubbell Civil War letters — what the brothers wrote vs. what was really happening.`;
  }

  return { title, description };
}

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';

  // Only modify response for known bots
  if (!BOT_PATTERN.test(userAgent)) {
    return; // Pass through unmodified
  }

  const url = new URL(request.url);

  // Load OG data and generate meta
  const ogData = await getOgData(url.origin);
  const { title, description } = generateOgMeta(url.pathname, url.searchParams, ogData);

  // Fetch the original response
  const response = await fetch(request);
  const contentType = response.headers.get('content-type') || '';

  // Only modify HTML responses
  if (!contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();

  // Build OG meta tags
  const ogTags = `
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${OG_IMAGE}">
    <meta property="og:url" content="${escapeHtml(url.toString())}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${OG_IMAGE}">
  `;

  // Inject OG tags into <head>
  const modifiedHtml = html.replace('</head>', ogTags + '\n</head>');

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');

  return new Response(modifiedHtml, {
    status: response.status,
    headers,
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
