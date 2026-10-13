import * as THREE from 'three';

/*
 * Forge3D Model Grammar v2
 * ------------------------
 * The generator follows a real game-asset blockout order:
 * 1) recognizable silhouette and readable proportions,
 * 2) primary masses with a consistent bevel language,
 * 3) secondary armor / anatomy plates that sit slightly above the surface,
 * 4) a restrained set of tertiary accents and emissive details.
 *
 * Most hero forms use hard-edged polygonal prisms instead of piles of plain
 * cubes. Their large planar faces remain quad-like in appearance, while cut
 * corners give the silhouette a deliberate, premium hard-surface finish.
 * The triangle budget is a hard cap, not a target that may be exceeded.
 */

const COLOR_MAP = [
  [/\b(purple|violet|magenta)\b/i, '#8054B8'],
  [/\b(red|crimson|ruby)\b/i, '#B94F4F'],
  [/\b(blue|cyan|ice|teal)\b/i, '#4C9EA8'],
  [/\b(green|mint|emerald)\b/i, '#4D9971'],
  [/\b(yellow|gold|golden)\b/i, '#C7A047'],
  [/\b(orange|amber)\b/i, '#C9793F'],
  [/\b(pink|rose)\b/i, '#C779A5'],
  [/\b(black|dark|graphite|obsidian)\b/i, '#414A55'],
  [/\b(white|ivory|pearl)\b/i, '#C9D1D4']
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const isMatch = (prompt, re) => re.test(prompt);

function paletteFor(prompt, imageColor) {
  let base = imageColor || '#8C70C8';
  if (!imageColor) {
    for (const [pattern, color] of COLOR_MAP) {
      if (pattern.test(prompt)) { base = color; break; }
    }
  }
  const c = new THREE.Color(base);
  const hsl = {}; c.getHSL(hsl);
  if (hsl.s < 0.18) c.setHSL(0.58, 0.14, clamp(hsl.l, 0.3, 0.72));
  const bHsl = {}; c.getHSL(bHsl);
  const accent = new THREE.Color().setHSL((bHsl.h + 0.095) % 1, clamp(Math.max(bHsl.s, 0.42), 0.42, 0.76), clamp(bHsl.l + 0.13, 0.48, 0.72));
  // Explicit feature colors ("cyan eyes", "gold visor") override body color.
  // Keep the color adjacent to the feature phrase so "blue dragon with gold eyes"
  // doesn't incorrectly assign the body color to the eyes.
  let glow = '#66E8E2';
  const featurePhrase = (color) => new RegExp(
    `\\b(?:${color})\\b\\s+(?:(?:bright|neon|glowing|luminous)\\s+)?(?:eyes?|visor|glow|lights?|core)\\b|\\b(?:eyes?|visor|glow|lights?|core)\\b\\s+(?:(?:are|is|glow|colored|color|:)\\s+)?(?:(?:bright|neon|glowing|luminous)\\s+)?\\b(?:${color})\\b`,
    'i'
  ).test(prompt);
  if (featurePhrase('cyan|teal|blue|ice')) glow = '#66E8FF';
  else if (featurePhrase('yellow|gold|golden|amber')) glow = '#FFD56A';
  else if (featurePhrase('green|mint|emerald')) glow = '#A5F58C';
  else if (featurePhrase('purple|violet|magenta|pink')) glow = '#E08BFF';
  else if (featurePhrase('red|crimson|ruby')) glow = '#FF766E';
  else if (isMatch(prompt, /\\b(yellow|gold|golden|amber)\\b/i)) glow = '#FFD56A';
  else if (isMatch(prompt, /\\b(purple|violet|magenta)\\b/i)) glow = '#E08BFF';
  else if (isMatch(prompt, /\\b(red|crimson|ruby)\\b/i)) glow = '#FF766E';
  else if (isMatch(prompt, /\\b(green|mint|emerald)\\b/i)) glow = '#A5F58C';
  else if (isMatch(prompt, /\\b(blue|cyan|ice|teal)\\b/i)) glow = '#66E8FF';
  if (isMatch(prompt, /\b(gold|golden|royal|ornate)\b/i)) accent.set('#D8AE58');
  if (isMatch(prompt, /\b(stealth|obsidian|black|graphite)\b/i)) accent.set('#788895');
  return {
    base: `#${c.getHexString()}`,
    accent: `#${accent.getHexString()}`,
    accent2: isMatch(prompt, /\b(gold|golden|royal|ornate)\b/i) ? '#D8AE58' : '#D4DFE2',
    dark: '#27323B',
    shadow: '#171F28',
    light: '#C9D4D9',
    metal: '#667784',
    eye: glow,
    glow
  };
}

function material(color, role = 'base', shapeStyle = 'premium') {
  const soft = shapeStyle === 'soft';
  const metalness = role === 'metal' ? 0.48 : role === 'glow' ? 0.12 : role === 'dark' ? 0.2 : 0.08;
  return new THREE.MeshStandardMaterial({
    color,
    roughness: soft ? 0.94 : role === 'glow' ? 0.3 : role === 'metal' ? 0.42 : 0.72,
    metalness,
    flatShading: !soft,
    emissive: role === 'glow' ? color : '#000000',
    emissiveIntensity: role === 'glow' ? 0.42 : 0
  });
}

function addMesh(group, name, geometry, color, position, scale = [1, 1, 1], rotation = [0, 0, 0], role = 'base', style = 'premium') {
  const mesh = new THREE.Mesh(geometry, material(color, role, style));
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.role = role;
  group.add(mesh);
  return mesh;
}

function box(g, name, pos, size, color, style = 'premium', role = 'base', rotation = [0, 0, 0]) {
  return addMesh(g, name, new THREE.BoxGeometry(...size), color, pos, [1, 1, 1], rotation, role, style);
}

function ico(g, name, pos, radius, color, scale = [1, 1, 1], detail = 0, style = 'premium', role = 'base') {
  return addMesh(g, name, new THREE.IcosahedronGeometry(radius, detail), color, pos, scale, [0, 0, 0], role, style);
}

function cylinder(g, name, pos, rTop, rBottom, height, color, segments = 6, rotation = [0, 0, 0], style = 'premium', role = 'base') {
  return addMesh(g, name, new THREE.CylinderGeometry(rTop, rBottom, height, segments, 1, false), color, pos, [1, 1, 1], rotation, role, style);
}
function cone(g, name, pos, radius, height, color, segments = 5, rotation = [0, 0, 0], style = 'premium') {
  return cylinder(g, name, pos, 0, radius, height, color, segments, rotation, style, 'metal');
}

function polygonPrismGeometry(points, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1, curveSegments: 1 });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function plate(g, name, pos, size, color, style = 'premium', role = 'base', cut = 0.13, rotation = [0, 0, 0]) {
  // An octagonal face is still a broad readable plane, with clipped corners
  // instead of rounded toy-like edges. 28 triangles including its side walls.
  if (style === 'soft' || style === 'minimal') return box(g, name, pos, size, color, style, role, rotation);
  const [w, h, d] = size;
  const c = Math.min(w, h) * clamp(cut, 0.06, 0.24);
  const pts = [
    [-w / 2 + c, -h / 2], [w / 2 - c, -h / 2], [w / 2, -h / 2 + c],
    [w / 2, h / 2 - c], [w / 2 - c, h / 2], [-w / 2 + c, h / 2],
    [-w / 2, h / 2 - c], [-w / 2, -h / 2 + c]
  ];
  return addMesh(g, name, polygonPrismGeometry(pts, d), color, pos, [1, 1, 1], rotation, role, style);
}

