# ZulfiQode Financial Model

Interactive 3-year startup financial model dashboard for ZulfiQode / Black Iron Quantum AI.
React + Vite, fully client-side — no backend, no database. Every assumption in the sidebar
recalculates the full 36-month model instantly.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

## Deploy on Vercel (via GitHub)

1. Initialize git and push to a new GitHub repository:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-new-github-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com), sign in, and click **Add New → Project**.
3. Import the GitHub repository you just pushed.
4. Vercel auto-detects the Vite framework preset — no configuration needed. Click **Deploy**.
5. Once deployed, Vercel gives you a live URL; every push to `main` redeploys automatically.

## Project structure

- `src/model.js` — pure calculation engine (no UI imports). Exports `defaultAssumptions`
  and `computeModel(assumptions)`, which returns month-by-month, annual, and 3-year
  dashboard aggregates.
- `src/App.jsx` — dashboard UI: KPI strip, annual summary table, trend charts, and the
  live assumptions sidebar.
- `src/index.css` — dark quant-terminal design tokens and global styles.
- `src/main.jsx` — React entry point.
