import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// News / announcements — add a new .md file in src/content/news to post.
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    author: z.string().default('GoldBeak Staff'),
    tag: z.string().optional(),
  }),
});

export const collections = { news };