function polyPlate(g, name, pos, points, depth, color, style = 'premium', role = 'base', rotation = [0, 0, 0]) {
  // Custom silhouettes stay custom in every material style; the style changes
  // shading and simple boxes, never silently destroys the designed profile.
  return addMesh(g, name, polygonPrismGeometry(points, depth), color, pos, [1, 1, 1], rotation, role, style);
}

function triangle(g, name, points, color, style = 'premium', role = 'base') {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  geo.computeVertexNormals();
  const mesh = addMesh(g, name, geo, color, [0, 0, 0], [1, 1, 1], [0, 0, 0], role, style);
  mesh.material.side = THREE.DoubleSide;
  return mesh;
}

function segment(g, name, start, end, width, depth, color, style = 'premium', role = 'base') {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const delta = b.clone().sub(a);
  const mesh = box(g, name, a.clone().add(b).multiplyScalar(0.5).toArray(), [width, delta.length(), depth], color, style, role);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  return mesh;
}

function makeHumanoid(g, p, prompt, style) {
  // Head/torso ratio and tapered massing are deliberately Roblox-readable.
  polyPlate(g, 'TorsoShell', [0, 2.52, 0], [
    [-0.47, 0.52], [0.47, 0.52], [0.62, 0.28], [0.45, -0.43], [0.30, -0.52],
    [-0.30, -0.52], [-0.45, -0.43], [-0.62, 0.28]
  ], 0.58, p.base, style);
  box(g, 'Pelvis', [0, 1.87, 0], [0.78, 0.34, 0.5], p.dark, style, 'dark');
  box(g, 'NeckCoupler', [0, 3.12, 0], [0.28, 0.19, 0.28], p.dark, style, 'dark');

  plate(g, 'HeadShell', [0, 3.58, 0], [0.82, 0.76, 0.68], p.light, style, 'metal', 0.16);
  box(g, 'HelmetCrown', [0, 3.91, 0.015], [0.84, 0.21, 0.7], p.base, style);
  box(g, 'FaceInset', [0, 3.58, -0.353], [0.59, 0.245, 0.045], p.dark, style, 'dark');
  box(g, 'VisorCore', [0, 3.59, -0.38], [0.43, 0.075, 0.025], p.glow, style, 'glow');
  if (isMatch(prompt, /robot|mech|cyber|sci.?fi|astronaut|android|helmet/i)) {
    box(g, 'BrowGuard', [0, 3.76, -0.365], [0.63, 0.095, 0.075], p.dark, style, 'dark');
    cone(g, 'Antenna', [0.23, 4.10, 0.02], 0.065, 0.22, p.accent2, 5, [0, 0, 0], style);
  }

  // Raised chest armor is kept on its own depth plane to avoid z-fighting.
  polyPlate(g, 'ChestArmor', [0, 2.59, -0.315], [
    [-0.32, 0.26], [0.32, 0.26], [0.40, 0.06], [0.26, -0.24], [-0.26, -0.24], [-0.40, 0.06]
  ], 0.065, p.dark, style, 'dark');
  plate(g, 'ChestCoreFrame', [0, 2.59, -0.355], [0.27, 0.29, 0.035], p.accent2, style, 'metal', 0.22);
  box(g, 'ChestCore', [0, 2.59, -0.377], [0.105, 0.16, 0.02], p.glow, style, 'glow');

  for (const s of [-1, 1]) {
    const side = s < 0 ? 'Left' : 'Right';
    plate(g, `${side}ShoulderArmor`, [s * 0.70, 2.82, 0], [0.45, 0.40, 0.56], p.base, style, 'base', 0.22, [0, 0, s * -0.08]);
    box(g, `${side}UpperArm`, [s * 0.77, 2.42, 0], [0.32, 0.45, 0.4], p.base, style);
    box(g, `${side}ForearmArmor`, [s * 0.79, 2.04, -0.015], [0.36, 0.37, 0.45], p.dark, style, 'dark', [0, 0, s * 0.035]);
    box(g, `${side}ForearmStripe`, [s * 0.79, 2.09, -0.247], [0.19, 0.045, 0.022], p.accent, style, 'metal');
    box(g, `${side}Hand`, [s * 0.79, 1.78, -0.02], [0.30, 0.22, 0.34], p.light, style, 'metal');
    box(g, `${side}Thigh`, [s * 0.31, 1.48, 0], [0.34, 0.49, 0.43], p.base, style);
    box(g, `${side}KneeJoint`, [s * 0.31, 1.18, 0], [0.24, 0.12, 0.29], p.dark, style, 'dark');
    box(g, `${side}ShinArmor`, [s * 0.31, 0.82, -0.015], [0.36, 0.48, 0.48], p.dark, style, 'dark');
    plate(g, `${side}Boot`, [s * 0.31, 0.39, -0.055], [0.44, 0.27, 0.63], p.accent, style, 'metal', 0.15);
    box(g, `${side}BootToe`, [s * 0.31, 0.34, -0.34], [0.27, 0.075, 0.055], p.dark, style, 'dark');
  }
  if (isMatch(prompt, /backpack|jetpack|heavy|soldier|explorer/i)) {
    plate(g, 'Backpack', [0, 2.62, 0.36], [0.55, 0.65, 0.28], p.dark, style, 'dark');
    box(g, 'PackLatch', [0, 2.61, 0.515], [0.18, 0.22, 0.025], p.accent2, style, 'metal');
  }
}

