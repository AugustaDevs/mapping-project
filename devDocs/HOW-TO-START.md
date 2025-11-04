# How to Start

## Introduction

The Mapping Project is both a functional service we intend to provide and a learning / growth opportunity. For those who are more experienced in coding the process may be fairly intuitive, but if you are struggling at all please [join the Discord server](https://discord.gg/Wju9NncCwA) and post in the #mapping-project channel - we want to help!

## Steps

- Fork this repo.
- Read [The Next Step](devDocs/THE-NEXT-STEP.md)
- Start a local development server (see below).
- Dive in.
- When you have interesting things to show, push a PR.

## Install Dependencies

We are using a few node modules - e.g., Prettier. You'll want to run `npm i`.

## Running the Development Server

This project requires a local HTTP server to avoid CORS errors when loading JSON files.

Run the development server:

```bash
npm start
```

This will start a server on `http://localhost:8080`. Open that URL in your browser.

To automatically open the browser:

```bash
npm run dev
```

## Adding POIs (Admin Workflow)

Because this project is served statically, the site cannot write directly to `src/assets/pois.json` from the browser. Use the admin page and export flow:

1. Open `http://localhost:8080/admin.html`.
2. Click "Add POI" then click on the map to choose a location.
3. Fill out the form (name, emoji, category, area, address, marker size) and Save.
   - The POI is added as a draft and immediately shown on the map.
   - Drafts are persisted in `localStorage` so you can add multiple POIs.
4. Click "Export JSON" to download an updated `pois.json` containing existing POIs plus your drafts.
5. Replace `src/assets/pois.json` in your working copy with the exported file, then commit it.
6. Use "Clear Draft" if you want to reset the local draft list.

Notes:
- The regular map is available at `http://localhost:8080/index.html`.
- The admin page loads the same base map and exposes admin-only controls.

## Please

Take notes as you go:

1. What problems did you encounter?
2. What is the best docs / articles you found?
3. How do you do x?
4. What features do we need?
5. What are the limitations of LeafletJS / OpenStreetMap.
6. Write documentation that helps new contributors onboard.
7. All the other things.
