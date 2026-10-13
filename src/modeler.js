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
  else if (isMatch(prompt, /\b(yellow|gold|golden|amber)\b/i)) glow = '#FFD56A';
  else if (isMatch(prompt, /\b(purple|violet|magenta)\b/i)) glow = '#E08BFF';
  else if (isMatch(prompt, /\b(red|crimson|ruby)\b/i)) glow = '#FF766E';
  else if (isMatch(prompt, /\b(green|mint|emerald)\b/i)) glow = '#A5F58C';
  else if (isMatch(prompt, /\b(blue|cyan|ice|teal)\b/i)) glow = '#66E8FF';
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
  if (/dinosaur|trex|t-rex|tyrannosaurus|triceratops|stegosaurus|raptor/i.test(prompt)) return makeDinosaur(g, p, prompt, style);
  if (/cat|kitten|tiger|lion|lynx|wolf|fox|dog|puppy|canine/i.test(prompt)) return makeFeline(g, p, prompt, style);
  if (/bird|owl|eagle|hawk|penguin|parrot|raven|duck|chicken/i.test(prompt)) return makeBird(g, p, prompt, style);
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

function makeDinosaur(g, p, prompt, style) {
  const horned = /triceratops|horned/i.test(prompt);
  const spined = /spike|spiny|stegosaurus|armou?r|dragon-like/i.test(prompt);
  plate(g, 'DinoTorso', [0, 1.55, 0.08], [0.98, 0.72, 1.40], p.base, style, 'base', 0.19);
  plate(g, 'DinoChest', [0, 1.57, -0.53], [0.64, 0.53, 0.20], p.accent, style, 'base', 0.17);
  plate(g, 'DinoHead', [0, 1.96, -0.83], [0.70, 0.52, 0.67], p.base, style, 'base', 0.20);
  plate(g, 'DinoJaw', [0, 1.72, -1.07], [0.59, 0.20, 0.43], p.dark, style, 'dark', 0.16);
  for (const s of [-1, 1]) {
    box(g, s < 0 ? 'LeftEye' : 'RightEye', [s * 0.28, 2.03, -1.174], [0.085, 0.075, 0.025], p.glow, style, 'glow');
    plate(g, s < 0 ? 'LeftBrow' : 'RightBrow', [s * 0.28, 2.10, -1.15], [0.19, 0.07, 0.045], p.dark, style, 'dark', 0.2, [0, 0, s * 0.15]);
    if (horned) cone(g, s < 0 ? 'LeftHorn' : 'RightHorn', [s * 0.30, 2.29, -0.82], 0.09, 0.25, p.accent2, 4, [0, 0, s * -0.25], style);
  }
  for (const z of [-0.36, 0.42]) for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R', fore = z < 0 ? 'F' : 'B';
    plate(g, `Dino${side}${fore}Leg`, [s * 0.43, 1.01, z], [0.32, 0.62, 0.34], p.base, style, 'base', 0.15);
    plate(g, `Dino${side}${fore}Foot`, [s * 0.45, 0.65, z - 0.08], [0.39, 0.17, 0.40], p.dark, style, 'dark', 0.14);
    if (z < 0) for (let c = -1; c <= 1; c++) cone(g, `Dino${side}Claw${c}`, [s * 0.45 + c * 0.09, 0.61, z - 0.29], 0.035, 0.10, p.light, 4, [Math.PI / 2, 0, 0], style);
  }
  for (let i = 0; i < 4; i++) {
    const z = 0.62 + i * 0.30, scale = 1 - i * 0.17;
    plate(g, `TailLink${i}`, [0, 1.48 - i * 0.10, z], [0.40 * scale, 0.36 * scale, 0.45 * scale], i % 2 ? p.accent : p.base, style, 'base', 0.16);
  }
  if (spined) for (let i = 0; i < 5; i++) cone(g, `BackSpike${i}`, [0, 2.02, -0.33 + i * 0.30], 0.095 - i * 0.008, 0.24 - i * 0.015, p.accent2, 4, [Math.PI / 2, 0, 0], style);
  if (/stegosaurus/i.test(prompt)) for (let i = 0; i < 5; i++) polyPlate(g, `DorsalPlate${i}`, [0, 2.00, -0.28 + i * 0.28], [[-0.01, -0.10], [0.0, 0.22], [0.17, 0.38], [0.25, 0.08], [0.13, -0.12]], 0.12, p.accent2, style, 'metal');
}

function makeFeline(g, p, prompt, style) {
  const isCat = /cat|kitten|tiger|lion|lynx/i.test(prompt);
  const isWolf = /wolf|fox|dog|puppy|canine/i.test(prompt);
  const isLion = /lion/i.test(prompt);
  plate(g, 'AnimalBody', [0, 1.28, 0.14], [0.83, 0.58, 1.30], p.base, style, 'base', 0.20);
  if (isLion) plate(g, 'ManeRuff', [0, 1.70, -0.40], [1.03, 0.88, 0.65], p.accent2, style, 'metal', 0.22);
  plate(g, 'AnimalNeck', [0, 1.55, -0.43], [0.43, 0.48, 0.47], p.base, style, 'base', 0.18);
  plate(g, 'AnimalHead', [0, 1.90, -0.67], [0.61, 0.49, 0.58], p.base, style, 'base', 0.22);
  plate(g, 'AnimalMuzzle', [0, 1.73, -0.98], [isWolf ? 0.40 : 0.31, 0.20, 0.31], p.light, style, 'metal', 0.18);
  box(g, 'Nose', [0, 1.80, -1.145], [0.085, 0.065, 0.035], p.dark, style, 'dark');
  for (const s of [-1, 1]) {
    box(g, s < 0 ? 'LeftEye' : 'RightEye', [s * 0.22, 1.96, -0.966], [0.075, 0.08, 0.025], p.glow, style, 'glow');
    polyPlate(g, s < 0 ? 'LeftEar' : 'RightEar', [s * 0.22, 2.23, -0.61], [[-0.12, -0.07], [-0.075, 0.20], [0.08, 0.24], [0.13, -0.06]], 0.13, p.dark, style, 'dark', [0, 0, s * -0.10]);
  }
  for (const z of [-0.36, 0.43]) for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R', fore = z < 0 ? 'F' : 'B';
    plate(g, `Animal${side}${fore}Leg`, [s * 0.30, 0.81, z], [0.23, 0.70, 0.25], p.base, style, 'base', 0.11);
    plate(g, `Animal${side}${fore}Paw`, [s * 0.31, 0.43, z - 0.07], [0.31, 0.18, 0.34], p.accent, style, 'base', 0.12);
  }
  segment(g, 'TailMain', [0, 1.42, 0.70], [isCat ? 0.04 : 0.20, 1.60, 1.10], 0.17, 0.17, p.base, style);
  segment(g, 'TailTip', [isCat ? 0.04 : 0.20, 1.60, 1.10], [isCat ? 0.05 : 0.34, isCat ? 1.83 : 1.47, 1.37], 0.12, 0.12, p.accent, style);
  if (isWolf) for (let i = 0; i < 3; i++) plate(g, `CheekTuft${i}`, [0, 1.77 - i * 0.08, -0.91], [0.36 - i * 0.04, 0.045, 0.03], p.light, style, 'metal');
  if (isCat && /whisker/i.test(prompt)) for (const s of [-1, 1]) for (let i = 0; i < 2; i++) segment(g, `Whisker${s}${i}`, [s * 0.18, 1.73 - i * 0.04, -1.12], [s * 0.44, 1.76 - i * 0.06, -1.10], 0.012, 0.012, p.light, style, 'metal');
}