function makeDragon(g, p, prompt, style) {
  plate(g, 'DragonTorso', [0, 1.68, 0.12], [0.86, 0.62, 1.18], p.base, style, 'base', 0.19);
  box(g, 'ChestScute', [0, 1.66, -0.49], [0.54, 0.40, 0.06], p.light, style, 'metal');
  for (let i = 0; i < 2; i++) box(g, `ScuteSeam${i}`, [0, 1.72 - i * 0.12, -0.529], [0.34 - i * 0.035, 0.022, 0.012], p.accent2, style, 'metal');
  box(g, 'DragonNeck', [0, 1.99, -0.47], [0.47, 0.57, 0.52], p.base, style, 'base', [-0.18, 0, 0]);
  plate(g, 'DragonHead', [0, 2.37, -0.72], [0.65, 0.52, 0.55], p.base, style, 'base', 0.2);
  box(g, 'DragonMuzzle', [0, 2.19, -1.02], [0.50, 0.24, 0.28], p.dark, style, 'dark');
  box(g, 'JawPlate', [0, 2.06, -0.99], [0.32, 0.08, 0.25], p.accent2, style, 'metal');
  for (const s of [-1, 1]) {
    box(g, s < 0 ? 'LeftEye' : 'RightEye', [s * 0.20, 2.43, -1.014], [0.085, 0.074, 0.025], p.glow, style, 'glow');
    box(g, s < 0 ? 'LeftBrow' : 'RightBrow', [s * 0.2, 2.51, -0.98], [0.21, 0.07, 0.06], p.dark, style, 'dark', [0, 0, s * 0.18]);
    cone(g, s < 0 ? 'LeftHorn' : 'RightHorn', [s * 0.22, 2.73, -0.65], 0.10, 0.31, p.accent2, 4, [0, 0, s * -0.22], style);
  }

  // Webbed wings: one clear silhouette plus a contrasting angular inner panel.
  const wing = [[0.02, -0.17], [0.16, 0.43], [0.82, 0.91], [0.69, 0.44], [1.04, 0.12], [0.49, 0.19], [0.28, -0.24]];
  const inset = [[0.15, -0.03], [0.22, 0.36], [0.65, 0.65], [0.58, 0.32], [0.78, 0.17], [0.43, 0.13]];
  for (const s of [-1, 1]) {
    const mirror = arr => s < 0 ? [...arr].reverse().map(([x, y]) => [-x, y]) : arr;
    polyPlate(g, s < 0 ? 'LeftWing' : 'RightWing', [s * 0.43, 2.01, 0.15], mirror(wing), 0.105, p.dark, style, 'dark');
    polyPlate(g, s < 0 ? 'LeftWingMembrane' : 'RightWingMembrane', [s * 0.43, 2.01, 0.087], mirror(inset), 0.025, p.accent, style, 'metal');
    segment(g, s < 0 ? 'LeftWingRib' : 'RightWingRib', [s * 0.49, 2.00, 0.045], [s * 1.12, 2.79, 0.045], 0.045, 0.045, p.accent2, style, 'metal');
  }

  // Limbs use paired upper/lower masses and a clear ground contact plane.
  for (const s of [-1, 1]) for (const z of [-0.31, 0.35]) {
    const side = s < 0 ? 'L' : 'R'; const fore = z < 0 ? 'F' : 'B';
    box(g, `Dragon${side}${fore}UpperLeg`, [s * 0.48, 1.22, z], [0.27, 0.47, 0.31], p.base, style);
    box(g, `Dragon${side}${fore}Foot`, [s * 0.49, 0.91, z - 0.045], [0.31, 0.20, 0.37], p.dark, style, 'dark');
    if (z < 0) box(g, `Dragon${side}${fore}Claw`, [s * 0.49, 0.90, z - 0.20], [0.10, 0.09, 0.12], p.accent2, style, 'metal');
  }
  // Three visibly decreasing tail links make the silhouette read as a creature.
  box(g, 'TailRoot', [0, 1.54, 0.78], [0.42, 0.34, 0.49], p.base, style);
  box(g, 'TailMid', [0, 1.43, 1.16], [0.31, 0.25, 0.43], p.accent, style);
  polyPlate(g, 'TailBlade', [0, 1.37, 1.48], [[-0.14, 0.08], [0.14, 0.08], [0.18, 0], [0, -0.15], [-0.18, 0]], 0.18, p.dark, style, 'dark');
  for (let i = 0; i < 2; i++) cone(g, `BackSpine${i}`, [0, 2.02 - i * 0.045, -0.10 + i * 0.28], 0.075 - i * 0.008, 0.18, p.accent2, 4, [Math.PI / 2, 0, 0], style);
}

