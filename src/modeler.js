import * as THREE from 'three';

const COLOR_MAP = [
  [/\b(purple|violet|magenta)\b/i, '#9D76DA'], [/\b(red|crimson)\b/i, '#D96859'],
  [/\b(blue|cyan|ice)\b/i, '#77C9D0'], [/\b(green|mint|emerald)\b/i, '#8EC79C'],
  [/\b(yellow|gold|golden)\b/i, '#E5C65B'], [/\b(orange)\b/i, '#E99C5D'],
  [/\b(pink|rose)\b/i, '#D99DBF'], [/\b(black|dark|graphite)\b/i, '#4D5655']
];

function paletteFor(prompt, imageColor) {
  let base = imageColor || '#9ACD83';
  if (!imageColor) {
    for (const [pattern, color] of COLOR_MAP) if (pattern.test(prompt)) { base = color; break; }
  }
  const c = new THREE.Color(base);
  // Keep sampled colors vivid enough to read on a neutral viewer background.
  const hsl = {}; c.getHSL(hsl);
  if (hsl.s < 0.22) c.setHSL(0.36, 0.36, Math.max(0.43, Math.min(0.68, hsl.l)));
  const accent = new THREE.Color().setHSL((c.getHSL({}).h + 0.12) % 1, 0.72, 0.68);
  return { base: `#${c.getHexString()}`, accent: `#${accent.getHexString()}`, dark: '#303A36', light: '#E8EEE3', eye: '#F4D75C' };
}
function material(color, roughness = 0.82) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, flatShading: true }); }
function addMesh(group, name, geometry, color, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material(color)); mesh.name = name;
  mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.set(...rotation); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
}
function box(group, name, pos, size, color) { return addMesh(group, name, new THREE.BoxGeometry(...size), color, pos); }
function ico(group, name, pos, radius, color, scale = [1, 1, 1], detail = 0) { return addMesh(group, name, new THREE.IcosahedronGeometry(radius, detail), color, pos, scale); }
function cylinder(group, name, pos, rTop, rBottom, height, color, segments = 6, rotation = [0, 0, 0]) {
  return addMesh(group, name, new THREE.CylinderGeometry(rTop, rBottom, height, segments, 1, false), color, pos, [1, 1, 1], rotation);
}
function cone(group, name, pos, radius, height, color, segments = 5, rotation = [0, 0, 0]) { return cylinder(group, name, pos, 0, radius, height, color, segments, rotation); }
function triangle(group, name, points, color) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3)); geo.computeVertexNormals();
  const mesh = addMesh(group, name, geo, color, [0, 0, 0]); mesh.material.side = THREE.DoubleSide; return mesh;
}
function makeHumanoid(g, p, prompt) {
  box(g, 'Torso', [0, 2.2, 0], [1.1, 1.25, 0.62], p.base);
  box(g, 'Head', [0, 3.18, 0], [0.82, 0.78, 0.74], p.light);
  box(g, 'FacePlate', [0, 3.19, -0.379], [0.53, 0.17, 0.035], p.accent);
  box(g, 'ChestPlate', [0, 2.35, -0.326], [0.58, 0.39, 0.04], p.dark);
  box(g, 'ChestMark', [0, 2.36, -0.35], [0.22, 0.08, 0.03], p.accent);
  for (const s of [-1, 1]) {
    box(g, s < 0 ? 'LeftArm' : 'RightArm', [s * 0.79, 2.18, 0], [0.39, 0.95, 0.48], p.base);
    ico(g, s < 0 ? 'LeftShoulder' : 'RightShoulder', [s * 0.78, 2.66, 0], 0.23, p.accent, [1, 1, 1], 0);
    box(g, s < 0 ? 'LeftHand' : 'RightHand', [s * 0.79, 1.62, -0.02], [0.38, 0.26, 0.43], p.light);
    box(g, s < 0 ? 'LeftLeg' : 'RightLeg', [s * 0.31, 1.14, 0], [0.43, 0.91, 0.52], p.dark);
    box(g, s < 0 ? 'LeftBoot' : 'RightBoot', [s * 0.31, 0.62, -0.06], [0.48, 0.25, 0.66], p.accent);
  }
  if (/robot|mech|cyber|antenna/i.test(prompt)) {
    box(g, 'AntennaStem', [0.2, 3.68, 0], [0.08, 0.26, 0.08], p.dark);
    ico(g, 'AntennaTip', [0.2, 3.83, 0], 0.09, p.accent, [1, 1, 1], 0);
  }
  if (/hood|hair|helmet/i.test(prompt)) box(g, 'HeadTop', [0, 3.58, 0.02], [0.88, 0.12, 0.8], p.base);
}
function makeQuadruped(g, p, prompt) {
  if (/horse|unicorn|pony/i.test(prompt)) {
    box(g, 'Body', [0, 1.65, 0], [1.5, 0.8, 0.67], p.base);
    box(g, 'Neck', [0, 2.05, -0.55], [0.48, 1.05, 0.48], p.base, );
    box(g, 'Head', [0, 2.63, -0.75], [0.6, 0.54, 0.58], p.light);
    box(g, 'Muzzle', [0, 2.48, -1.07], [0.49, 0.25, 0.2], p.accent);
    for (const s of [-1, 1]) { cone(g, 'Ear', [s * 0.2, 2.99, -0.74], 0.09, 0.32, p.dark, 4); ico(g, 'Eye', [s * 0.27, 2.67, -1.05], 0.065, p.eye, [1, 1, 0.5], 0); }
    box(g, 'Mane', [0, 2.26, -0.56], [0.28, 0.78, 0.55], p.accent);
    for (const x of [-0.52, 0.52]) for (const z of [-0.24, 0.24]) { box(g, 'Leg', [x, 0.9, z], [0.22, 1.15, 0.22], p.base); box(g, 'Hoof', [x, 0.29, z - 0.025], [0.3, 0.18, 0.31], p.dark); }
    box(g, 'Tail', [0.02, 1.53, 0.58], [0.18, 0.56, 0.18], p.accent, );
  } else if (/whale|fish|shark|dolphin/i.test(prompt)) {
    ico(g, 'Body', [0, 1.8, 0], 0.9, p.base, [1.65, 0.82, 0.74], 1);
    ico(g, 'Belly', [0, 1.48, -0.03], 0.54, p.light, [1.65, 0.55, 0.7], 0);
    for (const s of [-1, 1]) { ico(g, 'Eye', [s * 0.7, 1.98, -0.52], 0.09, p.dark, [1, 1, 0.75], 0); triangle(g, 'Fin', [[s * 0.2, 1.6, 0.05], [s * 1.25, 1.08, -0.05], [s * 0.73, 1.77, -0.2]], p.accent); }
    triangle(g, 'TailUpper', [[0, 1.83, 1.15], [-0.6, 2.27, 1.4], [0, 1.93, 1.39]], p.base);
    triangle(g, 'TailLower', [[0, 1.83, 1.15], [0, 1.93, 1.39], [0.6, 2.27, 1.4]], p.base);
    if (/shark/i.test(prompt)) for (let i = 0; i < 3; i++) cone(g, 'DorsalFin', [0, 2.5 - i * 0.18, i * 0.27], 0.13, 0.35, p.dark, 4);
  } else if (/octopus|squid/i.test(prompt)) {
    ico(g, 'Head', [0, 2.18, 0], 0.78, p.base, [1.05, 1.05, 0.9], 1);
    box(g, 'Face', [0, 2.0, -0.66], [0.6, 0.36, 0.08], p.dark);
    for (const s of [-1, 1]) { ico(g, 'Eye', [s * 0.18, 2.1, -0.72], 0.09, p.eye, [1, 1, 0.55], 0); }
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4, x = Math.cos(angle) * 0.65, z = Math.sin(angle) * 0.44;
      const endX = Math.cos(angle) * 1.24, endZ = Math.sin(angle) * 0.76;
      box(g, 'TentacleA', [x, 1.25, z], [0.23, 0.62, 0.23], p.base, [0, 0, -angle * 0.32]);
      box(g, 'TentacleB', [endX, 0.87 + (i % 2) * 0.08, endZ], [0.19, 0.53, 0.19], p.accent, [0, 0, -angle * 0.15]);
    }
  } else {
    ico(g, 'Body', [0, 1.73, 0], 0.76, p.base, [1.42, 0.77, 0.82], 1);
    ico(g, 'Head', [0, 2.08, -0.8], 0.47, p.base, [1.05, 0.98, 0.9], 0);
    box(g, 'Muzzle', [0, 1.91, -1.15], [0.48, 0.28, 0.29], p.light);
    for (const s of [-1, 1]) ico(g, 'Eye', [s * 0.27, 2.2, -1.13], 0.075, p.eye, [1, 1, 0.5], 0);
    for (const x of [-0.63, 0.63]) for (const z of [-0.33, 0.33]) { box(g, 'Leg', [x, 0.98, z], [0.29, 0.88, 0.3], p.base); box(g, 'Foot', [x, 0.48, z - 0.06], [0.4, 0.19, 0.43], p.dark); }
    box(g, 'TailA', [0.03, 1.67, 0.73], [0.22, 0.27, 0.68], p.accent, [0.75, 0, 0]);
    box(g, 'TailB', [0.04, 1.94, 1.24], [0.18, 0.18, 0.43], p.base, [0.85, 0, 0]);
    if (/dragon|dinosaur|wyvern/i.test(prompt)) {
      for (const s of [-1, 1]) {
        triangle(g, 'Wing', [[s * 0.38, 2.18, 0.14], [s * 1.4, 2.96, 0.2], [s * 1.02, 1.95, 0.18]], p.accent);
        triangle(g, 'WingFold', [[s * 0.38, 2.18, 0.14], [s * 1.02, 1.95, 0.18], [s * 0.92, 2.44, 0.24]], p.base);
      }
      for (let i = 0; i < 3; i++) cone(g, 'Spikes', [0, 2.45 - i * 0.04, 0.24 + i * 0.27], 0.13, 0.28, p.dark, 4, [Math.PI / 2, 0, 0]);
      cone(g, 'HornL', [-0.22, 2.52, -0.89], 0.1, 0.27, p.dark, 4, [0, 0, -0.2]);
      cone(g, 'HornR', [0.22, 2.52, -0.89], 0.1, 0.27, p.dark, 4, [0, 0, 0.2]);
    }
  }
}
function makeWeapon(g, p, prompt) {
  const isAxe = /axe|hammer|mace/i.test(prompt);
  box(g, 'Grip', [0, 1.0, 0], [0.16, 1.15, 0.16], p.dark);
  box(g, 'Pommel', [0, 0.38, 0], [0.25, 0.19, 0.23], p.accent);
  box(g, 'Guard', [0, 1.56, 0], [0.8, 0.16, 0.2], p.accent);
  if (isAxe) {
    box(g, 'AxeHead', [0.33, 2.02, 0], [0.7, 0.72, 0.2], p.base);
    triangle(g, 'AxeEdge', [[0.55, 1.66, -0.11], [0.84, 2.02, -0.11], [0.55, 2.38, -0.11]], p.light);
  } else {
    box(g, 'Blade', [0, 2.18, 0], [0.4, 1.12, 0.13], p.base);
    triangle(g, 'BladeTip', [[-0.2, 2.74, 0.01], [0.2, 2.74, 0.01], [0, 3.06, 0.01]], p.light);
    box(g, 'BladeLine', [0, 2.18, -0.071], [0.06, 0.82, 0.02], p.accent);
  }
}
function makeProp(g, p, prompt) {
  if (/tree|pine|fir|plant/i.test(prompt)) {
    cylinder(g, 'Trunk', [0, 0.78, 0], 0.16, 0.22, 1.55, p.dark, 5);
    if (/pine|fir/i.test(prompt)) { cone(g, 'LeavesLow', [0, 1.72, 0], 0.9, 1.35, p.base, 5); cone(g, 'LeavesHigh', [0, 2.45, 0], 0.64, 1.15, p.accent, 5); }
    else { ico(g, 'Canopy', [0, 2.05, 0], 0.9, p.base, [1, 1, 1], 1); ico(g, 'CanopyTop', [0.28, 2.48, 0], 0.55, p.accent, [1, 1, 1], 0); }
  } else if (/car|kart|truck|van/i.test(prompt)) {
    box(g, 'Chassis', [0, 0.78, 0], [1.8, 0.42, 2.5], p.dark);
    box(g, 'Body', [0, 1.03, 0], [1.85, 0.43, 2.2], p.base);
    box(g, 'Cabin', [0, 1.43, 0.24], [1.34, 0.56, 1.16], p.light);
    box(g, 'Windshield', [0, 1.47, -0.36], [1.12, 0.39, 0.04], p.accent);
    for (const x of [-0.96, 0.96]) for (const z of [-0.76, 0.8]) cylinder(g, 'Wheel', [x, 0.54, z], 0.29, 0.29, 0.17, '#343a39', 8, [0, 0, Math.PI / 2]);
    box(g, 'FrontLightL', [-0.59, 1.04, -1.12], [0.27, 0.13, 0.05], p.eye);
    box(g, 'FrontLightR', [0.59, 1.04, -1.12], [0.27, 0.13, 0.05], p.eye);
  } else if (/mug|cup|tankard/i.test(prompt)) {
    cylinder(g, 'Cup', [0, 0.9, 0], 0.52, 0.38, 1.2, p.base, 8);
    cylinder(g, 'Rim', [0, 1.52, 0], 0.54, 0.54, 0.1, p.accent, 8);
    const torus = new THREE.TorusGeometry(0.34, 0.09, 4, 8); addMesh(g, 'Handle', torus, p.dark, [0.57, 1.0, 0], [1, 1.12, 0.55], [Math.PI / 2, 0, 0]);
  } else if (/chair|seat|throne/i.test(prompt)) {
    box(g, 'Seat', [0, 1.06, 0.1], [1.35, 0.2, 1.1], p.base);
    box(g, 'Backrest', [0, 1.78, 0.55], [1.35, 1.3, 0.2], p.base);
    for (const x of [-0.52, 0.52]) for (const z of [-0.32, 0.48]) box(g, 'Leg', [x, 0.52, z], [0.16, 0.92, 0.16], p.dark);
    box(g, 'BackAccent', [0, 1.85, 0.43], [0.7, 0.38, 0.05], p.accent);
  } else if (/flag|banner|sign/i.test(prompt)) {
    cylinder(g, 'Pole', [0, 1.55, 0], 0.045, 0.045, 3.1, p.dark, 6);
    box(g, 'Banner', [0.48, 2.53, 0], [0.95, 0.72, 0.06], p.base);
    box(g, 'BannerStripe', [0.48, 2.51, -0.04], [0.95, 0.15, 0.025], p.accent);
  } else {
    box(g, 'MainBody', [0, 1.0, 0], [1.45, 1.1, 1.05], p.base);
    box(g, 'Top', [0, 1.62, 0], [1.53, 0.18, 1.13], p.dark);
    box(g, 'FrontPanel', [0, 1.05, -0.54], [0.78, 0.43, 0.035], p.accent);
    box(g, 'PanelInset', [0, 1.05, -0.57], [0.16, 0.2, 0.025], p.light);
    for (const x of [-0.48, 0.48]) box(g, 'Foot', [x, 0.35, 0.32], [0.24, 0.25, 0.24], p.dark);
  }
}

