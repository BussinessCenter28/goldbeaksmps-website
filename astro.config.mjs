// @ts-check
import { defineConfig } from 'astro/config';

// The website is served from the GitHub Pages PROJECT url:
//   https://bussinesscenter28.github.io/goldbeaksmps-website/
// (The domain goldbeaksmps.asmp.info is a CNAME to the Minehut MC server, so the
//  website can't live there. To move to a branded domain later, point a subdomain
//  CNAME at bussinesscenter28.github.io, set `site` to it, and remove `base`.)
export default defineConfig({
  site: 'https://bussinesscenter28.github.io',
  base: '/goldbeaksmps-website',
});