function makeBird(g, p, prompt, style) {
  const penguin = /penguin/i.test(prompt), owl = /owl/i.test(prompt), eagle = /eagle|hawk/i.test(prompt);
  ico(g, 'BirdBody', [0, 1.31, 0.02], 0.67, p.base, [0.91, 1.15, 0.82], 0, style);
  plate(g, 'BreastPatch', [0, 1.30, -0.52], [0.59, 0.74, 0.08], p.light, style, 'metal', 0.22);
  ico(g, 'BirdHead', [0, 2.03, -0.16], 0.40, p.base, [1.0, 0.93, 0.90], 0, style);
  const beakColor = p.accent2;
  polyPlate(g, 'Beak', [0, 1.97, -0.57], [[-0.13, 0.07], [0.13, 0.07], [0, -0.23]], 0.15, beakColor, style, 'metal');
  for (const s of [-1, 1]) {
    ico(g, s < 0 ? 'LeftEyeSocket' : 'RightEyeSocket', [s * 0.25, 2.07, -0.44], 0.105, p.dark, [1, 1, 0.40], 0, style, 'dark');
    ico(g, s < 0 ? 'LeftEye' : 'RightEye', [s * 0.25, 2.07, -0.485], 0.048, p.glow, [1, 1, 0.45], 0, style, 'glow');
    polyPlate(g, s < 0 ? 'LeftWing' : 'RightWing', [s * 0.48, 1.42, -0.03], [[-s * 0.05, 0.30], [s * 0.25, 0.16], [s * 0.44, -0.22], [s * 0.16, -0.34], [-s * 0.04, -0.05]], 0.12, p.accent, style, 'base');
    plate(g, s < 0 ? 'LeftFoot' : 'RightFoot', [s * 0.20, 0.42, -0.04], [0.25, 0.16, 0.35], p.accent2, style, 'metal', 0.10);
  }
  if (!penguin) for (let i = 0; i < 3; i++) polyPlate(g, `TailFeather${i}`, [(i - 1) * 0.15, 1.17, 0.59], [[-0.08, -0.12], [0, 0.18], [0.10, 0.32], [0.16, -0.12]], 0.07, i % 2 ? p.accent : p.base, style, 'base');
  if (owl) for (const s of [-1, 1]) plate(g, s < 0 ? 'LeftBrow' : 'RightBrow', [s * 0.25, 2.16, -0.47], [0.27, 0.06, 0.035], p.accent2, style, 'metal', 0.18, [0, 0, s * 0.2]);
  if (penguin) plate(g, 'PenguinBelly', [0, 1.12, -0.48], [0.50, 0.62, 0.07], '#E8ECE8', style, 'metal', 0.20);
  if (eagle) for (const s of [-1, 1]) polyPlate(g, s < 0 ? 'LeftWingTip' : 'RightWingTip', [s * 0.80, 1.30, 0], [[0, 0.1], [s * 0.23, -0.03], [s * 0.13, -0.25]], 0.1, p.dark, style, 'dark');
}

function makeSpacecraft(g, p, prompt, style) {
  const rocket = /rocket|missile|launch/i.test(prompt), ufo = /ufo|saucer|flying disc/i.test(prompt);
  if (ufo) {
    cylinder(g, 'SaucerHull', [0, 1.25, 0], 0.66, 1.08, 0.32, p.base, 8, [0, 0, 0], style);
    cylinder(g, 'LowerHull', [0, 1.06, 0], 0.36, 0.61, 0.22, p.dark, 8, [0, 0, 0], style, 'dark');
    ico(g, 'Dome', [0, 1.48, 0], 0.53, p.light, [1, 0.58, 1], 1, style, 'metal');
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; box(g, `SaucerLight${i}`, [Math.cos(a) * 0.72, 1.19, Math.sin(a) * 0.72], [0.12, 0.06, 0.07], p.glow, style, 'glow', [0, -a, 0]); }
    return;
  }
  if (rocket) {
    cylinder(g, 'RocketBody', [0, 1.52, 0], 0.33, 0.40, 2.08, p.base, 6, [0, 0, 0], style);
    cone(g, 'NoseCone', [0, 2.75, 0], 0.34, 0.54, p.accent, 6, [Math.PI, 0, 0], style);
    for (const s of [-1, 1]) polyPlate(g, s < 0 ? 'LeftFin' : 'RightFin', [s * 0.32, 0.80, 0], [[0, 0.22], [s * 0.35, -0.08], [s * 0.30, -0.34], [0, -0.20]], 0.13, p.dark, style, 'dark');
    cylinder(g, 'EngineBell', [0, 0.35, 0], 0.23, 0.32, 0.29, p.dark, 6, [0, 0, 0], style, 'dark');
    cylinder(g, 'RocketGlow', [0, 0.16, 0], 0.16, 0.12, 0.13, p.glow, 6, [0, 0, 0], style, 'glow');
    box(g, 'RocketWindow', [0.18, 1.75, -0.33], [0.11, 0.14, 0.02], p.glow, style, 'glow');
    return;
  }
  plate(g, 'ShipKeel', [0, 0.86, 0], [0.72, 0.32, 2.38], p.dark, style, 'dark', 0.15);
  polyPlate(g, 'ShipHull', [0, 1.08, -0.04], [[-0.30, -0.30], [0.30, -0.30], [0.49, 0.12], [0.25, 0.76], [0, 1.05], [-0.25, 0.76], [-0.49, 0.12]], 1.38, p.base, style, 'base');
  plate(g, 'CockpitFrame', [0, 1.63, -0.28], [0.46, 0.39, 0.47], p.dark, style, 'dark', 0.18);
  plate(g, 'CockpitGlass', [0, 1.66, -0.535], [0.31, 0.22, 0.035], p.glow, style, 'glow', 0.16);
  for (const s of [-1, 1]) {
    polyPlate(g, s < 0 ? 'LeftWing' : 'RightWing', [s * 0.40, 0.97, 0.20], [[-s * 0.02, 0.35], [s * 0.72, 0.05], [s * 1.08, -0.28], [s * 0.18, -0.20]], 0.10, p.accent, style);
    cylinder(g, s < 0 ? 'LeftEngine' : 'RightEngine', [s * 0.39, 0.89, 0.75], 0.15, 0.20, 0.42, p.dark, 6, [Math.PI / 2, 0, 0], style, 'dark');
    cylinder(g, s < 0 ? 'LeftThruster' : 'RightThruster', [s * 0.39, 0.89, 0.99], 0.105, 0.12, 0.09, p.glow, 6, [Math.PI / 2, 0, 0], style, 'glow');
    plate(g, s < 0 ? 'LeftWingPanel' : 'RightWingPanel', [s * 0.78, 1.00, 0.15], [0.32, 0.035, 0.18], p.accent2, style, 'metal', 0.12);
  }
  if (/battle|armou?r|fighter/i.test(prompt)) for (const s of [-1, 1]) polyPlate(g, s < 0 ? 'LeftFin' : 'RightFin', [s * 0.20, 1.31, 0.83], [[0, -0.05], [s * 0.20, 0.28], [s * 0.24, -0.08]], 0.10, p.dark, style, 'dark');
}