export function classifyPrompt(prompt, requested = 'auto') {
  if (requested !== 'auto') return requested;
  if (/sword|weapon|axe|dagger|hammer|staff|bow/i.test(prompt)) return 'weapon';
  if (/horse|dragon|dinosaur|whale|fish|shark|dolphin|octopus|squid|creature|animal|monster|unicorn|pony|wyvern/i.test(prompt)) return 'creature';
  if (/robot|avatar|person|character|humanoid|astronaut|knight|ninja|warrior|soldier/i.test(prompt)) return 'character';
  return 'prop';
}

function trianglesInMesh(mesh) { const g = mesh.geometry; const count = g.drawRange.count === Infinity ? (g.index ? g.index.count : (g.getAttribute('position')?.count || 0)) : g.drawRange.count; return Math.floor(count / 3); }

function enforceBudget(root, budget) {
  const priority = [ /ChestMark/, /PanelInset/, /AntennaTip/, /AntennaStem/, /Spikes/, /Horn/, /Eye/, /ChestPlate/, /FacePlate/, /Mane/, /TailB/, /TailA/, /WingFold/, /Wing/, /Muzzle/, /Belly/, /FrontLight/, /Ear/, /Hand/, /Foot/, /Hoof/, /DorsalFin/, /TentacleB/, /Boot/, /Shoulder/, /Leg/, /Wheel/, /BannerStripe/, /Top/, /Rim/, /Handle/, /BackAccent/, /Seat/, /Backrest/, /Guard/, /BladeLine/, /BladeTip/, /Pommel/ ];
  let stats = getMeshStats(root);
  for (const pattern of priority) {
    if (stats.triangles <= budget) break;
    const candidates = []; root.traverse(o => { if (o.isMesh && pattern.test(o.name)) candidates.push(o); });
    for (const mesh of candidates) {
      if (stats.triangles <= budget) break;
      mesh.parent?.remove(mesh); stats.triangles -= trianglesInMesh(mesh); stats.vertices -= mesh.geometry.getAttribute('position')?.count || 0; stats.parts--;
    }
  }
  if (stats.triangles > budget) {
    const candidates = []; root.traverse(o => { if (o.isMesh && !/^(Body|MainBody|Torso|Head)$/.test(o.name)) candidates.push(o); });
    candidates.sort((a, b) => trianglesInMesh(b) - trianglesInMesh(a));
    for (const mesh of candidates) { if (stats.triangles <= budget) break; mesh.parent?.remove(mesh); stats.triangles -= trianglesInMesh(mesh); stats.vertices -= mesh.geometry.getAttribute('position')?.count || 0; stats.parts--; }
  }
  return getMeshStats(root);
}

