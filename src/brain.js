import { classifyPrompt } from './modeler.js';

const OBJECT_TERMS = [
  ['spaceship', /spaceship|space ship|starship|fighter ship|spacecraft/i],
  ['rocket', /rocket|missile/i], ['airplane', /airplane|aeroplane|\bplane\b|jet aircraft/i], ['helicopter', /helicopter|\bheli\b/i],
  ['castle', /castle|fortress|keep/i], ['house', /house|cottage|cabin|hut|building/i], ['tower', /tower|lighthouse/i],
  ['dinosaur', /dinosaur|t-rex|trex|tyrannosaurus|triceratops|stegosaurus|raptor/i], ['dragon', /dragon|wyvern/i],
  ['cat', /cat|kitten|tiger|lion|lynx/i], ['dog', /dog|puppy|wolf|fox|canine/i], ['bird', /bird|owl|eagle|hawk|penguin|parrot|raven|duck|chicken/i],
  ['horse', /horse|unicorn|pony/i], ['shark', /shark/i], ['whale', /whale|dolphin/i], ['fish', /fish/i], ['octopus', /octopus|squid/i],
  ['robot', /robot|mech|android|astronaut/i], ['character', /character|avatar|warrior|knight|ninja|soldier|person|humanoid/i],
  ['sword', /sword|blade|dagger/i], ['axe', /axe|hatchet/i], ['hammer', /hammer|mace/i], ['pickaxe', /pickaxe|pick axe/i],
  ['car', /car|kart|truck|van|vehicle/i], ['bicycle', /bicycle|bike/i], ['boat', /boat|ship|sailboat/i],
  ['computer', /computer|monitor|laptop|terminal|gaming pc/i], ['backpack', /backpack|rucksack|jetpack/i],
  ['table', /table|desk/i], ['chair', /chair|seat|throne/i], ['bed', /bed/i], ['sofa', /sofa|couch/i],
  ['lantern', /lantern|lamp|streetlight/i], ['mushroom', /mushroom|toadstool/i], ['tree', /tree|pine|fir|bush|plant/i],
  ['crystal', /crystal|gem|ore/i], ['rock', /rock|boulder|stone/i], ['crate', /crate|chest|loot box|supply box/i],
  ['mug', /mug|cup|tankard|pot/i], ['cake', /cake|pie|tart/i], ['pumpkin', /pumpkin|squash/i], ['apple', /apple|fruit/i],
  ['tool', /wrench|spanner|shovel|spade|telescope|tool/i], ['flag', /flag|banner|sign/i]
];

const STYLE_TAGS = [
  ['cartoony', /cartoon|cartoony|cute|stylized|toy-like/i], ['premium', /premium|polished|professional|hero asset/i],
  ['angular', /sharp|angular|hard.?surface|chamfered|faceted/i], ['ornate', /ornate|royal|legendary|decorative|intricate/i],
  ['chunky', /chunky|bulky|thick|heavy/i], ['sleek', /sleek|slim|slender|streamlined/i], ['ancient', /ancient|ruined|weathered|old/i],
  ['futuristic', /futuristic|sci.?fi|cyber|neon|mech/i], ['nature', /forest|woodland|natural|organic/i]
];

export function findObjectSubject(prompt) {
  const text = String(prompt || '').toLowerCase();
  for (const [name, re] of OBJECT_TERMS) if (re.test(text)) return name;
  const words = text.replace(/[^a-z0-9 -]/g, ' ').split(/\s+/).filter(Boolean);
  const stop = new Set('a an the with and or but from into for of to in on at made make build create low poly lowpoly roblox game asset model 3d stylized cute detailed premium highly very tiny small big giant simple clean sharp smooth'.split(' '));
  const meaningful = words.filter(w => !stop.has(w) && w.length > 2);
  return meaningful.slice(-2).join(' ') || 'game asset';
}

