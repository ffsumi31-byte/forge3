import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createModel, getMeshStats } from './modeler.js';

const $ = (id) => document.getElementById(id);
const state = { prompt: $('prompt').value, type: 'auto', shapeStyle: 'minimal', budget: 500, imageColor: null, imageUrl: null, imageFileName: null, model: null, library: [], preferences: [] };
const viewport = $('viewport');
let scene, camera, renderer, controls, grid, currentModel, toastTimer;

function setupScene() {
  scene = new THREE.Scene(); scene.background = new THREE.Color('#f3f5f0');
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); camera.position.set(6.3, 4.8, 8.5);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewport.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.target.set(0, 1.6, 0); controls.minDistance = 3.4; controls.maxDistance = 15;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd5decf, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(4.5, 8, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const fill = new THREE.DirectionalLight(0xd8ead2, 1.25); fill.position.set(-5, 3, -4); scene.add(fill);
  grid = new THREE.GridHelper(12, 24, 0xd4ddcd, 0xe1e7dc); grid.position.y = 0.02; scene.add(grid);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.08 })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.015; floor.receiveShadow = true; scene.add(floor);
  resizeRenderer(); window.addEventListener('resize', resizeRenderer);
  animate();
}
function resizeRenderer() { if (!renderer) return; const w = Math.max(1, viewport.clientWidth), h = Math.max(1, viewport.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
function animate() { requestAnimationFrame(animate); if (controls) controls.update(); if (renderer && scene && camera) renderer.render(scene, camera); }
function frameCamera(root) {
  if (!root) return;
  const box = new THREE.Box3().setFromObject(root); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center); const max = Math.max(size.x, size.y, size.z, 2); camera.position.set(center.x + max * 1.55, center.y + max * 1.0, center.z + max * 2.0); camera.near = 0.1; camera.far = 200; camera.updateProjectionMatrix(); controls.minDistance = max * 1.1; controls.maxDistance = max * 7; controls.update();
}
function showToast(message) { const toast = $('toast'); toast.textContent = message; toast.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800); }
function sanitizeName(text) { return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32) || 'forge3d_asset'; }
function downloadBlob(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1200); }
function colorHexToRgb(hex) { const h = new THREE.Color(hex).getHexString(); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
function saveLibrary(item) { state.library.unshift(item); state.library = state.library.slice(0, 30); localStorage.setItem('forge3d-library', JSON.stringify(state.library)); renderLibrary(); }
function loadLocalData() {
  try { state.library = JSON.parse(localStorage.getItem('forge3d-library') || '[]'); } catch { state.library = []; }
  try { state.preferences = JSON.parse(localStorage.getItem('forge3d-preferences') || '[]'); } catch { state.preferences = []; }
  renderLibrary(); renderMemory();
}
function currentPromptWithPreferences() { const prefs = state.preferences.map(p => p.text).filter(Boolean); if (!prefs.length) return state.prompt; return `${state.prompt}. Style notes to apply: ${prefs.slice(0, 3).join('; ')}.`; }
function generate({ save = true, randomize = false } = {}) {
  const prompt = $('prompt').value.trim() || 'minimal robot character';
  state.prompt = prompt; state.type = $('asset-type').value; state.shapeStyle = $('shape-style').value; state.budget = Number($('triangle-budget').value);
  $('loading-overlay').hidden = false; $('generate-btn').disabled = true; $('generate-label').textContent = 'Generating…';
  // Yield one frame to let the browser paint the generating state before creating geometry.
  requestAnimationFrame(() => {
    try {
      if (currentModel) scene.remove(currentModel);
      const modelPrompt = currentPromptWithPreferences();
      const built = createModel({ prompt: randomize ? `${modelPrompt}, variation ${Math.floor(Math.random() * 9999)}` : modelPrompt, type: state.type, imageColor: state.imageColor, shapeStyle: state.shapeStyle, triangleBudget: state.budget });
      currentModel = built.group; state.model = built; scene.add(currentModel); frameCamera(currentModel);
      updateMetrics(built); $('model-name').textContent = sanitizeName(prompt); $('model-subtitle').textContent = `${titleCase(built.category)} · ${state.shapeStyle} low-poly preview`; $('model-status').textContent = state.imageFileName ? `Palette sampled from ${state.imageFileName}` : 'Ready to export';
      const localPaletteNote = state.imageColor ? ' Reference palette applied.' : '';
      $('sidebar-tris').textContent = `${built.stats.triangles} / ${state.budget}`;
      $('budget-fill').style.width = `${Math.min(100, built.stats.triangles / 500 * 100)}%`;
      if (save) saveLibrary({ prompt, type: built.category, triangles: built.stats.triangles, parts: built.stats.parts, time: new Date().toISOString(), image: !!state.imageColor });
      $('loading-overlay').hidden = true; $('generate-btn').disabled = false; $('generate-label').textContent = 'Generate asset';
      showToast(`Generated ${built.stats.parts} parts · ${built.stats.triangles} triangles.${localPaletteNote}`);
    } catch (err) {
      console.error(err); $('loading-overlay').hidden = true; $('generate-btn').disabled = false; $('generate-label').textContent = 'Generate asset'; showToast(`Generation error: ${err.message || err}`);
    }
  });
}
function updateMetrics(built) {
  const { triangles, vertices, parts } = built.stats; $('metric-tris').textContent = triangles.toLocaleString(); $('metric-parts').textContent = parts.toLocaleString(); $('metric-verts').textContent = vertices.toLocaleString(); $('metric-tris-caption').textContent = `of ${state.budget} max`;
  $('tris-bar').style.width = `${Math.min(100, triangles / state.budget * 100)}%`; $('metric-tris').style.color = triangles > state.budget ? '#c15b48' : '#334031';
}
function titleCase(s) { return String(s).replace(/\b\w/g, m => m.toUpperCase()); }
async function exportGLB() {
  if (!currentModel) return showToast('Generate an asset first.');
  $('download-glb').disabled = true; $('download-glb').textContent = 'Exporting…';
  try {
    currentModel.updateMatrixWorld(true);
    const exporter = new GLTFExporter();
    const result = await new Promise((resolve, reject) => exporter.parse(currentModel, resolve, reject, { binary: true, onlyVisible: true, trs: false }));
    const blob = new Blob([result], { type: 'model/gltf-binary' }); downloadBlob(blob, `${sanitizeName(state.prompt)}.glb`); showToast('GLB exported successfully.');
  } catch (err) { console.error(err); showToast(`GLB export failed: ${err.message || err}`); }
  finally { $('download-glb').disabled = false; $('download-glb').innerHTML = 'Export GLB <span>↓</span>'; }
}
function exportOBJ() {
  if (!currentModel) return showToast('Generate an asset first.');
  currentModel.updateMatrixWorld(true); let lines = [`# Forge3D browser-generated low-poly model`, `o ${sanitizeName(state.prompt)}`], offset = 1;
  currentModel.traverse(mesh => {
    if (!mesh.isMesh) return;
    const geo = mesh.geometry, pos = geo.getAttribute('position'), idx = geo.index; if (!pos) return;
    for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); lines.push(`v ${v.x.toFixed(5)} ${v.y.toFixed(5)} ${v.z.toFixed(5)}`); }
    const indices = idx ? idx.array : Array.from({ length: pos.count }, (_, i) => i);
    lines.push(`g ${mesh.name.replace(/\s+/g, '_')}`);
    for (let i = 0; i + 2 < indices.length; i += 3) lines.push(`f ${indices[i] + offset} ${indices[i + 1] + offset} ${indices[i + 2] + offset}`);
    offset += pos.count;
  });
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/plain' }), `${sanitizeName(state.prompt)}.obj`); showToast('OBJ exported successfully.');
}
function exportLua() {
  if (!currentModel) return showToast('Generate an asset first.');
  const p = state.model.palette, [r, g, b] = colorHexToRgb(p.base), [ar, ag, ab] = colorHexToRgb(p.accent), prompt = state.prompt.replace(/[^a-zA-Z0-9 ,.'-]/g, '').slice(0, 100);
  const lua = `-- Forge3D Studio: generated lightweight R6-style starter rig\n-- Prompt: ${prompt}\n-- This creates a simple Roblox rig scaffold. For exact custom mesh geometry, import the GLB separately.\nlocal Workspace = game:GetService("Workspace")\nlocal model = Instance.new("Model")\nmodel.Name = "Forge3D_${sanitizeName(state.prompt)}"\n\nlocal function makePart(name, size, position, color, transparency)\n  local p = Instance.new("Part")\n  p.Name = name\n  p.Size = size\n  p.Position = position\n  p.Color = color\n  p.Material = Enum.Material.SmoothPlastic\n  p.TopSurface = Enum.SurfaceType.Smooth\n  p.BottomSurface = Enum.SurfaceType.Smooth\n  p.Anchored = false\n  p.CanCollide = true\n  if transparency then p.Transparency = transparency end\n  p.Parent = model\n  return p\nend\nlocal baseColor = Color3.fromRGB(${r}, ${g}, ${b})\nlocal accentColor = Color3.fromRGB(${ar}, ${ag}, ${ab})\nlocal darkColor = Color3.fromRGB(48, 58, 54)\nlocal root = makePart("HumanoidRootPart", Vector3.new(2, 2, 1), Vector3.new(0, 3, 0), darkColor, 1)\nroot.CanCollide = false\nlocal torso = makePart("Torso", Vector3.new(2, 2, 1), Vector3.new(0, 3, 0), baseColor)\nlocal head = makePart("Head", Vector3.new(2, 1, 1), Vector3.new(0, 4.5, 0), accentColor)\nlocal face = makePart("Visor", Vector3.new(1.1, 0.22, 0.06), Vector3.new(0, 4.52, -0.53), darkColor)\nface.CanCollide = false\nlocal la = makePart("Left Arm", Vector3.new(1, 2, 1), Vector3.new(-1.5, 3, 0), baseColor)\nlocal ra = makePart("Right Arm", Vector3.new(1, 2, 1), Vector3.new(1.5, 3, 0), baseColor)\nlocal ll = makePart("Left Leg", Vector3.new(1, 2, 1), Vector3.new(-0.5, 1, 0), darkColor)\nlocal rl = makePart("Right Leg", Vector3.new(1, 2, 1), Vector3.new(0.5, 1, 0), darkColor)\nlocal function motor(name, p0, p1, c0, c1)\n  local m = Instance.new("Motor6D")\n  m.Name, m.Part0, m.Part1, m.C0, m.C1 = name, p0, p1, c0, c1\n  m.Parent = p0\n  return m\nend\nmotor("RootJoint", root, torso, CFrame.new(), CFrame.new())\nmotor("Neck", torso, head, CFrame.new(0, 1, 0), CFrame.new(0, -0.5, 0))\nmotor("Left Shoulder", torso, la, CFrame.new(-1, 0.5, 0), CFrame.new(0, 0.5, 0))\nmotor("Right Shoulder", torso, ra, CFrame.new(1, 0.5, 0), CFrame.new(0, 0.5, 0))\nmotor("Left Hip", torso, ll, CFrame.new(-0.5, -1, 0), CFrame.new(0, 1, 0))\nmotor("Right Hip", torso, rl, CFrame.new(0.5, -1, 0), CFrame.new(0, 1, 0))\nlocal humanoid = Instance.new("Humanoid")\nhumanoid.RigType = Enum.HumanoidRigType.R6\nhumanoid.Parent = model\nmodel.PrimaryPart = root\nmodel.Parent = Workspace\nprint("Forge3D rig created. Position it and test animations before publishing.")\n`;
  downloadBlob(new Blob([lua], { type: 'text/plain;charset=utf-8' }), `${sanitizeName(state.prompt)}_RobloxRig.server.lua`); showToast('Roblox rig script downloaded.');
}
function imageColorFromUrl(url) {
  return new Promise((resolve) => {
    const image = new Image(); image.onload = () => {
      try {
        const canvas = document.createElement('canvas'); canvas.width = 44; canvas.height = 44; const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0, 44, 44);
        const data = ctx.getImageData(0, 0, 44, 44).data; let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4 * 3) {
          const rr = data[i], gg = data[i + 1], bb = data[i + 2], max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb), sat = max ? (max - min) / max : 0;
          if (max > 248 && sat < .12) continue; if (max < 28) continue;
          r += rr; g += gg; b += bb; n++;
        }
        if (!n) { resolve(null); return; }
        r /= n; g /= n; b /= n; const max = Math.max(r, g, b), min = Math.min(r, g, b); if (max - min < 20) { r = 145; g = 195; b = 120; }
        resolve(`#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`);
      } catch (e) { console.warn('Could not sample reference image', e); resolve(null); }
    }; image.onerror = () => resolve(null); image.src = url;
  });
}
async function handleImage(file) {
  if (!file) return; if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return showToast('Please use a PNG, JPG or WEBP image.');
  if (file.size > 12 * 1024 * 1024) return showToast('Please keep reference images under 12 MB.');
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = URL.createObjectURL(file); state.imageFileName = file.name; state.imageColor = await imageColorFromUrl(state.imageUrl);
  const prev = $('upload-preview'); prev.hidden = false; prev.style.backgroundImage = `url("${state.imageUrl}")`; $('upload-title').innerHTML = `${escapeHTML(file.name)} <span>(reference added)</span>`; $('upload-subtitle').textContent = state.imageColor ? `Sampled palette: ${state.imageColor.toUpperCase()}` : 'Image added'; $('remove-image').hidden = false;
  showToast(state.imageColor ? `Reference palette picked: ${state.imageColor.toUpperCase()}` : 'Reference image added.');
}
function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function clearImage() { if (state.imageUrl) URL.revokeObjectURL(state.imageUrl); state.imageUrl = null; state.imageColor = null; state.imageFileName = null; $('upload-preview').hidden = true; $('upload-preview').style.backgroundImage = ''; $('upload-title').innerHTML = 'Add a reference image <span>(optional)</span>'; $('upload-subtitle').innerHTML = 'Drop an image here or <button type="button" id="browse-btn">browse files</button>'; $('remove-image').hidden = true; bindBrowseButton(); }
function bindBrowseButton() { const b = $('browse-btn'); if (b) b.addEventListener('click', () => $('image-input').click()); }
function renderLibrary() {
  const list = $('library-list'); if (!list) return;
  if (!state.library.length) { list.innerHTML = '<div class="library-empty">No saved models yet. Generate an asset and it will appear here.</div>'; return; }
  list.innerHTML = state.library.map((item, index) => `<article class="library-item"><div class="library-item-top"><span>${escapeHTML(titleCase(item.type || 'asset'))}</span><span>${Number(item.triangles || 0)} tris</span></div><h3>${escapeHTML(item.prompt || 'Untitled asset')}</h3><p>${Number(item.parts || 0)} mesh parts · ${item.image ? 'reference palette used' : 'procedural palette'}<br>${new Date(item.time).toLocaleString()}</p><button class="secondary-button load-prompt" data-index="${index}" type="button">Load prompt ↗</button></article>`).join('');
  list.querySelectorAll('.load-prompt').forEach(b => b.addEventListener('click', () => { const item = state.library[Number(b.dataset.index)]; $('prompt').value = item.prompt; $('asset-type').value = ['character', 'creature', 'weapon', 'prop'].includes(item.type) ? item.type : 'auto'; syncCharCount(); switchView('create'); generate({ save: false }); }));
}
function renderMemory() {
  const list = $('memory-list'); if (!list) return;
  if (!state.preferences.length) { list.innerHTML = '<div class="memory-empty">No preferences saved. Add your first design rule above.</div>'; return; }
  list.innerHTML = state.preferences.map((p, i) => `<div class="memory-entry"><span class="sparkle">✦</span><p>${escapeHTML(p.text)}</p><button type="button" aria-label="Delete preference" data-index="${i}">×</button></div>`).join('');
  list.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { state.preferences.splice(Number(b.dataset.index), 1); localStorage.setItem('forge3d-preferences', JSON.stringify(state.preferences)); renderMemory(); }));
}
function switchView(view) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active')); $(`view-${view}`).classList.add('active'); document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  if (view === 'create') setTimeout(resizeRenderer, 20);
}
function syncCharCount() { $('char-count').textContent = `${$('prompt').value.length} / 700`; }