function makeAircraft(g, p, prompt, style) {
  if (/helicopter|heli/i.test(prompt)) {
    plate(g, 'HeliCabin', [0, 1.23, -0.15], [0.74, 0.62, 1.06], p.base, style, 'base', 0.22);
    plate(g, 'HeliNose', [0, 1.12, -0.73], [0.55, 0.37, 0.42], p.accent, style, 'base', 0.21);
    plate(g, 'FrontGlass', [0, 1.31, -0.96], [0.38, 0.23, 0.035], p.glow, style, 'glow');
    segment(g, 'TailBoom', [0, 1.28, 0.35], [0, 1.45, 1.55], 0.16, 0.16, p.base, style);
    polyPlate(g, 'TailRotor', [0.0, 1.47, 1.55], [[-0.05, -0.30], [0.05, -0.30], [0.05, 0.30], [-0.05, 0.30]], 0.05, p.accent2, style, 'metal');
    cylinder(g, 'RotorMast', [0, 1.69, -0.1], 0.06, 0.06, 0.37, p.dark, 5, [0, 0, 0], style, 'dark');
    box(g, 'MainRotorBladeA', [0, 1.89, -0.1], [2.48, 0.055, 0.12], p.dark, style, 'dark');
    box(g, 'MainRotorBladeB', [0, 1.91, -0.1], [0.12, 0.055, 2.25], p.dark, style, 'dark');
    for (const s of [-1, 1]) box(g, s < 0 ? 'LeftSkid' : 'RightSkid', [s * 0.38, 0.75, -0.03], [0.09, 0.08, 1.18], p.dark, style, 'dark');
    return;
  }
  const jet = /jet|fighter|military/i.test(prompt);
  plate(g, 'Fuselage', [0, 1.05, 0], [0.46, 0.44, 2.90], p.base, style, 'base', 0.15);
  polyPlate(g, 'NoseCone', [0, 1.06, -1.48], [[-0.23, -0.12], [0.23, -0.12], [0.15, 0.23], [0, 0.55], [-0.15, 0.23]], 0.35, p.accent, style, 'metal');
  plate(g, 'Cockpit', [0, 1.34, -0.48], [0.35, 0.22, 0.62], p.glow, style, 'glow', 0.18);
  for (const s of [-1, 1]) {
    polyPlate(g, s < 0 ? 'LeftWing' : 'RightWing', [s * 0.40, 0.98, 0.10], [[-s * 0.04, 0.36], [s * 1.03, 0.04], [s * 0.84, -0.23], [s * 0.08, -0.18]], 0.12, p.base, style);
    polyPlate(g, s < 0 ? 'LeftTailplane' : 'RightTailplane', [s * 0.17, 1.13, 1.03], [[-s * 0.03, 0.15], [s * 0.48, 0.01], [s * 0.35, -0.12], [0, -0.10]], 0.09, p.accent, style);
    cylinder(g, s < 0 ? 'LeftEngine' : 'RightEngine', [s * 0.18, 0.90, 1.40], 0.11, 0.14, 0.35, p.dark, 6, [Math.PI / 2, 0, 0], style, 'dark');
    if (jet) cylinder(g, s < 0 ? 'LeftExhaust' : 'RightExhaust', [s * 0.18, 0.90, 1.59], 0.08, 0.10, 0.10, p.glow, 6, [Math.PI / 2, 0, 0], style, 'glow');
  }
  polyPlate(g, 'VerticalTail', [0, 1.30, 1.14], [[-0.04, -0.15], [0.04, -0.15], [0.09, 0.40], [0, 0.52], [-0.09, 0.12]], 0.10, p.accent, style);
}

function makeBuilding(g, p, prompt, style) {
  const castle = /castle|fortress|keep/i.test(prompt), tower = /tower|lighthouse/i.test(prompt);
  plate(g, 'Foundation', [0, 0.16, 0], [1.90, 0.30, 1.72], p.dark, style, 'dark', 0.10);
  plate(g, 'BuildingBody', [0, 1.12, 0], [1.55, 1.70, 1.32], p.base, style, 'base', 0.12);
  plate(g, 'DoorFrame', [0, 0.69, -0.675], [0.45, 0.92, 0.055], p.dark, style, 'dark', 0.12);
  plate(g, 'Door', [0, 0.67, -0.711], [0.32, 0.77, 0.03], p.accent, style, 'base', 0.10);
  box(g, 'DoorHandle', [0.10, 0.67, -0.735], [0.045, 0.08, 0.025], p.accent2, style, 'metal');
  for (const s of [-1, 1]) {
    plate(g, s < 0 ? 'LeftWindowFrame' : 'RightWindowFrame', [s * 0.43, 1.50, -0.687], [0.30, 0.38, 0.05], p.dark, style, 'dark', 0.10);
    box(g, s < 0 ? 'LeftWindow' : 'RightWindow', [s * 0.43, 1.50, -0.718], [0.20, 0.28, 0.02], p.glow, style, 'glow');
    box(g, s < 0 ? 'LeftWindowSill' : 'RightWindowSill', [s * 0.43, 1.30, -0.73], [0.36, 0.045, 0.07], p.accent2, style, 'metal');
  }
  if (castle) {
    plate(g, 'BattlementTop', [0, 2.03, 0], [1.82, 0.25, 1.56], p.dark, style, 'dark', 0.08);
    for (const x of [-0.66, -0.22, 0.22, 0.66]) for (const z of [-0.58, 0.58]) plate(g, `Merlon${x}${z}`, [x, 2.21, z], [0.22, 0.24, 0.22], p.base, style, 'base', 0.06);
    for (const x of [-0.73, 0.73]) for (const z of [-0.55, 0.55]) { plate(g, `TowerBase${x}${z}`, [x, 1.22, z], [0.40, 1.90, 0.4], p.accent, style, 'base', 0.10); cone(g, `TowerRoof${x}${z}`, [x, 2.35, z], 0.25, 0.38, p.dark, 4, [0,0,0], style); }
  } else if (tower) {
    plate(g, 'TowerCap', [0, 2.04, 0], [1.72, 0.17, 1.48], p.accent, style, 'base', 0.10);
    cone(g, 'TowerRoof', [0, 2.35, 0], 0.82, 0.62, p.dark, 5, [0, 0, 0], style);
  } else {
    polyPlate(g, 'Roof', [0, 2.00, 0], [[-0.94, -0.10], [0.94, -0.10], [0.0, 0.64]], 1.52, p.accent, style);
    plate(g, 'RoofRidge', [0, 2.61, 0], [0.12, 0.10, 1.60], p.accent2, style, 'metal', 0.06);
  }
  if (/snow|winter|ice/i.test(prompt)) plate(g, 'SnowCap', [0, 2.12, 0], [1.40, 0.08, 1.18], '#E8F3F7', style, 'metal', 0.12);
}

function makeFurniture(g, p, prompt, style) {
  if (/bed/i.test(prompt)) {
    plate(g, 'BedBase', [0, 0.57, 0.12], [1.58, 0.30, 2.20], p.dark, style, 'dark', 0.10);
    plate(g, 'Mattress', [0, 0.78, 0.12], [1.62, 0.22, 2.16], p.base, style, 'base', 0.10);
    plate(g, 'Pillow', [0, 0.94, -0.72], [0.67, 0.16, 0.40], p.light, style, 'metal', 0.14);
    plate(g, 'Headboard', [0, 1.18, -0.98], [1.68, 0.85, 0.14], p.accent, style, 'base', 0.12);
    for (const s of [-1, 1]) plate(g, s < 0 ? 'LeftBedFoot' : 'RightBedFoot', [s * 0.62, 0.30, 0.90], [0.15, 0.48, 0.15], p.dark, style, 'dark');
    return;
  }
  if (/sofa|couch/i.test(prompt)) {
    plate(g, 'SofaBase', [0, 0.72, 0.12], [1.72, 0.42, 1.05], p.base, style, 'base', 0.16);
    plate(g, 'SofaBack', [0, 1.22, 0.56], [1.72, 0.68, 0.25], p.dark, style, 'dark', 0.14);
    for (const s of [-1, 1]) plate(g, s < 0 ? 'LeftArm' : 'RightArm', [s * 0.79, 1.02, 0.13], [0.22, 0.58, 1.0], p.accent, style, 'base', 0.12);
    plate(g, 'SofaSeat', [0, 0.98, -0.02], [1.25, 0.16, 0.78], p.light, style, 'metal', 0.15);
    for (const s of [-1, 1]) plate(g, s < 0 ? 'LeftCushion' : 'RightCushion', [s * 0.34, 1.25, 0.41], [0.54, 0.42, 0.12], p.accent2, style, 'metal', 0.18);
  } else {
    plate(g, 'TableTop', [0, 1.10, 0], [1.65, 0.17, 1.12], p.base, style, 'base', 0.10);
    plate(g, 'Apron', [0, 0.94, 0], [1.28, 0.18, 0.75], p.dark, style, 'dark', 0.06);
    for (const x of [-0.65, 0.65]) for (const z of [-0.41, 0.41]) plate(g, `TableLeg${x}${z}`, [x, 0.49, z], [0.14, 0.83, 0.14], p.accent, style, 'base', 0.05);
    if (/desk/i.test(prompt)) { plate(g, 'Drawer', [0, 0.81, -0.39], [0.58, 0.17, 0.07], p.base, style); box(g, 'DrawerPull', [0, 0.81, -0.435], [0.13, 0.035, 0.025], p.accent2, style, 'metal'); }
  }
}

