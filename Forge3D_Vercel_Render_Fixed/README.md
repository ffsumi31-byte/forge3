# Forge3D Studio — Deployable low-poly web app

Forge3D Studio is a responsive browser-based modeling workbench for low-poly Roblox/game assets. It assembles actual editable 3D mesh geometry in a Three.js viewport and can export GLB, OBJ, and a starter Roblox Lua rig script.

This version intentionally avoids a Python server, npm dependencies, a database, and API keys. Node.js is used only for the local development server/build script; the deployed website is a static app. Three.js modules are loaded by the browser from jsDelivr using the import map in `index.html`.

## What it does

- Prompt-driven procedural mesh assembly for humanoids, creatures/animals, weapons, and props.
- Orbit, zoom, grid toggle, and fullscreen 3D preview.
- Upload PNG/JPG/WEBP reference images and extract a representative color to use in the generated model palette.
- Configurable triangle budget from 100 to 500; the generator removes lower-priority geometry when necessary to keep within the selected budget.
- Export `.glb` (colored 3D model), `.obj` (geometry), and `.lua` (starter R6-style Roblox rig scaffold).
- Local prompt history and saved style notes stored in the browser's `localStorage`.
- Deployment configurations for Vercel (`vercel.json`) and Render (`render.yaml`).

## Honest limitations

This is a **procedural modeling system**, not a neural text-to-3D model. The prompt selects and parameterizes a library of low-poly shape recipes. The uploaded photo currently contributes a color palette, not a reconstruction of the photo's full 3D geometry. The teaching panel saves preferences to the current browser and reuses them as prompt hints; it does not retrain a neural network. The downloadable Roblox Lua script creates a basic R6-style rig using `Motor6D` joints; it does not automatically import exact GLB mesh geometry into Roblox Studio.

To add neural image-to-3D, a separate inference runtime/model must be hosted somewhere with sufficient RAM/VRAM or run locally. This static app does not pretend to include those large weights for free.

## Run locally on Windows

1. Install Node.js LTS from https://nodejs.org/ if it is not already installed.
2. Extract this project to a folder, for example `D:\Forge3D-Web`.
3. Double-click `START_LOCAL_WINDOWS.bat`.
4. Your browser opens `http://127.0.0.1:5173`.

Or open a terminal in the project directory and run:

```bash
npm run dev
```

No `npm install` is needed. The 3D viewport loads Three.js from jsDelivr, so the browser needs an internet connection to retrieve the library; there are no AI API calls or API keys.

## Run tests and build

```bash
npm test
npm run build
npm run preview
```

`npm run build` copies the static app to `dist/`; `npm run preview` serves that built directory locally.

## Deploy on Vercel

### Git import (recommended)

1. Upload this folder's contents to the root of a GitHub repository. The repository root must contain `index.html`, `package.json`, `build.mjs`, `src/`, and `vercel.json`.
2. Go to https://vercel.com/new and import that repository.
3. The included config builds the static files into `dist/` with `node build.mjs`.
4. Click **Deploy**. No environment variables or secrets are required.

### Vercel CLI

```bash
npm run build
npx vercel
```

Follow the prompts. Once the preview works, `npx vercel --prod` deploys the production version.

## Deploy on Render

1. Push the project to a GitHub/GitLab repository.
2. Best option: choose **New → Static Site**. Use build command `node build.mjs` and publish directory `dist` (no start command is needed for a Static Site).
3. If you already created a **Web Service** and the logs say `Running yarn start`, this project now supports that too: keep the Start Command as `yarn start`. The `start` script builds `dist` and starts the included static server, which listens on Render’s `PORT`.
4. For automatic Blueprint setup, select **New → Blueprint** and connect the repository; the included `render.yaml` describes a static site.

Official docs: [Vercel static deployment via Vite](https://vite.dev/guide/static-deploy.html) (general static output concepts) · [Render Static Sites](https://render.com/docs/static-sites).

## Exports

- **GLB:** colored mesh parts and materials; recommended for Blender preview and common 3D tools.
- **OBJ:** vertices and faces in Wavefront format. OBJ is geometry-first; use GLB when material colors matter.
- **Roblox Lua:** a basic R6-style movable character scaffold with `Humanoid`, `HumanoidRootPart`, and six `Motor6D` joints. Paste into Roblox Studio's Command Bar while not in Play mode, inspect it, and test before publishing. Import the GLB separately if you want the exact modeled geometry.

## Data and privacy

Image files are read in the browser to sample a palette; they are not uploaded by this app. Library history and style preferences are stored in browser local storage. They do not sync between devices.
