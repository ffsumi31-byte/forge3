# Forge3D Studio — Premium low-poly modeler

Forge3D is a browser-first, local procedural modeler for stylized Roblox/game assets. This revision replaces the old primitive-spam shapes with a more intentional **silhouette-first modeling grammar**: angular profile prisms, chamfered hero forms, clear front/back depth layers, coherent scale ratios, and a primary/secondary/accent detail hierarchy.

## What's improved

- **Premium hard-surface is the default style.** Main forms use clipped-corner polygon prisms with broad planar faces rather than only plain cubes.
- **Better asset families.** Separate silhouettes and proportions for humanoid robots, dragons/wyverns, horses/unicorns, marine creatures, octopuses, weapons, vehicles, trees, mugs, chairs, crates, rocks and crystals.
- **Prompt-aware design.** Material palette and feature glow colors are read separately (so a purple dragon can have cyan eyes); prompts like tiny, giant, slim and bulky alter proportions.
- **Triangle budget is enforced** from 100 to 500 triangles. The modeler removes tertiary details first and preserves important silhouette forms as long as the selected budget permits.
- **Browser deployment is self-contained.** Three.js is copied to `dist/vendor/three` at build time. The published site no longer depends on a third-party CDN for its viewport/export modules.
- **No paid API key.** This is still procedural generation, not a neural text-to-3D model. Reference image upload currently samples the palette; it does not infer hidden geometry from pixels.

## Render Web Service setup

At the repository root, `package.json`, `index.html`, `build.mjs`, `server.mjs`, `src/`, and `public/` must sit side by side.

- Build Command: `npm install`
- Start Command: `npm start`

`npm start` builds the static output and starts the Node server on Render's `PORT`.

## Vercel setup

Import the repository as a Vercel project. The included `vercel.json` runs `npm install`, executes `node build.mjs`, and publishes `dist`.

## Run locally

Install [Node.js 20+](https://nodejs.org/), then run:

```bash
npm install
npm test
npm start
```

Open `http://localhost:5173`.

On Windows, `START_LOCAL_WINDOWS.bat` installs dependencies if missing, builds the app, starts the local server, and opens the browser.

## Modeling rules used by the generator

1. **Silhouette first:** the asset should read clearly before micro-details are added.
2. **Primary masses:** body, head, wings, blade or main chassis establish proportions.
3. **Secondary forms:** armor, face plates, limbs, tail links and window/cabin forms sit on deliberate depth planes.
4. **Tertiary detail:** small lights, seams, horns, rivets and accent strips use a small color/triangle budget.
5. **Hard surfaces:** broad planar faces, angular profiles and restrained clipped corners instead of excessive subdivision.
6. **Grounding and balance:** feet, hooves, wheels and prop bases give the asset clear contact points; prompt scaling changes overall proportions without increasing triangles.
7. **Budget discipline:** tiny accents are discarded before main masses if the user selects a low triangle count.

## Important limitation

The “teach” panel stores user preferences in browser local storage and appends these as design hints. It does not retrain a neural network. Full image-to-3D reconstruction would require adding a separate local model/runtime or an inference service.