function makeLantern(g, p, prompt, style) {
  const lamp = /lamp|streetlight/i.test(prompt);
  cylinder(g, 'BaseFoot', [0, 0.16, 0], 0.38, 0.42, 0.22, p.dark, 6, [0,0,0], style, 'dark');
  if (lamp) {
    cylinder(g, 'LampPost', [0, 1.25, 0], 0.08, 0.10, 2.00, p.dark, 6, [0,0,0], style, 'dark');
    segment(g, 'LampArm', [0, 2.18, 0], [0.50, 2.24, 0], 0.10, 0.10, p.dark, style, 'dark');
    plate(g, 'LampHousing', [0.55, 2.10, 0], [0.55, 0.20, 0.38], p.accent2, style, 'metal', 0.15);
    box(g, 'LampGlow', [0.55, 1.97, 0], [0.35, 0.04, 0.22], p.glow, style, 'glow');
    return;
  }
  plate(g, 'LanternLower', [0, 0.47, 0], [0.58, 0.18, 0.58], p.accent2, style, 'metal', 0.12);
  plate(g, 'GlassChamber', [0, 0.91, 0], [0.47, 0.70, 0.47], p.glow, style, 'glow', 0.12);
  for (const x of [-0.25, 0.25]) for (const z of [-0.25, 0.25]) box(g, `LanternPost${x}${z}`, [x, 0.91, z], [0.045, 0.78, 0.045], p.dark, style, 'dark');
  plate(g, 'LanternCap', [0, 1.34, 0], [0.67, 0.16, 0.67], p.dark, style, 'dark', 0.12);
  cone(g, 'LanternCrown', [0, 1.50, 0], 0.24, 0.30, p.accent2, 4, [0,0,0], style);
  segment(g, 'LanternHandleLeft', [-0.22, 1.48, 0], [-0.17, 1.86, 0], 0.05, 0.05, p.dark, style, 'dark');
  segment(g, 'LanternHandleTop', [-0.17, 1.86, 0], [0.17, 1.86, 0], 0.05, 0.05, p.dark, style, 'dark');
  segment(g, 'LanternHandleRight', [0.17, 1.86, 0], [0.22, 1.48, 0], 0.05, 0.05, p.dark, style, 'dark');
}

function makeMushroom(g, p, prompt, style) {
  const magic = /magic|glow|fantasy|enchanted/i.test(prompt);
  cylinder(g, 'Stem', [0, 0.68, 0], 0.20, 0.28, 1.30, p.light, 6, [0,0,0], style, 'metal');
  ico(g, 'Cap', [0, 1.43, 0], 0.77, p.base, [1.16, 0.60, 1.08], 1, style);
  cylinder(g, 'GillRing', [0, 1.23, 0], 0.62, 0.62, 0.10, p.accent2, 8, [0,0,0], style, 'metal');
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ico(g, `CapSpot${i}`, [Math.cos(a) * 0.43, 1.72, Math.sin(a) * 0.40], magic ? 0.10 : 0.085, magic ? p.glow : p.light, [1,0.48,1], 0, style, magic ? 'glow' : 'metal'); }
  if (magic) for (const s of [-1, 1]) ico(g, s < 0 ? 'LeftFirefly' : 'RightFirefly', [s * 0.87, 1.52, 0], 0.065, p.glow, [1,1,1], 0, style, 'glow');
}

function makeFood(g, p, prompt, style) {
  if (/cake|pie|tart/i.test(prompt)) {
    cylinder(g, 'CakeBase', [0, 0.45, 0], 0.68, 0.68, 0.72, p.base, 8, [0,0,0], style);
    cylinder(g, 'IcingLayer', [0, 0.83, 0], 0.70, 0.70, 0.12, p.light, 8, [0,0,0], style, 'metal');
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ico(g, `Berry${i}`, [Math.cos(a)*0.34, 0.96, Math.sin(a)*0.34], 0.105, p.accent, [1,0.8,1], 0, style); }
    return;
  }
  if (/pumpkin|squash/i.test(prompt)) {
    ico(g, 'PumpkinBody', [0, 0.75, 0], 0.75, p.base, [1.1, 0.92, 1.0], 1, style);
    cylinder(g, 'PumpkinStem', [0, 1.40, 0], 0.07, 0.10, 0.24, p.dark, 5, [0,0,0], style, 'dark');
    for (const s of [-1, 1]) plate(g, s < 0 ? 'LeftRib' : 'RightRib', [s*0.28,0.76,-0.42],[0.12,0.79,0.08],p.accent,style,'metal',0.12,[0,0,s*0.12]);
    if (/face|jack|halloween/i.test(prompt)) { for (const s of [-1,1]) polyPlate(g, s<0?'LeftEye':'RightEye',[s*0.19,0.83,-0.67],[[-0.07,0.04],[0.07,0.04],[0,-0.09]],0.03,p.dark,style,'dark'); polyPlate(g,'PumpkinMouth',[0,0.59,-0.68],[[-0.20,0.05],[-0.1,-0.02],[0,-0.06],[0.1,-0.02],[0.20,0.05]],0.025,p.dark,style,'dark'); }
    return;
  }
  ico(g, 'FoodBody', [0, 0.77, 0], 0.65, p.base, [1.0, 0.96, 0.88], 1, style);
  segment(g, 'FoodStem', [0, 1.31, 0], [0.05, 1.48, 0.03], 0.08, 0.08, p.dark, style, 'dark');
  if (/apple/i.test(prompt)) polyPlate(g, 'Leaf', [0.14, 1.39, 0], [[0,0],[0.19,0.09],[0.30,0.01],[0.17,-0.08]],0.035,p.accent,style,'metal');
  if (/bread|loaf/i.test(prompt)) plate(g, 'Crust', [0, 0.93, 0], [1.0, 0.56, 0.66], p.accent2, style, 'metal', 0.20);
}

function makeTool(g, p, prompt, style) {
  if (/pickaxe|pick axe/i.test(prompt)) {
    plate(g, 'PickGrip', [0, 0.95, 0], [0.14, 1.38, 0.14], p.dark, style, 'dark', 0.12);
    polyPlate(g, 'PickHead', [0, 1.70, 0], [[-0.74,0.08],[-0.48,0.35],[0,0.20],[0.48,0.35],[0.74,0.08],[0.45,-0.12],[0,-0.03],[-0.45,-0.12]],0.16,p.base,style);
    plate(g, 'PickSocket', [0,1.68,-0.095],[0.28,0.26,0.035],p.accent2,style,'metal',0.12);
  } else if (/shovel|spade/i.test(prompt)) {
    plate(g, 'ShovelHandle', [0, 1.03, 0], [0.12, 1.64, 0.12], p.dark, style, 'dark', 0.10);
    plate(g, 'ShovelGrip', [0, 1.86, 0], [0.40, 0.12, 0.12], p.accent2, style, 'metal', 0.10);
    polyPlate(g, 'ShovelBlade', [0, 0.30, -0.01], [[-0.20,0.32],[0.20,0.32],[0.28,-0.03],[0,-0.34],[-0.28,-0.03]],0.14,p.base,style,'metal');
  } else if (/wrench|spanner/i.test(prompt)) {
    plate(g, 'WrenchHandle', [0, 0.79, 0], [0.15, 1.06, 0.13], p.dark, style, 'dark', 0.10);
    polyPlate(g, 'WrenchJaw', [0, 1.48, 0], [[-0.34,0.28],[-0.23,0.42],[-0.07,0.22],[0.07,0.22],[0.23,0.42],[0.34,0.28],[0.20,0.04],[-0.20,0.04]],0.15,p.metal,style,'metal');
    cylinder(g, 'WrenchHole', [0, 0.34, -0.08], 0.10, 0.10, 0.02, p.base, 6, [Math.PI/2,0,0], style);
  } else {
    // Compact telescope / tool stand, chosen for unknown utility tool nouns.
    cylinder(g, 'ToolTube', [0, 1.20, 0], 0.18, 0.25, 1.00, p.base, 6, [0,0,0], style);
    cylinder(g, 'ToolLens', [0, 1.73, 0], 0.22, 0.22, 0.12, p.glow, 6, [0,0,0], style, 'glow');
    plate(g, 'ToolMount', [0, 0.63, 0], [0.35,0.22,0.35],p.dark,style,'dark');
    for (const s of [-1,1]) segment(g, `ToolTripod${s}`, [s*0.08,0.58,0],[s*0.37,0.08,s*0.18],0.07,0.07,p.accent2,style,'metal');
    if (/staff/i.test(prompt)) plate(g,'StaffGem',[0,1.92,0],[0.30,0.28,0.30],p.glow,style,'glow',0.18);
  }
}