function makeHorse(g, p, prompt, style) {
  // Horse faces -Z; torso, neck, head and muzzle form one intentional profile.
  plate(g, 'HorseBarrel', [0, 1.57, 0.12], [0.94, 0.65, 1.40], p.base, style, 'base', 0.18);
  box(g, 'RumpPlate', [0, 1.64, 0.69], [0.89, 0.56, 0.38], p.accent, style);
  box(g, 'ChestMass', [0, 1.72, -0.46], [0.65, 0.68, 0.55], p.base, style);
  box(g, 'Neck', [0, 2.08, -0.61], [0.43, 0.93, 0.48], p.base, style, 'base', [-0.18, 0, 0]);
  plate(g, 'Head', [0, 2.59, -0.83], [0.48, 0.55, 0.48], p.light, style, 'metal', 0.20, [-0.09, 0, 0]);
  box(g, 'Muzzle', [0, 2.42, -1.11], [0.43, 0.24, 0.23], p.accent2, style, 'metal');
  for (const s of [-1, 1]) {
    cone(g, s < 0 ? 'LeftEar' : 'RightEar', [s * 0.16, 2.96, -0.79], 0.09, 0.30, p.dark, 4, [0, 0, s * 0.16], style);
    box(g, s < 0 ? 'LeftEye' : 'RightEye', [s * 0.245, 2.65, -1.035], [0.055, 0.065, 0.028], p.dark, style, 'dark');
    box(g, s < 0 ? 'LeftBridle' : 'RightBridle', [s * 0.21, 2.49, -1.045], [0.035, 0.28, 0.025], p.accent, style, 'metal');
  }
  plate(g, 'ManeCrest', [0, 2.47, -0.52], [0.25, 0.83, 0.32], p.accent, style, 'base', 0.16, [-0.23, 0, 0]);
  for (const z of [-0.35, 0.44]) for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R'; const fore = z < 0 ? 'F' : 'B';
    box(g, `Horse${side}${fore}UpperLeg`, [s * 0.32, 1.00, z], [0.24, 0.62, 0.25], p.base, style);
    box(g, `Horse${side}${fore}Joint`, [s * 0.32, 0.65, z - 0.015], [0.20, 0.11, 0.20], p.dark, style, 'dark');
    box(g, `Horse${side}${fore}Shin`, [s * 0.32, 0.43, z], [0.18, 0.37, 0.19], p.light, style, 'metal');
    box(g, `Horse${side}${fore}Hoof`, [s * 0.32, 0.20, z - 0.055], [0.29, 0.17, 0.30], p.dark, style, 'dark');
  }
  segment(g, 'TailUpper', [0, 1.56, 0.78], [0.04, 1.13, 1.14], 0.19, 0.19, p.accent, style);
  segment(g, 'TailTip', [0.04, 1.13, 1.14], [0.08, 0.94, 1.32], 0.14, 0.14, p.dark, style);
  if (/unicorn/i.test(prompt)) cone(g, 'UnicornHorn', [0, 2.85, -0.98], 0.085, 0.34, p.accent2, 5, [-0.25, 0, 0], style);
  if (/armou?r|knight|royal/i.test(prompt)) {
    plate(g, 'HorseBarding', [0, 1.63, -0.12], [0.75, 0.57, 0.09], p.dark, style, 'dark', 0.19);
    box(g, 'BardingEmblem', [0, 1.66, -0.177], [0.14, 0.19, 0.025], p.accent2, style, 'metal');
  }
}

function makeMarine(g, p, prompt, style) {
  const shark = isMatch(prompt, /shark/i), fish = isMatch(prompt, /fish/i);
  ico(g, 'MarineBody', [0, 1.62, 0.05], 0.82, p.base, [1.16, 0.84, 1.58], 1, style);
  ico(g, 'Belly', [0, 1.36, -0.03], 0.55, p.light, [1.02, 0.48, 1.34], 0, style, 'metal');
  plate(g, 'Snout', [0, 1.65, -1.10], [0.48, 0.25, 0.46], p.base, style, 'base', 0.18);
  for (const s of [-1, 1]) {
    box(g, s < 0 ? 'LeftEyeSocket' : 'RightEyeSocket', [s * 0.52, 1.91, -0.67], [0.14, 0.13, 0.05], p.dark, style, 'dark');
    box(g, s < 0 ? 'LeftEye' : 'RightEye', [s * 0.52, 1.92, -0.704], [0.065, 0.075, 0.02], p.glow, style, 'glow');
    polyPlate(g, s < 0 ? 'LeftPectoralFin' : 'RightPectoralFin', [s * 0.58, 1.41, -0.05], [[0, 0.16], [s * 0.64, -0.30], [s * 0.38, 0.30], [0.04 * s, 0.38]], 0.11, p.accent, style);
  }
  polyPlate(g, 'DorsalFin', [0, 2.24, 0.22], [[-0.12, -0.12], [0.02, 0.42], [0.22, 0.54], [0.18, -0.1]], 0.13, p.dark, style);
  polyPlate(g, 'TailFinLeft', [-0.18, 1.63, 1.27], [[0.13, 0.04], [-0.36, 0.40], [-0.20, -0.05]], 0.12, p.accent, style);
  polyPlate(g, 'TailFinRight', [0.18, 1.63, 1.27], [[-0.13, 0.04], [0.36, 0.40], [0.20, -0.05]], 0.12, p.accent, style);
  if (shark) {
    for (let i = 0; i < 4; i++) triangle(g, `Gill${i}`, [[-0.37 + i * 0.08, 1.63, -0.88], [-0.34 + i * 0.08, 1.46, -0.89], [-0.31 + i * 0.08, 1.63, -0.88]], p.light, style, 'metal');
  }
  if (fish && /tropical|clown|colorful/i.test(prompt)) {
    for (const z of [-0.40, 0.16, 0.62]) plate(g, `FishBand${z}`, [0, 1.65, z], [1.20, 1.30, 0.08], p.accent2, style, 'metal', 0.2, [0, 0, Math.PI / 2]);
  }
}

