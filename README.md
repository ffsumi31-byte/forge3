# Forge3D Studio — 8-pass low-poly designer

Forge3D is a browser-first game-asset workbench. It now runs each request through an explicit design process rather than immediately stamping out a preset:

1. **Inspect the prompt** — identify the object, role, style, scale, palette and requested features.
2. **Research references** — optionally fetch public Wikipedia and Wikimedia Commons search results, with source links and Commons attribution metadata.
3. **Cartoon concept** — make a category-aware SVG silhouette study before geometry.
4. **Blockout** — build the primary masses at a reduced triangle budget.
5. **Inspect** — audit finite vertex data, bounds, component count and budget.
6. **Detail pass** — use specialist modeling grammar for secondary and tertiary shapes.
7. **Clean rebuild** — rebuild the final asset from a clean scene rather than exporting the temporary blockout.
8. **Final QA** — audit the actual model shown in the viewport and report the triangle cap and warnings.

## Model design

The full design policy is documented in [`DESIGNER_PLAYBOOK.md`](./DESIGNER_PLAYBOOK.md), including silhouette-first composition, quad-like planar shapes, negative space, detail budgeting, local-AI part-plan constraints, feedback memory, and the final release checklist.

Dedicated silhouettes are provided for humanoid characters, dragons, horses, fish/sharks, octopuses, dinosaurs, cats/dogs/wolves, birds, spaceships, rockets, airplanes, helicopters, cars, bicycles, boats, buildings/castles/towers, tables/desks/beds/sofas, lanterns/streetlights, mushrooms, food props, tools, computers/laptops, backpacks, trees, crates, mugs, chairs, crystals and weapons. Unknown prompt types no longer silently become robots: with local AI enabled, the designer can build an unfamiliar object from its generated 8–18-part plan. The plan is restricted to a safe shape vocabulary, bounded transforms, a 500-triangle budget and grounding normalization; if the plan is incomplete, Forge3D falls back to a coherent game-prop profile.

The grammar emphasizes readable outline, broad planar faces, clipped/chamfered corners, controlled depth layers, matched left/right details, functional secondary parts, contact points and restrained accent colors. When Ollama is disabled, unsupported nouns are called out in the pipeline instead of being misrepresented as a specifically understood design. Geometry stays under the user's 100–500 triangle budget, with non-silhouette accents removed before major forms.

## Optional real local AI (no paid API key)

The website can connect to an Ollama model on the user's own PC and use it to inspect prompts or reference images and return a structured design blueprint. This is actual local model inference, not a claim that Forge3D retrains the model or that a text LLM directly generates arbitrary mesh topology.

1. Install Ollama from <https://ollama.com/>.
2. For text planning, run `ollama pull qwen2.5:3b`. For image understanding, run `ollama pull qwen2.5vl:3b` and enter that model name in the app.
3. Open **Teach the model → Connect a local AI brain**, set endpoint `http://localhost:11434`, enter the model name, click **Test connection**, then turn on **Use local AI during generation** and save.
4. For the hosted website, this connection still targets the visitor's own PC; Render/Vercel only host the frontend. To authorize a deployed origin, run `ALLOW_OLLAMA_ORIGIN_WINDOWS.bat`, enter your exact site origin such as `https://your-app.onrender.com`, fully quit Ollama from the system tray, and reopen it. For the localhost site, Ollama's normal local-origin defaults are usually sufficient. Only authorize origins you trust; avoid `OLLAMA_ORIGINS=*` on shared computers or networks.

The browser sends the prompt and optional image directly to the configured local Ollama endpoint. Forge3D does not send them to a Forge3D server. On unfamiliar subjects, the AI now returns a bounded part-by-part mesh plan (primitive type, placement, size, rotation, material role and optional symmetry); Forge3D validates it, builds actual geometry, creates a concept drawing from those parts, enforces the triangle budget and audits the result. Specialist assets use curated topology rules because these are more dependable than raw LLM coordinates. This is a genuine local AI-assisted modeling system, but not a trained 3D diffusion/foundation model and not a guarantee of watertight/animation-ready topology for every prompt.

## Internet research

The Research stage uses public MediaWiki/Wikimedia Commons endpoints without an API key. Availability and CORS may vary by browser/network. If lookup fails, the app records an offline fallback and still generates from its local modeling grammar. Wikimedia thumbnails link to their file pages; each image's license must be checked before reuse.

## Deploy on Render

The project files must be in the repository root: `package.json`, `index.html`, `build.mjs`, `server.mjs`, `src/` and `public/`.

- Build command: `npm install`
- Start command: `npm start`

`npm start` builds `dist/` and launches the Node static server on Render's `PORT`.

## Deploy on Vercel

Import the repository. The included `vercel.json` installs dependencies, runs the build and publishes `dist/`.

## Run and test locally

Requires Node.js 20+:

```bash
npm install
npm test
npm start
```

Then open `http://localhost:5173`. On Windows, `START_LOCAL_WINDOWS.bat` is a shortcut.

## Honest limitations

The default engine is a detailed procedural modeling system; it does not have a trained foundation model for arbitrary text-to-3D generation. Ollama adds real language/vision reasoning, can author bounded part layouts for unfamiliar nouns, and public internet reference search grounds the design process, but the result still uses a constrained primitive vocabulary rather than a learned 3D diffusion field. For general image-to-3D reconstruction with learned geometry, add a separate GPU inference service/model runtime. For example, Microsoft's TRELLIS requires a Linux environment and a GPU with at least 16 GB VRAM in its official setup; Tencent's Hunyuan3D-2.1 documents around 10 GB VRAM for shape and 29 GB for its full shape+texture pipeline. Those are not realistic to run inside a standard Render/Vercel static web deployment.