function makeComputer(g, p, prompt, style) {
  const laptop = /laptop|notebook/i.test(prompt);
  if (laptop) {
    plate(g, 'LaptopBase', [0, 0.25, 0], [1.45, 0.09, 1.05], p.dark, style, 'dark', 0.10, [-0.06,0,0]);
    plate(g, 'KeyboardDeck', [0, 0.305, -0.04], [1.22, 0.025, 0.66], p.metal, style, 'metal', 0.05);
    for (let r=0;r<3;r++) for (let c=0;c<5;c++) box(g,`Key${r}${c}`,[-0.46+c*0.23,0.324,-0.22+r*0.13],[0.15,0.014,0.065],p.dark,style,'dark');
    plate(g, 'LaptopScreenShell', [0, 0.82, 0.45], [1.44, 0.94, 0.09], p.dark, style, 'dark', 0.10, [-0.10,0,0]);
    plate(g, 'LaptopScreen', [0, 0.82, 0.397], [1.20, 0.70, 0.025], p.glow, style, 'glow', 0.08, [-0.10,0,0]);
  } else {
    plate(g, 'MonitorShell', [0, 1.42, 0], [1.55, 1.02, 0.17], p.dark, style, 'dark', 0.12);
    plate(g, 'MonitorGlass', [0, 1.43, -0.095], [1.28, 0.74, 0.025], p.glow, style, 'glow', 0.08);
    plate(g, 'MonitorStand', [0, 0.79, 0.02], [0.15, 0.38, 0.15], p.metal, style, 'metal', 0.05);
    plate(g, 'MonitorFoot', [0, 0.56, -0.02], [0.65, 0.10, 0.38], p.dark, style, 'dark', 0.08);
    plate(g, 'MonitorLogo', [0, 0.96, -0.105], [0.13,0.045,0.012], p.accent2,style,'metal',0.02);
    plate(g, 'Keyboard', [0, 0.24, -0.48], [1.20, 0.08, 0.42], p.dark, style, 'dark', 0.06);
    box(g, 'Mouse', [0.80, 0.25, -0.48], [0.18, 0.12, 0.20], p.accent, style);
  }
}

function applyDetailProportions(root, prompt, variation = 0) {
  const scaleMeshes = (regex, sx, sy, sz) => root.traverse(o => { if (o.isMesh && regex.test(o.name)) { o.scale.x *= sx; o.scale.y *= sy; o.scale.z *= sz; } });
  if (/oversized head|big head|large head/i.test(prompt)) scaleMeshes(/HeadShell|Head$|DragonHead|AnimalHead|BirdHead|HelmetCrown/, 1.13, 1.12, 1.10);
  if (/long tail|extra long tail/i.test(prompt)) scaleMeshes(/Tail(Main|Mid|Root|Link|Upper|Tip|Blade)/, 1.0, 1.0, 1.18);
  if (/wide wings|huge wings|wide wing/i.test(prompt)) scaleMeshes(/Wing|Membrane|WingRib/, 1.20, 1.0, 1.0);
  if (/short legs|stubby legs/i.test(prompt)) scaleMeshes(/UpperLeg|Thigh|ShinArmor|Horse.*Leg|Dino.*Leg|Animal.*Leg/, 1.0, 0.82, 1.0);
  if (/long legs|long-legged/i.test(prompt)) scaleMeshes(/UpperLeg|Thigh|ShinArmor|Horse.*Leg|Dino.*Leg|Animal.*Leg/, 1.0, 1.18, 1.0);
  if (/bulky|chunky|heavy|tank/i.test(prompt)) scaleMeshes(/Torso|Body|Barrel|MainBody|Chest|Shell|Chassis/, 1.08, 1.0, 1.08);
  if (/sleek|slim|slender/i.test(prompt)) scaleMeshes(/Torso|Body|Barrel|MainBody|Chassis|Fuselage/, 0.90, 1.0, 1.02);
  if (variation % 4 === 1) scaleMeshes(/Tail(Main|Mid|Root|Link|Upper|Tip)/, 1.0, 1.0, 1.07);
  if (variation % 4 === 2) scaleMeshes(/Wing|Membrane|Tailplane/, 1.06, 1.0, 1.0);
  if (variation % 4 === 3) scaleMeshes(/ShoulderArmor|ChestArmor|ChestCoreFrame|HeadShell/, 1.045, 1.035, 1.0);
}


function makeBicycle(g, p, prompt, style) {
  // Side-on X/Z wheel plane, deliberately compact and made from separated readable parts.
  for (const z of [-0.73, 0.73]) {
    cylinder(g, z < 0 ? 'FrontWheel' : 'RearWheel', [0, 0.53, z], 0.40, 0.40, 0.095, p.dark, 8, [0, 0, Math.PI / 2], style, 'dark');
    cylinder(g, z < 0 ? 'FrontHub' : 'RearHub', [0, 0.53, z < 0 ? z - 0.055 : z - 0.055], 0.10, 0.10, 0.12, p.accent2, 6, [0, 0, Math.PI / 2], style, 'metal');
  }
  const a = [0, 0.53, -0.73], b = [0, 1.05, -0.05], c = [0, 0.53, 0.73], d = [0, 0.65, 0.04];
  segment(g, 'FrameDownTube', a, d, 0.085, 0.085, p.base, style, 'metal');
  segment(g, 'FrameTopTube', d, b, 0.075, 0.075, p.base, style, 'metal');
  segment(g, 'FrameSeatStay', c, b, 0.07, 0.07, p.accent, style, 'metal');
  segment(g, 'FrameChainStay', a, c, 0.06, 0.06, p.dark, style, 'dark');
  segment(g, 'SeatPost', d, [0, 1.23, 0.04], 0.065, 0.065, p.dark, style, 'dark');
  plate(g, 'Seat', [0, 1.27, 0.08], [0.36, 0.09, 0.20], p.dark, style, 'dark', 0.12);
  segment(g, 'HandleStem', [0, 1.00, -0.05], [0, 1.23, -0.66], 0.06, 0.06, p.dark, style, 'dark');
  box(g, 'HandleBar', [0, 1.25, -0.67], [0.58, 0.07, 0.07], p.accent2, style, 'metal');
  cylinder(g, 'Crank', [0, 0.65, 0.04], 0.10, 0.10, 0.12, p.dark, 6, [Math.PI / 2, 0, 0], style, 'dark');
  segment(g, 'PedalArm', [0, 0.65, 0.04], [0, 0.52, 0.18], 0.045, 0.045, p.accent2, style, 'metal');
  box(g, 'Pedal', [0, 0.52, 0.18], [0.27, 0.05, 0.08], p.dark, style, 'dark');
}