function makeOctopus(g, p, prompt, style) {
  ico(g, 'Mantle', [0, 2.12, 0.03], 0.73, p.base, [1.00, 1.10, 0.88], 1, style);
  plate(g, 'FaceMask', [0, 1.94, -0.58], [0.67, 0.37, 0.12], p.dark, style, 'dark', 0.22);
  for (const s of [-1, 1]) {
    box(g, s < 0 ? 'LeftEyeSocket' : 'RightEyeSocket', [s * 0.19, 2.04, -0.653], [0.16, 0.17, 0.04], p.accent2, style, 'metal');
    box(g, s < 0 ? 'LeftEye' : 'RightEye', [s * 0.19, 2.04, -0.681], [0.075, 0.095, 0.02], p.glow, style, 'glow');
  }
  // Six flared, two-link tentacles with clear spacing; the outer pair is widest.
  for (let i = 0; i < 6; i++) {
    const t = (i / 5) * 2 - 1;
    const x0 = t * 0.34, x1 = t * 0.78, x2 = t * (1.15 + (1 - Math.abs(t)) * 0.12);
    const y1 = 1.32 - Math.abs(t) * 0.09, y2 = 0.78 + Math.abs(t) * 0.08;
    const side = i < 3 ? 'L' : 'R';
    segment(g, `Tentacle${i + 1}Upper`, [x0, 1.64, 0.02], [x1, y1, -0.02], 0.23, 0.22, p.base, style);
    segment(g, `Tentacle${i + 1}Lower`, [x1, y1, -0.02], [x2, y2, -0.10], 0.17, 0.17, p.accent, style);
    box(g, `Tentacle${i + 1}Tip`, [x2, y2, -0.10], [0.13, 0.13, 0.14], p.light, style, 'metal');
  }
  if (/crown|king|royal/i.test(prompt)) {
    plate(g, 'CrownBand', [0, 2.70, 0], [0.56, 0.14, 0.49], p.accent2, style, 'metal');
    for (const x of [-0.20, 0, 0.20]) cone(g, `CrownPoint${x}`, [x, 2.83, 0], 0.06, 0.20, p.accent2, 4, [0, 0, x * -0.5], style);
  }
}

function makeQuadruped(g, p, prompt, style) {
  if (/horse|unicorn|pony/i.test(prompt)) return makeHorse(g, p, prompt, style);
  if (/whale|fish|shark|dolphin/i.test(prompt)) return makeMarine(g, p, prompt, style);
  if (/octopus|squid/i.test(prompt)) return makeOctopus(g, p, prompt, style);
  if (/dragon|wyvern/i.test(prompt)) return makeDragon(g, p, prompt, style);

  // Fallback creature grammar: torso mass, forward head, muzzle, matched limbs,
  // and an articulated-looking tail. Avoids the old unrelated-cube silhouette.
  plate(g, 'CreatureTorso', [0, 1.62, 0.12], [0.95, 0.66, 1.35], p.base, style, 'base', 0.18);
  plate(g, 'CreatureRuff', [0, 1.83, -0.45], [0.72, 0.60, 0.54], p.accent, style, 'base', 0.18);
  plate(g, 'CreatureHead', [0, 2.15, -0.75], [0.60, 0.50, 0.52], p.base, style, 'base', 0.18);
  plate(g, 'Muzzle', [0, 1.98, -1.04], [0.43, 0.22, 0.25], p.light, style, 'metal', 0.18);
  for (const s of [-1, 1]) {
    box(g, s < 0 ? 'LeftEye' : 'RightEye', [s * 0.22, 2.19, -1.02], [0.075, 0.075, 0.025], p.glow, style, 'glow');
    plate(g, s < 0 ? 'LeftEar' : 'RightEar', [s * 0.22, 2.48, -0.70], [0.17, 0.28, 0.15], p.dark, style, 'dark', 0.18, [0, 0, s * -0.20]);
    for (const z of [-0.31, 0.37]) {
      plate(g, `Leg${s}${z}`, [s * 0.39, 0.92, z], [0.27, 0.73, 0.28], p.base, style, 'base', 0.13);
      plate(g, `Foot${s}${z}`, [s * 0.40, 0.48, z - 0.06], [0.34, 0.18, 0.39], p.dark, style, 'dark', 0.13);
    }
  }
  segment(g, 'TailRoot', [0, 1.60, 0.77], [0.08, 1.40, 1.22], 0.24, 0.23, p.accent, style);
  segment(g, 'TailTip', [0.08, 1.40, 1.22], [0.16, 1.52, 1.52], 0.15, 0.15, p.base, style);
  if (/spike|armou?r|dinosaur/i.test(prompt)) for (let i = 0; i < 3; i++) cone(g, `BackSpike${i}`, [0, 2.02, 0.06 + i * 0.3], 0.09, 0.2, p.accent2, 4, [Math.PI / 2, 0, 0], style);
}

function makeWeapon(g, p, prompt, style) {
  const isAxe = isMatch(prompt, /axe|battleaxe|hatchet/i);
  const isHammer = isMatch(prompt, /hammer|mace/i);
  plate(g, 'Pommel', [0, 0.38, 0], [0.24, 0.20, 0.23], p.accent2, style, 'metal', 0.18);
  plate(g, 'Grip', [0, 0.96, 0], [0.15, 0.93, 0.16], p.dark, style, 'dark', 0.15);
  for (let y = 0.70; y <= 1.18; y += 0.16) box(g, `GripWrap${y.toFixed(2)}`, [0, y, -0.09], [0.16, 0.035, 0.025], p.accent, style, 'metal');
  plate(g, 'Guard', [0, 1.48, 0], [0.86, 0.15, 0.22], p.accent2, style, 'metal', 0.20);
  box(g, 'GuardGem', [0, 1.49, -0.125], [0.13, 0.10, 0.025], p.glow, style, 'glow');
  if (isHammer) {
    plate(g, 'HammerHead', [0, 2.02, 0], [0.82, 0.54, 0.46], p.base, style, 'base', 0.17);
    plate(g, 'HammerFaceL', [-0.43, 2.02, 0], [0.12, 0.40, 0.38], p.accent2, style, 'metal');
    plate(g, 'HammerFaceR', [0.43, 2.02, 0], [0.12, 0.40, 0.38], p.accent2, style, 'metal');
  } else if (isAxe) {
    polyPlate(g, 'AxeBlade', [0.28, 2.08, 0], [[-0.02, 0.34], [0.30, 0.48], [0.52, 0.17], [0.55, -0.22], [0.25, -0.38], [-0.02, -0.25]], 0.17, p.base, style);
    polyPlate(g, 'AxeEdge', [0.29, 2.08, -0.094], [[0.24, 0.36], [0.52, 0.17], [0.55, -0.22], [0.25, -0.38], [0.34, -0.02]], 0.025, p.light, style, 'metal');
    box(g, 'AxeEtch', [0.39, 2.08, -0.112], [0.045, 0.28, 0.015], p.glow, style, 'glow');
  } else {
    polyPlate(g, 'Blade', [0, 2.13, 0], [
      [-0.20, -0.22], [-0.24, 0.53], [-0.12, 1.03], [0, 1.36], [0.12, 1.03], [0.24, 0.53], [0.20, -0.22]
    ], 0.13, p.base, style);
    polyPlate(g, 'BladeFacet', [0, 2.15, -0.072], [[-0.10, 0.04], [-0.08, 0.87], [0, 1.18], [0.08, 0.87], [0.10, 0.04]], 0.018, p.light, style, 'metal');
    box(g, 'BladeRune', [0, 2.40, -0.085], [0.035, 0.28, 0.012], p.glow, style, 'glow');
  }
  if (/royal|legendary|ancient|ornate/i.test(prompt)) {
    plate(g, 'PommelCrest', [0, 0.39, -0.14], [0.14, 0.12, 0.025], p.glow, style, 'glow');
    for (const s of [-1, 1]) box(g, `GuardEngraving${s}`, [s * 0.25, 1.50, -0.13], [0.08, 0.035, 0.02], p.dark, style, 'dark');
  }
}