export function createModel({ prompt = 'minimal robot character', type = 'auto', imageColor = null, shapeStyle = 'minimal', triangleBudget = 500 } = {}) {
  const cleanPrompt = String(prompt || 'minimal robot character').slice(0, 700);
  const category = classifyPrompt(cleanPrompt, type);
  const p = paletteFor(cleanPrompt, imageColor);
  const group = new THREE.Group(); group.name = cleanPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 42) || 'forge3d_asset';
  group.userData = { prompt: cleanPrompt, category, shapeStyle, triangleBudget: Math.min(500, Math.max(100, Number(triangleBudget) || 500)), palette: p };
  if (category === 'character') makeHumanoid(group, p, cleanPrompt);
  else if (category === 'creature') makeQuadruped(group, p, cleanPrompt);
  else if (category === 'weapon') makeWeapon(group, p, cleanPrompt);
  else makeProp(group, p, cleanPrompt);

  // Shape style is intentionally lightweight: it adjusts bevel-ish color/detail emphasis
  // without adding subdivision-heavy geometry.
  if (shapeStyle === 'soft') group.traverse(o => { if (o.isMesh) { o.material.roughness = 0.95; o.castShadow = true; } });
  if (shapeStyle === 'faceted') group.traverse(o => { if (o.isMesh) o.material.flatShading = true; });

  const limit = Math.min(500, Math.max(100, Number(triangleBudget) || 500));
  enforceBudget(group, limit);
  group.updateMatrixWorld(true);
  const stats = getMeshStats(group);
  group.userData.stats = stats;
  return { group, category, palette: p, stats, name: group.name };
}

export function getMeshStats(root) {
  let triangles = 0, vertices = 0, parts = 0;
  root.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    parts++;
    const pos = o.geometry.getAttribute('position');
    if (pos) vertices += pos.count;
    const idx = o.geometry.index;
    const drawCount = o.geometry.drawRange.count === Infinity ? (idx ? idx.count : (pos ? pos.count : 0)) : o.geometry.drawRange.count;
    triangles += Math.floor(drawCount / 3);
  });
  return { triangles, vertices, parts };
}