function makeBoat(g, p, prompt, style) {
  polyPlate(g, 'Hull', [0, 0.62, 0], [[-0.75, 0.30], [0.75, 0.30], [0.60, -0.10], [0.34, -0.38], [-0.34, -0.38], [-0.60, -0.10]], 2.0, p.base, style, 'base');
  plate(g, 'Deck', [0, 0.83, 0], [1.27, 0.12, 1.50], p.accent, style, 'base', 0.10);
  if (/sail|sailboat|pirate/i.test(prompt)) {
    cylinder(g, 'Mast', [0, 1.78, 0.12], 0.055, 0.065, 1.95, p.dark, 5, [0,0,0], style, 'dark');
    polyPlate(g, 'Sail', [0.33, 1.82, 0.12], [[-0.26,0.72],[0.32,0.54],[0.32,-0.60],[-0.26,-0.42]], 0.08, p.light, style, 'metal');
    if (/pirate/i.test(prompt)) plate(g, 'JollyEmblem', [0.35, 1.79, 0.067], [0.20,0.20,0.025],p.dark,style,'dark',0.05);
  } else {
    plate(g, 'Cabin', [0, 1.10, 0.20], [0.74, 0.48, 0.68], p.light, style, 'metal', 0.12);
    plate(g, 'CabinWindowFront', [0, 1.16, -0.15], [0.42,0.22,0.035],p.glow,style,'glow',0.05);
    for (const s of [-1,1]) plate(g, s < 0 ? 'LeftPorthole' : 'RightPorthole', [s*0.39,1.17,0.10],[0.11,0.11,0.035],p.glow,style,'glow',0.03);
  }
  cylinder(g, 'BowLight', [0, 0.94, -0.86], 0.065,0.065,0.04,p.accent2,5,[Math.PI/2,0,0],style,'glow');
}

function makeBackpack(g, p, prompt, style) {
  plate(g, 'PackBody', [0, 1.03, 0.15], [1.02, 1.40, 0.52], p.base, style, 'base', 0.18);
  plate(g, 'PackFrontPocket', [0, 0.88, -0.16], [0.72, 0.57, 0.12], p.accent, style, 'base', 0.14);
  plate(g, 'PocketFlap', [0, 1.21, -0.24], [0.76, 0.20, 0.06], p.dark, style, 'dark', 0.10);
  plate(g, 'PackLatch', [0, 1.12, -0.285], [0.16, 0.13, 0.025], p.accent2, style, 'metal');
  for (const x of [-0.39,0.39]) { segment(g, `PackStrap${x}`, [x,1.54,0.31], [x*0.9,0.52,0.30],0.10,0.05,p.dark,style,'dark'); box(g,`PackSidePocket${x}`,[x*1.18,0.78,0.13],[0.16,0.43,0.29],p.accent,style); }
  if (/hiking|explorer|adventure/i.test(prompt)) plate(g,'SleepingRoll',[0,1.70,0.34],[0.80,0.23,0.22],p.light,style,'metal',0.10);
}

function makeProp(g, p, prompt, style) {
  if (/spaceship|space ship|starship|rocket|ufo|saucer|flying disc/i.test(prompt)) return makeSpacecraft(g, p, prompt, style);
  if (/airplane|aeroplane|\bplane\b|jet|helicopter|heli/i.test(prompt)) return makeAircraft(g, p, prompt, style);
  if (/castle|fortress|house|cottage|building|lighthouse|tower|temple|shop/i.test(prompt)) return makeBuilding(g, p, prompt, style);
  if (/table|desk|bed|sofa|couch|bookshelf/i.test(prompt)) return makeFurniture(g, p, prompt, style);
  if (/lantern|lamp|streetlight/i.test(prompt)) return makeLantern(g, p, prompt, style);
  if (/mushroom|toadstool/i.test(prompt)) return makeMushroom(g, p, prompt, style);
  if (/cake|pie|tart|pumpkin|squash|apple|bread|loaf|food/i.test(prompt)) return makeFood(g, p, prompt, style);
  if (/pickaxe|pick axe|shovel|spade|wrench|spanner|telescope|utility tool/i.test(prompt)) return makeTool(g, p, prompt, style);
  if (/computer|monitor|laptop|notebook computer|terminal|gaming pc/i.test(prompt)) return makeComputer(g, p, prompt, style);
  if (/backpack|rucksack|jetpack/i.test(prompt)) return makeBackpack(g, p, prompt, style);
  if (/bicycle|bike|mountain bike|motorcycle|motorbike|scooter/i.test(prompt)) return makeBicycle(g, p, prompt, style);
  if (/boat|sailboat|ship|canoe|yacht/i.test(prompt)) return makeBoat(g, p, prompt, style);
  if (/car|kart|truck|van|vehicle|sports car/i.test(prompt)) return makeCar(g, p, prompt, style);
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
  if (/sword|weapon|axe|dagger|hammer|staff|bow|blade|mace|blaster|gun|pistol|rifle/i.test(prompt)) return 'weapon';
  if (/horse|dragon|dinosaur|trex|t-rex|tyrannosaurus|triceratops|stegosaurus|raptor|whale|fish|shark|dolphin|octopus|squid|creature|animal|monster|unicorn|pony|wyvern|wolf|fox|bear|cat|dog|kitten|puppy|tiger|lion|lynx|pet|bird|owl|eagle|hawk|penguin|parrot|raven|duck|chicken|frog|rabbit|deer|snail|spider|dodo|bat|dragonfly|butterfly/i.test(prompt)) return 'creature';
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
  // Procedural families use curated name-priority rules; AI compositions use
  // the modeler's explicit primary/secondary/accent importance labels instead.
  if (!root.userData?.aiAuthoredGeometry) for (const pattern of DETAIL_PRIORITY) {
    if (stats.triangles <= budget) break;
    const candidates = [];
    root.traverse(o => { if (o.isMesh && pattern.test(o.name)) candidates.push(o); });
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
  if (stats.triangles > budget) {
    const protectedNames = /Torso|Body|Barrel|Mantle|MainBody|Head$|HeadShell|Blade$|DragonTorso|CreatureTorso|CupBody|CrateBody|Chassis|Hull|Fuselage|Foundation|Central|Primary|Core|Frame|Main/i;
    const candidates = [];
    root.traverse(o => { if (o.isMesh && !protectedNames.test(o.name)) candidates.push(o); });
    const priorityRank = { accent: 0, secondary: 1, primary: 2 };
    candidates.sort((a, b) => (priorityRank[a.userData.designPriority] ?? 1) - (priorityRank[b.userData.designPriority] ?? 1) || trianglesInMesh(b) - trianglesInMesh(a));
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
  // Absolute final pass: even if a malformed plan labels every part as primary,
  // the advertised triangle cap must remain a hard invariant.
  stats = getMeshStats(root);
  if (stats.triangles > budget) {
    const remaining = [];
    root.traverse(o => { if (o.isMesh) remaining.push(o); });
    const priorityRank = { accent: 0, secondary: 1, primary: 2 };
    remaining.sort((a, b) => (priorityRank[a.userData.designPriority] ?? 1) - (priorityRank[b.userData.designPriority] ?? 1) || trianglesInMesh(b) - trianglesInMesh(a));
    for (const mesh of remaining) {
      stats = getMeshStats(root);
      if (stats.triangles <= budget) break;
      if (!mesh.parent) continue;
      const pairName = matchingMirrorName(mesh.name);
      let counterpart = null;
      if (pairName) root.traverse(o => { if (!counterpart && o.isMesh && o.name === pairName) counterpart = o; });
      const remove = [mesh, counterpart].filter((o, i, a) => o?.parent && a.indexOf(o) === i);
      for (const item of remove) item.parent.remove(item);
    }
  }
  return getMeshStats(root);
}

function applyBlueprintPalette(p, blueprint, prompt, imageColor) {
  if (imageColor || !Array.isArray(blueprint?.palette) || !blueprint.palette.length) return;
  // Explicit user color instructions win; otherwise the design brain's palette is used.
  if (COLOR_MAP.some(([pattern]) => pattern.test(String(prompt || '')))) return;
  const names = {
    ivory: '#D9D2BF', cream: '#D9D2BF', copper: '#B8754D', bronze: '#A87343', brass: '#C3A058', silver: '#ADB8C0', steel: '#7A8B98', navy: '#35486D', turquoise: '#43B8B0', aqua: '#52D9D1', lime: '#A9CF4E', beige: '#BBA98A', tan: '#A98B67', coral: '#DA7868', maroon: '#783D4A', lavender: '#A99AD5'
  };
  const resolve = (value, fallback) => {
    const name = String(value || '').trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/i.test(name)) return name;
    if (names[name]) return names[name];
    for (const [pattern, hex] of COLOR_MAP) if (pattern.test(name)) return hex;
    return fallback;
  };
  p.base = resolve(blueprint.palette[0], p.base);
  if (blueprint.palette[1]) p.accent = resolve(blueprint.palette[1], p.accent);
  if (blueprint.palette[2]) p.accent2 = resolve(blueprint.palette[2], p.accent2);
  if (blueprint.palette[3]) p.glow = resolve(blueprint.palette[3], p.glow);
}

function safeBlueprintNumber(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
}

function safeBlueprintString(value, fallback = '') {
  return String(value ?? fallback).replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 42) || fallback;
}