function makeCar(g, p, prompt, style) {
  plate(g, 'LowerChassis', [0, 0.58, 0], [1.52, 0.30, 2.42], p.dark, style, 'dark', 0.12);
  plate(g, 'MainBody', [0, 0.85, 0], [1.80, 0.46, 2.48], p.base, style, 'base', 0.14);
  plate(g, 'Hood', [0, 1.05, -0.78], [1.58, 0.20, 0.77], p.accent, style, 'base', 0.10);
  polyPlate(g, 'Cabin', [0, 1.36, 0.11], [[-0.62, -0.23], [0.62, -0.23], [0.45, 0.26], [0.30, 0.36], [-0.30, 0.36], [-0.45, 0.26]], 1.02, p.light, style, 'metal');
  plate(g, 'Windshield', [0, 1.39, -0.414], [0.88, 0.30, 0.045], p.dark, style, 'dark', 0.16);
  plate(g, 'WindshieldGlint', [0, 1.43, -0.442], [0.59, 0.055, 0.014], p.accent2, style, 'metal', 0.18);
  plate(g, 'RearWindow', [0, 1.40, 0.63], [0.82, 0.27, 0.045], p.dark, style, 'dark', 0.16);
  plate(g, 'FrontBumper', [0, 0.73, -1.28], [1.56, 0.15, 0.18], p.accent2, style, 'metal', 0.13);
  plate(g, 'RearBumper', [0, 0.73, 1.28], [1.56, 0.15, 0.18], p.accent2, style, 'metal', 0.13);
  for (const s of [-1, 1]) {
    box(g, s < 0 ? 'LeftHeadlight' : 'RightHeadlight', [s * 0.57, 0.98, -1.24], [0.26, 0.10, 0.035], p.glow, style, 'glow');
    box(g, s < 0 ? 'LeftTaillight' : 'RightTaillight', [s * 0.60, 0.97, 1.245], [0.22, 0.10, 0.035], '#F07866', style, 'glow');
    for (const z of [-0.78, 0.78]) {
      cylinder(g, `Wheel${s}${z}`, [s * 0.91, 0.53, z], 0.31, 0.31, 0.18, p.shadow, 6, [0, 0, Math.PI / 2], style, 'dark');
      cylinder(g, `Hub${s}${z}`, [s * 1.015, 0.53, z], 0.15, 0.15, 0.025, p.accent2, 4, [0, 0, Math.PI / 2], style, 'metal');
    }
    box(g, `SideStripe${s}`, [s * 0.91, 0.87, 0.0], [0.035, 0.06, 0.62], p.accent2, style, 'metal');
  }
  if (/truck|van/i.test(prompt)) {
    plate(g, 'CargoBed', [0, 1.20, 0.70], [1.38, 0.40, 0.78], p.base, style, 'base');
    box(g, 'CargoInset', [0, 1.42, 0.70], [0.98, 0.035, 0.48], p.dark, style, 'dark');
  }
}

