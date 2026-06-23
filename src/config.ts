/* ====================================================================
   GoldBeak SMPS — central site config (single source of truth)
   Edit your server details here; the whole site reads from this file.
   ==================================================================== */
export const SERVER = {
  name: 'GoldBeak SMPS',
  tagline: 'A crossplay survival server where bases are fair game.',

  // Website domain (GitHub Pages custom domain).
  domain: 'goldbeaksmps.asmp.info',

  // Minecraft connect address shown to players (Java + Bedrock).
  // This is the branded domain. To make Java players connect with it, add a
  // DNS SRV record (_minecraft._tcp.goldbeaksmps.asmp.info) pointing to your
  // Minehut server. Until then, players use the minehut.gg host below.
  address: 'goldbeaksmps.asmp.info',

  // The host the LIVE-STATUS widget queries. Keep this as the resolvable
  // Minehut host so status works immediately; switch it to `address` once
  // your SRV record is live.
  statusAddress: 'GoldBeakSMPS.minehut.gg',

  // Bedrock port. Minehut's default Bedrock port is 19132 —
  // double-check this in your Minehut dashboard if Bedrock players can't join.
  bedrockPort: '19132',

  // Current player slots (from the in-game scoreboard).
  maxPlayers: 10,

  // Which endpoint the live-status widget queries on api.mcsrvstat.us.
  // "java" works for Minehut crossplay hosts.
  statusEdition: 'java' as 'java' | 'bedrock',
};

/* ====================================================================
   Repo info for the /admin panel. The admin page commits content
   changes (staff, rules, news) straight to this GitHub repo.
   Fill `owner` in after you create the repo — or just type it into the
   admin UI (it's saved in your browser either way).
   ==================================================================== */
export const REPO = {
  owner: 'BussinessCenter28',       // your GitHub username/org
  name: 'goldbeaksmps-website',
  branch: 'main',
};

