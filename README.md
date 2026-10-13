# Forge3D Web Studio — Render-ready upload

This version is configured as a Render **Node Web Service**, so an existing service can use `npm install` as its Build Command and `npm start` as its Start Command. It listens on Render's `PORT` environment variable. It also retains Vercel static hosting support. No API keys and no Python are required to deploy the web UI.

## Fix the missing package.json error without the Root Directory setting

Render's error means the connected Git repository does not have `package.json` at its top level. Extract this ZIP, then upload the **contents inside the extracted folder** directly to the main page of the GitHub repository connected to Render. Do not upload the ZIP itself or put all the files inside another folder. Ensure `package.json`, `index.html`, `build.mjs`, `server.mjs`, `src/`, and `public/` are visible at the repository's main page. Full instructions are in `UPLOAD_TO_GITHUB.txt`.

## Render settings

- Build Command: `npm install`
- Start Command: `npm start`

No Root Directory change is needed once the repository is structured correctly.

## Test locally

```bash
npm test
npm start
```

Then open `http://localhost:5173`. Three.js is imported in the browser from jsDelivr, so the browser needs internet access. There are no paid/cloud model API calls. Image upload influences the palette; this is a procedural modeling app, not a full neural image-to-3D reconstruction service.