function makeProp(g, p, prompt, style) {
  if (/car|kart|truck|van|vehicle/i.test(prompt)) return makeCar(g, p, prompt, style);
  if (/tree|pine|fir|plant|bush/i.test(prompt)) {
    cylinder(g, 'Trunk', [0, 0.72, 0], 0.14, 0.20, 1.42, p.dark, 5, [0, 0, 0], style, 'dark');
    if (/pine|fir/i.test(prompt)) {
      cone(g, 'CanopyLower', [0, 1.58, 0], 0.92, 1.22, p.base, 5, [0, 0, 0], style);
      cone(g, 'CanopyMiddle', [0, 2.15, 0], 0.70, 1.13, p.accent, 5, [0, 0, 0], style);
      cone(g, 'CanopyTop', [0, 2.68, 0], 0.47, 0.94, p.base, 5, [0, 0, 0], style);
    } else {
      ico(g, 'CanopyMain', [0, 1.93, 0], 0.80, p.base, [1, 1, 1], 1, style);
      ico(g, 'CanopySide', [0.36, 2.20, 0.04], 0.48, p.accent, [1, 1, 1], 0, style);
      ico(g, 'CanopyTop', [-0.20, 2.42, -0.02], 0.42, p.base, [1, 1, 1], 0, style);
    }
  } else if (/mug|cup|tankard|pot/i.test(prompt)) {
    cylinder(g, 'CupBody', [0, 0.84, 0], 0.49, 0.38, 1.12, p.base, 8, [0, 0, 0], style);
    cylinder(g, 'CupInterior', [0, 1.39, 0], 0.36, 0.36, 0.025, p.dark, 8, [0, 0, 0], style, 'dark');
    cylinder(g, 'CupRim', [0, 1.42, 0], 0.51, 0.51, 0.085, p.accent2, 8, [0, 0, 0], style, 'metal');
    const torus = new THREE.TorusGeometry(0.31, 0.075, 4, 8);
    addMesh(g, 'CupHandle', torus, p.dark, [0.51, 0.90, 0], [1, 1.08, 0.55], [Math.PI / 2, 0, 0], 'dark', style);
    plate(g, 'CupBadge', [0, 0.92, -0.397], [0.34, 0.30, 0.025], p.accent, style, 'metal', 0.22);
    box(g, 'CupBadgeMark', [0, 0.92, -0.414], [0.075, 0.15, 0.014], p.glow, style, 'glow');
  } else if (/chair|seat|throne/i.test(prompt)) {
    plate(g, 'SeatCushion', [0, 1.03, 0.02], [1.32, 0.20, 1.10], p.base, style, 'base', 0.14);
    plate(g, 'SeatInset', [0, 1.145, -0.01], [0.96, 0.035, 0.76], p.accent, style, 'metal', 0.14);
    plate(g, 'BackRest', [0, 1.78, 0.49], [1.30, 1.26, 0.20], p.base, style, 'base', 0.15, [0.08, 0, 0]);
    plate(g, 'BackPanel', [0, 1.82, 0.375], [0.82, 0.78, 0.045], p.dark, style, 'dark', 0.16);
    plate(g, 'BackEmblem', [0, 1.85, 0.345], [0.25, 0.32, 0.035], p.accent2, style, 'metal');
    for (const x of [-0.53, 0.53]) for (const z of [-0.34, 0.42]) plate(g, `ChairLeg${x}${z}`, [x, 0.52, z], [0.16, 0.88, 0.16], p.dark, style, 'dark', 0.10);
    if (/throne|royal/i.test(prompt)) {
      for (const x of [-0.56, 0.56]) cone(g, `ThroneFinial${x}`, [x, 2.51, 0.48], 0.09, 0.30, p.accent2, 4, [0, 0, 0], style);
    }
  } else if (/flag|banner|sign/i.test(prompt)) {
    cylinder(g, 'FlagPole', [0, 1.52, 0], 0.045, 0.055, 3.05, p.dark, 6, [0, 0, 0], style, 'dark');
    plate(g, 'FlagField', [0.43, 2.52, 0], [0.92, 0.66, 0.07], p.base, style, 'base', 0.06);
    box(g, 'FlagStripe', [0.43, 2.52, -0.043], [0.83, 0.13, 0.025], p.accent2, style, 'metal');
    plate(g, 'FlagEmblem', [0.43, 2.52, -0.06], [0.20, 0.22, 0.02], p.accent, style, 'metal');
    plate(g, 'PoleFoot', [0, 0.10, 0], [0.36, 0.20, 0.36], p.dark, style, 'dark');
  } else if (/crate|box|chest|supply|loot/i.test(prompt)) {
    plate(g, 'CrateBody', [0, 0.86, 0], [1.25, 1.12, 1.05], p.base, style, 'base', 0.12);
    plate(g, 'CrateLid', [0, 1.47, 0], [1.34, 0.18, 1.12], p.dark, style, 'dark', 0.10);
    plate(g, 'FrontInset', [0, 0.89, -0.535], [0.79, 0.56, 0.035], p.dark, style, 'dark', 0.13);
    plate(g, 'LockPlate', [0, 0.91, -0.563], [0.20, 0.29, 0.035], p.accent2, style, 'metal');
    box(g, 'LockGlow', [0, 0.91, -0.586], [0.06, 0.11, 0.016], p.glow, style, 'glow');
    for (const s of [-1, 1]) {
      box(g, `CornerBrace${s}`, [s * 0.52, 0.87, -0.546], [0.06, 0.89, 0.035], p.accent2, style, 'metal');
      box(g, `LidRivet${s}`, [s * 0.50, 1.49, -0.57], [0.06, 0.06, 0.025], p.light, style, 'metal');
    }
  } else if (/rock|crystal|ore|gem/i.test(prompt)) {
    ico(g, 'RockCore', [0, 0.84, 0], 0.78, p.base, [1.0, 0.90, 0.88], 0, style);
    polyPlate(g, 'CrystalFacetA', [0, 1.18, -0.25], [[-0.30, -0.10], [-0.18, 0.42], [0.02, 0.66], [0.26, 0.32], [0.30, -0.10]], 0.18, p.accent, style, 'metal');
    if (/crystal|gem/i.test(prompt)) {
      polyPlate(g, 'CrystalPoint', [0, 1.72, -0.25], [[-0.16, -0.04], [0, 0.43], [0.16, -0.04]], 0.16, p.glow, style, 'glow');
      for (const s of [-1, 1]) polyPlate(g, `SideShard${s}`, [s * 0.33, 1.21, -0.08], [[-0.12, -0.12], [0, 0.25], [0.13, -0.06]], 0.12, p.accent2, style, 'metal');
    }
  } else {
    // Default crate-like game prop rather than the old featureless cube.
    plate(g, 'MainBody', [0, 0.95, 0], [1.36, 1.12, 1.05], p.base, style, 'base', 0.13);
    plate(g, 'TopCap', [0, 1.55, 0], [1.43, 0.16, 1.12], p.dark, style, 'dark', 0.11);
    plate(g, 'FrontPanel', [0, 1.00, -0.54], [0.80, 0.47, 0.04], p.dark, style, 'dark', 0.16);
    plate(g, 'PanelInset', [0, 1.00, -0.57], [0.48, 0.21, 0.025], p.accent, style, 'metal', 0.16);
    box(g, 'PanelStatus', [0, 1.00, -0.586], [0.13, 0.075, 0.02], p.glow, style, 'glow');
    for (const x of [-0.48, 0.48]) plate(g, `Foot${x}`, [x, 0.30, 0.31], [0.22, 0.22, 0.25], p.dark, style, 'dark');
  }
}

export function classifyPrompt(prompt, requested = 'auto') {
  if (requested !== 'auto') return requested;
  if (/sword|weapon|axe|dagger|hammer|staff|bow|blade|mace/i.test(prompt)) return 'weapon';
  if (/horse|dragon|dinosaur|whale|fish|shark|dolphin|octopus|squid|creature|animal|monster|unicorn|pony|wyvern|wolf|fox|bear|cat|dog|pet/i.test(prompt)) return 'creature';
  if (/robot|avatar|person|character|humanoid|astronaut|knight|ninja|warrior|soldier|android|mech/i.test(prompt)) return 'character';
  return 'prop';
}

function trianglesInMesh(mesh) {
  const geom = mesh.geometry;
  const count = geom.drawRange.count === Infinity ? (geom.index ? geom.index.count : (geom.getAttribute('position')?.count || 0)) : geom.drawRange.count;
  return Math.floor(count / 3);
}

