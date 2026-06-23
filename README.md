# GoldBeak SMPS — Website

The official website for **GoldBeak SMPS**, a crossplay (Java + Bedrock) Minecraft
**survival** server with PvP, raiding, and a player economy. Built with **Astro +
TypeScript** and deployed free to **GitHub Pages**.

![Astro](https://img.shields.io/badge/built%20with-Astro-f5c542) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-4aa3df) ![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-44c767)

## Features

- ⚡ **Astro + TypeScript** — components, a build step, and a content system (more than plain HTML/CSS/JS).
- 🟢 **Live server status** + player count via the free mcsrvstat.us API.
- 📋 One-click **copy** buttons for the Java + Bedrock connect addresses.
- 📰 **News/announcements** powered by Markdown — add a file, get a post.
- 👥 **Staff roster** with live Minecraft head avatars.
- 📜 **Rules** and **FAQ** straight from the server.
- 📱 Fully responsive, mobile-first, gold-on-dark theme.

## Quick start

```powershell
npm install
npm run dev      # http://localhost:4321
```

Build for production:

```powershell
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## ✏️ Edit your server details (important!)

Everything server-specific lives in **`src/config.ts`**:

```ts
export const SERVER = {
  name: 'GoldBeak SMPS',
  domain: 'goldbeaksmps.asmp.info',     // website domain
  address: 'goldbeaksmps.asmp.info',    // ← what players type to connect
  statusAddress: 'GoldBeakSMPS.minehut.gg', // ← used by the live-status widget
  bedrockPort: '19132',
  maxPlayers: 10,
  statusEdition: 'java',
};
```

> **Connect address vs. status host:** `address` is what players see. Once you add
> a DNS **SRV record** pointing `goldbeaksmps.asmp.info` at your Minehut server,
> set `statusAddress` to the same value. Until then it stays on the `minehut.gg`
> host so the live status works right now.

Other content:

- **Staff:** `src/data/staff.ts`
- **Rules:** `src/data/rules.ts`
- **News:** add a Markdown file in `src/content/news/` (see existing posts for the format).

## Add a news post

Create `src/content/news/my-post.md`:

```md
---
title: "My announcement"
date: 2026-07-01
summary: "Short teaser shown in the news list."
author: "GetIced_"
tag: "Update"
---

Your post body in **Markdown**.
```

It appears on the home page and `/news` automatically.

## Deploy to GitHub Pages

1. Push this repo to GitHub (branch `main`).
2. Repo → **Settings → Pages → Source: GitHub Actions**.
3. The included workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
   builds the site and deploys it on every push.
4. **Custom domain:** `goldbeaksmps.asmp.info` is set in [public/CNAME](public/CNAME).
   In your DNS, add a `CNAME` record for `goldbeaksmps` → `<your-username>.github.io`
   (or the apex/A-records GitHub provides). Then confirm the domain under Settings → Pages.

## Project structure

```
src/
  config.ts            # server details (edit here)
  content.config.ts    # news collection schema
  data/                # staff.ts, rules.ts
  layouts/Base.astro   # page shell
  components/           # Header, Hero, Connect, Features, Rules, Staff, News, FAQ, CTA, Footer
  content/news/         # markdown news posts
  pages/                # index.astro, news/
  styles/global.css     # theme + styling
public/                 # CNAME, favicon
.github/workflows/      # GitHub Pages deploy
```

## 🔐 Admin panel (`/admin`)

The site is static, so the admin panel edits content by **committing to this repo
via the GitHub API** — every save is a commit that triggers the auto-deploy, so
changes go live in ~1–2 minutes. It edits:

- **Staff** → `src/data/staff.json`
- **Rules** → `src/data/rules.json`
- **News** → Markdown files in `src/content/news/`

### One-time setup

1. Go to **https://your-domain/admin** (or `http://localhost:4321/admin` locally).
2. Create a **fine-grained personal access token**:
   GitHub → Settings → Developer settings → *Fine-grained tokens* → **Generate new token**.
   - **Repository access:** Only select repositories → this repo.
   - **Permissions:** *Contents* → **Read and write**.
3. In `/admin`, paste the token, enter your **owner** (GitHub username), **repo**
   name, and **branch** (`main`), then click **Connect**.
4. Edit Staff / Rules / News and hit **Save**. Done.

> **Security:** the token is stored only in your browser's `localStorage` and is sent
> straight to `api.github.com`. Never share it or commit it. Use a fine-grained token
> scoped to just this repo so it can't touch anything else. Sign out to clear it.

Tip: set `REPO.owner` in [`src/config.ts`](src/config.ts) to pre-fill the owner field.

---

Not affiliated with Mojang or Microsoft.