function blueprintRoleColor(role, p, hint = '') {
  const label = `${role || ''} ${hint || ''}`.toLowerCase();
  if (/glow|emissive|light|eye|glass|screen/.test(label)) return { color: p.glow, role: 'glow' };
  if (/metal|steel|chrome|brass|gold|silver/.test(label)) return { color: p.accent2, role: 'metal' };
  if (/dark|shadow|black|rubber|grip|underside/.test(label)) return { color: p.dark, role: 'dark' };
  if (/accent|trim|stripe|secondary|decoration|ornament/.test(label)) return { color: p.accent, role: 'metal' };
  return { color: p.base, role: 'base' };
}

function blueprintPriority(part, name = '') {
  const explicit = String(part?.priority || part?.level || '').toLowerCase();
  if (['primary','secondary','accent'].includes(explicit)) return explicit;
  const role = String(part?.role || '').toLowerCase();
  if (role === 'glow' || role === 'accent') return 'accent';
  const label = `${name} ${part?.name || ''} ${part?.kind || ''}`.toLowerCase();
  if (/rivet|badge|trim|stripe|seam|button|status|glow|light|screen|tiny|accent|decoration|ornament|inset/.test(label)) return 'accent';
  if (/main|central|core|body|chassis|hull|foundation|base|frame|torso|head|cab|fuselage|primary/.test(label)) return 'primary';
  return 'secondary';
}

function makeBlueprintComposition(g, p, blueprint, style) {
  // Unknown objects can be described as a constrained mesh plan by a local
  // language/vision model. Validate every numeric input and geometry primitive
  // before using it; an untrusted model response must never create unbounded meshes.
  const raw = Array.isArray(blueprint?.parts) ? blueprint.parts.slice(0, 28) : [];
  const parts = raw.map((part, index) => {
    if (!part || typeof part !== 'object') return null;
    const shape = String(part.shape || 'plate').toLowerCase();
    if (!['box','plate','sphere','icosphere','cylinder','cone','wedge','rod','ring'].includes(shape)) return null;
    const vector = (value, defaults, low, high) => defaults.map((fallback, i) => safeBlueprintNumber(Array.isArray(value) ? value[i] : fallback, fallback, low, high));
    const position = vector(part.position, [0, 0.7 + index * 0.04, 0], [-2.5, -0.25, -2.5], [2.5, 4.5, 2.5]);
    const size = vector(part.size, [0.55, 0.35, 0.45], [0.06, 0.06, 0.06], [1.9, 2.8, 1.9]);
    const rotation = vector(part.rotation, [0, 0, 0], [-Math.PI, -Math.PI, -Math.PI], [Math.PI, Math.PI, Math.PI]);
    return { part, shape, position, size, rotation, index };
  }).filter(Boolean);
  // A partial/poor model response should fall back to a curated procedural model.
  if (parts.length < 5) return false;

  const partName = (value, index) => `${safeBlueprintString(value, `AIForm${index + 1}`).replace(/\s+/g, '_')}_${index + 1}`;
  for (const item of parts) {
    const { part, shape, position: pos, size, rotation: rot, index } = item;
    const mirrored = /^(both|mirror|bilateral)$/i.test(String(part.symmetry || ''));
    const rawLabel = safeBlueprintString(part.name || part.label || part.kind, `AIForm${index + 1}`).replace(/^(left|right|mirror|both)[ _-]*/i, '');
    const name = partName(mirrored ? `Left_${rawLabel}` : rawLabel, index);
    const roleInfo = blueprintRoleColor(part.role || part.material || part.colorRole, p, part.color);
    const color = roleInfo.color;
    const [w, h, d] = size;
    const drawPos = mirrored ? [-Math.max(Math.abs(pos[0]), w * 0.32), pos[1], pos[2]] : pos;
    let generatedMesh = null;
    if (shape === 'box') generatedMesh = box(g, name, drawPos, size, color, style, roleInfo.role, rot);
    else if (shape === 'plate') generatedMesh = plate(g, name, drawPos, size, color, style, roleInfo.role, 0.14, rot);
    else if (shape === 'sphere' || shape === 'icosphere') generatedMesh = ico(g, name, drawPos, 0.5, color, [w, h, d], 0, style, roleInfo.role);
    else if (shape === 'cylinder') generatedMesh = cylinder(g, name, drawPos, Math.max(0.04, Math.min(w, d) / 2), Math.max(0.04, Math.min(w, d) / 2), h, color, 6, rot, style, roleInfo.role);
    else if (shape === 'cone') generatedMesh = cone(g, name, drawPos, Math.max(0.04, Math.min(w, d) / 2), h, color, 5, rot, style);
    else if (shape === 'rod') generatedMesh = cylinder(g, name, drawPos, Math.max(0.035, Math.min(w, d) / 2), Math.max(0.035, Math.min(w, d) / 2), h, color, 5, rot, style, roleInfo.role);
    else if (shape === 'wedge') generatedMesh = polyPlate(g, name, drawPos, [[-w * 0.50, -h * 0.42], [w * 0.34, -h * 0.42], [w * 0.50, h * 0.18], [0, h * 0.50], [-w * 0.28, h * 0.22]], d, color, style, roleInfo.role, rot);
    else if (shape === 'ring') {
      const radius = Math.max(0.08, Math.min(w, h) * 0.43);
      const thickness = Math.max(0.025, Math.min(w, h, d) * 0.10);
      generatedMesh = addMesh(g, name, new THREE.TorusGeometry(radius, thickness, 4, 8), color, drawPos, [1, 1, Math.max(0.5, d / Math.max(w, h))], rot, roleInfo.role, style);
    }
    if (generatedMesh) { generatedMesh.userData.designPriority = blueprintPriority(part, rawLabel); generatedMesh.userData.aiBlueprintPart = true; }
    // Explicit mirror instructions let the model request bilateral elements
    // without requiring a second guessed part. Position x is mirrored safely.
    if (mirrored) {
      const mirroredName = partName(`Right_${rawLabel}`, index);
      const mirrorPos = [-drawPos[0], drawPos[1], drawPos[2]];
      if (shape === 'box') box(g, mirroredName, mirrorPos, size, color, style, roleInfo.role, [rot[0], -rot[1], -rot[2]]);
      else if (shape === 'plate') plate(g, mirroredName, mirrorPos, size, color, style, roleInfo.role, 0.14, [rot[0], -rot[1], -rot[2]]);
      else if (shape === 'sphere' || shape === 'icosphere') ico(g, mirroredName, mirrorPos, 0.5, color, [w, h, d], 0, style, roleInfo.role);
      else if (shape === 'cylinder') cylinder(g, mirroredName, mirrorPos, Math.max(0.04, Math.min(w, d) / 2), Math.max(0.04, Math.min(w, d) / 2), h, color, 6, [rot[0], -rot[1], -rot[2]], style, roleInfo.role);
      else if (shape === 'cone') cone(g, mirroredName, mirrorPos, Math.max(0.04, Math.min(w, d) / 2), h, color, 5, [rot[0], -rot[1], -rot[2]], style);
      else if (shape === 'rod') cylinder(g, mirroredName, mirrorPos, Math.max(0.035, Math.min(w, d) / 2), Math.max(0.035, Math.min(w, d) / 2), h, color, 5, [rot[0], -rot[1], -rot[2]], style, roleInfo.role);
      else if (shape === 'wedge') polyPlate(g, mirroredName, mirrorPos, [[-w * 0.50, -h * 0.42], [w * 0.34, -h * 0.42], [w * 0.50, h * 0.18], [0, h * 0.50], [-w * 0.28, h * 0.22]], d, color, style, roleInfo.role, [rot[0], -rot[1], -rot[2]]);
      else if (shape === 'ring') {
        const radius = Math.max(0.08, Math.min(w, h) * 0.43), thickness = Math.max(0.025, Math.min(w, h, d) * 0.10);
        addMesh(g, mirroredName, new THREE.TorusGeometry(radius, thickness, 4, 8), color, mirrorPos, [1, 1, Math.max(0.5, d / Math.max(w, h))], [rot[0], -rot[1], -rot[2]], roleInfo.role, style);
      }
      g.traverse(o => { if (o.isMesh && o.name === mirroredName) { o.userData.designPriority = blueprintPriority(part, rawLabel); o.userData.aiBlueprintPart = true; } });
    }
  }
  return true;
}