const DETAIL_PRIORITY = [
  /Rune|Etch|Vent|Stripe|Seam|Rivet|BadgeMark|Glint|Emblem|Gill/,
  /EyeSocket|Eye$|Core$|Membrane|Rib|Claw|Toe|BootToe|ShinStripe|ForearmStripe/,
  /Inset|Facet|Brow|Bumper|Finial|Bridle|Barding|ChestLowerLine|ShoulderInset/,
  /Crest|Horn|Spine|Antenna|Ear|Handle|Hub|Joint|Tip|Hoof|Foot|Hand/,
  /Shoulder|UpperArm|Forearm|Thigh|Shin|UpperLeg|Lower|WingFold/,
  /ChestArmor|ChestScute|HeadShell|Head$|BladeFacet|Panel|HelmetCrown|Boot$/
];

function matchingMirrorName(name) {
  let match = name.match(/^(Left|Right)(.+)$/);
  if (match) return `${match[1] === 'Left' ? 'Right' : 'Left'}${match[2]}`;
  match = name.match(/^(Dragon)(L|R)(F|B)(.+)$/);
  if (match) return `${match[1]}${match[2] === 'L' ? 'R' : 'L'}${match[3]}${match[4]}`;
  match = name.match(/^(Horse)(L|R)(F|B)(.+)$/);
  if (match) return `${match[1]}${match[2] === 'L' ? 'R' : 'L'}${match[3]}${match[4]}`;
  return null;
}

function enforceBudget(root, budget) {
  let stats = getMeshStats(root);
  for (const pattern of DETAIL_PRIORITY) {
    if (stats.triangles <= budget) break;
    const candidates = [];
    root.traverse(o => { if (o.isMesh && pattern.test(o.name)) candidates.push(o); });
    for (const mesh of candidates) {
      if (stats.triangles <= budget) break;
      if (!mesh.parent) continue;
      // If a left/right detail must be sacrificed, remove its mirror too. An
      // asymmetric leftover stripe or missing eye reads as a broken model.
      const pairName = matchingMirrorName(mesh.name);
      let counterpart = null;
      if (pairName) root.traverse(o => { if (!counterpart && o.isMesh && o.name === pairName) counterpart = o; });
      const remove = [mesh, counterpart].filter((o, i, a) => o?.parent && a.indexOf(o) === i);
      for (const item of remove) {
        item.parent.remove(item);
        stats.triangles -= trianglesInMesh(item);
        stats.vertices -= item.geometry.getAttribute('position')?.count || 0;
        stats.parts--;
      }
    }
  }
  if (stats.triangles > budget) {
    const protectedNames = /Torso|Body|Barrel|Mantle|MainBody|Head$|HeadShell|Blade$|DragonTorso|CreatureTorso|CupBody|CrateBody/;
    const candidates = [];
    root.traverse(o => { if (o.isMesh && !protectedNames.test(o.name)) candidates.push(o); });
    candidates.sort((a, b) => trianglesInMesh(b) - trianglesInMesh(a));
    for (const mesh of candidates) {
      if (stats.triangles <= budget) break;
      if (!mesh.parent) continue;
      const pairName = matchingMirrorName(mesh.name);
      let counterpart = null;
      if (pairName) root.traverse(o => { if (!counterpart && o.isMesh && o.name === pairName) counterpart = o; });
      const remove = [mesh, counterpart].filter((o, i, a) => o?.parent && a.indexOf(o) === i);
      for (const item of remove) {
        item.parent.remove(item);
        stats.triangles -= trianglesInMesh(item);
        stats.vertices -= item.geometry.getAttribute('position')?.count || 0;
        stats.parts--;
      }
    }
  }
  return getMeshStats(root);
}

function applyPromptScale(group, prompt) {
  let x = 1, y = 1, z = 1;
  if (/\b(tiny|mini|miniature|small|pocket)\b/i.test(prompt)) { x *= 0.88; y *= 0.86; z *= 0.88; }
  if (/\b(giant|huge|massive|boss)\b/i.test(prompt)) { x *= 1.18; y *= 1.16; z *= 1.18; }
  if (/\b(tall|slender|slim|sleek)\b/i.test(prompt)) { x *= 0.91; y *= 1.12; z *= 0.94; }
  if (/\b(bulky|heavy|chunky|tank)\b/i.test(prompt)) { x *= 1.12; y *= 0.98; z *= 1.12; }
  group.scale.set(x, y, z);
  group.userData.scaleProfile = { x, y, z };
}

export function createModel({ prompt = 'minimal robot character', type = 'auto', imageColor = null, shapeStyle = 'premium', triangleBudget = 500 } = {}) {
  const cleanPrompt = String(prompt || 'minimal robot character').slice(0, 700);
  const category = classifyPrompt(cleanPrompt, type);
  const p = paletteFor(cleanPrompt, imageColor);
  const group = new THREE.Group();
  group.name = cleanPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 42) || 'forge3d_asset';
  const safeStyle = ['premium', 'minimal', 'faceted', 'soft'].includes(shapeStyle) ? shapeStyle : 'premium';
  const limit = clamp(Number(triangleBudget) || 500, 100, 500);
  group.userData = {
    prompt: cleanPrompt, category, shapeStyle: safeStyle, triangleBudget: limit, palette: p,
    designRules: ['silhouette-first', 'primary-secondary-tertiary detail hierarchy', 'hard planar faces', 'layered surfaces do not share depth', 'grounded contact points', 'restrained accent palette']
  };
  if (category === 'character') makeHumanoid(group, p, cleanPrompt, safeStyle);
  else if (category === 'creature') makeQuadruped(group, p, cleanPrompt, safeStyle);
  else if (category === 'weapon') makeWeapon(group, p, cleanPrompt, safeStyle);
  else makeProp(group, p, cleanPrompt, safeStyle);

  if (safeStyle === 'faceted') group.traverse(o => { if (o.isMesh) o.material.flatShading = true; });
  if (safeStyle === 'soft') group.traverse(o => { if (o.isMesh) o.material.roughness = 0.95; });
  applyPromptScale(group, cleanPrompt);
  const stats = enforceBudget(group, limit);
  group.updateMatrixWorld(true);
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
