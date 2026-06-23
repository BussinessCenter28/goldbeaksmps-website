# CLAUDE.md — GoldBeak SMPS Website

Guidance for Claude Code when working in this repository.

## Project

The official website for **GoldBeak SMPS**, a Minecraft **survival** server.
Players use it to see live status, learn the rules, meet the staff, read news,
and get connect instructions for both Java and Bedrock.

- **Stack:** [Astro](https://astro.build) 5 + TypeScript. Component-based, with a
  build step and a content collection for news — i.e. more than plain HTML/CSS/JS,
  but still ships as a fast static site.
- **Hosting:** GitHub Pages (static output) via the workflow in `.github/workflows/`.
- **Custom domain:** `goldbeaksmps.asmp.info` (see `public/CNAME`).
- **Audience:** Minecraft players, many on mobile — keep it responsive and fast.

## Server facts (the real ones)

- **Name:** GoldBeak SMPS
- **Game mode:** Survival, **PvP enabled** (spawn is a safe zone), **raiding allowed**
  (no grief protection), with a **player economy** and **ranks**.
- **Editions:** Crossplay — **Java AND Bedrock** on the same world (Minehut host,
  Bedrock integrated, NOT Geyser).
- **Connect address (shown to players):** `goldbeaksmps.asmp.info`
  (intended to point at the Minehut server via a DNS **SRV record**).
- **Live-status host:** `GoldBeakSMPS.minehut.gg` — the resolvable Minehut host the
  status widget queries until the SRV record is set up.
- All of the above lives in `src/config.ts` — **edit server details there only.**

## Structure

```
src/
  config.ts            Server address/port/status — SINGLE SOURCE OF TRUTH
  content.config.ts    News content collection schema (glob loader)
  data/
    staff.ts           Staff roster (roles + members) + head-avatar helper
    rules.ts           The official server rules
  layouts/Base.astro   <html> shell, <head> meta, Header + Footer
  components/           Header, Footer, Hero, Connect, Features, Rules,
                        Staff, NewsPreview, Faq, CtaBand
  content/news/*.md     News posts (frontmatter: title, date, summary, author, tag)
  pages/
    index.astro        Home (all sections)
    news/index.astro   News listing
    news/[...slug].astro  Single news post
  styles/global.css    Theme tokens (:root) + all styling
public/
  CNAME                Custom domain for GitHub Pages
  favicon.svg
.github/workflows/deploy.yml   Build + deploy to GitHub Pages
```

## Conventions

- **Single source of truth:** server connection details → `src/config.ts`.
  Staff → `src/data/staff.ts`. Rules → `src/data/rules.ts`. Don't hardcode these
  in components.
- **Theme tokens** are CSS custom properties in `:root` at the top of
  `src/styles/global.css`. Reuse `var(--gold)`, `var(--bg)`, etc.
- **Add a news post:** drop a new `.md` file in `src/content/news/` with the
  required frontmatter. It appears automatically on the home page and `/news`.
- **Live status** uses the free `https://api.mcsrvstat.us/3/<host>` API and queries
  `SERVER.statusAddress`. Until the real address resolves it reads "offline".
- Astro 5 content notes: collections defined in `src/content.config.ts` with the
  `glob` loader; render posts with `render(entry)` imported from `astro:content`;
  the entry slug is `entry.id`.
- Keep it dependency-light and statically buildable (no SSR adapter) so GitHub
  Pages can host it.

## Admin panel (`/admin`)

A client-side editor (no backend) that commits content changes to this repo via the
GitHub REST API using a user-supplied fine-grained token (stored in `localStorage`).

- Runtime logic: `src/scripts/admin.ts` (`initAdmin()`), mounted by `src/pages/admin/index.astro`.
- Edits `src/data/staff.json`, `src/data/rules.json`, and Markdown in `src/content/news/`.
- That's why staff/rules are JSON (structured, machine-editable) while `staff.ts`/
  `rules.ts` just import + type them. Keep the JSON shape stable or update both the
  TS types and the admin editors.
- Repo target comes from `REPO` in `src/config.ts` (or is typed into the admin UI).
- The page is `noindex` and intentionally not linked from the public nav.

## Commands

```powershell
npm install      # once
npm run dev      # local dev server (http://localhost:4321)
npm run build    # production build to dist/
npm run preview  # preview the built site
```

## Deploy (GitHub Pages)

1. Push to GitHub (`main`).
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. The `deploy.yml` workflow builds and publishes `dist/`.
4. Add the custom domain `goldbeaksmps.asmp.info` (already in `public/CNAME`) and
   point its DNS at GitHub Pages.

## When making changes

- Keep it static-build friendly (no server runtime).
- Preserve responsiveness — test narrow widths and the mobile menu.
- Update `src/config.ts` for any server-detail change; update `src/data/*` for
  staff/rules; add markdown for news.
