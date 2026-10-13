import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'src', 'public']) {
  const source = path.join(root, name);
  try { await stat(source); await cp(source, path.join(out, name), { recursive: true }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
await writeFile(path.join(out, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
console.log('Forge3D built to dist/ (static browser app; no server dependencies).');