$('generate-btn').addEventListener('click', () => generate()); $('download-glb').addEventListener('click', exportGLB); $('download-obj').addEventListener('click', exportOBJ); $('download-lua').addEventListener('click', exportLua);
$('prompt').addEventListener('input', syncCharCount); $('prompt').addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate(); });
$('triangle-budget').addEventListener('input', () => { state.budget = Number($('triangle-budget').value); $('triangle-budget-value').textContent = state.budget; });
$('reset-settings').addEventListener('click', () => { $('asset-type').value = 'auto'; $('shape-style').value = 'minimal'; $('triangle-budget').value = 500; $('triangle-budget-value').textContent = '500'; state.type = 'auto'; state.shapeStyle = 'minimal'; state.budget = 500; showToast('Settings reset.'); });
document.querySelectorAll('.example-chip').forEach(b => b.addEventListener('click', () => { $('prompt').value = b.dataset.prompt; syncCharCount(); generate(); }));
$('image-input').addEventListener('change', e => handleImage(e.target.files?.[0])); bindBrowseButton(); $('remove-image').addEventListener('click', clearImage);
$('drop-zone').addEventListener('dragover', e => { e.preventDefault(); $('drop-zone').classList.add('drag-over'); }); $('drop-zone').addEventListener('dragleave', () => $('drop-zone').classList.remove('drag-over')); $('drop-zone').addEventListener('drop', e => { e.preventDefault(); $('drop-zone').classList.remove('drag-over'); handleImage(e.dataTransfer.files?.[0]); });
$('randomize-btn').addEventListener('click', () => generate({ randomize: true })); $('reset-camera').addEventListener('click', () => frameCamera(currentModel)); $('grid-toggle').addEventListener('click', () => { grid.visible = !grid.visible; $('grid-toggle').style.background = grid.visible ? '#fff' : '#eef4e8'; });
$('fullscreen-btn').addEventListener('click', async () => { const wrap = $('viewport-wrap'); try { if (!document.fullscreenElement) await wrap.requestFullscreen(); else await document.exitFullscreen(); } catch { showToast('Fullscreen is not available in this browser.'); } });
$('help-btn').addEventListener('click', () => $('help-dialog').showModal()); $('close-help').addEventListener('click', () => $('help-dialog').close()); $('got-it').addEventListener('click', () => $('help-dialog').close()); $('help-dialog').addEventListener('click', e => { if (e.target === $('help-dialog')) $('help-dialog').close(); });
document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view))); document.querySelectorAll('.go-create').forEach(b => b.addEventListener('click', () => switchView('create')));
$('clear-library').addEventListener('click', () => { state.library = []; localStorage.removeItem('forge3d-library'); renderLibrary(); showToast('Local history cleared.'); });
$('memory-form').addEventListener('submit', e => { e.preventDefault(); const text = $('memory-input').value.trim(); if (!text) return; state.preferences.unshift({ text, time: new Date().toISOString() }); state.preferences = state.preferences.slice(0, 20); localStorage.setItem('forge3d-preferences', JSON.stringify(state.preferences)); $('memory-input').value = ''; $('memory-status').textContent = 'Preference saved.'; renderMemory(); showToast('Style preference saved locally.'); });
$('clear-memory').addEventListener('click', () => { state.preferences = []; localStorage.removeItem('forge3d-preferences'); renderMemory(); showToast('Style memory cleared.'); });

setupScene(); loadLocalData(); syncCharCount(); generate({ save: false });