export function analyzePrompt(prompt, requestedType = 'auto', preferences = []) {
  const text = String(prompt || '').trim();
  const subject = findObjectSubject(text);
  const category = classifyPrompt(text, requestedType);
  const style = STYLE_TAGS.filter(([, re]) => re.test(text)).map(([tag]) => tag);
  const colors = [...text.matchAll(/\b(purple|violet|magenta|red|crimson|blue|cyan|teal|green|mint|emerald|yellow|gold|golden|orange|amber|pink|rose|black|graphite|white|ivory|brown|tan|silver|gray|grey)\b/gi)].map(m => m[0].toLowerCase());
  const features = [];
  const known = ['wings','tail','horns','spikes','armor','armour','visor','antenna','crown','claws','fins','feathers','jetpack','backpack','windows','wheels','engines','glowing eyes','glowing','crystals','leaves','stripes','runes','saddle','sword','shield','cape','hood','helmet','shoulder pads','belly plates','gills','whiskers','scales','shell','futuristic','royal','armored','damaged'];
  for (const feature of known) if (new RegExp(`\\b${feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) features.push(feature);
  const sizes = /\b(giant|huge|massive|boss)\b/i.test(text) ? 'oversized' : /\b(tiny|mini|miniature|small|pocket)\b/i.test(text) ? 'compact' : /\b(slim|sleek|slender|tall)\b/i.test(text) ? 'slender' : /\b(bulky|chunky|heavy|tank)\b/i.test(text) ? 'bulky' : 'balanced';
  const userStyle = preferences.filter(Boolean).slice(0, 4);
  const designPrinciples = [
    'silhouette must read at thumbnail size',
    'primary masses are larger than secondary plates',
    'use consistent bevel/chamfer language and planar faces',
    'keep bilateral details symmetrical unless asymmetry is requested',
    'separate overlapping surfaces by a small intentional offset',
    'accent colors are reserved for face, emissive, or hero details',
    'preserve enough negative space to make components readable'
  ];
  return {
    subject, category, originalPrompt: text, style: style.length ? style : ['cartoony','premium','angular'],
    colors: [...new Set(colors)], features, sizeProfile: sizes,
    intendedUse: /roblox|game|playable|avatar|npc/i.test(text) ? 'real-time game asset' : 'stylized 3D asset',
    designPrinciples, preferences: userStyle,
    silhouettePlan: makeSilhouettePlan(subject, text, category),
    geometryBudget: 'under 500 triangles unless user raises the budget'
  };
}

function makeSilhouettePlan(subject, prompt, category) {
  if (/dragon|dinosaur|horse|cat|dog|bird|shark|whale|octopus/i.test(subject)) return 'Readable creature outline: torso first, head/face second, matched limbs or fins third, tail/wings last.';
  if (/spaceship|rocket|airplane|helicopter|car|bicycle|boat/i.test(subject)) return 'Vehicle profile: central chassis/fuselage, clear forward direction, paired propulsion or wheels, large functional appendages.';
  if (/sword|axe|hammer|pickaxe|tool/i.test(subject)) return 'Tool profile: single continuous handle axis, one unmistakable working head/blade, restrained grip/edge accents.';
  if (/house|castle|tower/i.test(subject)) return 'Architecture profile: foundation, main mass, recognizable roof or tower, oversized door and legible window rhythm.';
  if (/tree|mushroom|crystal|rock|pumpkin|apple/i.test(subject)) return 'Organic prop profile: broad central silhouette, a clear stem/base, 2–4 controlled surface accents.';
  return category === 'character' ? 'Character profile: head-to-torso ratio, shoulder span, pelvis, mirrored limbs, grounded feet.' : 'Prop profile: primary mass, one functional secondary form, repeated accent language, clear contact plane.';
}

function plainText(html = '') { return html.replace(/<[^>]*>/g, ' ').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(); }
function timeoutSignal(ms = 6500) { return AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined; }

export async function researchReferences(prompt, fetchImpl = fetch) {
  const subject = findObjectSubject(prompt);
  const query = `${subject} anatomy design reference`;
  const report = { subject, query, articles: [], images: [], status: 'unavailable', notes: [] };
  const enc = encodeURIComponent(query);
  const articleUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${enc}&srlimit=4&format=json&origin=*`;
  const imageQuery = encodeURIComponent(`${subject} stylized model reference`);
  const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${imageQuery}&gsrnamespace=6&gsrlimit=4&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=360&format=json&origin=*`;
  const results = await Promise.allSettled([
    fetchImpl(articleUrl, { signal: timeoutSignal(6500) }).then(r => { if (!r.ok) throw new Error(`Wikipedia returned ${r.status}`); return r.json(); }),
    fetchImpl(commonsUrl, { signal: timeoutSignal(6500) }).then(r => { if (!r.ok) throw new Error(`Commons returned ${r.status}`); return r.json(); })
  ]);
  const [articles, commons] = results;
  if (articles.status === 'fulfilled') {
    report.articles = (articles.value.query?.search || []).map(row => ({
      title: plainText(row.title), snippet: plainText(row.snippet),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(row.title).replace(/ /g, '_'))}`
    }));
  } else report.notes.push('Wikipedia research could not be reached; the offline design grammar was used.');
  if (commons.status === 'fulfilled') {
    report.images = Object.values(commons.value.query?.pages || {}).map(page => {
      const ii = page.imageinfo?.[0] || {}, meta = ii.extmetadata || {};
      return {
        title: plainText(page.title || '').replace(/^File:/, ''),
        thumb: ii.thumburl || ii.url || '', url: ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`,
        artist: plainText(meta.Artist?.value || 'Contributor not listed').slice(0, 100),
        license: plainText(meta.LicenseShortName?.value || 'Check source page').slice(0, 60)
      };
    }).filter(x => x.thumb);
  } else report.notes.push('Wikimedia Commons images could not be reached; use the prompt and uploaded reference instead.');
  report.status = (report.articles.length || report.images.length) ? 'complete' : 'offline';
  report.notes.unshift(report.status === 'complete' ? 'Online reference search completed. Use sources as inspiration; they are not copied into the generated mesh.' : 'Online research unavailable in this browser session. Continuing with the offline design plan.');
  return report;
}

export function createCartoonSvg(brief, palette = {}) {
  const p = { base: palette.base || '#8C70C8', accent: palette.accent || '#C49BEF', accent2: palette.accent2 || '#E5C27A', dark: palette.dark || '#27323B', light: palette.light || '#E3E8E6', glow: palette.glow || '#66E8FF' };
  let artwork = '';
  const s = brief.subject;
  if (/robot|character|avatar/i.test(s) || brief.category === 'character') {
    artwork = `<path d="M108 122 L132 98 L208 98 L232 122 L222 180 L196 194 L144 194 L118 180 Z" fill="${p.base}"/><path d="M142 194 L194 194 L205 236 L190 246 L146 246 L131 236 Z" fill="${p.dark}"/><path d="M122 122 L136 76 L204 76 L218 122 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="7"/><path d="M139 110 L201 110 L195 129 L145 129 Z" fill="${p.glow}"/><path d="M111 137 L83 149 L76 190 L91 196 L109 170 M229 137 L257 149 L264 190 L249 196 L231 170" fill="${p.base}" stroke="${p.dark}" stroke-width="9" stroke-linejoin="round"/><path d="M148 246 L145 291 L126 303 L158 307 L172 291 L174 246 M189 246 L192 291 L211 303 L179 307 L165 291 L163 246" fill="${p.dark}" stroke="${p.dark}" stroke-width="6" stroke-linejoin="round"/><path d="M145 152 L195 152" stroke="${p.accent2}" stroke-width="8" stroke-linecap="round"/>`;
  } else if (/dragon|dinosaur|horse|cat|dog|bird|shark|whale|octopus|creature/i.test(s) || brief.category === 'creature') {
    if (/bird/i.test(s)) artwork = `<ellipse cx="172" cy="183" rx="62" ry="78" fill="${p.base}"/><circle cx="175" cy="111" r="43" fill="${p.base}"/><path d="M202 108 L245 126 L203 139 Z" fill="${p.accent2}"/><path d="M124 178 L75 222 L104 233 L150 201 M219 177 L267 215 L244 228 L207 201" fill="${p.accent}" stroke="${p.dark}" stroke-width="7"/><circle cx="190" cy="108" r="7" fill="${p.glow}"/><path d="M143 255 L136 286 M194 255 L201 286" stroke="${p.accent2}" stroke-width="10" stroke-linecap="round"/>`;
    else if (/horse|cat|dog/i.test(s)) artwork = `<path d="M98 175 L111 133 L151 126 L171 150 L219 155 L244 193 L232 222 L104 222 L81 203 Z" fill="${p.base}"/><path d="M193 151 L209 105 L241 111 L256 139 L239 165 Z" fill="${p.base}"/><path d="M211 109 L217 75 L234 102 M240 112 L260 85 L256 124" stroke="${p.dark}" stroke-width="10" stroke-linejoin="round"/><path d="M114 216 L112 270 L130 270 L140 217 M205 217 L211 270 L228 270 L225 214" fill="${p.dark}" stroke="${p.dark}" stroke-width="6"/><path d="M82 186 Q48 166 55 139" stroke="${p.accent}" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="237" cy="132" r="5" fill="${p.glow}"/>`;
    else artwork = `<path d="M115 149 L147 117 L193 119 L221 150 L211 211 L174 230 L132 210 Z" fill="${p.base}"/><path d="M135 130 L91 89 L100 153 Z M201 130 L246 83 L240 156 Z" fill="${p.accent}" stroke="${p.dark}" stroke-width="6"/><path d="M141 155 L207 155 L195 177 L153 177 Z" fill="${p.light}"/><circle cx="151" cy="150" r="7" fill="${p.glow}"/><circle cx="197" cy="150" r="7" fill="${p.glow}"/><path d="M140 207 L128 251 L146 264 L164 229 M197 207 L207 252 L192 265 L177 229" fill="${p.dark}" stroke="${p.dark}" stroke-width="6"/><path d="M218 191 L254 213 L278 205" stroke="${p.accent2}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  } else if (/sword|axe|hammer|pickaxe/i.test(s) || brief.category === 'weapon') {
    artwork = `<path d="M172 63 L197 111 L188 203 L172 220 L156 203 L147 111 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="7" stroke-linejoin="round"/><path d="M172 71 L172 211" stroke="${p.accent2}" stroke-width="4"/><path d="M112 221 L232 221 L232 239 L190 246 L190 288 L154 288 L154 246 L112 239 Z" fill="${p.dark}"/><path d="M158 125 L186 125" stroke="${p.glow}" stroke-width="7"/>`;
  } else if (/spaceship|rocket|airplane|helicopter/i.test(s)) {
    artwork = `<path d="M172 57 L198 143 L251 209 L222 217 L193 188 L193 255 L172 280 L151 255 L151 188 L122 217 L93 209 L146 143 Z" fill="${p.base}" stroke="${p.dark}" stroke-width="7" stroke-linejoin="round"/><path d="M172 99 L185 155 L159 155 Z" fill="${p.glow}"/><path d="M152 242 L172 272 L192 242" fill="${p.accent2}"/>`;
  } else if (/car|boat|bicycle/i.test(s)) {
    artwork = `<path d="M76 190 L92 150 L130 139 L156 109 L211 109 L242 151 L265 160 L271 203 L67 203 Z" fill="${p.base}" stroke="${p.dark}" stroke-width="7" stroke-linejoin="round"/><path d="M147 121 L138 151 L183 151 L183 121 Z M193 121 L193 151 L232 151 L211 121 Z" fill="${p.glow}"/><circle cx="110" cy="207" r="21" fill="${p.dark}"/><circle cx="232" cy="207" r="21" fill="${p.dark}"/><circle cx="110" cy="207" r="9" fill="${p.accent2}"/><circle cx="232" cy="207" r="9" fill="${p.accent2}"/>`;
  } else if (/castle|house|tower/i.test(s)) {
    artwork = `<path d="M87 275 L87 149 L118 149 L118 113 L147 113 L147 149 L196 149 L196 113 L225 113 L225 149 L257 149 L257 275 Z" fill="${p.base}" stroke="${p.dark}" stroke-width="7"/><path d="M104 149 L104 82 L132 111 L160 82 L160 149 M184 149 L184 82 L211 111 L239 82 L239 149" fill="${p.accent}" stroke="${p.dark}" stroke-width="6"/><path d="M154 275 L154 215 Q172 179 190 215 L190 275" fill="${p.dark}"/><rect x="112" y="178" width="24" height="27" fill="${p.glow}"/><rect x="211" y="178" width="24" height="27" fill="${p.glow}"/>`;
  } else if (/computer|laptop|monitor/i.test(s)) {
    artwork = `<path d="M76 83 L268 83 L268 226 L76 226 Z" fill="${p.dark}" stroke="${p.dark}" stroke-width="8"/><path d="M94 101 L250 101 L250 205 L94 205 Z" fill="${p.glow}"/><path d="M160 226 L184 226 L193 264 L151 264 Z" fill="${p.metal || p.accent2}"/><path d="M113 267 L231 267 L244 280 L99 280 Z" fill="${p.dark}"/><path d="M112 125 L163 125 L163 135 L112 135 M112 151 L213 151 L213 159 L112 159" stroke="${p.light}" stroke-width="7"/>`;
  } else if (/mushroom|tree|plant/i.test(s)) {
    artwork = `<path d="M156 208 L189 208 L197 286 L146 286 Z" fill="${p.accent2}"/><path d="M68 198 Q74 124 128 134 Q156 63 199 111 Q257 88 276 158 Q290 201 246 209 L102 209 Z" fill="${p.base}" stroke="${p.dark}" stroke-width="7" stroke-linejoin="round"/><circle cx="135" cy="157" r="10" fill="${p.glow}"/><circle cx="207" cy="145" r="10" fill="${p.glow}"/>`;
  } else if (/lantern|lamp/i.test(s)) {
    artwork = `<path d="M124 95 L220 95 L241 127 L230 230 L114 230 L103 127 Z" fill="${p.glow}" stroke="${p.dark}" stroke-width="8"/><path d="M111 125 L232 125 M115 221 L228 221" stroke="${p.accent2}" stroke-width="13"/><path d="M135 103 L135 219 M208 103 L208 219" stroke="${p.dark}" stroke-width="8"/><path d="M151 90 Q151 52 172 52 Q193 52 193 90" stroke="${p.dark}" stroke-width="8" fill="none"/><path d="M151 230 L193 230 L204 273 L140 273 Z" fill="${p.dark}"/>`;
  } else if (/table|desk|chair|sofa|bed/i.test(s)) {
    artwork = `<path d="M69 130 L275 130 L275 154 L69 154 Z" fill="${p.base}" stroke="${p.dark}" stroke-width="7"/><path d="M91 153 L112 153 L112 272 L91 272 Z M233 153 L254 153 L254 272 L233 272 Z" fill="${p.accent}"/><path d="M113 108 L231 108 L245 128 L99 128 Z" fill="${p.light}"/><path d="M132 168 L211 168" stroke="${p.accent2}" stroke-width="8"/>`;
  } else if (/cake|pie|apple|pumpkin|fruit/i.test(s)) {
    artwork = `<path d="M82 201 L98 151 L246 151 L262 201 L244 254 L100 254 Z" fill="${p.base}" stroke="${p.dark}" stroke-width="7"/><path d="M98 151 Q172 117 246 151" stroke="${p.light}" stroke-width="19" fill="none"/><circle cx="136" cy="143" r="12" fill="${p.accent}"/><circle cx="172" cy="134" r="12" fill="${p.glow}"/><circle cx="207" cy="143" r="12" fill="${p.accent2}"/>`;
  } else {
    artwork = `<path d="M105 112 L238 112 L252 131 L252 247 L230 269 L111 269 L92 248 L92 132 Z" fill="${p.base}" stroke="${p.dark}" stroke-width="7" stroke-linejoin="round"/><path d="M122 145 L222 145 L222 205 L122 205 Z" fill="${p.dark}"/><path d="M145 165 L198 165 L198 184 L145 184 Z" fill="${p.glow}"/><path d="M127 225 L218 225" stroke="${p.accent2}" stroke-width="8" stroke-linecap="round"/>`;
  }
  const label = String(brief.subject || 'game asset').replace(/[<>&"']/g, '').slice(0, 28);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 344 344" role="img" aria-label="Cartoon concept of ${label}"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#FAFCF8"/><stop offset="1" stop-color="#E9EFE6"/></linearGradient><pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#D9E2D4"/></pattern></defs><rect width="344" height="344" rx="20" fill="url(#bg)"/><rect width="344" height="344" rx="20" fill="url(#dots)"/><ellipse cx="172" cy="291" rx="92" ry="13" fill="#CFD8C8" opacity=".7"/>${artwork}<text x="20" y="28" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="2" fill="#64725F">FORGE3D / CONCEPT STUDY</text><text x="20" y="326" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#34402F">${label.toUpperCase()}</text></svg>`;
}

export function createBlueprintConceptSvg(brief, palette = {}, blueprint = null) {
  const parts = Array.isArray(blueprint?.parts) ? blueprint.parts.slice(0, 28).filter(p => p && Array.isArray(p.position) && Array.isArray(p.size)) : [];
  if (parts.length < 5) return createCartoonSvg(brief, palette);
  const esc = value => String(value ?? '').replace(/[<>&"']/g, ch => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[ch]));
  const validParts = parts.map(p => ({
    ...p,
    x: Math.max(-2.5, Math.min(2.5, Number(p.position[0]) || 0)),
    y: Math.max(-0.25, Math.min(4.5, Number(p.position[1]) || 0.5)),
    w: Math.max(0.06, Math.min(1.9, Number(p.size[0]) || 0.4)),
    h: Math.max(0.06, Math.min(2.8, Number(p.size[1]) || 0.3)),
    z: Math.max(-2.5, Math.min(2.5, Number(p.position[2]) || 0))
  }));
  const minX = Math.min(...validParts.map(p => p.x - p.w / 2)), maxX = Math.max(...validParts.map(p => p.x + p.w / 2));
  const minY = Math.min(...validParts.map(p => p.y - p.h / 2)), maxY = Math.max(...validParts.map(p => p.y + p.h / 2));
  const scale = Math.min(222 / Math.max(0.5, maxX - minX), 212 / Math.max(0.5, maxY - minY));
  const cx = x => 172 + (x - (minX + maxX) / 2) * scale;
  const cy = y => 268 - (y - minY) * scale;
  const colors = {
    base: palette.base || '#7D9D84', accent: palette.accent || '#C6A15B', metal: palette.accent2 || '#D1D8D4',
    dark: palette.dark || '#34403D', glow: palette.glow || '#70D8D0'
  };
  const draw = validParts.sort((a, b) => b.z - a.z).map((part, index) => {
    const x = cx(part.x), y = cy(part.y), w = Math.max(6, part.w * scale), h = Math.max(6, part.h * scale);
    const color = colors[/glow|light|glass|eye|screen/i.test(`${part.role} ${part.name}`) ? 'glow' : /metal|steel|gold|brass/i.test(`${part.role} ${part.name}`) ? 'metal' : /dark|shadow|grip|black/i.test(`${part.role} ${part.name}`) ? 'dark' : /accent|trim|stripe/i.test(`${part.role} ${part.name}`) ? 'accent' : 'base'];
    const shape = String(part.shape || 'plate').toLowerCase();
    const title = esc(String(part.name || `Form ${index + 1}`).slice(0, 28));
    const rotation = Number(Array.isArray(part.rotation) ? part.rotation[2] : 0) || 0;
    if (shape === 'sphere' || shape === 'icosphere' || shape === 'ring') {
      return shape === 'ring' ? `<circle cx="${x}" cy="${y}" r="${Math.min(w,h)*0.42}" fill="none" stroke="${color}" stroke-width="${Math.max(3,Math.min(w,h)*0.1)}"/>` : `<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}" fill="${color}" stroke="#27323B" stroke-width="2.5"/>`;
    }
    if (shape === 'cone') return `<path d="M ${x-w/2} ${y+h/2} L ${x} ${y-h/2} L ${x+w/2} ${y+h/2} Z" fill="${color}" stroke="#27323B" stroke-width="2.5" stroke-linejoin="round"/>`;
    if (shape === 'wedge') return `<path d="M ${x-w/2} ${y+h/2} L ${x-w/2} ${y-h/3} L ${x+w/2} ${y-h/2} L ${x+w/2} ${y+h/2} Z" fill="${color}" stroke="#27323B" stroke-width="2.5" stroke-linejoin="round"/>`;
    if (shape === 'rod') return `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${Math.min(w,h)/2}" transform="rotate(${rotation*180/Math.PI} ${x} ${y})" fill="${color}" stroke="#27323B" stroke-width="2.5"/>`;
    const cut = Math.min(8, w*0.15, h*0.15);
    const points = `${x-w/2+cut},${y-h/2} ${x+w/2-cut},${y-h/2} ${x+w/2},${y-h/2+cut} ${x+w/2},${y+h/2-cut} ${x+w/2-cut},${y+h/2} ${x-w/2+cut},${y+h/2} ${x-w/2},${y+h/2-cut} ${x-w/2},${y-h/2+cut}`;
    return `<polygon points="${points}" transform="rotate(${rotation*180/Math.PI} ${x} ${y})" fill="${color}" stroke="#27323B" stroke-width="2.5" stroke-linejoin="round"><title>${title}</title></polygon>`;
  }).join('');
  const label = esc(String(brief?.subject || blueprint?.subject || 'custom asset').slice(0, 32));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 344 344" role="img" aria-label="AI part-plan concept of ${label}"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#FAFCF8"/><stop offset="1" stop-color="#E9EFE6"/></linearGradient><pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#D9E2D4"/></pattern></defs><rect width="344" height="344" rx="20" fill="url(#bg)"/><rect width="344" height="344" rx="20" fill="url(#dots)"/><ellipse cx="172" cy="278" rx="105" ry="10" fill="#CFD8C8" opacity=".65"/>${draw}<text x="20" y="28" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="2" fill="#64725F">FORGE3D / AI BLOCKOUT</text><text x="20" y="326" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#34402F">${label.toUpperCase()}</text></svg>`;
}

export async function askLocalOllama({ endpoint = 'http://localhost:11434', model = 'qwen2.5:3b', prompt, imageDataUrl = null, fetchImpl = fetch }) {
  const root = endpoint.trim().replace(/\/$/, '');
  const system = `You are a senior stylized game-asset art director and procedural 3D technical artist. Inspect the prompt and optional reference image. Return ONLY valid compact JSON with keys: objectType (character, creature, weapon, prop), subject (short noun), silhouette (one sentence), primaryForms (3-6 strings), secondaryDetails (3-8 strings), accentDetails (2-5 strings), proportions (headScale, bodyWidth, limbLength, tailLength numbers 0.7-1.4), palette (2-4 color names), materialNotes (array), qualityChecks (array), designHints (short description), parts (array of 8-18 part objects for novel objects). Each part object MUST contain name (short unique label), shape (one of box, plate, sphere, icosphere, cylinder, cone, wedge, rod, ring), position (three numbers [x,y,z], y-up, bottom near y=0, x/z within -2.5..2.5, y within -0.25..4.5), size (three positive numbers [width,height,depth], each 0.06..1.9, height max 2.8), rotation (three radians numbers -3.14..3.14), role (base, accent, metal, dark, glow), priority (primary, secondary, accent), symmetry (single or both). Mark 2-4 silhouette-defining forms primary, functional supporting forms secondary, and trim/indicators accent. Make part names describe what they do, not generic Part01. Use 2-4 primary forms, 3-8 secondary forms and only a few accents. The geometry must form one coherent object with a grounded base, no floating junk, no duplicate intersections, a recognizable silhouette, and under 500 triangles. For standard assets, propose custom composition parts anyway, but don't imitate the robot unless requested. Flat surfaces, intentional chamfers, consistent proportions, restrained accent palette. Do not invent texture-only detail.`;
  const user = `Create a custom design and a part-by-part geometry plan for this asset: ${prompt}. Do not reuse a fixed archetype. First mentally identify the real-world object's defining silhouette and functional features. Use coordinates consistently so all parts fit together and the bottom rests near y=0. Prefer a small number of strong, clean angular forms to many random boxes. Return 8-18 placed shape parts with sensible positions and dimensions. If a reference image is attached, use it to estimate visible form and color, but do not claim to infer hidden views with certainty.`;
  const message = { role: 'user', content: user };
  if (imageDataUrl) message.images = [imageDataUrl.replace(/^data:[^;]+;base64,/, '')];
  const response = await fetchImpl(`${root}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: false, format: 'json', messages: [{ role: 'system', content: system }, message ], options: { temperature: 0.35 } }),
    signal: AbortSignal.timeout ? AbortSignal.timeout(90000) : undefined
  });
  if (!response.ok) throw new Error(`Local AI connection failed (${response.status}). Check Ollama is running and browser origin access is enabled.`);
  const data = await response.json();
  const raw = data.message?.content || '';
  let blueprint;
  try { blueprint = JSON.parse(raw); } catch { throw new Error('The local model did not return valid design JSON. Try a vision/instruction model such as qwen2.5:3b or qwen2.5vl:3b.'); }
  if (!blueprint || typeof blueprint !== 'object') throw new Error('Local model returned an empty design blueprint.');
  return blueprint;
}