function applyBlueprintProportions(group, blueprint) {
  const values = blueprint?.proportions;
  if (!values || typeof values !== 'object') return;
  const head = safeBlueprintNumber(values.headScale, 1, 0.72, 1.38);
  const body = safeBlueprintNumber(values.bodyWidth, 1, 0.72, 1.38);
  const limbs = safeBlueprintNumber(values.limbLength, 1, 0.72, 1.38);
  const tail = safeBlueprintNumber(values.tailLength, 1, 0.72, 1.45);
  group.traverse(o => {
    if (!o.isMesh) return;
    if (/Head|HelmetCrown|FaceShell|AnimalHead|DragonHead|BirdHead/i.test(o.name)) { o.scale.x *= head; o.scale.y *= head; o.scale.z *= head; }
    if (/Torso|Body|Chassis|MainBody|Fuselage|Barrel/i.test(o.name)) o.scale.x *= body;
    if (/Arm|Leg|Shin|Thigh|Limb/i.test(o.name)) o.scale.y *= limbs;
    if (/Tail/i.test(o.name)) o.scale.z *= tail;
  });
}

export function hasDedicatedGeometry(prompt, type = 'auto') {
  if (['character', 'creature', 'weapon'].includes(type) || ['character', 'creature', 'weapon'].includes(classifyPrompt(prompt, 'auto'))) return true;
  return /spaceship|space ship|starship|rocket|ufo|saucer|flying disc|airplane|aeroplane|\bplane\b|jet|helicopter|\bheli\b|castle|fortress|house|cottage|building|lighthouse|tower|temple|shop|table|desk|bed|sofa|couch|bookshelf|lantern|lamp|streetlight|mushroom|toadstool|cake|pie|tart|pumpkin|squash|apple|bread|loaf|food|pickaxe|pick axe|shovel|spade|wrench|spanner|telescope|utility tool|computer|monitor|laptop|notebook computer|terminal|gaming pc|backpack|rucksack|jetpack|bicycle|bike|mountain bike|motorcycle|motorbike|scooter|boat|sailboat|ship|canoe|yacht|car|kart|truck|van|vehicle|sports car|tree|pine|fir|plant|bush|mug|cup|tankard|pot|chair|seat|throne|flag|banner|sign|crate|box|chest|supply|loot|rock|crystal|ore|gem/i.test(String(prompt || ''));
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

export function createModel({ prompt = 'minimal robot character', type = 'auto', imageColor = null, shapeStyle = 'premium', triangleBudget = 500, variation = 0, designHints = '', blueprint = null } = {}) {
  const userPrompt = String(prompt || 'minimal robot character').slice(0, 700);
  const cleanPrompt = `${userPrompt} ${String(designHints || '').slice(0, 700)}`.trim();
  const category = classifyPrompt(cleanPrompt, type);
  const p = paletteFor(cleanPrompt, imageColor);
  applyBlueprintPalette(p, blueprint, userPrompt, imageColor);
  const group = new THREE.Group();
  group.name = cleanPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 42) || 'forge3d_asset';
  const safeStyle = ['premium', 'minimal', 'faceted', 'soft'].includes(shapeStyle) ? shapeStyle : 'premium';
  const limit = clamp(Number(triangleBudget) || 500, 100, 500);
  group.userData = {
    prompt: cleanPrompt, category, shapeStyle: safeStyle, triangleBudget: limit, palette: p,
    designRules: ['silhouette-first', 'primary-secondary-tertiary detail hierarchy', 'hard planar faces', 'layered surfaces do not share depth', 'grounded contact points', 'restrained accent palette', 'bilateral symmetry audit', 'proportion audit before detail pass'],
    variation: Number(variation) || 0, designHints: String(designHints || '')
  };
  const aiAuthoredGeometry = makeBlueprintComposition(group, p, blueprint, safeStyle);
  if (!aiAuthoredGeometry) {
    if (category === 'character') makeHumanoid(group, p, cleanPrompt, safeStyle);
    else if (category === 'creature') makeQuadruped(group, p, cleanPrompt, safeStyle);
    else if (category === 'weapon') makeWeapon(group, p, cleanPrompt, safeStyle);
    else makeProp(group, p, cleanPrompt, safeStyle);
  }

  if (safeStyle === 'faceted') group.traverse(o => { if (o.isMesh) o.material.flatShading = true; });
  if (safeStyle === 'soft') group.traverse(o => { if (o.isMesh) o.material.roughness = 0.95; });
  applyPromptScale(group, cleanPrompt);
  applyDetailProportions(group, cleanPrompt, Number(variation) || 0);
  applyBlueprintProportions(group, blueprint);
  if (aiAuthoredGeometry) {
    group.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(group);
    if (Number.isFinite(bounds.min.y)) group.position.y -= bounds.min.y;
  }
  group.userData.aiAuthoredGeometry = aiAuthoredGeometry;
  const stats = enforceBudget(group, limit);
  group.updateMatrixWorld(true);
  group.userData.stats = stats;
  return { group, category, palette: p, stats, name: group.name };
}

export function auditModel(root, triangleBudget = 500) {
  root.updateMatrixWorld(true);
  const stats = getMeshStats(root);
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  let invalidVertices = 0, emptyMeshes = 0;
  const names = new Set(); let duplicateNames = 0;
  root.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.getAttribute('position')?.count) emptyMeshes++;
    const pos = o.geometry.getAttribute('position');
    if (pos?.array) for (let i = 0; i < pos.array.length; i++) if (!Number.isFinite(pos.array[i])) invalidVertices++;
    if (names.has(o.name)) duplicateNames++; else names.add(o.name);
  });
  const dims = [size.x, size.y, size.z];
  const warnings = [];
  if (!stats.triangles) warnings.push('No renderable triangles were generated.');
  if (stats.triangles > triangleBudget) warnings.push(`Triangle budget exceeded (${stats.triangles}/${triangleBudget}).`);
  if (invalidVertices) warnings.push(`${invalidVertices} non-finite vertex positions found.`);
  if (emptyMeshes) warnings.push(`${emptyMeshes} empty mesh objects found.`);
  if (dims.some(v => !Number.isFinite(v) || v <= 0)) warnings.push('Bounding dimensions are invalid.');
  if (duplicateNames) warnings.push(`${duplicateNames} duplicate mesh names found.`);
  if (Math.max(...dims) / Math.max(0.0001, Math.min(...dims)) > 12) warnings.push('Extreme aspect ratio; confirm the prompt intended a very long or very tall asset.');
  if (stats.parts < 3) warnings.push('Very few parts; the asset may be too simple for a finished game prop.');
  return { ...stats, bounds: { x: +size.x.toFixed(3), y: +size.y.toFixed(3), z: +size.z.toFixed(3) }, invalidVertices, emptyMeshes, duplicateNames, warnings, passed: warnings.filter(w => /budget exceeded|non-finite|empty mesh|dimensions are invalid/i.test(w)).length === 0 };
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
